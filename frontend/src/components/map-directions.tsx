import { Card } from "@/components/ui/card"
import { MapIcon, Navigation, Clock, ArrowRight, Volume2, VolumeX } from "lucide-react"
import { useEffect, useState, useRef } from "react"
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
  const previousDirectionsRef = useRef<string | null>(null)

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

  // Fetch directions when destination changes
  useEffect(() => {
    const fetchDirections = async () => {
      if (destination && destination !== "Select destination") {
        setLoading(true)
        setError(null)
        try {
          console.log(`Fetching directions for destination: ${destination}`, currentLocation ? `with location: ${JSON.stringify(currentLocation)}` : '');
          const data = await getDirections(destination, currentLocation || undefined)
          console.log('Received directions data:', data);
          
          // Validate the data
          if (!data) {
            throw new Error('Empty response from directions API');
          }
          
          if (data.error && !data.fallback) {
            throw new Error(data.error);
          }
          
          // Check if the data has the expected structure
          if (!data.steps || !Array.isArray(data.steps)) {
            console.error('Invalid directions data structure:', data);
            throw new Error('Invalid directions data structure');
          }
          
          setDirections(data)
          
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
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to get directions. Please try again.';
          setError(errorMessage)
          console.error('Error fetching directions:', err)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchDirections()
  }, [destination, currentLocation, origin, onDirectionsReceived])

  // Auto-play directions when they become available
  useEffect(() => {
    if (directions && !loading && !error) {
      try {
        // Check if the directions have changed
        const directionsText = JSON.stringify(directions);
        if (directionsText !== previousDirectionsRef.current) {
          previousDirectionsRef.current = directionsText;
          
          // Format and speak the directions
          const speechText = formatDirectionsForSpeech(directions);
          const tts = TextToSpeech.getInstance();
          
          // Speak the directions
          tts.speak(speechText)
            .then(() => {
              setIsSpeaking(true);
            })
            .catch(err => {
              console.error("Error speaking directions:", err);
            });
        }
      } catch (error) {
        console.error("Error in auto-play directions:", error);
      }
    }
  }, [directions, loading, error]);

  const handleSpeak = () => {
    if (!directions) return;

    try {
      const tts = TextToSpeech.getInstance();
      
      if (isSpeaking) {
        tts.stop();
        setIsSpeaking(false);
      } else {
        const speechText = formatDirectionsForSpeech(directions);
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

  // Add cleanup for TTS when component unmounts
  useEffect(() => {
    return () => {
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
              <MapIcon className="h-5 w-5 text-teal-600" />
              <h3 className="font-medium text-teal-800">Directions</h3>
            </div>
            {directions && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSpeak}
                className="h-8 w-8"
                title={isSpeaking ? "Stop speaking" : "Speak directions"}
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
                                <span>{step.distance || ""}</span>
                                {step.distance && step.duration && <span>•</span>}
                                <span>{step.duration || ""}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 text-sm">
                        <p className="text-teal-700">No step-by-step directions available.</p>
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