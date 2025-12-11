import React, { useState } from 'react';
import { MediaType, GenerationMode, ViewMode } from '../types';
import { 
  Settings, X, Image as ImageIcon, Video as VideoIcon, 
  History, Layout, Key, 
  AlignVerticalDistributeEnd, AlignVerticalDistributeCenter, 
  AlignVerticalDistributeStart, EyeOff
} from 'lucide-react';

interface FloatingMenuProps {
  mode: GenerationMode;
  setMode: (mode: GenerationMode) => void;
  view: ViewMode;
  setView: (view: ViewMode) => void;
  textPosition: 'bottom' | 'top' | 'center' | 'custom' | 'hidden';
  setTextPosition: (pos: 'bottom' | 'top' | 'center' | 'custom' | 'hidden') => void;
  onSelectKey: () => void;
  historyCount: number;
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({
  mode, setMode,
  view, setView,
  textPosition, setTextPosition,
  onSelectKey,
  historyCount
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to cycle text position
  const cycleTextPosition = () => {
      const modes: ('bottom' | 'top' | 'center' | 'hidden')[] = ['bottom', 'center', 'top', 'hidden'];
      const currentIndex = modes.indexOf(textPosition as any);
      const next = currentIndex === -1 ? 'bottom' : modes[(currentIndex + 1) % modes.length];
      setTextPosition(next);
  };

  const getTextIcon = () => {
      switch(textPosition) {
          case 'top': return <AlignVerticalDistributeStart className="w-4 h-4" />;
          case 'center': return <AlignVerticalDistributeCenter className="w-4 h-4" />;
          case 'hidden': return <EyeOff className="w-4 h-4" />;
          case 'custom': return <AlignVerticalDistributeCenter className="w-4 h-4 text-indigo-400" />;
          case 'bottom': default: return <AlignVerticalDistributeEnd className="w-4 h-4" />;
      }
  };

  return (
    <>
      {/* Toggle Button (Bottom Right) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/10 transition-all shadow-lg hover:rotate-90 duration-500"
        aria-label="Open Settings"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Overlay/Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 flex justify-end">
           {/* Backdrop click to close */}
           <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

           {/* Side Panel */}
           <div className="relative w-full max-w-sm h-full bg-[#0f111a] border-l border-gray-800 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
              
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                    Studio Controls
                 </h2>
                 <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                 >
                    <X className="w-6 h-6 text-gray-400" />
                 </button>
              </div>

              <div className="space-y-8">
                  
                  {/* View Section */}
                  <div className="space-y-3">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Workspace</label>
                      <div className="grid grid-cols-2 gap-2 bg-gray-800/50 p-1 rounded-xl">
                          <button
                              onClick={() => setView('CANVAS')}
                              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                  view === 'CANVAS' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'
                              }`}
                          >
                              <Layout className="w-4 h-4" /> Live
                          </button>
                          <button
                              onClick={() => setView('HISTORY')}
                              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                  view === 'HISTORY' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'
                              }`}
                          >
                              <History className="w-4 h-4" /> History
                              {historyCount > 0 && <span className="ml-1 text-xs bg-gray-600 px-1.5 rounded-full">{historyCount}</span>}
                          </button>
                      </div>
                  </div>

                  {/* Generation Mode */}
                  <div className="space-y-3">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Output Mode</label>
                      <div className="grid grid-cols-2 gap-2 bg-gray-800/50 p-1 rounded-xl">
                          <button
                              onClick={() => setMode(MediaType.IMAGE)}
                              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                  mode === MediaType.IMAGE ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                              }`}
                          >
                              <ImageIcon className="w-4 h-4" /> Image
                          </button>
                          <button
                              onClick={() => setMode(MediaType.VIDEO)}
                              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                  mode === MediaType.VIDEO ? 'bg-pink-600 text-white shadow' : 'text-gray-400 hover:text-white'
                              }`}
                          >
                              <VideoIcon className="w-4 h-4" /> Video
                          </button>
                      </div>
                  </div>

                  {/* UI Toggles */}
                  <div className="space-y-3">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Interface</label>
                      
                      {/* Text Position */}
                      <button 
                        onClick={cycleTextPosition}
                        className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors border border-gray-700/50"
                      >
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-gray-700 rounded-lg text-gray-300">
                                  {getTextIcon()}
                              </div>
                              <span className="text-sm font-medium text-gray-300">Caption Position</span>
                          </div>
                          <span className="text-xs text-gray-500 font-mono uppercase">{textPosition}</span>
                      </button>
                  </div>

                  <hr className="border-gray-800" />

                  {/* Actions */}
                  <div className="grid grid-cols-1 gap-3">
                      <button 
                         onClick={onSelectKey}
                         className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 transition-all text-sm font-medium"
                      >
                         <Key className="w-4 h-4" /> API Key
                      </button>
                  </div>

              </div>
           </div>
        </div>
      )}
    </>
  );
};