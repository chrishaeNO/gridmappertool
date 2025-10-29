'use client';

import React from 'react';
import { Compass } from 'lucide-react';

interface CompassOverlayProps {
  rotation: number;
  onSetNorthUp?: () => void;
}

export default function CompassOverlay({ rotation, onSetNorthUp }: CompassOverlayProps) {
  return (
    <div className="absolute top-4 right-4 z-10">
      <div 
        className="bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg cursor-pointer hover:bg-background/95 transition-colors"
        onClick={onSetNorthUp}
        title="Click to set North up"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <Compass 
              className="h-8 w-8 text-primary" 
              style={{ 
                transform: `rotate(${-rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.3s ease'
              }} 
            />
            {/* North indicator */}
            <div 
              className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-2 h-2 bg-red-500 rounded-full"
              style={{ 
                transform: `translateX(-50%) translateY(-4px) rotate(${-rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.3s ease'
              }}
            />
          </div>
          <div className="text-xs text-center">
            <div className="font-semibold">N</div>
            <div className="text-muted-foreground">{rotation}°</div>
          </div>
        </div>
      </div>
    </div>
  );
}
