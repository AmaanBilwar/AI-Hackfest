import { Card } from "@/components/ui/card"
import { MapIcon, Navigation } from "lucide-react"

interface MapDirectionsProps {
  origin: string
  destination: string
}

export default function MapDirections({ origin, destination }: MapDirectionsProps) {
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
              <p className="text-teal-700">{origin}</p>
            </div>
            <div className="w-0.5 h-3 bg-teal-200 ml-1"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <p className="text-teal-700">{destination}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
            <Navigation className="h-6 w-6 text-teal-600 mx-auto mb-2" />
            <p className="text-teal-700 text-sm">
              {destination !== "Select destination"
                ? "Calculating best route..."
                : "Speak your destination to see directions"}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
