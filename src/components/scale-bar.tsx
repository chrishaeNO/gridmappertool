'use client';

import React from 'react';

type ScaleBarProps = {
  scale: number;
  cellSize: number;
  unit: 'px' | 'mm';
  dpi: number;
  color: string;
};

export default function ScaleBar({ scale, cellSize, unit, dpi, color }: ScaleBarProps) {
  const cellSizePx = unit === 'px' ? cellSize : (cellSize / 25.4) * dpi;
  
  if (cellSizePx <= 0) return null;

  const scaleBarLengthPx = cellSizePx * scale;
  const label = `${cellSize}${unit}`;

  // Don't render the scale bar if it's too small to be useful
  if (scaleBarLengthPx < 20) {
    return null;
  }

  return (
    <div
      className="absolute bottom-4 left-4 p-2 pointer-events-none"
      style={{ color: color }}
    >
      <div className="flex flex-col items-center bg-background/50 backdrop-blur-sm p-1 rounded">
        <span className="text-xs font-semibold">{label}</span>
        <div
          className="h-1 border-l-2 border-r-2 border-b-2"
          style={{ width: `${scaleBarLengthPx}px`, borderColor: color }}
        ></div>
      </div>
    </div>
  );
}
