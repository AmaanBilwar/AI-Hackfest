# Real-time Audio Transcription with Gemini API

This project demonstrates real-time audio transcription using the Gemini API. It captures audio from the user's microphone and transcribes it in real-time.

## Features

- Real-time audio capture from microphone
- WebSocket communication for streaming audio data
- Transcription using Google's Gemini API
- Simple and intuitive user interface

## Prerequisites

- Python 3.8 or higher
- A Gemini API key (get it from [Google AI Studio](https://ai.google.dev/))

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the root directory with your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

## Running the Application

1. Start the Flask server:
   ```
   python src/app.py
   ```
2. Open your browser and navigate to `http://localhost:5000`
3. Click "Start Recording" to begin transcription
4. Speak into your microphone
5. Click "Stop Recording" when finished

## Project Structure

- `src/app.py`: Flask backend with WebSocket support
- `src/templates/index.html`: Frontend with audio capture and WebSocket client
- `requirements.txt`: Python dependencies

## How It Works

1. The frontend captures audio from the user's microphone in 1-second chunks
2. Each audio chunk is converted to base64 and sent to the backend via WebSocket
3. The backend receives the audio data, saves it as a temporary file
4. The audio file is sent to Gemini API for transcription
5. The transcription result is sent back to the frontend via WebSocket
6. The frontend displays the transcription in real-time

## Notes

- The Gemini API has rate limits, so be mindful of how frequently you send audio chunks
- Audio quality and transcription accuracy depend on various factors like microphone quality and background noise
- This is a demonstration project and may need additional error handling and optimization for production use


## Helpful Resources
1. text to speech model [here](https://huggingface.co/OuteAI/Llama-OuteTTS-1.0-1B)