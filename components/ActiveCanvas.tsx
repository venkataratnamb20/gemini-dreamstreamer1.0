import React from 'react';
import { MediaItem } from '../types';
import { MediaCard } from './MediaCard';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';

interface ActiveCanvasProps {
  item: MediaItem | null;
  previousItem?: MediaItem | null; 
  contextPrompt: string;
  textConfig: {
    mode: 'bottom' | 'top' | 'center' | 'custom' | 'hidden';
    onDrag: (x: number, y: number) => void;
  };
}

export const ActiveCanvas: React.FC<ActiveCanvasProps> = ({ item, previousItem, contextPrompt, textConfig }) => {
  const isGenerating = item?.isLoading;
  // Always prefer showing the item if it has data, or the previous item if we are loading the next one
  const displayItem = item?.url ? item : (previousItem?.url ? previousItem : null);
  
  // If we are generating but have a display item (continuity), show it.
  // If we are generating the VERY first item (no displayItem), show loading placeholder.

  if (!displayItem && !isGenerating && !contextPrompt) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-gray-600 animate-in fade-in duration-700 p-4">
        <div className="p-8 rounded-3xl border-2 border-dashed border-gray-800/50 bg-black/20 backdrop-blur-sm flex flex-col items-center text-center max-w-md">
            <Sparkles className="w-12 h-12 text-indigo-500 mb-4 opacity-50" />
            <p className="text-2xl font-medium mb-2 text-gray-400">Empty Canvas</p>
            <p className="text-base text-gray-500">
            Tap the mic and describe a scene to begin.
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
      {/* Background Ambience */}
      {displayItem?.url && (
         <div 
            className="absolute inset-0 z-0 opacity-20 blur-3xl scale-110"
            style={{ 
                backgroundImage: `url(${displayItem.url})`, 
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
         />
      )}

      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-0 md:p-6 lg:p-10 transition-all duration-500">
        {displayItem ? (
          <div className="relative w-full h-full max-w-[100vw] max-h-[100vh] flex items-center justify-center shadow-2xl">
             <MediaCard 
                item={displayItem} 
                interactive={true}
                textConfig={textConfig}
                fullScreen={true}
             />
             
             {/* Unobtrusive Loading Indicator */}
             {isGenerating && (
                <div className="absolute top-6 right-6 z-50 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full border border-white/10 shadow-lg">
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                        <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                            Updating...
                        </span>
                    </div>
                </div>
             )}
          </div>
        ) : (
           // Initial Loading State (First Generation)
           <div className="w-full h-full max-w-4xl max-h-[80vh] aspect-square bg-gray-900/50 rounded-3xl border border-gray-800/50 flex items-center justify-center relative overflow-hidden backdrop-blur-sm">
               <div className="z-10 text-center p-8">
                  <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                      <Wand2 className="w-16 h-16 text-indigo-500 animate-bounce relative z-10" />
                  </div>
                  <p className="text-gray-400 animate-pulse font-medium text-lg">Conjuring first scene...</p>
                  {contextPrompt && (
                     <p className="mt-6 text-sm text-gray-500 italic max-w-md mx-auto px-4">"{contextPrompt}"</p>
                  )}
               </div>
           </div>
        )}
      </div>
    </div>
  );
};