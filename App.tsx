import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FloatingMenu } from './components/FloatingMenu';
import { VoiceControl } from './components/VoiceControl';
import { MediaCard } from './components/MediaCard';
import { ActiveCanvas } from './components/ActiveCanvas';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { MediaItem, MediaType, GenerationMode, ViewMode, ImageStyle } from './types';
import { generateImageFromText, generateVideoFromText, checkApiKeySelection, openApiKeySelection } from './services/genaiService';
import { Sparkles, Trash2, RefreshCcw, Palette, Undo2, Redo2 } from 'lucide-react';

const STYLES: ImageStyle[] = [
  'None', 'Cinematic', 'Photographic', 'Anime', '3D Render', 
  'Watercolor', 'Oil Painting', 'Pixel Art', 'Cyberpunk', 'Sketch'
];

const App: React.FC = () => {
  // State
  const [timeline, setTimeline] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  
  const [mode, setMode] = useState<GenerationMode>(MediaType.IMAGE);
  const [style, setStyle] = useState<ImageStyle>('None');
  const [view, setView] = useState<ViewMode>('CANVAS');
  const [continuousMode, setContinuousMode] = useState<boolean>(true);
  const [textPositionMode, setTextPositionMode] = useState<'bottom' | 'top' | 'center' | 'custom' | 'hidden'>('bottom');
  const [contextPrompt, setContextPrompt] = useState<string>("");
  
  const sessionSeed = useRef<number>(Math.floor(Math.random() * 1000000));
  const itemsEndRef = useRef<HTMLDivElement>(null);

  // Derived state
  const activeItem = currentIndex >= 0 ? timeline[currentIndex] : null;
  // If the active item is loading, show the one before it as "previous" to maintain visuals
  // If active item is loaded, previous is just the one before in the timeline
  const previousActiveItem = currentIndex > 0 ? timeline[currentIndex - 1] : null;

  const scrollToBottom = () => {
    if (view === 'HISTORY') {
       itemsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [timeline.length, view]);

  const handleClearHistory = () => {
    if (confirm("Clear all history?")) {
      setTimeline([]);
      setCurrentIndex(-1);
      setContextPrompt("");
      sessionSeed.current = Math.floor(Math.random() * 1000000);
    }
  };

  const handleResetContext = () => {
     setContextPrompt("");
     // Start new scene effectively clears the board visually but keeps history? 
     // Requirement says "Start New Scene". Usually implies clearing current context.
     // To keep it simple and consistent with previous behavior:
     setTimeline([]);
     setCurrentIndex(-1);
     sessionSeed.current = Math.floor(Math.random() * 1000000);
  };

  const handleUndo = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setContextPrompt(timeline[newIndex].prompt);
    }
  }, [currentIndex, timeline]);

  const handleRedo = useCallback(() => {
    if (currentIndex < timeline.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setContextPrompt(timeline[newIndex].prompt);
    }
  }, [currentIndex, timeline]);

  const generateMedia = async (newInput: string, currentMode: GenerationMode) => {
    if (!newInput.trim()) return;
    
    if (currentMode === MediaType.VIDEO) {
        const hasKey = await checkApiKeySelection();
        if (!hasKey) {
            await openApiKeySelection();
        }
    }

    const updatedContext = contextPrompt ? `${contextPrompt}. ${newInput}` : newInput;
    setContextPrompt(updatedContext);

    const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // Use the currently displayed image as reference for continuity
    const referenceItem = activeItem && !activeItem.isLoading && !activeItem.error ? activeItem : null;
    const referenceImageUrl = referenceItem?.url;

    const newItem: MediaItem = {
      id: newId,
      type: currentMode,
      prompt: updatedContext,
      isLoading: true,
      timestamp: Date.now(),
    };

    // Standard Undo/Redo behavior: discard future history if we diverge
    const newTimeline = timeline.slice(0, currentIndex + 1);
    const newIndex = newTimeline.length;
    
    setTimeline([...newTimeline, newItem]);
    setCurrentIndex(newIndex);

    try {
      let url: string;
      const seed = sessionSeed.current;
      if (currentMode === MediaType.IMAGE) {
        url = await generateImageFromText(newInput, updatedContext, referenceImageUrl, style, seed);
      } else {
        url = await generateVideoFromText(newInput, updatedContext, referenceImageUrl, style, seed);
      }

      setTimeline(prev => 
        prev.map(item => item.id === newId ? { ...item, isLoading: false, url } : item)
      );
    } catch (error: any) {
      console.error("Generation error:", error);
      if (error.message && error.message.includes("Requested entity was not found")) {
         await openApiKeySelection();
      }
      setTimeline(prev => 
        prev.map(item => item.id === newId ? { ...item, isLoading: false, error: error.message || "Failed to generate" } : item)
      );
    }
  };

  const handleSpeechResult = useCallback((transcript: string) => {
      if (transcript && transcript.trim().length > 0) {
        const lower = transcript.toLowerCase().trim().replace(/[.,!?]/g, '');
        
        // Voice Commands for Undo/Redo
        if (['undo', 'go back', 'back', 'previous'].includes(lower)) {
            handleUndo();
            return;
        }
        if (['redo', 'go forward', 'forward', 'next'].includes(lower)) {
            handleRedo();
            return;
        }

        if (view !== 'CANVAS') setView('CANVAS');
        generateMedia(transcript, mode);
      }
  }, [mode, view, contextPrompt, activeItem, style, handleUndo, handleRedo]); 

  const { isListening, startListening, stopListening, error: speechError } = useSpeechRecognition({
    onResult: handleSpeechResult,
    continuousMode: continuousMode,
  });

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  return (
    <div className="h-screen w-screen bg-[#0f111a] text-white font-sans overflow-hidden relative selection:bg-indigo-500 selection:text-white">
      {/* Background Noise Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0"></div>
      
      {/* Floating Menu (Bottom Right) */}
      <FloatingMenu 
        mode={mode} setMode={setMode}
        view={view} setView={setView}
        textPosition={textPositionMode} setTextPosition={setTextPositionMode}
        onSelectKey={openApiKeySelection}
        historyCount={timeline.length}
      />

      {/* Main Branding (Top Left) */}
      <div className="absolute top-4 left-4 z-40 pointer-events-none md:pointer-events-auto">
         <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
                DreamStream
            </span>
         </div>
      </div>

      {/* Start New Scene Button (Top Right) */}
      {contextPrompt && (
        <button
            onClick={handleResetContext}
            className="absolute top-4 right-4 z-50 p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/10 transition-all shadow-lg hover:scale-110 duration-200 group"
            title="Start New Scene (Clears Context)"
        >
            <RefreshCcw className="w-6 h-6 text-indigo-400 group-hover:rotate-180 transition-transform duration-500" />
        </button>
      )}

      {/* Undo/Redo Controls (Bottom Left) */}
      <div className="fixed bottom-8 left-8 z-50 flex gap-4">
         <button 
            onClick={handleUndo}
            disabled={currentIndex <= 0}
            className={`
               p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-full shadow-lg transition-all
               ${currentIndex <= 0 ? 'opacity-30 cursor-not-allowed' : 'text-white hover:bg-white/10 hover:-translate-y-1'}
            `}
            title="Undo (Voice: 'Undo')"
         >
             <Undo2 className="w-6 h-6" />
         </button>
         <button 
            onClick={handleRedo}
            disabled={currentIndex >= timeline.length - 1}
            className={`
               p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-full shadow-lg transition-all
               ${currentIndex >= timeline.length - 1 ? 'opacity-30 cursor-not-allowed' : 'text-white hover:bg-white/10 hover:-translate-y-1'}
            `}
            title="Redo (Voice: 'Redo')"
         >
             <Redo2 className="w-6 h-6" />
         </button>
      </div>

      {/* Art Direction (Style) Selector - Bottom Right (Left of Settings) */}
      <div className="fixed bottom-8 right-28 z-50">
        <div className="relative group">
           <button className="p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/10 transition-all shadow-lg">
               <Palette className="w-6 h-6 text-pink-400" />
           </button>
           
           {/* Popup Select */}
           <div className="absolute bottom-full right-0 mb-4 w-40 bg-[#0f111a] border border-gray-800 rounded-xl shadow-2xl p-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto transform translate-y-2 group-hover:translate-y-0">
               <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wider border-b border-gray-800">
                   Art Style
               </div>
               <div className="max-h-60 overflow-y-auto py-1">
                   {STYLES.map(s => (
                       <button
                           key={s}
                           onClick={() => setStyle(s)}
                           className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${style === s ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                       >
                           {s}
                       </button>
                   ))}
               </div>
           </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="absolute inset-0 z-10">
          
          {view === 'CANVAS' ? (
             <ActiveCanvas 
                item={activeItem} 
                previousItem={previousActiveItem}
                contextPrompt={contextPrompt}
                textConfig={{
                    mode: textPositionMode,
                    onDrag: () => setTextPositionMode('custom')
                }} 
            />
          ) : (
             <div className="h-full w-full overflow-y-auto p-4 md:p-12 animate-in slide-in-from-right-10 duration-300">
                <div className="max-w-7xl mx-auto pt-12 pb-32">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">History <span className="text-sm font-normal text-gray-500">({timeline.length})</span></h2>
                        {timeline.length > 0 && (
                            <button onClick={handleClearHistory} className="flex items-center gap-2 px-4 py-2 text-red-400 bg-red-900/10 hover:bg-red-900/20 rounded-lg transition-colors border border-red-900/20">
                                <Trash2 className="w-4 h-4" /> Clear All
                            </button>
                        )}
                    </div>

                    {timeline.length === 0 ? (
                        <div className="text-center text-gray-500 py-20 bg-gray-900/30 rounded-3xl border border-gray-800/50">
                            <p>No history yet. Switch to Live Canvas to start dreaming.</p>
                            <button onClick={() => setView('CANVAS')} className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white font-medium transition-colors">
                                Go to Canvas
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {timeline.map((item, index) => (
                                <div key={item.id} className={`${index === currentIndex ? 'ring-2 ring-indigo-500 rounded-xl' : ''}`}>
                                   <MediaCard item={item} />
                                </div>
                            ))}
                            <div ref={itemsEndRef} />
                        </div>
                    )}
                </div>
             </div>
          )}

      </main>

      {/* Error Toast */}
      {speechError && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-xl z-50 animate-bounce">
          {speechError}
        </div>
      )}

      {/* Voice Control (Bottom Center) - Floating */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
         <div className="pointer-events-auto transform hover:scale-105 transition-transform duration-200">
            <VoiceControl 
                isListening={isListening} 
                onToggle={toggleListening}
                continuousMode={continuousMode}
                onToggleContinuous={() => setContinuousMode(!continuousMode)}
            />
         </div>
      </div>

    </div>
  );
};

export default App;