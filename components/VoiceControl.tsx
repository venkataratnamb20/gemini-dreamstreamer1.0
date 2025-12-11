import React from 'react';
import { Mic, MicOff, RefreshCw } from 'lucide-react';

interface VoiceControlProps {
  isListening: boolean;
  onToggle: () => void;
  disabled?: boolean;
  continuousMode: boolean;
  onToggleContinuous: () => void;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({ 
  isListening, 
  onToggle, 
  disabled,
  continuousMode,
  onToggleContinuous
}) => {
  return (
    <div className="flex items-center gap-4">
      {/* Main Mic Button */}
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`
          relative flex items-center justify-center w-20 h-20 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95
          ${disabled ? 'bg-gray-600 cursor-not-allowed opacity-50' : 
            isListening ? 'bg-red-500 shadow-red-500/50 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/50'}
        `}
        aria-label={isListening ? "Stop Recording" : "Start Recording"}
      >
         {/* Ripple effect rings when listening */}
        {isListening && (
          <>
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
            <span className="absolute inline-flex h-3/4 w-3/4 rounded-full bg-red-400 opacity-50 animate-ping delay-75"></span>
          </>
        )}

        <div className="z-10 text-white">
          {isListening ? <Mic className="w-10 h-10" /> : <MicOff className="w-10 h-10" />}
        </div>
      </button>

      {/* Auto-Mic Toggle (Small button next to mic) */}
      <button
        onClick={onToggleContinuous}
        className={`
          flex flex-col items-center justify-center w-12 h-12 rounded-full border border-white/10 backdrop-blur-md shadow-lg transition-all
          ${continuousMode ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-black/40 text-gray-400 hover:bg-black/60'}
        `}
        title={continuousMode ? "Auto-Mic On" : "Auto-Mic Off"}
      >
        <RefreshCw className={`w-5 h-5 ${continuousMode ? 'animate-spin-slow' : ''}`} />
      </button>
    </div>
  );
};