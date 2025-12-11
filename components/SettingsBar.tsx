import React from 'react';
import { MediaType, GenerationMode, ImageStyle } from '../types';
import { Image as ImageIcon, Video as VideoIcon, Key, RefreshCcw, Palette } from 'lucide-react';

interface SettingsBarProps {
  mode: GenerationMode;
  setMode: (mode: GenerationMode) => void;
  style: ImageStyle;
  setStyle: (style: ImageStyle) => void;
  onResetContext: () => void;
  onSelectKey: () => void;
  hasContext: boolean;
}

const STYLES: ImageStyle[] = [
  'None',
  'Cinematic',
  'Photographic',
  'Anime',
  '3D Render',
  'Watercolor',
  'Oil Painting',
  'Pixel Art',
  'Cyberpunk',
  'Sketch'
];

export const SettingsBar: React.FC<SettingsBarProps> = ({ 
  mode, 
  setMode, 
  style,
  setStyle,
  onResetContext, 
  onSelectKey,
  hasContext 
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-gray-900/80 backdrop-blur-md p-3 rounded-2xl border border-gray-700 shadow-xl">
      
      {/* Mode Switcher */}
      <div className="flex bg-gray-800 p-1 rounded-xl">
        <button
          onClick={() => setMode(MediaType.IMAGE)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === MediaType.IMAGE 
              ? 'bg-indigo-600 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Image</span>
        </button>
        <button
          onClick={() => setMode(MediaType.VIDEO)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === MediaType.VIDEO 
              ? 'bg-pink-600 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <VideoIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Video</span>
        </button>
      </div>

      <div className="w-px h-8 bg-gray-700 mx-1 hidden sm:block"></div>

      {/* Style Selector */}
      <div className="relative group">
         <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-sm text-gray-300">
            <Palette className="w-4 h-4 text-indigo-400" />
            <select 
               value={style}
               onChange={(e) => setStyle(e.target.value as ImageStyle)}
               className="bg-transparent border-none outline-none focus:ring-0 appearance-none cursor-pointer w-24 sm:w-32"
               aria-label="Select Style"
            >
              {STYLES.map((s) => (
                <option key={s} value={s} className="bg-gray-800 text-white">
                  {s}
                </option>
              ))}
            </select>
         </div>
      </div>

      <div className="w-px h-8 bg-gray-700 mx-1 hidden sm:block"></div>

      {/* Context Control */}
      {hasContext && (
        <button
          onClick={onResetContext}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-900/20 hover:bg-indigo-900/40 text-indigo-300 rounded-lg text-sm font-medium transition-colors border border-indigo-500/30"
          title="Start a new scene (clears memory)"
        >
          <RefreshCcw className="w-4 h-4" />
          <span className="hidden sm:inline">New Scene</span>
        </button>
      )}

      {/* API Key */}
      <button
        onClick={onSelectKey}
        className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-700"
        title="Change API Key"
      >
        <Key className="w-4 h-4" />
        <span className="hidden sm:inline">Key</span>
      </button>
    </div>
  );
};