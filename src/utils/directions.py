import requests
import os
import re

def get_directions(origin, destination):
    url = "https://maps.googleapis.com/maps/api/directions/json"
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

    steps = []
    for step in data["routes"][0]["legs"][0]["steps"]:
        html_instruction = step["html_instructions"]
        clean_instruction = re.sub(r'<[^>]+>', '', html_instruction)
        steps.append(clean_instruction)

    return {
        "origin": origin,
        "destination": destination,
        "steps": steps
    }
