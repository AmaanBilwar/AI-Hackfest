import os
import pymongo
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from datetime import datetime
# from openai import OpenAI
from dotenv import load_dotenv
from utils.directions import get_directions
from utils.gemini_utils import extract_origin_destination

# Load environment variables
load_dotenv()

# Initialize API key
# Initialize API keys
# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# if not OPENAI_API_KEY:
#     print("Warning: OPENAI_API_KEY not found in environment variables")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY not found in environment variables")

# Initialize MongoDB client
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
mongo_client = pymongo.MongoClient(MONGO_URI)
db = mongo_client["transcripts"]
collection = db["transcripts"]

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})


@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Hello, World!"}), 200


@app.route('/api/save-transcript', methods=['POST'])
def save_transcript():
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing required field: text'}), 400

        text = data['text']
        timestamp = data.get('timestamp', datetime.now().isoformat())
        user_id = data.get('user_id', 'anonymous')

        document = {
            'text': text,
            'timestamp': timestamp,
            'user_id': user_id,
            'created_at': datetime.now()
        }

        result = collection.insert_one(document)

        print(f"Saved transcript to MongoDB with ID: {result.inserted_id}")
        print(f"Text: {text}")
        print(f"Timestamp: {timestamp}")
        print(f"User ID: {user_id}")

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


@app.route('/api/get-directions', methods=['POST'])
def get_directions_route():
    data = request.json
    user_input = data.get("text")

    if not user_input:
        return jsonify({"error": "Missing 'text' field in request"}), 400

    origin, destination = extract_origin_destination(user_input)

    if not origin or not destination:
        return jsonify({"error": "Could not extract origin or destination"}), 400

    directions = get_directions(origin, destination)
    return jsonify(directions)


if __name__ == '__main__':
    app.run(debug=True, port=5000)


