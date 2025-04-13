/**
 * Utility functions for interacting with the Gemini API
 */

// Get the Gemini API key from environment variables
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

/**
 * Transcribe audio using Gemini's multimodal API
 * @param audioBlob - The audio blob to transcribe
 * @returns The transcribed text
 */
export async function transcribeAudioWithGemini(audioBlob: Blob): Promise<string> {
  try {
    // Convert audio blob to base64
    const base64Audio = await blobToBase64(audioBlob);
    
    // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
    const base64Data = base64Audio.split(',')[1];
    
    // Prepare the request body
    const requestBody = {
      contents: [
        {
          parts: [
            { text: "Transcribe the following audio accurately." },
            {
              inline_data: {
                mime_type: "audio/webm;codecs=opus",
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };
    
    // Make the API request
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );
    
    // Check if the request was successful
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    // Parse the response
    const data = await response.json();
    
    // Extract the transcribed text
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('No transcription found in the response');
    }
  } catch (error) {
    console.error('Error transcribing audio with Gemini:', error);
    throw error;
  }
}

/**
 * Save a transcript to the backend
 * @param text - The transcribed text
 * @param userId - Optional user ID
 * @returns The response from the backend
 */
export async function saveTranscript(text: string, userId?: string): Promise<any> {
  try {
    const response = await fetch('http://localhost:5000/api/save-transcript', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        timestamp: new Date().toISOString(),
        user_id: userId || 'anonymous',
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error saving transcript:', errorData);
      throw new Error(`Error saving transcript: ${errorData.error || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving transcript:', error);
    throw error;
  }
}

/**
 * Convert a Blob to a base64 string
 * @param blob - The Blob to convert
 * @returns A Promise that resolves to the base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get directions from the backend
 * @param text - The transcribed text containing destination
 * @param currentLocation - Optional current location coordinates
 * @returns The directions data
 */
export async function getDirections(text: string, currentLocation?: { lat: number, lng: number }): Promise<any> {
  try {
    const response = await fetch('http://localhost:5000/api/get-directions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        currentLocation
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error getting directions:', errorData);
      throw new Error(`Error getting directions: ${errorData.error || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting directions:', error);
    throw error;
  }
} 