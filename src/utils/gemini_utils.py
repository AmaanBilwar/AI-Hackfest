import google.generativeai as genai
import json
import os
import re

# Configure the API key for Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Initialize the Gemini Pro model
model = genai.GenerativeModel(model_name="gemini-2.0-flash-thinking-exp-01-21")

def extract_origin_destination(user_input: str):
    prompt = f"""
    Extract the origin and destination from this sentence:
    "{user_input}"

    Only return a JSON object like this:
    {{
        "origin": "origin name",
        "destination": "destination name"
    }}

    No explanation. Only valid JSON.
    """

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        print("Gemini raw response:", text)

        # Try to extract JSON using regex in case extra text is included
        match = re.search(r'\{.*?\}', text, re.DOTALL)
        if match:
            json_text = match.group()
            locations = json.loads(json_text)
            return locations.get("origin"), locations.get("destination")
        else:
            print("No JSON found in Gemini response")
            return None, None

    except Exception as e:
        print("Error during Gemini content generation:", e)
        return None, None
