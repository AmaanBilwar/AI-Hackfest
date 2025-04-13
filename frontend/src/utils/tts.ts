/**
 * Text-to-Speech utility using OpenAI's text-to-speech API
 */

export class TextToSpeech {
  private static instance: TextToSpeech;
  private audioElement: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;

  private constructor() {
    // Create an audio element for playing the speech
    this.audioElement = new Audio();
    
    // Set up event listeners
    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
    });
    
    this.audioElement.addEventListener('error', (e) => {
      console.error('Error playing audio:', e);
      this.isPlaying = false;
    });
  }

  public static getInstance(): TextToSpeech {
    if (!TextToSpeech.instance) {
      TextToSpeech.instance = new TextToSpeech();
    }
    return TextToSpeech.instance;
  }

  public async speak(text: string, voice: string = 'alloy'): Promise<void> {
    try {
      // Stop any ongoing speech
      this.stop();

      // Fetch the audio from the backend
      const response = await fetch('http://localhost:5000/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Text-to-speech error: ${errorData.error || 'Unknown error'}`);
      }

      // Get the audio blob
      const audioBlob = await response.blob();
      
      // Create a URL for the blob
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Set the audio source and play
      if (this.audioElement) {
        this.audioElement.src = audioUrl;
        this.audioElement.play();
        this.isPlaying = true;
      }
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      throw error;
    }
  }

  public stop(): void {
    if (this.audioElement && this.isPlaying) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.isPlaying = false;
    }
  }

  public isSpeaking(): boolean {
    return this.isPlaying;
  }
}

// Helper function to format directions for speech
export function formatDirectionsForSpeech(directions: any): string {
  if (!directions) {
    return "No directions available.";
  }

  try {
    // Check if the directions object has the structure expected by the MapDirections component
    if (directions.steps && Array.isArray(directions.steps) && directions.steps.length > 0) {
      return directions.steps
        .map((step: any) => step?.instruction || "Continue")
        .join('. ');
    }
    
    // Fallback for the original structure (routes[0].legs[0].steps)
    if (directions.routes && 
        Array.isArray(directions.routes) && 
        directions.routes.length > 0 && 
        directions.routes[0]?.legs && 
        Array.isArray(directions.routes[0].legs) && 
        directions.routes[0].legs.length > 0 &&
        directions.routes[0].legs[0]?.steps &&
        Array.isArray(directions.routes[0].legs[0].steps) &&
        directions.routes[0].legs[0].steps.length > 0) {
      return directions.routes[0].legs[0].steps
        .map((step: any) => {
          if (step?.html_instructions) {
            return step.html_instructions.replace(/<[^>]*>/g, '');
          } else if (step?.instruction) {
            return step.instruction;
          } else {
            return "Continue";
          }
        })
        .join('. ');
    }

    return "No directions available.";
  } catch (error) {
    console.error("Error formatting directions for speech:", error);
    return "No directions available.";
  }
} 