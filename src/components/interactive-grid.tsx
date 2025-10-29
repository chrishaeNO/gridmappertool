'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { getColumnLabel } from '@/utils/columnLabels';

type GridMap = {
  id: string;
  userId: string;
  imageUrl: string;
  gridCellSize: number;
  gridUnit: 'px' | 'mm';
  gridColor: string;
  labelFont: string;
  labelColor: string;
  shared: boolean;
  createdAt: string;
  lastUpdated: string;
  name: string;
  imageDimensions: { naturalWidth: number; naturalHeight: number };
  gridOffset: { x: number; y: number };
  dpi: number;
  gridThickness: number;
};

type InteractiveGridProps = {
  mapData: GridMap;
};

const InteractiveGrid = ({ mapData }: InteractiveGridProps) => {
  const {
    imageUrl,
    imageDimensions,
    gridCellSize,
    gridUnit,
    dpi,
    gridOffset,
    gridColor,
    labelColor,
    gridThickness,
  } = mapData;

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [hoveredCoords, setHoveredCoords] = useState<{ col: string; row: number } | null>(null);

  const cellSizePx = gridUnit === 'px' ? gridCellSize : (gridCellSize / 25.4) * dpi;
  const labelSize = Math.min(25, cellSizePx * 0.4);
  const labelFontSize = Math.min(12, cellSizePx * 0.3);

  const numCols = Math.floor((imageDimensions.naturalWidth - gridOffset.x) / cellSizePx);
  const numRows = Math.floor((imageDimensions.naturalHeight - gridOffset.y) / cellSizePx);

  const fitAndCenter = useCallback(() => {
    if (!imageDimensions || !containerRef.current || !contentRef.current) return;

    const contentWidth = imageDimensions.naturalWidth + labelSize;
    const contentHeight = imageDimensions.naturalHeight + labelSize;
    const { offsetWidth: containerWidth, offsetHeight: containerHeight } = containerRef.current;

    const scaleX = (containerWidth - 32) / contentWidth;
    const scaleY = (containerHeight - 32) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1);

    setScale(newScale);

    if (contentRef.current) {
      const scaledContentWidth = contentWidth * newScale;
      const scaledContentHeight = contentHeight * newScale;
      contentRef.current.style.left = `${(containerWidth - scaledContentWidth) / 2}px`;
      contentRef.current.style.top = `${(containerHeight - scaledContentHeight) / 2}px`;
    }
  }, [imageDimensions, labelSize]);

  useEffect(() => {
    fitAndCenter();
    window.addEventListener('resize', fitAndCenter);
    return () => window.removeEventListener('resize', fitAndCenter);
  }, [fitAndCenter]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!contentRef.current) return;

    const rect = contentRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const contentX = x / scale;
    const contentY = y / scale;

    const imageX = contentX - labelSize;
    const imageY = contentY - labelSize;

    if (imageX < 0 || imageY < 0) {
      setHoveredCoords(null);
      return;
    }

    const gridX = imageX - gridOffset.x;
    const gridY = imageY - gridOffset.y;

    if (gridX < 0 || gridY < 0) {
      setHoveredCoords(null);
      return;
    }

    const colIndex = Math.floor(gridX / cellSizePx);
    const rowIndex = Math.floor(gridY / cellSizePx);
    
    if (colIndex < 0 || rowIndex < 0 || colIndex >= numCols || rowIndex >= numRows) {
        setHoveredCoords(null);
        return;
    };
    
    const col = getColumnLabel(colIndex);
    const row = rowIndex + 1;
    setHoveredCoords({ col, row });
  };
  
  const handleMouseLeave = () => {
    setHoveredCoords(null);
  }

  const renderCenterCoord = () => {
    if (!hoveredCoords) return null;
    
    const colIndex = hoveredCoords.col.charCodeAt(0) - 65;
    const rowIndex = hoveredCoords.row - 1;

    const x = labelSize + gridOffset.x + colIndex * cellSizePx + cellSizePx / 2;
    const y = labelSize + gridOffset.y + rowIndex * cellSizePx + cellSizePx / 2;
    
    return (
        <div
            className="absolute pointer-events-none flex items-center justify-center"
            style={{
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
                fontSize: Math.min(cellSizePx * 0.5, 48),
                color: labelColor,
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '0.2em 0.4em',
                borderRadius: '0.25em',
                fontWeight: 'bold',
                textShadow: '0 0 5px black',
            }}
        >
            {hoveredCoords.col}{hoveredCoords.row}
        </div>
    );
};

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex items-center justify-center overflow-hidden relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={contentRef}
        className="absolute transform-gpu cursor-pointer"
        style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top left',
            width: imageDimensions.naturalWidth + labelSize,
            height: imageDimensions.naturalHeight + labelSize
        }}
      >
        <div className="relative w-full h-full">
            {/* Corner Box */}
            <div className="absolute top-0 left-0" style={{width: labelSize, height: labelSize}}></div>

            {/* Column Labels */}
            {Array.from({ length: numCols }).map((_, i) => (
                <div
                    key={`col-label-${i}`}
                    className="absolute text-center font-bold flex items-center justify-center pointer-events-none"
                    style={{
                        color: labelColor,
                        left: `${labelSize + gridOffset.x + (i * cellSizePx)}px`,
                        top: 0,
                        width: `${cellSizePx}px`,
                        height: `${labelSize}px`,
                        fontSize: `${labelFontSize}px`,
                    }}
                >
                    {getColumnLabel(i)}
                </div>
            ))}

            {/* Row Labels */}
            {Array.from({ length: numRows }).map((_, i) => (
                <div
                    key={`row-label-${i}`}
                    className="absolute text-center font-bold flex items-center justify-center pointer-events-none"
                    style={{
                        color: labelColor,
                        top: `${labelSize + gridOffset.y + (i * cellSizePx)}px`,
                        left: 0,
                        width: `${labelSize}px`,
                        height: `${cellSizePx}px`,
                        fontSize: `${labelFontSize}px`,
                    }}
                >
                    {i + 1}
                </div>
            ))}
            
            {/* Image and Grid container */}
            <div className="absolute overflow-hidden" style={{ left: labelSize, top: labelSize, width: imageDimensions.naturalWidth, height: imageDimensions.naturalHeight }}>
                <Image
                    src={imageUrl}
                    alt={mapData.name}
                    layout="fill"
                    objectFit="contain"
                    priority
                />
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ transform: `translate(${gridOffset.x}px, ${gridOffset.y}px)` }}>
                    {Array.from({ length: numCols + 1 }).map((_, i) => (
                    <line
                        key={`v-${i}`}
                        x1={i * cellSizePx}
                        y1={0}
                        x2={i * cellSizePx}
                        y2={numRows * cellSizePx}
                        stroke={gridColor}
                        strokeWidth={gridThickness / scale}
                        vectorEffect="non-scaling-stroke"
                    />
                    ))}
                    {Array.from({ length: numRows + 1 }).map((_, i) => (
                    <line
                        key={`h-${i}`}
                        x1={0}
                        y1={i * cellSizePx}
                        x2={numCols * cellSizePx}
                        y2={i * cellSizePx}
                        stroke={gridColor}
                        strokeWidth={gridThickness / scale}
                        vectorEffect="non-scaling-stroke"
                    />
                    ))}
                </svg>
            </div>
            {renderCenterCoord()}
        </div>
      </div>
    </div>
  );
};

export default InteractiveGrid;
