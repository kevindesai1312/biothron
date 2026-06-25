import os
import io
import json
import numpy as np
from pymongo import MongoClient
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

# Load .env from backend directory
env_path = os.path.join(os.path.dirname(__file__), 'swasthyamitra-backend', '.env')
load_dotenv(dotenv_path=env_path)

# 1. Configuration & Initializations
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = MongoClient(MONGO_URI)
db = client["SwasthyaMitra"]
knowledge_collection = db["medical_knowledge"]
logs_collection = db["user_logs"] # For chat history tracking

embeddings_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2", google_api_key=GEMINI_API_KEY)
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=GEMINI_API_KEY, temperature=0.2)

# 2. Local Semantic Search Function for MongoDB Compass Data
def get_similar_context(user_query, top_k=3):
    # Convert incoming user query into a vector embedding
    query_vector = embeddings_model.embed_query(user_query)
    
    # Retrieve documents containing embeddings from MongoDB
    all_docs = list(knowledge_collection.find({}, {"text": 1, "metadata": 1, "embedding": 1}))
    
    scored_docs = []
    for doc in all_docs:
        if "embedding" in doc and doc["embedding"]:
            # Perform Cosine Similarity calculation locally
            dot_product = np.dot(query_vector, doc["embedding"])
            norm_q = np.linalg.norm(query_vector)
            norm_d = np.linalg.norm(doc["embedding"])
            similarity = dot_product / (norm_q * norm_d)
            
            scored_docs.append((similarity, doc["text"], doc.get("metadata", {})))
            
    # Sort by highest similarity score
    scored_docs.sort(key=lambda x: x[0], reverse=True)
    
    # Extract text and metadata from top results
    top_contexts = []
    top_sources = []
    for score, text, metadata in scored_docs[:top_k]:
        top_contexts.append(text)
        if metadata:
            top_sources.append(metadata)
            
    return "\n\n---\n\n".join(top_contexts), top_sources

# 3. Defining the Master Prompt Template
master_prompt_template = ChatPromptTemplate.from_template("""
You are SwasthyaMitra AI, an intelligent, empathetic public health chatbot designed to bridge healthcare gaps for rural and digital India. Your primary role is to provide accurate disease awareness, preventive healthcare practices, symptom insights, vaccination information, and guidance on government health schemes based strictly on verified medical databases provided to you.

### CRITICAL INSTRUCTIONS:
1. **Knowledge Source:** First, prioritize answering the user's query using the verified medical context provided below. If the provided context does not contain the answer, you are fully authorized to use your general medical knowledge to provide a helpful, safe, and accurate response. However, if you rely on your general knowledge, you must append a polite reminder to consult a local ASHA worker or doctor for personalized medical advice. Do not output the strict failure message anymore.
2. **Language Protocol:** Automatically detect the language of the user's message. Respond entirely in that same regional language (e.g., Hindi, Tamil, Telugu, Gujarati, etc.) using simple, conversational text that can be easily understood when read or converted to speech.
3. **Medical Disclaimer & Guardrail:** You are an AI health buddy, not a doctor. If the user describes severe, life-threatening symptoms (e.g., severe chest pain, heavy bleeding, loss of consciousness, extreme difficulty breathing), immediately output this exact warning in their language: "🚨 EMERGENCY: This sounds like a severe medical emergency. Please visit the nearest hospital or call local emergency health services immediately!"
4. **Actionable & Clear Layout:** Present your answers using short paragraphs, bullet points, or simple steps. Avoid dense medical jargon. Keep instructions practical for rural contexts.

---
### VERIFIED HEALTH CONTEXT:
{context}
---

### USER QUERY:
{query}

### SWASTHYAMITRA AI RESPONSE:
""")

# 4. Orchestrating Execution Pipeline
def ask_swasthyamitra(user_query, user_id="session_123"):
    # Step A: Retrieve vector context matching the query from MongoDB Compass
    retrieved_context, retrieved_sources = get_similar_context(user_query, top_k=2)
    
    # Step B: Format the Master Prompt with the payload
    formatted_prompt = master_prompt_template.format(
        context=retrieved_context if retrieved_context else "No specific context available.",
        query=user_query
    )
    
    # Step C: Generate output from LLM
    response = llm.invoke(formatted_prompt)
    ai_reply = response.content
    
    # Step D: Log transaction to user_logs collection inside MongoDB Compass
    logs_collection.insert_one({
        "user_id": user_id,
        "query": user_query,
        "response": ai_reply,
        "context_used": retrieved_context,
        "sources": retrieved_sources
    })
    
    return {
        "response": ai_reply,
        "sources": retrieved_sources
    }

# --- Execution Test Case / CLI Entry Point ---
if __name__ == "__main__":
    import sys
    import base64
    if len(sys.argv) > 1:
        # Called from Node.js or CLI with an argument
        if sys.argv[1] == "--base64" and len(sys.argv) > 2:
            user_input = base64.b64decode(sys.argv[2]).decode('utf-8')
        else:
            user_input = sys.argv[1]
            
        answer_payload = ask_swasthyamitra(user_input)
        
        # Print ONLY the JSON payload to stdout so Node.js can parse it cleanly
        # Ensure we don't break Windows shell with emojis or Hindi characters
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        print(json.dumps(answer_payload, ensure_ascii=False))
    else:
        # Fallback test query
        sample_query = "मलेरिया से बचने के उपाय क्या हैं?"
        print(f"User: {sample_query}\n")
        
        answer_payload = ask_swasthyamitra(sample_query)
        print(f"SwasthyaMitra AI JSON:\n{json.dumps(answer_payload, ensure_ascii=False, indent=2)}")
