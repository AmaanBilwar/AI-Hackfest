import requests
import os
import re
import json

def get_landmark_near_step(lat, lng, api_key):
    """Get notable landmarks near a navigation step."""
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{lat},{lng}",
        "radius": 50,  # Search within 50 meters
        "type": ["point_of_interest", "store", "restaurant", "cafe", "park", "library", "museum"],
        "key": api_key
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        if data["status"] == "OK" and data["results"]:
            # Return the most notable landmark (first result)
            return data["results"][0]
        return None
    except Exception as e:
        print(f"Error finding landmarks: {str(e)}")
        return None

def enhance_instruction_with_landmark(instruction, landmark):
    """Add landmark reference to instruction."""
    landmark_name = landmark["name"]
    
    # Basic pattern matching - could be improved with NLP
    if "Turn right" in instruction:
        return f"{instruction} (You'll see {landmark_name} on your right)"
    elif "Turn left" in instruction:
        return f"{instruction} (You'll see {landmark_name} on your left)"
    elif "Continue" in instruction or "Head" in instruction or "Proceed" in instruction:
        return f"{instruction} passing {landmark_name}"
    else:
        return f"{instruction} (Look for {landmark_name} nearby)"

def get_detailed_instructions(step, api_key=None):
    """Convert a step into detailed, accessible instructions with landmarks."""
    instruction = step.get("html_instructions", "")
    distance = step.get("distance", {}).get("text", "")
    duration = step.get("duration", {}).get("text", "")
    travel_mode = step.get("travel_mode", "")
    
    # Clean HTML tags
    clean_instruction = re.sub(r'<[^>]+>', '', instruction)
    
    # Create detailed instructions
    detailed_instructions = []
    
    # Add main instruction
    detailed_instructions.append(f"Step: {clean_instruction}")
    
    # Initialize landmarks list
    landmarks = []
    
    # Check for landmarks near this step if API key is provided
    if api_key and "start_location" in step and "end_location" in step:
        # Calculate midpoint of this step
        mid_lat = (step["start_location"]["lat"] + step["end_location"]["lat"]) / 2
        mid_lng = (step["start_location"]["lng"] + step["end_location"]["lng"]) / 2
        
        # Get landmark near this step
        landmark = get_landmark_near_step(mid_lat, mid_lng, api_key)
        if landmark:
            # Enhance instruction with landmark reference
            enhanced = enhance_instruction_with_landmark(clean_instruction, landmark)
            detailed_instructions[0] = f"Step: {enhanced}"
            
            # Add additional landmark context
            landmark_types = landmark.get("types", [])
            readable_types = [t.replace("_", " ") for t in landmark_types if t not in ["point_of_interest", "establishment"]]
            if readable_types:
                landmark_type = readable_types[0]
                detailed_instructions.append(f"{landmark['name']} is a {landmark_type}")
            
            # Add landmark to landmarks list
            landmarks.append({
                "name": landmark["name"],
                "types": landmark_types,
                "location": landmark["geometry"]["location"]
            })
    
    # Add distance and duration if available
    if distance:
        detailed_instructions.append(f"This step is {distance} long")
    if duration:
        detailed_instructions.append(f"It will take approximately {duration}")
    
    # Add mode-specific instructions
    if travel_mode == "TRANSIT":
        if "transit_details" in step:
            transit = step["transit_details"]
            line = transit.get("line", {}).get("short_name", "")
            vehicle = transit.get("line", {}).get("vehicle", {}).get("name", "")
            detailed_instructions.append(f"Take the {vehicle} {line}")
            
            # Add departure and arrival instructions
            departure = transit.get("departure_stop", {}).get("name", "")
            arrival = transit.get("arrival_stop", {}).get("name", "")
            if departure:
                detailed_instructions.append(f"Depart from {departure}")
            if arrival:
                detailed_instructions.append(f"Get off at {arrival}")
    
    # Add navigation cues
    if "maneuver" in step:
        maneuver = step["maneuver"]
        if maneuver == "turn-right":
            detailed_instructions.append("Turn right")
        elif maneuver == "turn-left":
            detailed_instructions.append("Turn left")
        elif maneuver == "straight":
            detailed_instructions.append("Continue straight ahead")
    
    return " ".join(detailed_instructions), landmarks

def get_directions(origin, destination):
    url = "https://maps.googleapis.com/maps/api/directions/json"
    
    # Get API key
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        print("Error: GOOGLE_MAPS_API_KEY not found in environment variables")
        return {"error": "Google Maps API key not configured"}
    
    # Handle current location
    if origin.lower() == "current location":
        origin = "current location"
    
    # Try to improve the destination if it's a generic query
    improved_destination = destination
    if "nearest" in destination.lower():
        # Extract the business name
        business_name = destination.lower().replace("nearest", "").strip()
        improved_destination = f"{business_name} restaurant"
        print(f"Improved destination from '{destination}' to '{improved_destination}'")
    
    params = {
        "origin": origin,
        "destination": improved_destination,
        "mode": "driving",  # Changed from transit to driving for better results
        "key": api_key
    }

    print(f"Requesting directions from {origin} to {improved_destination}")
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        print(f"Google Maps API response status: {data.get('status')}")
        
        if data["status"] != "OK":
            error_message = data.get("error_message", "No directions found")
            print(f"Error from Google Maps API: {error_message}")
            
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
                "fallback": True,
                "narrative": f"I couldn't find specific directions to '{destination}'. Please try a more specific location or check the spelling."
            }
            
            return fallback_directions

        # Extract route information
        route = data["routes"][0]
        leg = route["legs"][0]
        
        # Get formatted addresses
        origin_address = leg["start_address"]
        destination_address = leg["end_address"]
        
        # Get distance and duration
        distance = leg["distance"]["text"]
        duration = leg["duration"]["text"]
        
        # Extract and process steps
        steps = []
        all_landmarks = []
        
        for i, step in enumerate(leg["steps"], 1):
            detailed_instruction, landmarks = get_detailed_instructions(step, api_key)
            
            step_info = {
                "step_number": i,
                "instruction": detailed_instruction,
                "distance": step["distance"]["text"] if "distance" in step else "",
                "duration": step["duration"]["text"] if "duration" in step else "",
                "mode": step["travel_mode"]
            }
            
            # Add landmarks if available
            if landmarks:
                step_info["landmarks"] = landmarks
                all_landmarks.extend(landmarks)
            
            steps.append(step_info)

        # Create a complete narrative
        narrative = f"Starting from {origin_address}. "
        narrative += f"The total journey is {distance} and will take approximately {duration}. "
        narrative += "Here are your step by step directions: "
        
        for step in steps:
            narrative += f"Step {step['step_number']}: {step['instruction']}. "
        
        narrative += f"You have arrived at your destination: {destination_address}."

        result = {
            "origin": origin_address,
            "destination": destination_address,
            "distance": distance,
            "duration": duration,
            "steps": steps,
            "narrative": narrative,
            "includes_landmarks": True,
            "landmarks_count": len(all_landmarks)
        }
        
        print(f"Successfully processed directions with {len(steps)} steps and {len(all_landmarks)} landmarks")
        return result
        
    except Exception as e:
        print(f"Error getting directions: {str(e)}")
        return {"error": f"Error getting directions: {str(e)}"}