import React, { useState, useEffect, useRef } from 'react';
import { Type, GripHorizontal } from 'lucide-react';

interface DraggableCaptionProps {
  text: string;
  isEditable: boolean;
  positionMode: 'bottom' | 'top' | 'center' | 'custom' | 'hidden';
  onPositionChange?: (x: number, y: number) => void;
}

export const DraggableCaption: React.FC<DraggableCaptionProps> = ({ 
  text, 
  isEditable, 
  positionMode,
  onPositionChange 
}) => {
  // Default positions based on mode
  const getInitialStyle = () => {
    switch (positionMode) {
      case 'top': return { top: '10%', left: '50%', transform: 'translate(-50%, 0)' };
      case 'center': return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      case 'bottom': 
      default: return { bottom: '10%', left: '50%', transform: 'translate(-50%, 0)' };
    }
  };

  const [position, setPosition] = useState<{x: number | null, y: number | null}>({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{x: number, y: number}>({ x: 0, y: 0 });

  // Reset local position when mode changes to a preset (not custom)
  useEffect(() => {
    if (positionMode !== 'custom') {
        setPosition({ x: null, y: null });
    }
  }, [positionMode]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isEditable) return;
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    if (elementRef.current) {
       const rect = elementRef.current.getBoundingClientRect();
       dragStartRef.current = {
           x: clientX - rect.left,
           y: clientY - rect.top
       };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !elementRef.current) return;
      e.preventDefault();

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      
      const parent = elementRef.current.offsetParent as HTMLElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      
      // Calculate new position relative to parent
      let newX = clientX - parentRect.left - dragStartRef.current.x;
      let newY = clientY - parentRect.top - dragStartRef.current.y;

      // Constrain to parent bounds
      const elRect = elementRef.current.getBoundingClientRect();
      const maxX = parentRect.width - elRect.width;
      const maxY = parentRect.height - elRect.height;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
      
      // Notify parent that we are now in custom mode
      if (onPositionChange) {
         onPositionChange(newX, newY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove, { passive: false });
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, onPositionChange]);

  if (positionMode === 'hidden') return null;

  // Combine preset styles with custom drag coordinates
  const style: React.CSSProperties = position.x !== null && position.y !== null 
    ? { top: position.y, left: position.x, position: 'absolute' }
    : { position: 'absolute', ...getInitialStyle() };

  return (
    <div 
      ref={elementRef}
      style={style}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      className={`
        z-20 max-w-[90%] px-4 py-2 rounded-xl backdrop-blur-md transition-shadow
        ${isEditable ? 'cursor-move hover:ring-2 hover:ring-indigo-500/50 hover:bg-black/60' : ''}
        ${isDragging ? 'ring-2 ring-indigo-500 bg-black/70 shadow-xl' : 'bg-black/40'}
      `}
    >
      <div className="flex items-center gap-2">
         {isEditable && (
             <GripHorizontal className={`w-4 h-4 text-gray-400 ${isDragging ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 transition-opacity`} />
         )}
         <p className="text-white text-sm md:text-base font-medium drop-shadow-md text-center leading-tight">
            {text}
         </p>
      </div>
    </div>
  );
};