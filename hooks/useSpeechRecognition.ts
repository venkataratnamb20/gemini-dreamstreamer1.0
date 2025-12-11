import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionProps {
  onResult: (transcript: string) => void;
  onEnd?: () => void;
  continuousMode?: boolean;
}

export const useSpeechRecognition = ({ onResult, onEnd, continuousMode = false }: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Refs to track state inside callbacks
  const onResultRef = useRef(onResult);
  const onEndRef = useRef(onEnd);
  const continuousModeRef = useRef(continuousMode);
  const shouldStopRef = useRef(false); // Track if stop was requested by user
  const hasFatalErrorRef = useRef(false); // Track permission errors to prevent infinite restart loops

  useEffect(() => {
    onResultRef.current = onResult;
    onEndRef.current = onEnd;
    continuousModeRef.current = continuousMode;
  }, [onResult, onEnd, continuousMode]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      hasFatalErrorRef.current = false;
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const finalTranscript = event.results[i][0].transcript.trim();
          if (finalTranscript && onResultRef.current) {
            onResultRef.current(finalTranscript);
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      // Ignore 'no-speech' error as it is expected during silence in continuous mode
      if (event.error === 'no-speech') {
        return;
      }

      console.error("Speech recognition error", event.error);
      
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError("Microphone access denied.");
        hasFatalErrorRef.current = true;
        setIsListening(false);
      } else {
         if (event.error !== 'no-speech') {
            // Non-fatal error, we might log it but keep trying if continuous
            console.warn(`Speech recognition warning: ${event.error}`);
         }
      }
      
      // If it's a fatal error, we must stop listening visually
      if (hasFatalErrorRef.current) {
          setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (onEndRef.current) {
        onEndRef.current();
      }

      // Auto-restart logic
      // Only restart if:
      // 1. Continuous mode is enabled in props
      // 2. The user did NOT manually click stop (shouldStopRef)
      // 3. There wasn't a fatal error (like permissions denied)
      if (continuousModeRef.current && !shouldStopRef.current && !hasFatalErrorRef.current) {
        console.log("Auto-restarting speech recognition...");
        try {
            // Small timeout to let the browser cleanup the previous session
            setTimeout(() => {
                if (recognitionRef.current && !shouldStopRef.current) {
                     recognitionRef.current.start();
                }
            }, 100);
        } catch (e) {
            console.error("Failed to auto-restart", e);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []); 

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      shouldStopRef.current = false;
      try {
        // Check if already started to avoid errors
        recognitionRef.current.start();
      } catch (e) {
        // Often throws if already started, safe to ignore or log
        console.log("Start called but maybe already listening", e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      shouldStopRef.current = true; // Mark as intentional stop
      recognitionRef.current.stop();
    }
  }, []);

  return { isListening, startListening, stopListening, error };
};