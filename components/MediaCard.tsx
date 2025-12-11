import React, { useRef } from 'react';
import { MediaItem, MediaType } from '../types';
import { Download, AlertCircle, Loader2 } from 'lucide-react';
import { DraggableCaption } from './DraggableCaption';

interface MediaCardProps {
  item: MediaItem;
  interactive?: boolean;
  textConfig?: {
    mode: 'bottom' | 'top' | 'center' | 'custom' | 'hidden';
    onDrag?: (x: number, y: number) => void;
  };
  fullScreen?: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({ 
  item, 
  interactive = false,
  textConfig = { mode: 'bottom' },
  fullScreen = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (item.type === MediaType.VIDEO && videoRef.current) {
      videoRef.current.playbackRate = 2.0; 
    }
  };

  const handleMouseLeave = () => {
    if (item.type === MediaType.VIDEO && videoRef.current) {
      videoRef.current.playbackRate = 1.0; 
    }
  };

  // If fullScreen, we want the container to be flexible (h-full w-full) and image to contain.
  // If not fullScreen (e.g. history), we want aspect-square.

  return (
    <div 
      className={`
        group relative bg-gray-900/50 overflow-hidden shadow-2xl flex flex-col transition-all duration-300
        ${fullScreen ? 'w-full h-full rounded-none md:rounded-3xl border-0 md:border md:border-gray-800' : 'aspect-square rounded-xl border border-gray-700 hover:shadow-2xl hover:border-indigo-500/50 hover:-translate-y-1'}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden">
        {item.isLoading ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
            <p className="text-gray-400 text-sm animate-pulse">
              {item.type === MediaType.VIDEO ? "Dreaming up a video..." : "Painting your thought..."}
            </p>
          </div>
        ) : item.error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-red-400">
            <AlertCircle className="w-10 h-10 mb-2" />
            <p className="text-sm">{item.error}</p>
          </div>
        ) : item.url ? (
          <>
            {item.type === MediaType.VIDEO ? (
              <video 
                ref={videoRef}
                src={item.url} 
                autoPlay 
                loop 
                muted 
                playsInline 
                className={`w-full h-full ${fullScreen ? 'object-contain' : 'object-cover'}`}
              />
            ) : (
              <img 
                src={item.url} 
                alt={item.prompt} 
                className={`w-full h-full transition-transform duration-700 ease-in-out 
                   ${fullScreen ? 'object-contain' : 'object-cover group-hover:scale-110'}
                `}
              />
            )}
            
            <DraggableCaption 
                text={item.prompt}
                isEditable={interactive}
                positionMode={interactive ? textConfig.mode : 'bottom'} 
                onPositionChange={interactive ? textConfig.onDrag : undefined}
            />
          </>
        ) : null}
        
        {!item.isLoading && !item.error && item.url && (
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
                 <span className="text-xs text-gray-300 uppercase tracking-wider bg-black/60 px-2 py-1.5 rounded backdrop-blur-sm border border-gray-700 font-bold">
                    {item.type}
                 </span>
                 <a 
                    href={item.url} 
                    download={`dreamstream-${item.id}.${item.type === MediaType.VIDEO ? 'mp4' : 'png'}`}
                    className="p-1.5 bg-black/60 rounded backdrop-blur-sm border border-gray-700 hover:bg-indigo-600 hover:border-indigo-500 transition-colors text-white"
                    title="Download"
                >
                    <Download className="w-4 h-4" />
                </a>
            </div>
        )}
      </div>
    </div>
  );
};