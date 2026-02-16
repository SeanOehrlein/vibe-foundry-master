import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='c:\\CyCOS\\System\\Core\\Manager\\.env')

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    try:
        print("Listing available models...")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(m.name)
    except Exception as e:
        print(f"Error listing models: {e}")
else:
    print("No GEMINI_API_KEY found.")
