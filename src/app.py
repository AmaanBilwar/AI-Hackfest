from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
from dotenv import load_dotenv
import pymongo
from google import genai
import asyncio
import wave

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/transcript', methods=['POST'])
async def transcript():
    # This endpoint is kept for backward compatibility
    prompt = "Please transcribe the following audio file"
    
    my_file = gemini_client.upload(file='transcript.mp3')
    response = gemini_client.models.generate_content(
        model_name="gemini-2.0-flash",
        contents=[prompt, my_file]
    )

    return jsonify(response.text)

if __name__ == "__main__":
    app.run(debug=True)

