import requests
import os
import re
import json

def get_detailed_instructions(step):
    """Convert a step into detailed, accessible instructions."""
    instruction = step.get("instruction", "")
    distance = step.get("distance", {}).get("text", "")
    duration = step.get("duration", {}).get("text", "")
    travel_mode = step.get("travel_mode", "")
    
    # Clean HTML tags
    clean_instruction = re.sub(r'<[^>]+>', '', instruction)
    
    # Create detailed instructions
    detailed_instructions = []
    
    # Add main instruction
    detailed_instructions.append(f"Step: {clean_instruction}")
    
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
    
    return " ".join(detailed_instructions)

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
        for i, step in enumerate(leg["steps"], 1):
            detailed_instruction = get_detailed_instructions(step)
            
            steps.append({
                "step_number": i,
                "instruction": detailed_instruction,
                "distance": step["distance"]["text"] if "distance" in step else "",
                "duration": step["duration"]["text"] if "duration" in step else "",
                "mode": step["travel_mode"]
            })

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
            "narrative": narrative
        }
        
        print(f"Successfully processed directions with {len(steps)} steps")
        return result
        
    except Exception as e:
        print(f"Error getting directions: {str(e)}")
        return {"error": f"Error getting directions: {str(e)}"}