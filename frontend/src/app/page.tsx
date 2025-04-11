"use client"

import { useState } from "react"
import { Mic, MicOff, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import TranscriptionBox from "@/components/transcription-box"
import MapDirections from "@/components/map-directions"

export default function Home() {
  const [isListening, setIsListening] = useState(false)
  const [transcription, setTranscription] = useState("")

  const toggleListening = () => {
    setIsListening(!isListening)
    // In a real app, this would trigger speech recognition
    if (!isListening) {
      // Simulate transcription for demo purposes
      const demoTranscriptions = [
        "Take me to the nearest bus stop",
        "When is the next train to downtown?",
        "How do I get to Central Park?",
      ]
      const randomIndex = Math.floor(Math.random() * demoTranscriptions.length)

      let text = ""
      const interval = setInterval(() => {
        if (text.length < demoTranscriptions[randomIndex].length) {
          text += demoTranscriptions[randomIndex][text.length]
          setTranscription(text)
        } else {
          clearInterval(interval)
          setTimeout(() => setIsListening(false), 1000)
        }
      }, 100)
    } else {
      setTranscription("")
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-sky-50 to-teal-50">
      <div className="w-full max-w-md px-4 py-8 flex flex-col items-center gap-6">
        <h1 className="text-2xl font-semibold text-teal-800">Transit Companion</h1>

        <div className="w-full flex flex-col items-center gap-6">
          <Button
            onClick={toggleListening}
            className={`rounded-full w-20 h-20 flex items-center justify-center transition-all ${
              isListening ? "bg-rose-500 hover:bg-rose-600" : "bg-teal-600 hover:bg-teal-700"
            }`}
            aria-label={isListening ? "Stop listening" : "Start listening"}
          >
            {isListening ? <MicOff className="h-10 w-10 text-white" /> : <Mic className="h-10 w-10 text-white" />}
          </Button>

          <TranscriptionBox text={transcription} isActive={isListening} />

          <MapDirections origin="Current Location" destination={transcription ? transcription : "Select destination"} />

          <Card className="w-full p-4 bg-white/80 backdrop-blur-sm border-teal-100">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-teal-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-teal-800">Nearby Transit</h3>
                <p className="text-sm text-teal-600">Bus 47: Arriving in 2 minutes</p>
                <p className="text-sm text-teal-600">Train B: Arriving in 7 minutes</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <footer className="w-full py-4 text-center text-sm text-teal-600 mt-auto">
        <p>Transit Companion for Visually Impaired Commuters</p>
      </footer>
    </main>
  )
}
