import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv(r'd:\healthcare\swasthyamitra-backend\.env')
models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
for m in models:
    try:
        llm = ChatGoogleGenerativeAI(model=m, google_api_key=os.getenv('GEMINI_API_KEY'))
        print(m, 'SUCCESS:', llm.invoke('Hello').content[:10])
    except Exception as e:
        print(m, 'ERROR:', str(e)[:150])
