
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
    clickedCoords?: { col: string; row: number } | null;
    onCellClick?: (coords: { col: string; row: number } | null) => void;
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
    clickedCoords,
    onCellClick,
}: GridDisplayContainerProps) => {

    if (!imageSrc || !imageDimensions) {
        return null;
    }
    
    const cellSizePx = unit === "px" ? cellSize : (cellSize / 25.4) * dpi;
    const labelSize = isReadOnly ? 0 : Math.min(25, cellSizePx * 0.4);

    const grids = [];
    for (let row = 0; row < splitRows; row++) {
        for (let col = 0; col < splitCols; col++) {
            const sliceIndex = row * splitCols + col;
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
                />
            );
        }
    }

    return (
        <div 
            className="transform-gpu transition-transform relative"
            style={{ 
                display: 'grid',
                gridTemplateColumns: `repeat(${splitCols}, min-content)`,
                gridTemplateRows: `repeat(${splitRows}, min-content)`,
                width: imageDimensions.naturalWidth + (splitCols * labelSize),
                height: imageDimensions.naturalHeight + (splitRows * labelSize),
            }}
        >
            {grids}
        </div>
    );
};

export default GridDisplayContainer;
