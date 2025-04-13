import os
import pymongo
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv
from utils.directions import get_directions
from utils.gemini_utils import extract_origin_destination
import io

# Load environment variables
load_dotenv()

# Initialize API keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("Warning: OPENAI_API_KEY not found in environment variables")
else:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)

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
CORS(app, resources={r"/*": {"origins": "*"}})

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
    try:
        data = request.json
        if not data:
            print("Error: No JSON data received in request")
            return jsonify({"error": "No JSON data received"}), 400
            
        user_input = data.get("text")
        current_location = data.get("currentLocation")

        if not user_input:
            print("Error: Missing 'text' field in request")
            return jsonify({"error": "Missing 'text' field in request"}), 400

        print(f"Received request for directions with text: {user_input}")
        if current_location:
            print(f"Current location: {current_location}")

        # Extract destination from user input
        origin, destination = extract_origin_destination(user_input)
        print(f"Extracted origin: {origin}, destination: {destination}")

        if not destination:
            print("Error: Could not extract destination from user input")
            return jsonify({"error": "Could not extract destination"}), 400

        # Use current location if available, otherwise use extracted origin
        if current_location:
            origin = f"{current_location['lat']},{current_location['lng']}"
            print(f"Using current location as origin: {origin}")
        elif not origin:
            origin = "Current Location"  # Default to current location if not specified
            print("Using 'Current Location' as origin")

        print(f"Getting directions from {origin} to {destination}")
        directions = get_directions(origin, destination)
        
        # Check for specific error messages
        if "error" in directions:
            error_msg = directions["error"]
            print(f"Error getting directions: {error_msg}")
            
            # Handle "No directions found" error gracefully
            if "No directions found" in error_msg:
                # Create a fallback response with a friendly message
                fallback_directions = {
                    "origin": origin,
                    "destination": destination,
                    "distance": "Unknown",
                    "duration": "Unknown",
                    "steps": [
                        {
                            "instruction": f"I couldn't find specific directions to '{destination}'. Please try a more specific location or check the spelling.",
                            "distance": "",
                            "duration": "",
                            "mode": "unknown"
                        }
                    ],
                    "fallback": True
                }
                
                # Save the fallback response to MongoDB
                try:
                    directions_document = {
                        'origin': origin,
                        'destination': destination,
                        'directions': fallback_directions,
                        'user_input': user_input,
                        'timestamp': datetime.now().isoformat(),
                        'created_at': datetime.now(),
                        'error': error_msg
                    }
                    
                    # Save to a separate collection for directions
                    directions_collection = db["directions"]
                    result = directions_collection.insert_one(directions_document)
                    print(f"Saved fallback directions to MongoDB with ID: {result.inserted_id}")
                except Exception as e:
                    print(f"Error saving fallback directions to MongoDB: {str(e)}")
                
                return jsonify(fallback_directions)
            
            return jsonify(directions), 400
        
        # The flag is already set in the updated get_directions function, but we'll ensure it's set here as well
        if "includes_landmarks" not in directions:
            directions["includes_landmarks"] = True
            
        print(f"Successfully retrieved directions with {len(directions.get('steps', []))} steps")
        print(f"Directions include landmarks: {directions.get('includes_landmarks', False)}")
        
        # Save directions to MongoDB
        try:
            directions_document = {
                'origin': origin,
                'destination': destination,
                'directions': directions,
                'user_input': user_input,
                'timestamp': datetime.now().isoformat(),
                'created_at': datetime.now()
            }
            
            # Save to a separate collection for directions
            directions_collection = db["directions"]
            result = directions_collection.insert_one(directions_document)
            print(f"Saved directions to MongoDB with ID: {result.inserted_id}")
        except Exception as e:
            print(f"Error saving directions to MongoDB: {str(e)}")
            # Continue even if saving fails
            
        return jsonify(directions)
        
    except Exception as e:
        print(f"Error in get-directions route: {str(e)}")
        return jsonify({"error": f"Error getting directions: {str(e)}"}), 500


@app.route('/api/save-directions', methods=['POST'])
def save_directions():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
            
        origin = data.get('origin')
        destination = data.get('destination')
        directions = data.get('directions')
        user_input = data.get('user_input')
        
        if not all([origin, destination, directions]):
            return jsonify({'error': 'Missing required fields'}), 400
            
        document = {
            'origin': origin,
            'destination': destination,
            'directions': directions,
            'user_input': user_input,
            'timestamp': datetime.now().isoformat(),
            'created_at': datetime.now()
        }
        
        # Save to a separate collection for directions
        directions_collection = db["directions"]
        result = directions_collection.insert_one(document)
        
        print(f"Saved directions to MongoDB with ID: {result.inserted_id}")
        
        return jsonify({
            'success': True,
            'message': 'Directions saved successfully to MongoDB',
            'data': {
                'id': str(result.inserted_id),
                'origin': origin,
                'destination': destination
            }
        }), 200
        
    except Exception as e:
        print(f"Error saving directions to MongoDB: {str(e)}")
        return jsonify({'error': f'Error saving directions: {str(e)}'}), 500


@app.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing required field: text'}), 400

        text = data['text']
        voice = data.get('voice', 'alloy')  # Default to 'alloy' voice
        
        if not OPENAI_API_KEY:
            return jsonify({'error': 'OpenAI API key not found'}), 503

        # Use OpenAI's text-to-speech API
        response = openai_client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text
        )
        
        # Get the audio content
        audio_content = response.content
        
        # Return the audio content as a file
        return send_file(
            io.BytesIO(audio_content),
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name='speech.mp3'
        )

    except Exception as e:
        print(f"Error in text-to-speech: {str(e)}")
        return jsonify({'error': f'Error in text-to-speech: {str(e)}'}), 500


@app.route('/api/get-accessible-directions', methods=['POST'])
def get_accessible_directions():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data received"}), 400
            
        user_input = data.get("text")
        current_location = data.get("currentLocation")

        if not user_input:
            return jsonify({"error": "Missing 'text' field in request"}), 400

        # Extract destination from user input
        origin, destination = extract_origin_destination(user_input)

        if not destination:
            return jsonify({"error": "Could not extract destination"}), 400

        # Use current location if available, otherwise use extracted origin
        if current_location:
            origin = f"{current_location['lat']},{current_location['lng']}"
        elif not origin:
            origin = "Current Location"

        # Get detailed directions
        directions = get_directions(origin, destination)
        
        # Generate speech for the narrative
        if not OPENAI_API_KEY:
            return jsonify({'error': 'OpenAI API key not found'}), 503

        # Create a complete narrative that won't cause looping
        narrative = directions.get("narrative", "No directions available.")
        
        # Use OpenAI's text-to-speech API for the narrative
        response = openai_client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=narrative
        )
        
        # Get the audio content
        audio_content = response.content
        
        # Return the audio file directly without saving
        return send_file(
            io.BytesIO(audio_content),
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name='directions.mp3'
        )

    except Exception as e:
        print(f"Error in get-accessible-directions: {str(e)}")
        return jsonify({"error": f"Error getting accessible directions: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)

