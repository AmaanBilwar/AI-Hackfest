import { Card } from "@/components/ui/card"
import { MapIcon, Navigation, Clock, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"
import { getDirections } from "@/utils/geminiApi"

interface MapDirectionsProps {
  origin: string
  destination: string
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
}

export default function MapDirections({ origin, destination }: MapDirectionsProps) {
  const [directions, setDirections] = useState<DirectionsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null)

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
          const data = await getDirections(destination, currentLocation || undefined)
          setDirections(data)
        } catch (err) {
          setError("Failed to get directions. Please try again.")
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchDirections()
  }, [destination, currentLocation])

  return (
    <Card className="w-full h-64 p-0 overflow-hidden relative border-teal-100">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=600')] bg-cover bg-center opacity-40"></div>

      <div className="absolute inset-0 bg-gradient-to-b from-teal-500/20 to-teal-700/30"></div>

      <div className="relative z-10 h-full flex flex-col">
        <div className="bg-white/90 p-3 border-b border-teal-100">
          <div className="flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-teal-600" />
            <h3 className="font-medium text-teal-800">Directions</h3>
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
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-teal-600" />
                    <span className="text-sm font-medium text-teal-800">{directions.duration}</span>
                  </div>
                  <span className="text-sm text-teal-600">{directions.distance}</span>
                </div>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-auto">
                {directions.steps.map((step, index) => (
                  <div key={index} className="bg-white/80 backdrop-blur-sm rounded-lg p-2 text-sm">
                    <div className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-teal-700">{step.instruction}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-teal-500">
                          <span>{step.distance}</span>
                          <span>•</span>
                          <span>{step.duration}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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