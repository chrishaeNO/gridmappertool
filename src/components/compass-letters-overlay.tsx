'use client';

import React from 'react';

interface CompassLettersOverlayProps {
  compassLetters: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  };
  showReferencePoints: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

export default function CompassLettersOverlay({
  compassLetters,
  showReferencePoints,
  containerRef
}: CompassLettersOverlayProps) {
  // Don't render if no letters are enabled
  if (!compassLetters.north && !compassLetters.south && !compassLetters.east && !compassLetters.west) {
    return null;
  }

  // Calculate proper offset: nøyaktig 7px fra referanselinjer
  const gridLabelOffset = '35px'; // Space for grid labels (A, B, C... and 1, 2, 3...)
  const referenceLineOffset = showReferencePoints ? '7px' : '0px'; // Exactly 7px from reference lines
  const extraSpacing = '5px'; // Minimal extra spacing
  
  const letterSize = '20px'; // Smaller size to match export

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* North (N) - Above grid labels and reference lines */}
      {compassLetters.north && (
        <div
          className="absolute flex items-center justify-center font-medium text-black bg-white/90 rounded-full border-2 border-gray-300 shadow-lg"
          style={{
            width: letterSize,
            height: letterSize,
            fontSize: '16px',
            top: showReferencePoints 
              ? `calc(${gridLabelOffset} + ${referenceLineOffset} + 2px)` // Close to reference line
              : `calc(${gridLabelOffset} - 10px)`, // Close to grid labels when no reference lines
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          N
        </div>
      )}

      {/* South (S) - Below grid labels and reference lines */}
      {compassLetters.south && (
        <div
          className="absolute flex items-center justify-center font-medium text-black bg-white/90 rounded-full border-2 border-gray-300 shadow-lg"
          style={{
            width: letterSize,
            height: letterSize,
            fontSize: '16px',
            bottom: showReferencePoints 
              ? `calc(${gridLabelOffset} + ${referenceLineOffset} + ${extraSpacing})` // Close to reference line
              : `calc(${gridLabelOffset} - 10px)`, // Close to grid labels when no reference lines
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          S
        </div>
      )}

      {/* East (E) - Right of grid labels and reference lines */}
      {compassLetters.east && (
        <div
          className="absolute flex items-center justify-center font-medium text-black bg-white/90 rounded-full border-2 border-gray-300 shadow-lg"
          style={{
            width: letterSize,
            height: letterSize,
            fontSize: '16px',
            top: '50%',
            right: showReferencePoints 
              ? `calc(${gridLabelOffset} + ${referenceLineOffset} + ${extraSpacing})` // Close to reference line
              : `calc(${gridLabelOffset} - 10px)`, // Close to grid labels when no reference lines
            transform: 'translateY(-50%)'
          }}
        >
          E
        </div>
      )}

      {/* West (W) - Left of grid labels and reference lines */}
      {compassLetters.west && (
        <div
          className="absolute flex items-center justify-center font-medium text-black bg-white/90 rounded-full border-2 border-gray-300 shadow-lg"
          style={{
            width: letterSize,
            height: letterSize,
            fontSize: '16px',
            top: '50%',
            left: showReferencePoints 
              ? `calc(${gridLabelOffset} + ${referenceLineOffset} + ${extraSpacing})` // Close to reference line
              : `calc(${gridLabelOffset} - 10px)`, // Close to grid labels when no reference lines
            transform: 'translateY(-50%)'
          }}
        >
          W
        </div>
      )}
    </div>
  );
}
