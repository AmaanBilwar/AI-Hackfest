import { Card } from "@/components/ui/card"
import { MapIcon, Navigation, Clock, ArrowRight, Volume2, VolumeX, Accessibility } from "lucide-react"
import { useEffect, useState, useRef, useCallback } from "react"
import { getDirections, saveDirections } from "@/utils/geminiApi"
import { TextToSpeech, formatDirectionsForSpeech } from "@/utils/tts"
import { Button } from "@/components/ui/button"

interface MapDirectionsProps {
  origin: string
  destination: string
  onDirectionsReceived?: (directions: any) => void
}

interface DirectionStep {
  instruction: string
  distance: string
  duration: string
  mode: string
}

interface DirectionsData {
  origin: string
  destination: string
  distance: string
  duration: string
  steps: DirectionStep[]
  fallback?: boolean
}

export default function MapDirections({ origin, destination, onDirectionsReceived }: MapDirectionsProps) {
  const [directions, setDirections] = useState<DirectionsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const previousDirectionsRef = useRef<string | null>(null)
  const lastRequestRef = useRef<string | null>(null)
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get current location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error("Error getting current location:", error)
        }
      )
    }
  }, [])

  const fetchAudioDirections = useCallback(async (dest: string, loc: { lat: number, lng: number } | null) => {
    // Clean up previous audio if it exists
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    
    // Clean up previous URL if it exists
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    
    try {
      const audioResponse = await fetch('http://localhost:5000/api/get-accessible-directions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: dest,
          currentLocation: loc || undefined
        }),
      });

      if (!audioResponse.ok) {
        console.error('Failed to get audio directions:', await audioResponse.text());
        return;
      }

      // Get the audio blob
      const audioBlob = await audioResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      
      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Set up event handlers
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        // Clean up after playback
        if (audioRef.current) {
          audioRef.current = null;
        }
      };
      audio.onerror = (e) => {
        console.error('Error playing audio:', e);
        setIsSpeaking(false);
        // Clean up on error
        if (audioRef.current) {
          audioRef.current = null;
        }
      };
      
      // Play the audio
      await audio.play();
    } catch (audioErr) {
      console.error('Error with audio directions:', audioErr);
    }
  }, []);

  // Fetch directions when destination changes
  useEffect(() => {
    const fetchDirections = async () => {
      if (destination && destination !== "Select destination") {
        // Check if we've already requested this destination
        if (lastRequestRef.current === destination) {
          console.log('Skipping duplicate request for:', destination);
          return;
        }

        // Clear any existing timeout
        if (requestTimeoutRef.current) {
          clearTimeout(requestTimeoutRef.current);
        }

        // Set a new timeout to debounce the request
        requestTimeoutRef.current = setTimeout(async () => {
          setLoading(true);
          setError(null);
          lastRequestRef.current = destination;

          try {
            console.log(`Fetching directions for destination: ${destination}`, currentLocation ? `with location: ${JSON.stringify(currentLocation)}` : '');
            
            // Get directions data first
            const data = await getDirections(destination, currentLocation || undefined);
            console.log('Received directions data:', data);
            
            // Validate the data
            if (!data) {
              throw new Error('Empty response from directions API');
            }
            
            // Set the directions data first
            setDirections(data);
            
            // Save directions to MongoDB
            try {
              await saveDirections(origin, destination, data, destination);
              console.log('Directions saved successfully');
            } catch (err) {
              console.error('Error saving directions:', err);
            }
            
            // Call the callback function if provided
            if (onDirectionsReceived) {
              onDirectionsReceived(data);
            }

            // Get audio directions
            await fetchAudioDirections(destination, currentLocation);
            
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get directions. Please try again.';
            setError(errorMessage);
            console.error('Error fetching directions:', err);
          } finally {
            setLoading(false);
          }
        }, 500); // 500ms debounce
      }
    };

    fetchDirections();

    // Cleanup function
    return () => {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
    };
  }, [destination, currentLocation, origin, onDirectionsReceived, fetchAudioDirections]);

  const handleSpeak = () => {
    if (!directions) return;

    try {
      if (isSpeaking && audioRef.current) {
        // Stop the current audio
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsSpeaking(false);
      } else {
        // Use the TTS service for manual playback
        const speechText = formatDirectionsForSpeech(directions);
        const tts = TextToSpeech.getInstance();
        tts.speak(speechText)
          .then(() => {
            setIsSpeaking(true);
          })
          .catch(err => {
            console.error("Error speaking directions:", err);
          });
      }
    } catch (error) {
      console.error("Error in handleSpeak:", error);
    }
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Clean up audio resources
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      
      // Clean up URL objects
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      
      // Clear any pending timeouts
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
      
      // Stop any TTS
      const tts = TextToSpeech.getInstance();
      tts.stop();
    };
  }, []);

  return (
    <Card className="w-full h-64 p-0 overflow-hidden relative border-teal-100">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=600')] bg-cover bg-center opacity-40"></div>

      <div className="absolute inset-0 bg-gradient-to-b from-teal-500/20 to-teal-700/30"></div>

      <div className="relative z-10 h-full flex flex-col">
        <div className="bg-white/90 p-3 border-b border-teal-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Accessibility className="h-5 w-5 text-teal-600" />
              <h3 className="font-medium text-teal-800">Accessible Directions</h3>
            </div>
            {directions && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSpeak}
                className="h-8 w-8"
                title={isSpeaking ? "Stop speaking" : "Speak directions"}
                aria-label={isSpeaking ? "Stop speaking directions" : "Speak directions"}
              >
                {isSpeaking ? (
                  <VolumeX className="h-4 w-4 text-teal-600" />
                ) : (
                  <Volume2 className="h-4 w-4 text-teal-600" />
                )}
              </Button>
            )}
          </div>

          <div className="mt-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-600"></div>
              <p className="text-teal-700">{directions?.origin || origin}</p>
            </div>
            <div className="w-0.5 h-3 bg-teal-200 ml-1"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <p className="text-teal-700">{directions?.destination || destination}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                <Navigation className="h-6 w-6 text-teal-600 mx-auto mb-2 animate-spin" />
                <p className="text-teal-700 text-sm">Calculating best route...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
              <p className="text-rose-600 text-sm">{error}</p>
            </div>
          ) : directions ? (
            <div className="space-y-3">
              {directions.fallback ? (
                <div className="bg-amber-50/80 backdrop-blur-sm rounded-lg p-3 text-center border border-amber-200">
                  <p className="text-amber-700 text-sm">{directions.steps[0].instruction}</p>
                  <p className="text-amber-600 text-xs mt-2">Try being more specific with your destination.</p>
                </div>
              ) : (
                <>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-teal-600" />
                        <span className="text-sm font-medium text-teal-800">{directions.duration || "Duration not available"}</span>
                      </div>
                      <span className="text-sm text-teal-600">{directions.distance || "Distance not available"}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-32 overflow-auto">
                    {directions.steps && Array.isArray(directions.steps) && directions.steps.length > 0 ? (
                      directions.steps.map((step, index) => (
                        <div key={index} className="bg-white/80 backdrop-blur-sm rounded-lg p-2 text-sm">
                          <div className="flex items-start gap-2">
                            <ArrowRight className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-teal-700">{step.instruction || "Continue"}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-teal-500">
                                {step.distance && <span>{step.distance}</span>}
                                {step.duration && <span>• {step.duration}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                        <p className="text-teal-700 text-sm">No step-by-step directions available.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                <Navigation className="h-6 w-6 text-teal-600 mx-auto mb-2" />
                <p className="text-teal-700 text-sm">
                  {destination !== "Select destination"
                    ? "Calculating best route..."
                    : "Speak your destination to see directions"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}