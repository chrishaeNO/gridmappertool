'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Compass } from 'lucide-react';

interface InteractiveRotationOverlayProps {
  isActive: boolean;
  currentRotation: number;
  onRotationChange: (angle: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export default function InteractiveRotationOverlay({
  isActive,
  currentRotation,
  onRotationChange,
  containerRef
}: InteractiveRotationOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  
  // Calculate center of the container
  useEffect(() => {
    if (!containerRef.current || !isActive) return;
    
    const updateCenter = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setCenter({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      }
    };
    
    updateCenter();
    window.addEventListener('resize', updateCenter);
    window.addEventListener('scroll', updateCenter);
    
    return () => {
      window.removeEventListener('resize', updateCenter);
      window.removeEventListener('scroll', updateCenter);
    };
  }, [containerRef, isActive]);

  const calculateAngle = useCallback((clientX: number, clientY: number) => {
    const deltaX = clientX - center.x;
    const deltaY = clientY - center.y;
    
    // Calculate angle in degrees (0° = top, clockwise)
    let angle = Math.atan2(deltaX, -deltaY) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    
    return angle;
  }, [center]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isActive) return;
    e.preventDefault();
    setIsDragging(true);
  }, [isActive]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !isActive) return;
    
    const angle = calculateAngle(e.clientX, e.clientY);
    onRotationChange(angle);
  }, [isDragging, isActive, calculateAngle, onRotationChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isActive) return;
    e.preventDefault();
    setIsDragging(true);
  }, [isActive]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !isActive || e.touches.length === 0) return;
    
    const touch = e.touches[0];
    const angle = calculateAngle(touch.clientX, touch.clientY);
    onRotationChange(angle);
  }, [isDragging, isActive, calculateAngle, onRotationChange]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-auto" />
      
      {/* Center compass */}
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-grab active:cursor-grabbing"
        style={{
          left: '50%',
          top: '50%'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Compass background */}
        <div className="relative">
          {/* Outer ring */}
          <div className="w-32 h-32 rounded-full border-4 border-white bg-black/50 backdrop-blur-sm flex items-center justify-center">
            {/* Inner compass */}
            <div className="w-24 h-24 rounded-full border-2 border-white/50 relative flex items-center justify-center">
              <Compass 
                className="w-16 h-16 text-white" 
                style={{ 
                  transform: `rotate(${-currentRotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease'
                }} 
              />
              
              {/* North indicator */}
              <div 
                className="absolute w-3 h-3 bg-red-500 rounded-full border border-white"
                style={{ 
                  top: '4px',
                  left: '50%',
                  transform: `translateX(-50%) rotate(${-currentRotation}deg)`,
                  transformOrigin: '50% 44px',
                  transition: isDragging ? 'none' : 'transform 0.2s ease'
                }}
              />
            </div>
          </div>
          
          {/* Rotation indicator line */}
          <div 
            className="absolute w-0.5 h-20 bg-white origin-bottom"
            style={{
              left: '50%',
              bottom: '50%',
              transform: `translateX(-50%) rotate(${currentRotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease'
            }}
          />
        </div>
        
        {/* Angle display */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/70 text-white px-3 py-1 rounded text-sm font-mono">
            {Math.round(currentRotation)}°
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
        <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
          Drag the compass to rotate • Current: {Math.round(currentRotation)}°
        </div>
      </div>
    </div>
  );
}
