"use client"

import { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import TranscriptionBox from "@/components/transcription-box"
import MapDirections from "@/components/map-directions"
import { transcribeAudioWithGemini, saveTranscript } from '@/utils/geminiApi';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Reset audio chunks
      audioChunksRef.current = [];
      
      // Get audio stream from microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder with 9-second chunks
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Start recording with 9-second chunks
      mediaRecorder.start(9000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      // Set up interval to process chunks
      recordingIntervalRef.current = setInterval(async () => {
        if (audioChunksRef.current.length > 0) {
          // Stop the current recording to get the chunk
          mediaRecorder.stop();
          
          // Process the chunk
          await processAudioChunk();
          
          // Start a new recording
          const newMediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 128000
          });
          
          newMediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };
          
          newMediaRecorder.start(9000);
          mediaRecorderRef.current = newMediaRecorder;
        }
      }, 9000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      // Clear the interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      // Process any remaining chunks
      if (audioChunksRef.current.length > 0) {
        processAudioChunk();
      }
    }
  };

  const processAudioChunk = async () => {
    if (audioChunksRef.current.length === 0 || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // Combine all chunks into a single blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
      
      // Clear the chunks array
      audioChunksRef.current = [];
      
      // Transcribe the audio using Gemini API
      const transcription = await transcribeAudioWithGemini(audioBlob);
      
      // Update the transcript
      setTranscript(prev => prev + ' ' + transcription);
      
      // Save the transcript to the backend
      await saveTranscript(transcription);
      
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-sky-50 to-teal-50">
      <div className="w-full max-w-md px-4 py-8 flex flex-col items-center gap-6">
        <h1 className="text-2xl font-semibold text-teal-800">Transit Companion</h1>

        <div className="w-full flex flex-col items-center gap-6">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`rounded-full w-20 h-20 flex items-center justify-center transition-all ${
              isRecording ? "bg-rose-500 hover:bg-rose-600" : "bg-teal-600 hover:bg-teal-700"
            }`}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? <MicOff className="h-10 w-10 text-white" /> : <Mic className="h-10 w-10 text-white" />}
          </Button>

          <TranscriptionBox text={transcript} isActive={isRecording} />

          <MapDirections origin="Current Location" destination={transcript ? transcript : "Select destination"} />

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
