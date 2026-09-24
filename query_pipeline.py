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
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://kevinkdesai1308_db_user:Yh2joDtSbsNacDQu@cluster0.zahkpwz.mongodb.net/smartipm?retryWrites=true&w=majority")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = MongoClient(MONGO_URI)
db = client["SwasthyaMitra"]
knowledge_collection = db["medical_knowledge"]
logs_collection = db["user_logs"] # For chat history tracking

embeddings_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2", google_api_key=GEMINI_API_KEY)

response_schema = {
    "type": "OBJECT",
    "properties": {
        "text_response": {"type": "STRING"},
        "active_tab_fallback": {"type": "STRING"},
        "suggested_chips": {
            "type": "ARRAY",
            "items": {"type": "STRING"}
        },
        "trigger_alert_banner": {"type": "BOOLEAN"}
    },
    "required": ["text_response", "active_tab_fallback", "suggested_chips", "trigger_alert_banner"]
}

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash", 
    google_api_key=GEMINI_API_KEY, 
    temperature=0.2,
    response_mime_type="application/json",
    response_schema=response_schema
)

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
    
    max_score = float(scored_docs[0][0]) if scored_docs else 0.0
    
    # Extract text and metadata from top results
    top_contexts = []
    top_sources = []
    for score, text, metadata in scored_docs[:top_k]:
        top_contexts.append(text)
        if metadata:
            top_sources.append(metadata)
            
    return "\n\n---\n\n".join(top_contexts), top_sources, max_score

# 3. Defining the Master Prompt Template
master_prompt_template = ChatPromptTemplate.from_template("""
You are the core AI backend engineering engine for SwasthyaMitra AI, an empathetic, highly structured public health assistant engineered for rural and digital India. Your output directly formats the web chat interface shown in image_aef3c1.png.

### 1. IDENTITY & CAPABILITIES BOUNDARY
Your knowledge profile covers five distinct user-driven areas visible on the main navigation bar and quick-action chips of image_aef3c1.png:
- **Chat/General:** Basic public health guidance and digital medical support.
- **Symptoms:** Step-by-step evaluation of user symptoms to provide clear medical insights.
- **Disease Info:** Direct, fact-based educational information on illnesses (e.g., Malaria, Dengue, TB).
- **Schemes:** Detailed guidance explaining government healthcare benefits (e.g., ABHA Card, PM-JAY tracking).
- **Hospitals:** Proximity-based direction to nearby public clinics using local coordinate metadata.

### 2. CRITICAL OPERATION PROTOCOLS

#### Protocol A: Strict RAG Data Boundary
- You must prioritize answering user queries using the verified medical context provided in the database snapshot below.
- If the required facts are completely absent from the context, you are allowed to supplement the answer with your general medical knowledge to ensure the user gets a helpful and complete answer. Do not refuse to answer.
- *CRITICAL SAFETY RULE:* If the provided context is exactly "NO_VERIFIED_CONTEXT", YOU MUST NOT ANSWER THE QUESTION. You must actively lock down the system and reply exactly with: "Data Boundary Enforced: I am only allowed to provide answers from our verified medical database. Your query did not match any verified records (Confidence Score < 0.50). Please consult a doctor."

#### Protocol B: Multi-Lingual & Native Script Execution
As shown in the language dropdown menu of image_aef3c1.png, you must fully support and output text natively in the requested user language:
- English (English)
- Hindi (हिंदी)
- Bengali (বাংলা)
- Telugu (తెలుగు)
- Tamil (தமிழ்)
- Marathi (मराठी)
- Gujarati (ગુજરાતી)
- Rule: Always respond in the native script of the selected language. Keep vocabulary clear, conversational, and direct, optimized for text-to-speech engine playback.

#### Protocol C: Emergency Short-Circuit Triage (The Footer Guardrail)
- Your footer explicitly states: "AI assistant for health information only. For emergencies, call 108."
- If the incoming text or audio query indicates severe emergency symptoms (e.g., sudden chest pain, profound difficulty breathing, snake bite, severe bleeding, or unconsciousness), you must ignore standard RAG operations and immediately output this short-circuit alert in the user's active language script:
  "🚨 EMERGENCY ALERT: This pattern indicates a high-priority medical emergency. Do not wait for AI instructions. Please immediately call 108 or proceed directly to the nearest emergency room or hospital facility."

#### Protocol D: UX Layout Compatibility
- Format text answers with clean spacing, short paragraphs, and clear bullet points.
- CRITICAL: Do NOT use HTML tags (like <ul>, <li>, <b>) for formatting. Use plain text markdown like "-" for bullets and "**" for bold. The frontend renders raw text and cannot parse HTML.
- Never write heavy, technical, or dense walls of medical text. Keep your responses modern, approachable, and highly scannable to mirror the clean UI layout of image_aef3c1.png.

---
### 🖥️ CURRENT CONVERSATION RUNTIME METADATA
- Selected System Language: Auto-detected
- Attached Active User Location: Embedded in query
- Linked ABHA Identity Status: Embedded in query

---
### 📚 VERIFIED HEALTH DATABASE CONTEXT (FROM MONGODB VECTORS)
{context}

---
### 💬 ACTIVE USER QUERY (TEXT OR TRANSCRIBED AUDIO VOICE)
{query}

### 🧠 SWASTHYAMITRA AI SYSTEM OUTPUT:
You MUST output your response exactly as a JSON object matching the provided response schema. Do not include markdown formatting like ```json in the output.
""")

# 4. Orchestrating Execution Pipeline
def ask_swasthyamitra(user_query, user_id="session_123"):
    # Step A: Retrieve vector context matching the query from MongoDB Compass
    retrieved_context, retrieved_sources, max_score = get_similar_context(user_query, top_k=2)
    
    # Hallucination Defense: Enforce 0.50 threshold
    if max_score < 0.50:
        retrieved_context = "NO_VERIFIED_CONTEXT"
        retrieved_sources = []
        
    # Step B: Format the Master Prompt with the payload
    formatted_prompt = master_prompt_template.format(
        context=retrieved_context if retrieved_context else "No specific context available.",
        query=user_query
    )
    
    # Step C: Generate output from LLM
    response = llm.invoke(formatted_prompt)
    ai_reply_raw = response.content
    
    try:
        ai_reply_data = json.loads(ai_reply_raw)
    except Exception:
        ai_reply_data = {
            "text_response": ai_reply_raw,
            "active_tab_fallback": "Chat",
            "suggested_chips": [],
            "trigger_alert_banner": False
        }
    
    ai_reply = ai_reply_data.get("text_response", str(ai_reply_data))
    
    # Step D: Log transaction to user_logs collection inside MongoDB Compass
    logs_collection.insert_one({
        "user_id": user_id,
        "query": user_query,
        "response": ai_reply,
        "ui_state": ai_reply_data,
        "context_used": retrieved_context,
        "sources": retrieved_sources,
        "confidence_score": max_score
    })
    
    return {
        "response": ai_reply,
        "ui_state": ai_reply_data,
        "sources": retrieved_sources,
        "confidence_score": max_score
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
