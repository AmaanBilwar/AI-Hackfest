import requests
import os
import re
import json

def get_directions(origin, destination):
    url = "https://maps.googleapis.com/maps/api/directions/json"
    
    # Get API key
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        print("Error: GOOGLE_MAPS_API_KEY not found in environment variables")
        return {"error": "Google Maps API key not configured"}
    
    # Handle current location
    if origin.lower() == "current location":
        # Use the browser's geolocation API on the frontend
        # For now, we'll just pass the string and handle it in the frontend
        origin = "current location"
    
    params = {
        "origin": origin,
        "destination": destination,
        "mode": "transit",
        "key": api_key
    }

    print(f"Requesting directions from {origin} to {destination}")
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        print(f"Google Maps API response status: {data.get('status')}")
        
        if data["status"] != "OK":
            error_message = data.get("error_message", "No directions found")
            print(f"Error from Google Maps API: {error_message}")
            return {"error": error_message}

        # Extract route information
        route = data["routes"][0]
        leg = route["legs"][0]
        
        # Get formatted addresses
        origin_address = leg["start_address"]
        destination_address = leg["end_address"]
        
        # Get distance and duration
        distance = leg["distance"]["text"]
        duration = leg["duration"]["text"]
        
        # Extract steps
        steps = []
        for step in leg["steps"]:
            html_instruction = step["html_instructions"]
            clean_instruction = re.sub(r'<[^>]+>', '', html_instruction)
            
            # Get step details
            step_distance = step["distance"]["text"] if "distance" in step else ""
            step_duration = step["duration"]["text"] if "duration" in step else ""
            travel_mode = step["travel_mode"]
            
            steps.append({
                "instruction": clean_instruction,
                "distance": step_distance,
                "duration": step_duration,
                "mode": travel_mode
            })

        result = {
            "origin": origin_address,
            "destination": destination_address,
            "distance": distance,
            "duration": duration,
            "steps": steps
        }
        
        print(f"Successfully processed directions with {len(steps)} steps")
        return result
        
    except Exception as e:
        print(f"Error getting directions: {str(e)}")
        return {"error": f"Error getting directions: {str(e)}"}