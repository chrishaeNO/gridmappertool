"use client";

import React, { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getColumnLabel } from '@/utils/columnLabels';

export type ImageDimensions = {
  width: number;
  height: number;
};

type ImageGridDisplayProps = {
  imageSrc: string;
  imageDimensions: ImageDimensions;
  imageRef: React.RefObject<HTMLImageElement>;
  onImageLoad: (dimensions: ImageDimensions) => void;
  cellSize: number;
  unit: "px" | "mm";
  dpi: number;
  gridOffset: { x: number; y: number };
  onHover: (coords: { col: string; row: number } | null) => void;
  hoveredCoords: { col: string; row: number } | null;
  clickedCoords?: { col: string; row: number } | null;
  onCellClick?: (coords: { col: string; row: number } | null) => void;
  gridColor: string;
  labelColor: string;
  backgroundColor: string;
  gridThickness: number;
  containerRef: React.RefObject<HTMLDivElement>;
  gridIndex: { row: number; col: number };
  totalGrids: { rows: number; cols: number };
  showCenterCoords: boolean;
  onGridCropChange: (isCropped: boolean) => void;
  sliceName: string;
  onSliceNameChange: (newName: string) => void;
  isSelected: boolean;
  onClick: () => void;
  isEditing: boolean;
  onStartEditing: () => void;
  isReadOnly?: boolean;
  imageZoom: number;
  panOffset: { x: number; y: number };
  sliceImageZoom?: number;
  slicePanOffset?: { x: number; y: number };
  sliceRotation?: number;
  onSliceImageSettingsChange?: (settings: { zoom?: number; panOffset?: { x: number; y: number }; rotation?: number }) => void;
  showReferencePoints?: boolean;
  referenceColors?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  imageRotation?: number;
  isRotationMode?: boolean;
  compassLetters?: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  };
};

const GridLines = React.memo(({ numCols, numRows, colWidth, rowHeight, strokeColor, strokeWidth }: any) => {
    const lines = [];
    if (numCols < 0 || numRows < 0 || colWidth <= 0 || rowHeight <= 0) return null;
    // Vertical lines
    for (let i = 0; i <= numCols; i++) {
        lines.push(<line key={`v-${i}`} x1={i * colWidth} y1={0} x2={i * colWidth} y2={numRows * rowHeight} stroke={strokeColor} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />);
    }
    // Horizontal lines
    for (let i = 0; i <= numRows; i++) {
        lines.push(<line key={`h-${i}`} x1={0} y1={i * rowHeight} x2={numCols * colWidth} y2={i * rowHeight} stroke={strokeColor} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />);
    }
    return <>{lines}</>;
});
GridLines.displayName = 'GridLines';


