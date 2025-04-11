import { Card } from "@/components/ui/card"

interface TranscriptionBoxProps {
  text: string
  isActive: boolean
}

export default function TranscriptionBox({ text, isActive }: TranscriptionBoxProps) {
  return (
    <Card className="w-full h-24 p-4 bg-white/80 backdrop-blur-sm border-teal-100 overflow-auto">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-teal-800 mb-1">Transcription</h3>
          <p className="text-teal-700">
            {text || (
              <span className="text-teal-400 italic">{isActive ? "Listening..." : "Tap the microphone to speak"}</span>
            )}
            {isActive && text && <span className="animate-pulse">|</span>}
          </p>
        </div>
      </div>
    </Card>
  )
}
