import os
from pymongo import MongoClient
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

# Load .env from backend directory
env_path = os.path.join(os.path.dirname(__file__), 'swasthyamitra-backend', '.env')
load_dotenv(dotenv_path=env_path)

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://kevinkdesai1308_db_user:Yh2joDtSbsNacDQu@cluster0.zahkpwz.mongodb.net/smartipm?retryWrites=true&w=majority")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

print("Connecting to MongoDB...")
client = MongoClient(MONGO_URI)
db = client["SwasthyaMitra"]
knowledge_collection = db["medical_knowledge"]

# Initialize Gemini Embeddings
print("Initializing Gemini Embeddings...")
embeddings_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2", google_api_key=GEMINI_API_KEY)

# Sample medical data
sample_data = [
    {
        "text": "मलेरिया से बचने के लिए सोते समय मच्छरदानी का प्रयोग करें और घर के आस-पास पानी जमा न होने दें।",
        "metadata": {"topic": "Malaria Prevention", "language": "hi"}
    },
    {
        "text": "If you have a persistent fever for more than 3 days accompanied by chills, you should immediately visit the nearest primary health center.",
        "metadata": {"topic": "Fever Symptoms", "language": "en"}
    },
    {
        "text": "डेंगू बुखार के लक्षणों में तेज बुखार, सिरदर्द, आंखों के पीछे दर्द, मांसपेशियों और जोड़ों में दर्द, और त्वचा पर लाल चकत्ते शामिल हैं। डेंगू से बचने के लिए मच्छरों से बचें।",
        "metadata": {"topic": "Dengue Symptoms", "language": "hi"}
    },
    {
        "text": "टीबी (Tuberculosis) के मुख्य लक्षणों में दो हफ्ते से ज्यादा समय तक खांसी, बुखार, सीने में दर्द और वजन कम होना शामिल है। सरकारी अस्पतालों में टीबी का इलाज मुफ्त उपलब्ध है।",
        "metadata": {"topic": "TB Inquiries", "language": "hi"}
    },
    {
        "text": "हैजा (Cholera) दूषित पानी पीने या दूषित भोजन खाने से होता है। इसके लक्षणों में गंभीर दस्त और उल्टी शामिल हैं, जिससे शरीर में पानी की कमी हो सकती है। ओआरएस (ORS) का घोल पिलाएं।",
        "metadata": {"topic": "Cholera Symptoms", "language": "hi"}
    },
    {
        "text": "टाइफाइड (Typhoid) एक जीवाणु संक्रमण है जो दूषित भोजन और पानी से फैलता है। तेज बुखार, सिरदर्द, पेट दर्द और कमजोरी इसके लक्षण हैं। उबला हुआ पानी ही पिएं।",
        "metadata": {"topic": "Typhoid Information", "language": "hi"}
    },
    {
        "text": "मधुमेह (Diabetes) में बार-बार पेशाब आना, अत्यधिक प्यास लगना और बिना कारण वजन कम होना जैसे लक्षण दिख सकते हैं। नियमित जांच और स्वस्थ आहार आवश्यक है।",
        "metadata": {"topic": "Diabetes Symptoms", "language": "hi"}
    },
    {
        "text": "बच्चों के लिए टीकाकरण (Vaccination) बहुत महत्वपूर्ण है। पोलियो, बीसीजी (BCG), और पेंटावैलेंट टीके बच्चों को गंभीर बीमारियों से बचाते हैं। अपने नजदीकी स्वास्थ्य केंद्र से संपर्क करें।",
        "metadata": {"topic": "Vaccination Schedules", "language": "hi"}
    },
    {
        "text": "The Janani Suraksha Yojana (JSY) is a safe motherhood intervention under the National Health Mission. It aims to reduce maternal and neonatal mortality by promoting institutional delivery among poor pregnant women. Under this scheme, pregnant women receive cash assistance.",
        "metadata": {"topic": "Government Health Schemes", "language": "en"}
    },
    {
        "text": "The Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA) provides comprehensive, quality, and free antenatal care to pregnant women on the 9th of every month. It aims to ensure that every pregnant woman receives at least one checkup in the 2nd or 3rd trimester by a physician/specialist.",
        "metadata": {"topic": "Government Health Schemes", "language": "en"}
    },
    {
        "text": "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB-PMJAY) provides a health cover of Rs. 5 lakhs per family per year for secondary and tertiary care hospitalization. This includes maternity care for pregnant women and treatment for severe illnesses.",
        "metadata": {"topic": "Government Health Schemes", "language": "en"}
    },
    {
        "text": "गर्भवती महिलाओं के लिए प्रधानमंत्री मातृ वंदना योजना (PMMVY) के तहत 5000 रुपये की नकद सहायता दी जाती है, ताकि वे अपने स्वास्थ्य और पोषण का ध्यान रख सकें।",
        "metadata": {"topic": "Government Health Schemes", "language": "hi"}
    }
]

print("Embedding and inserting data into MongoDB...")
for item in sample_data:
    # 1. Generate the vector embedding using Gemini
    vector = embeddings_model.embed_query(item["text"])
    
    # 2. Insert the document + embedding into MongoDB
    document = {
        "text": item["text"],
        "metadata": item["metadata"],
        "embedding": vector
    }
    
    knowledge_collection.insert_one(document)
    print(f"Inserted: {item['metadata']['topic']}")

print("\nSuccess! The 'SwasthyaMitra' database has now been created in MongoDB.")
print("Please refresh MongoDB Compass to see it!")
