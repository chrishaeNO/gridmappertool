
import React from 'react';
import ImageGridDisplay from './image-grid-display';
import type { ImageDimensions } from '@/components/image-workspace';
import type { Dispatch, SetStateAction } from 'react';

type GridDisplayContainerProps = {
    imageSrc: string | null;
    imageDimensions: ImageDimensions | null;
    imageRef: React.RefObject<HTMLImageElement>;
    onImageLoad: (dimensions: ImageDimensions) => void;
    cellSize: number;
    unit: 'px' | 'mm';
    dpi: number;
    gridOffset: { x: number; y: number };
    onHover: (coords: { col: string; row: number } | null) => void;
    hoveredCoords: { col: string; row: number } | null;
    gridColor: string;
    labelColor: string;
    backgroundColor: string;
    gridThickness: number;
    splitCols: number;
    splitRows: number;
    containerRef: React.RefObject<HTMLDivElement>;
    showCenterCoords: boolean;
    onGridCropChange: (isCropped: boolean) => void;
    sliceNames: string[];
    onSliceNameChange: (index: number, newName: string) => void;
    selectedSliceIndex: number | null;
    onSliceClick: (index: number) => void;
    editingSliceIndex: number | null;
    onStartEditing: (index: number) => void;
    isReadOnly?: boolean;
    imageZoom: number;
    panOffset: { x: number; y: number };
    sliceImageSettings?: {
        [sliceIndex: number]: {
            zoom: number;
            panOffset: { x: number; y: number };
            rotation?: number;
        }
    };
    onSliceImageSettingsChange?: (sliceIndex: number, settings: { zoom?: number; panOffset?: { x: number; y: number }; rotation?: number }) => void;
    clickedCoords?: { col: string; row: number } | null;
    onCellClick?: (coords: { col: string; row: number } | null) => void;
    showReferencePoints?: boolean;
    referenceColors?: {
        top: string;
        right: string;
        bottom: string;
        left: string;
    };
    imageRotation?: number;
    isRotationMode?: boolean;
};

const GridDisplayContainer = ({
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
    gridColor,
    labelColor,
    backgroundColor,
    gridThickness,
    splitCols,
    splitRows,
    containerRef,
    showCenterCoords,
    onGridCropChange,
    sliceNames,
    onSliceNameChange,
    selectedSliceIndex,
    onSliceClick,
    editingSliceIndex,
    onStartEditing,
    isReadOnly = false,
    imageZoom,
    panOffset,
    sliceImageSettings,
    onSliceImageSettingsChange,
    clickedCoords,
    onCellClick,
    showReferencePoints = false,
    referenceColors = {
        top: '#ffffff',    // White
        right: '#ff0000',  // Red
        bottom: '#000000', // Black
        left: '#01b050'    // Green (updated standard)
    },
    imageRotation = 0,
    isRotationMode = false,
}: GridDisplayContainerProps) => {

    if (!imageSrc || !imageDimensions) {
        return null;
    }
    
    const cellSizePx = unit === "px" ? cellSize : (cellSize / 25.4) * dpi;
    const labelSize = isReadOnly ? 0 : Math.min(25, cellSizePx * 0.4);
    
    // Calculate dynamic spacing and padding based on label size for reference lines
    const referencePadding = splitCols * splitRows > 1 ? Math.max(12, labelSize * 0.3) : 0;
    const sliceSpacing = splitCols * splitRows > 1 ? Math.max(40, referencePadding * 2) : 0;

    const grids = [];
    for (let row = 0; row < splitRows; row++) {
        for (let col = 0; col < splitCols; col++) {
            const sliceIndex = row * splitCols + col;
            const sliceSettings = sliceImageSettings?.[sliceIndex];
            
            grids.push(
                <ImageGridDisplay
                    key={`${row}-${col}`}
                    imageSrc={imageSrc}
                    imageDimensions={imageDimensions}
                    imageRef={imageRef}
                    onImageLoad={onImageLoad}
                    cellSize={cellSize}
                    unit={unit}
                    dpi={dpi}
                    gridOffset={gridOffset}
                    onHover={onHover}
                    hoveredCoords={hoveredCoords}
                    clickedCoords={clickedCoords}
                    onCellClick={onCellClick}
                    gridColor={gridColor}
                    labelColor={labelColor}
                    backgroundColor={backgroundColor}
                    gridThickness={gridThickness}
                    containerRef={containerRef}
                    gridIndex={{ row, col }}
                    totalGrids={{ rows: splitRows, cols: splitCols }}
                    showCenterCoords={showCenterCoords}
                    onGridCropChange={onGridCropChange}
                    sliceName={sliceNames[sliceIndex] || ''}
                    onSliceNameChange={(newName: string) => onSliceNameChange(sliceIndex, newName)}
                    isSelected={selectedSliceIndex === sliceIndex}
                    onClick={() => onSliceClick(sliceIndex)}
                    isEditing={editingSliceIndex === sliceIndex}
                    onStartEditing={() => onStartEditing(sliceIndex)}
                    isReadOnly={isReadOnly}
                    imageZoom={imageZoom}
                    panOffset={panOffset}
                    sliceImageZoom={sliceSettings?.zoom}
                    slicePanOffset={sliceSettings?.panOffset}
                    sliceRotation={sliceSettings?.rotation}
                    onSliceImageSettingsChange={onSliceImageSettingsChange ? (settings) => onSliceImageSettingsChange(sliceIndex, settings) : undefined}
                    showReferencePoints={showReferencePoints}
                    referenceColors={referenceColors}
                    imageRotation={imageRotation}
                    isRotationMode={isRotationMode}
                />
            );
        }
    }

    // Calculate dimensions safely
    const containerWidth = imageDimensions 
        ? imageDimensions.width + (splitCols * labelSize) + ((splitCols - 1) * sliceSpacing) + (splitCols * splitRows > 1 ? (referencePadding + 6) * 2 : 0)
        : 'auto';
    const containerHeight = imageDimensions 
        ? imageDimensions.height + (splitRows * labelSize) + ((splitRows - 1) * sliceSpacing) + (splitCols * splitRows > 1 ? (referencePadding + 6) * 2 : 0)
        : 'auto';

    return (
        <div 
            className="transform-gpu transition-transform relative"
            style={{ 
                display: 'grid',
                gridTemplateColumns: `repeat(${splitCols}, min-content)`,
                gridTemplateRows: `repeat(${splitRows}, min-content)`,
                gap: `${sliceSpacing}px`,
                padding: splitCols * splitRows > 1 ? `${referencePadding + 6}px` : '0', // Dynamic padding based on reference line size
                width: typeof containerWidth === 'number' ? `${containerWidth}px` : containerWidth,
                height: typeof containerHeight === 'number' ? `${containerHeight}px` : containerHeight,
            }}
        >
            {grids}
            
            {/* Reference Points now rendered by individual ImageGridDisplay components */}
        </div>
    );
};

export default GridDisplayContainer;
