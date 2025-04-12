import os
import pymongo
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from google import genai
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Initialize API keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("Warning: OPENAI_API_KEY not found in environment variables")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY not found in environment variables")

# initialize clients
openai_client = OpenAI(api_key=OPENAI_API_KEY)
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# initialize mongo client
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
mongo_client = pymongo.MongoClient(MONGO_URI)
db = mongo_client["transcripts"]
collection = db["transcripts"]

# initialize flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})



@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Hello, World!"}), 200


# New endpoint to save transcripts
@app.route('/api/save-transcript', methods=['POST'])
def save_transcript():
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing required field: text'}), 400
        
        # Extract data
        text = data.get('text', '')
        timestamp = data.get('timestamp', datetime.now().isoformat())
        user_id = data.get('user_id', 'anonymous')
        
        # Create document for MongoDB
        document = {
            'text': text,
            'timestamp': timestamp,
            'user_id': user_id,
            'created_at': datetime.now()
        }
        
        # Insert document into MongoDB collection
        result = collection.insert_one(document)
        
        # Log the saved transcript
        print(f"Saved transcript to MongoDB with ID: {result.inserted_id}")
        print(f"Text: {text}")
        print(f"Timestamp: {timestamp}")
        print(f"User ID: {user_id}")
        
        # Return success response
        return jsonify({
            'success': True,
            'message': 'Transcript saved successfully to MongoDB',
            'data': {
                'id': str(result.inserted_id),
                'text': text,
                'timestamp': timestamp,
                'user_id': user_id
            }
        }), 200
        
    except Exception as e:
        print(f"Error saving transcript to MongoDB: {str(e)}")
        return jsonify({'error': f'Error saving transcript: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