function ImageGridDisplay({
  imageSrc,
  imageDimensions,
  imageRef,
  onImageLoad,
  cellSize,
  unit,
  dpi,
  gridOffset,
  onHover,
  hoveredCoords,
  clickedCoords,
  onCellClick,
  gridColor,
  labelColor,
  backgroundColor,
  gridThickness,
  containerRef,
  gridIndex,
  totalGrids,
  showCenterCoords,
  onGridCropChange,
  sliceName,
  onSliceNameChange,
  isSelected,
  onClick,
  isEditing,
  onStartEditing,
  isReadOnly = false,
  imageZoom,
  panOffset,
  sliceImageZoom,
  slicePanOffset,
  sliceRotation,
  onSliceImageSettingsChange,
  showReferencePoints = false,
  referenceColors = {
    top: '#ffffff',    // White
    right: '#ff0000',  // Red
    bottom: '#000000', // Black
    left: '#01b050'    // Green (updated standard)
  },
  imageRotation = 0,
  isRotationMode = false,
  compassLetters = { north: false, south: false, east: false, west: false },
}: ImageGridDisplayProps) {

  const inputRef = useRef<HTMLInputElement>(null);
  const isSplit = totalGrids.rows * totalGrids.cols > 1;
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartPanOffset, setDragStartPanOffset] = useState({ x: 0, y: 0 });
  const [isAltPressed, setIsAltPressed] = useState(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Track Alt/Option key for drag mode indication
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !isAltPressed) {
        setIsAltPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey && isAltPressed) {
        setIsAltPressed(false);
      }
    };

    const handleWindowBlur = () => {
      setIsAltPressed(false);
    };

    if (!isReadOnly && isSplit) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('blur', handleWindowBlur);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isAltPressed, isReadOnly, isSplit]);
  

  const gridData = useMemo(() => {
    if (!imageDimensions || cellSize <= 0 || isNaN(cellSize)) return null;
    
    const { width, height } = imageDimensions;
    
    // Validate dimensions
    if (!width || !height || isNaN(width) || isNaN(height)) return null;
    
    const { rows: totalRows, cols: totalCols } = totalGrids;
    const { row: rowIndex, col: colIndex } = gridIndex;

    // Validate grid parameters
    if (!totalRows || !totalCols || isNaN(totalRows) || isNaN(totalCols) || totalRows <= 0 || totalCols <= 0) return null;
    if (isNaN(rowIndex) || isNaN(colIndex) || rowIndex < 0 || colIndex < 0) return null;

    const sliceWidth = width / totalCols;
    const sliceHeight = height / totalRows;

    const sliceLeft = colIndex * sliceWidth;
    const sliceTop = rowIndex * sliceHeight;

    const cellSizePx = unit === "px" ? cellSize : (cellSize / 25.4) * (dpi || 96);
    if (cellSizePx <= 0 || isNaN(cellSizePx)) return null;
    
    // Validate gridOffset
    if (!gridOffset || isNaN(gridOffset.x) || isNaN(gridOffset.y)) return null;
    
    const gridStartXInSlice = gridOffset.x - sliceLeft;
    const gridStartYInSlice = gridOffset.y - sliceTop;

    const firstColOffset = gridStartXInSlice < 0 ? (Math.ceil(Math.abs(gridStartXInSlice) / cellSizePx) * cellSizePx) + gridStartXInSlice : gridStartXInSlice % cellSizePx;
    const firstRowOffset = gridStartYInSlice < 0 ? (Math.ceil(Math.abs(gridStartYInSlice) / cellSizePx) * cellSizePx) + gridStartYInSlice : gridStartYInSlice % cellSizePx;
    
    const numCols = Math.max(0, Math.floor((sliceWidth - firstColOffset) / cellSizePx));
    const numRows = Math.max(0, Math.floor((sliceHeight - firstRowOffset) / cellSizePx));
    
    // Beregn startindeks for koordinater basert på slice-posisjon og grid-offset
    // Dette sikrer at hver slice har unike, kontinuerlige koordinater
    const totalColsFromStart = Math.floor((sliceLeft - gridOffset.x + firstColOffset) / cellSizePx);
    const totalRowsFromStart = Math.floor((sliceTop - gridOffset.y + firstRowOffset) / cellSizePx);

    const startColIndex = Math.max(0, totalColsFromStart);
    const startRowIndex = Math.max(0, totalRowsFromStart);
    
    // Beregn om grid-celler blir croppet
    // En grid er croppet hvis:
    // 1. Vi ikke kan få noen hele celler (numCols eller numRows er 0)
    // 2. Det er plass til flere celler enn vi viser (dvs. det er restplass som ikke brukes)
    
    const availableWidth = sliceWidth - firstColOffset;
    const availableHeight = sliceHeight - firstRowOffset;
    
    // Beregn hvor mye plass som er igjen etter de hele cellene
    const remainingWidth = availableWidth - (numCols * cellSizePx);
    const remainingHeight = availableHeight - (numRows * cellSizePx);
    
    // Grid er croppet hvis:
    // - Vi ikke kan få noen hele celler, ELLER
    // - Det er nok plass til minst en hel celle til (mer enn 90% av en celle)
    const cellThreshold = cellSizePx * 0.9; // 90% av en celle - mer realistisk terskel
    const isCropped = numCols === 0 || numRows === 0 || 
                     remainingWidth >= cellThreshold || 
                     remainingHeight >= cellThreshold;
    
    // Final validation of calculated values
    const finalNumCols = numCols + 1;
    const finalNumRows = numRows + 1;
    
    if (isNaN(finalNumCols) || isNaN(finalNumRows) || isNaN(cellSizePx) || 
        isNaN(firstColOffset) || isNaN(firstRowOffset)) {
      console.warn('NaN values detected in grid calculations:', {
        finalNumCols, finalNumRows, cellSizePx, firstColOffset, firstRowOffset,
        cellSize, dpi, unit, gridOffset, imageDimensions
      });
      return null;
    }
    
    return {
      numCols: finalNumCols,
      numRows: finalNumRows,
      startColIndex,
      startRowIndex,
      colWidth: cellSizePx,
      rowHeight: cellSizePx,
      gridLeft: firstColOffset,
      gridTop: firstRowOffset,
      sliceWidth,
      sliceHeight,
      sliceLeft,
      sliceTop,
      isCropped,
    };
  }, [imageDimensions, cellSize, unit, dpi, gridOffset, gridIndex, totalGrids]);

  useEffect(() => {
    if (gridData && !isReadOnly) {
      onGridCropChange(gridData.isCropped);
    }
  }, [gridData, onGridCropChange, isReadOnly]);

    if (!imageSrc || !gridData || !imageDimensions) {
        return null;
    }
    
    const {
      numCols,
      numRows,
      startColIndex,
      startRowIndex,
      colWidth,
      rowHeight,
      gridLeft,
      gridTop,
      sliceLeft,
      sliceTop,
      sliceWidth,
      sliceHeight,
    } = gridData;
    
    const labelSize = Math.max(25, Math.min(40, colWidth * 0.4));
    const labelFontSize = Math.max(10, Math.min(16, colWidth * 0.3));

    const handleNameSubmit = () => {
      if(isReadOnly) return;
      onSliceNameChange(inputRef.current?.value || sliceName);
    };

    // Background image dragging handlers
    const handleBackgroundMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
      if (isReadOnly || !isSplit || !onSliceImageSettingsChange) return;
      
      // Only start dragging if Alt/Option key is held down to avoid conflicts with grid clicking
      if (!event.altKey) return;
      
      event.preventDefault();
      event.stopPropagation();
      
      setIsDragging(true);
      setDragStart({ x: event.clientX, y: event.clientY });
      setDragStartPanOffset({ ...effectivePanOffset });
      
      // Change cursor to indicate dragging mode
      document.body.style.cursor = 'grabbing';
      
      // Disable text selection during drag
      document.body.style.userSelect = 'none';
    };

    const handleBackgroundMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !onSliceImageSettingsChange) return;
      
      event.preventDefault();
      
      const deltaX = event.clientX - dragStart.x;
      const deltaY = event.clientY - dragStart.y;
      
      const newPanOffset = {
        x: dragStartPanOffset.x + deltaX,
        y: dragStartPanOffset.y + deltaY
      };
      
      onSliceImageSettingsChange({ panOffset: newPanOffset });
    };

    const handleBackgroundMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    // Global mouse up handler to stop dragging even if mouse leaves the component
    useEffect(() => {
      const handleGlobalMouseUp = () => {
        if (isDragging) {
          setIsDragging(false);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      };

      if (isDragging) {
        document.addEventListener('mouseup', handleGlobalMouseUp);
        document.addEventListener('mouseleave', handleGlobalMouseUp);
      }

      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('mouseleave', handleGlobalMouseUp);
      };
    }, [isDragging]);

    const handleGridClick = (event: React.MouseEvent<HTMLDivElement>) => {
        // Stopp event-propagering for å unngå at parent onClick fjerner koordinater
        event.stopPropagation();
        
        // Kall slice onClick for å markere denne slicen
        onClick();
        
        if (!onCellClick) return;
        
        // Finn nærmeste container med transform for å få riktig skala
        let element = event.currentTarget as HTMLElement;
        let scale = 1;
        
        // Gå opp i DOM-hierarkiet for å finne scale-transform
        while (element && element !== document.body) {
            const transform = window.getComputedStyle(element).transform;
            if (transform && transform !== 'none') {
                const matrix = transform.match(/matrix\(([^)]+)\)/);
                if (matrix) {
                    const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
                    scale = values[0]; // scaleX verdi
                    break;
                }
            }
            element = element.parentElement as HTMLElement;
        }
        
        const rect = event.currentTarget.getBoundingClientRect();
        // Juster for skala
        const x = (event.clientX - rect.left) / scale;
        const y = (event.clientY - rect.top) / scale;
        
        // Beregn hvilken celle som ble klikket, justert for grid-offset
        const adjustedX = x - gridLeft;
        const adjustedY = y - gridTop;
        
        if (adjustedX < 0 || adjustedY < 0 || adjustedX >= numCols * colWidth || adjustedY >= numRows * rowHeight) {
            onCellClick(null);
            return;
        }
        
        const localColIndex = Math.floor(adjustedX / colWidth);
        const localRowIndex = Math.floor(adjustedY / rowHeight);
        
        const colIndex = localColIndex + startColIndex;
        const rowIndex = localRowIndex + startRowIndex;
        
        const colChar = getColumnLabel(colIndex);
        const rowNumber = rowIndex + 1;
        
        onCellClick({ col: colChar, row: rowNumber });
    };

    const renderCenterCoord = () => {
        // Prioriter click-koordinater, bruk hover kun hvis ingen click-koordinater
        const coordsToShow = clickedCoords || hoveredCoords;
        if (!showCenterCoords || !coordsToShow) return null;

        const hoveredColChar = coordsToShow.col;
        const hoveredRowNumber = coordsToShow.row;

        const hoveredColIndex = hoveredColChar.charCodeAt(0) - 65;
        const hoveredRowIndex = hoveredRowNumber - 1;
        
        const isColInSlice = hoveredColIndex >= startColIndex && hoveredColIndex < startColIndex + numCols;
        const isRowInSlice = hoveredRowIndex >= startRowIndex && hoveredRowIndex < startRowIndex + numRows;

        if (isColInSlice && isRowInSlice) {
            const localColIndex = hoveredColIndex - startColIndex;
            const localRowIndex = hoveredRowIndex - startRowIndex;

            // Beregn koordinat-posisjon nøyaktig
            const x = labelSize + gridLeft + localColIndex * colWidth + colWidth / 2;
            const y = labelSize + gridTop + localRowIndex * rowHeight + rowHeight / 2;
            
            if (x > sliceWidth + labelSize || y > sliceHeight + labelSize) return null;

            return (
                <div
                    className="absolute pointer-events-none flex items-center justify-center"
                    style={{
                        left: x,
                        top: y,
                        transform: 'translate(-50%, -50%)',
                        fontSize: Math.min(colWidth * 0.5, 48),
                        color: labelColor,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        padding: '0.2em 0.4em',
                        borderRadius: '0.25em',
                        fontWeight: 'bold',
                        textShadow: '0 0 5px black',
                    }}
                >
                    {coordsToShow.col}{coordsToShow.row}
                </div>
            );
        }
        return null;
    };

    const shouldShowLabels = true; // Always show labels, even in read-only mode

    // Use slice-specific settings if available, otherwise fall back to global settings
    const effectiveZoom = sliceImageZoom ?? imageZoom;
    const effectivePanOffset = slicePanOffset ?? panOffset;
    
    const backgroundPositionX = `-${(sliceLeft * effectiveZoom) - effectivePanOffset.x}px`;
    const backgroundPositionY = `-${(sliceTop * effectiveZoom) - effectivePanOffset.y}px`;


    return (
        <div 
          className={cn(
            "relative border-muted-foreground/20",
            !isReadOnly && isSplit ? "cursor-pointer" : "cursor-default",
            !isReadOnly && isSplit && isSelected ? "border-2 border-ring" : "border"
          )}
          style={{ width: sliceWidth + (2 * labelSize), height: sliceHeight + (2 * labelSize) }}
          onClick={onClick}
          onDoubleClick={onStartEditing}
        >
            {/* Corner Boxes */}
            {shouldShowLabels && (
              <>
                <div className="absolute top-0 left-0" style={{width: labelSize, height: labelSize}}></div>
                <div className="absolute top-0 right-0" style={{width: labelSize, height: labelSize}}></div>
                <div className="absolute bottom-0 left-0" style={{width: labelSize, height: labelSize}}></div>
                <div className="absolute bottom-0 right-0" style={{width: labelSize, height: labelSize}}></div>
              </>
            )}

            {/* Column Labels - Top */}
            {shouldShowLabels && Array.from({ length: numCols }).map((_, i) => {
              const xOnSlice = gridLeft + i * colWidth;
              const xInCanvas = xOnSlice + colWidth / 2;
              if (xInCanvas < 0 || xInCanvas > sliceWidth) return null;

              return (
                <div
                    key={`col-top-${i}`}
                    className="absolute text-center font-bold flex items-center justify-center pointer-events-none"
                    style={{
                        color: labelColor,
                        left: `${labelSize + xInCanvas - (colWidth/2)}px`,
                        top: 0,
                        width: `${colWidth}px`,
                        height: `${labelSize}px`,
                        fontSize: `${labelFontSize}px`,
                        textShadow: '0 0 4px rgba(0,0,0,0.8)',
                        fontWeight: 'bold',
                        zIndex: 10,
                    }}
                >
                    {getColumnLabel(startColIndex + i)}
                </div>
              )
            })}

            {/* Column Labels - Bottom */}
            {shouldShowLabels && Array.from({ length: numCols }).map((_, i) => {
              const xOnSlice = gridLeft + i * colWidth;
              const xInCanvas = xOnSlice + colWidth / 2;
              if (xInCanvas < 0 || xInCanvas > sliceWidth) return null;

              return (
                <div
                    key={`col-bottom-${i}`}
                    className="absolute text-center font-bold flex items-center justify-center pointer-events-none"
                    style={{
                        color: labelColor,
                        left: `${labelSize + xInCanvas - (colWidth/2)}px`,
                        top: `${labelSize + sliceHeight}px`,
                        width: `${colWidth}px`,
                        height: `${labelSize}px`,
                        fontSize: `${labelFontSize}px`,
                        textShadow: '0 0 4px rgba(0,0,0,0.8)',
                        fontWeight: 'bold',
                        zIndex: 10,
                    }}
                >
                    {getColumnLabel(startColIndex + i)}
                </div>
              )
            })}
            
            {/* Row Labels - Left */}
            {shouldShowLabels && Array.from({ length: numRows }).map((_, i) => {
              const yOnSlice = gridTop + i * rowHeight;
              const yInCanvas = yOnSlice + rowHeight / 2;
              if (yInCanvas < 0 || yInCanvas > sliceHeight) return null;

              return (
                <div
                    key={`row-left-${i}`}
                    className="absolute text-center font-bold flex items-center justify-center pointer-events-none"
                    style={{
                        color: labelColor,
                        top: `${labelSize + yInCanvas - (rowHeight/2)}px`,
                        left: 0,
                        height: `${rowHeight}px`,
                        width: `${labelSize}px`,
                        fontSize: `${labelFontSize}px`,
                        textShadow: '0 0 4px rgba(0,0,0,0.8)',
                        fontWeight: 'bold',
                        zIndex: 10,
                    }}
                >
                    {startRowIndex + i + 1}
                </div>
              )
            })}

            {/* Row Labels - Right */}
            {shouldShowLabels && Array.from({ length: numRows }).map((_, i) => {
              const yOnSlice = gridTop + i * rowHeight;
              const yInCanvas = yOnSlice + rowHeight / 2;
              if (yInCanvas < 0 || yInCanvas > sliceHeight) return null;

              return (
                <div
                    key={`row-right-${i}`}
                    className="absolute text-center font-bold flex items-center justify-center pointer-events-none"
                    style={{
                        color: labelColor,
                        top: `${labelSize + yInCanvas - (rowHeight/2)}px`,
                        left: `${labelSize + sliceWidth}px`,
                        height: `${rowHeight}px`,
                        width: `${labelSize}px`,
                        fontSize: `${labelFontSize}px`,
                        textShadow: '0 0 4px rgba(0,0,0,0.8)',
                        fontWeight: 'bold',
                        zIndex: 10,
                    }}
                >
                    {startRowIndex + i + 1}
                </div>
              )
            })}

            <div 
              className={`absolute overflow-hidden ${!isReadOnly && isSplit && isAltPressed ? 'cursor-grab' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
              style={{ 
                left: labelSize, 
                top: labelSize, 
                width: sliceWidth, 
                height: sliceHeight,
                backgroundColor: backgroundColor // Apply background color only to grid area
              }}
              onClick={handleGridClick}
              onMouseDown={handleBackgroundMouseDown}
              onMouseMove={handleBackgroundMouseMove}
              onMouseUp={handleBackgroundMouseUp}
            >
                {/* Alt/Option key indicator overlay */}
                {!isReadOnly && isSplit && isAltPressed && !isDragging && (
                  <div className="absolute inset-0 bg-blue-500/5 border-2 border-blue-500 border-dashed flex items-center justify-center pointer-events-none">
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Click + Drag to Move Background
                    </div>
                  </div>
                )}
                
                {/* Rotated image container - clipped by parent */}
                <div
                    className="absolute"
                    style={{
                        left: 0,
                        top: 0,
                        width: `100%`,
                        height: `100%`,
                        transform: `rotate(${sliceRotation !== undefined ? sliceRotation : imageRotation}deg)`,
                        transformOrigin: 'center center'
                    }}
                >
                    <div
                        className="absolute"
                        style={{
                            backgroundImage: `url(${imageSrc})`,
                            backgroundSize: `${imageDimensions.width * effectiveZoom}px ${imageDimensions.height * effectiveZoom}px`,
                            backgroundPosition: `${backgroundPositionX} ${backgroundPositionY}`,
                            left: 0,
                            top: 0,
                            width: `100%`,
                            height: `100%`,
                            pointerEvents: isDragging || isRotationMode ? 'none' : 'auto'
                        }}
                    />
                </div>

                {/* Drag overlay */}
                {isDragging && (
                  <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500 border-dashed flex items-center justify-center pointer-events-none">
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Dragging Background
                    </div>
                  </div>
                )}

                <svg
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{
                        transform: `translate(${isNaN(gridLeft) ? 0 : gridLeft}px, ${isNaN(gridTop) ? 0 : gridTop}px)`,
                        width: isNaN(numCols * colWidth) ? 0 : (numCols * colWidth),
                        height: isNaN(numRows * rowHeight) ? 0 : (numRows * rowHeight),
                    }}
                >
                    <GridLines numCols={numCols} numRows={numRows} colWidth={colWidth} rowHeight={rowHeight} strokeColor={gridColor} strokeWidth={gridThickness} />
                </svg>

                {(!isReadOnly && isSplit) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        type="text"
                        defaultValue={sliceName}
                        className="bg-background/80 text-foreground text-center p-2 rounded-md outline-none ring-2 ring-ring"
                        style={{
                          fontSize: Math.min(sliceWidth, sliceHeight) / 10,
                          width: '80%',
                        }}
                        onBlur={handleNameSubmit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleNameSubmit();
                          if (e.key === 'Escape') onSliceNameChange(sliceName); // Revert on escape
                        }}
                        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling up
                      />
                    ) : (
                      <div
                        className="bg-black/50 text-white p-2 rounded-md text-lg font-bold pointer-events-none"
                        style={{
                          fontSize: Math.min(sliceWidth, sliceHeight) / 8,
                          color: labelColor,
                          textShadow: '0 0 8px black'
                        }}
                      >
                        {sliceName}
                      </div>
                    )}
                  </div>
                )}
            </div>
            {renderCenterCoord()}
            
            {/* Integrated Reference Points - rendered per slice with accurate positioning */}
            {showReferencePoints && (
                <div className="absolute pointer-events-none">
                    {/* Calculate reference line positioning based on actual slice dimensions */}
                    {(() => {
                        const linePadding = Math.max(10, labelSize * 0.25); // Redusert padding til 10px mellom labels og linjer
                        const lineThickness = Math.max(4, labelSize * 0.15); // Dynamic thickness
                        const sliceContentWidth = sliceWidth + (2 * labelSize); // Updated for labels on both sides
                        const sliceContentHeight = sliceHeight + (2 * labelSize); // Updated for labels on top and bottom
                        
                        return (
                            <>
                                {/* Top line - hvit - ekstra 5px avstand fra labels */}
                                <div 
                                    className="absolute z-20"
                                    style={{
                                        left: `${labelSize}px`,
                                        top: `${-(linePadding + 5)}px`,
                                        width: `${sliceWidth}px`,
                                        height: `${lineThickness}px`,
                                        backgroundColor: referenceColors.top,
                                        boxShadow: '0 0 2px rgba(0,0,0,0.3)',
                                    }}
                                />
                                {/* Right line - rød - normal avstand (20px) */}
                                <div 
                                    className="absolute z-20"
                                    style={{
                                        left: `${sliceContentWidth + linePadding}px`,
                                        top: `${labelSize}px`,
                                        width: `${lineThickness}px`,
                                        height: `${sliceHeight}px`,
                                        backgroundColor: referenceColors.right,
                                        boxShadow: '0 0 2px rgba(0,0,0,0.3)',
                                    }}
                                />
                                {/* Bottom line - sort - normal avstand (20px) */}
                                <div 
                                    className="absolute z-20"
                                    style={{
                                        left: `${labelSize}px`,
                                        top: `${sliceContentHeight + linePadding}px`,
                                        width: `${sliceWidth}px`,
                                        height: `${lineThickness}px`,
                                        backgroundColor: referenceColors.bottom,
                                        boxShadow: '0 0 2px rgba(0,0,0,0.3)',
                                    }}
                                />
                                {/* Left line - grønn - ekstra 5px avstand fra labels */}
                                <div 
                                    className="absolute z-20"
                                    style={{
                                        left: `${-(linePadding + 5)}px`,
                                        top: `${labelSize}px`,
                                        width: `${lineThickness}px`,
                                        height: `${sliceHeight}px`,
                                        backgroundColor: referenceColors.left,
                                        boxShadow: '0 0 2px rgba(0,0,0,0.3)',
                                    }}
                                />
                            </>
                        );
                    })()
                    }
                </div>
            )}
            
            {/* Compass Letters Overlay disabled for slices to avoid overlapping with grid */}
            {/* Compass letters are only shown on the main overlay when not split */}
        </div>
    );
}

export default ImageGridDisplay;
