import requests
import os
import re

def get_directions(origin, destination):
    url = "https://maps.googleapis.com/maps/api/directions/json"
    
    # Handle current location
    if origin.lower() == "current location":
        # Use the browser's geolocation API on the frontend
        # For now, we'll just pass the string and handle it in the frontend
        origin = "current location"
    
    params = {
        "origin": origin,
        "destination": destination,
        "mode": "transit",
        "key": os.getenv("GOOGLE_MAPS_API_KEY")
    }

    response = requests.get(url, params=params)
    data = response.json()

    if data["status"] != "OK":
        return {"error": data.get("error_message", "No directions found")}

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

    return {
        "origin": origin_address,
        "destination": destination_address,
        "distance": distance,
        "duration": duration,
        "steps": steps
    }
