
import React, { useState, useEffect, useMemo, useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import { UploadCloud, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import GridDisplayContainer from './grid-display-container';
import ImageGridDisplay from './image-grid-display';
import ScaleBar from './scale-bar';
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export type ImageDimensions = {
  naturalWidth: number;
  naturalHeight: number;
};

type ImageWorkspaceProps = {
  imageSrc: string | null;
  imageRef: React.RefObject<HTMLImageElement>;
  imageDimensions: ImageDimensions | null;
  onImageLoad: (dimensions: ImageDimensions) => void;
  cellSize: number;
  unit: "px" | "mm";
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
  showCenterCoords: boolean;
  showScaleBar: boolean;
  onGridCropChange: (isCropped: boolean) => void;
  sliceNames: string[];
  setSliceNames: Dispatch<SetStateAction<string[]>>;
  selectedSliceIndex: number | null;
  setSelectedSliceIndex: Dispatch<SetStateAction<number | null>>;
  isReadOnly?: boolean;
  imageZoom: number;
  setImageZoom: Dispatch<SetStateAction<number>>;
  panOffset: { x: number; y: number };
  setPanOffset: Dispatch<SetStateAction<{ x: number; y: number }>>;
  clickedCoords?: { col: string; row: number } | null;
  onCellClick?: (coords: { col: string; row: number } | null) => void;
  disablePanning?: boolean;
};

export default function ImageWorkspace({
  imageSrc,
  imageRef,
  imageDimensions,
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
  showCenterCoords,
  showScaleBar,
  onGridCropChange,
  sliceNames,
  setSliceNames,
  selectedSliceIndex,
  setSelectedSliceIndex,
  isReadOnly = false,
  imageZoom,
  setImageZoom,
  panOffset,
  setPanOffset,
  clickedCoords,
  onCellClick,
  disablePanning = false,
}: ImageWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const [editingSliceIndex, setEditingSliceIndex] = useState<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [touchStartZoom, setTouchStartZoom] = useState<number>(1);

  const fitAndCenter = useCallback(() => {
    if (!imageDimensions || !containerRef.current || isReadOnly) {
        // For delte kart, ikke gjør noe - hold scale på 1
        if (!isReadOnly) {
          setScale(1);
        }
        return;
    };
    
    const cellSizePx = unit === 'px' ? cellSize : (cellSize / 25.4) * dpi;
    const labelSize = Math.min(25, cellSizePx * 0.4);

    const contentWidth = imageDimensions.naturalWidth + splitCols * labelSize;
    const contentHeight = imageDimensions.naturalHeight + splitRows * labelSize;
    
    const { offsetWidth: containerWidth, offsetHeight: containerHeight } = containerRef.current;
    
    const scaleX = (containerWidth - 32) / contentWidth;
    const scaleY = (containerHeight - 32) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1);
    
    setScale(newScale);
  }, [imageDimensions, containerRef, splitCols, splitRows, cellSize, unit, dpi, isReadOnly]);
  
  useEffect(() => {
      fitAndCenter();
  }, [imageDimensions, fitAndCenter, splitCols, splitRows]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver(() => fitAndCenter());
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [fitAndCenter, containerRef]);

  const handleSliceClick = (index: number) => {
    if (isReadOnly || splitCols * splitRows <= 1) return;
    setSelectedSliceIndex(index);
    setEditingSliceIndex(null); // Exit edit mode when selecting another slice
  }

  const handleStartEditing = (index: number) => {
    if (isReadOnly || splitCols * splitRows <= 1) return;
    setEditingSliceIndex(index);
  };

  const handleSliceNameChange = (index: number, newName: string) => {
    if (isReadOnly) return;
    const newSliceNames = [...sliceNames];
    newSliceNames[index] = newName;
    setSliceNames(newSliceNames);
    setEditingSliceIndex(null); // Exit edit mode after change
  };


  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      
      if (isReadOnly) {
        // For delte kart: pan hele kartet ved å justere transform origin
        if (contentRef.current) {
          const currentTransform = contentRef.current.style.transform;
          const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
          const currentX = translateMatch ? parseFloat(translateMatch[1]) : 0;
          const currentY = translateMatch ? parseFloat(translateMatch[2]) : 0;
          
          const newX = currentX + dx;
          const newY = currentY + dy;
          
          contentRef.current.style.transform = `scale(${scale}) translate(${newX}px, ${newY}px)`;
        }
      } else {
        // For editor: bruk panOffset
        setPanOffset(prev => {
          const newX = prev.x + dx;
          const newY = prev.y + dy;
          return { x: newX, y: newY };
        });
      }
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!contentRef.current || !imageDimensions || !containerRef.current) {
      onHover(null);
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    
    const mouseX = e.clientX - contentRect.left;
    const mouseY = e.clientY - contentRect.top;

    const cellSizePx = unit === "px" ? cellSize : (cellSize / 25.4) * dpi;
    if (cellSizePx <= 0) {
      onHover(null);
      return;
    }
    const labelSize = isReadOnly ? 0 : Math.min(25, cellSizePx * 0.4);

    const mouseXInContent = mouseX / scale;
    const mouseYInContent = mouseY / scale;

    const sliceWidth = imageDimensions.naturalWidth / splitCols;
    const sliceHeight = imageDimensions.naturalHeight / splitRows;

    const sliceCol = Math.floor(mouseXInContent / (sliceWidth + labelSize));
    const sliceRow = Math.floor(mouseYInContent / (sliceHeight + labelSize));
    
    const xInSlice = (mouseXInContent % (sliceWidth + labelSize)) - labelSize;
    const yInSlice = (mouseYInContent % (sliceHeight + labelSize)) - labelSize;
    
    if (xInSlice < 0 || yInSlice < 0) {
        onHover(null);
        return;
    }

    const imageX = sliceCol * sliceWidth + xInSlice;
    const imageY = sliceRow * sliceHeight + yInSlice;

    const gridMouseX = (imageX - panOffset.x) / imageZoom - gridOffset.x;
    const gridMouseY = (imageY - panOffset.y) / imageZoom - gridOffset.y;
    
    if (gridMouseX < 0 || gridMouseY < 0 || imageX > imageDimensions.naturalWidth || imageY > imageDimensions.naturalHeight) {
      onHover(null);
      return;
    }

    const colIndex = Math.floor(gridMouseX / cellSizePx);
    const rowIndex = Math.floor(gridMouseY / cellSizePx);

    const totalCols = Math.floor((imageDimensions.naturalWidth - gridOffset.x) / cellSizePx);

    if (colIndex >= 0 && colIndex < totalCols + 1 && rowIndex >= 0) {
      const col = String.fromCharCode(65 + colIndex);
      const row = rowIndex + 1;
      onHover({ col, row });
    } else {
      onHover(null);
    }
  };
  
  const handleMouseLeave = () => {
    onHover(null);
    setIsPanning(false);
  };
  
  const handleGlobalClick = useCallback((e: MouseEvent) => {
    if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
      setSelectedSliceIndex(null);
      setEditingSliceIndex(null);
    }
  }, [setSelectedSliceIndex]);

  useEffect(() => {
    document.addEventListener('mousedown', handleGlobalClick);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [handleGlobalClick]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ingen panning for delte kart siden de ikke kan zoome
    if (!disablePanning && e.button === 0 && !isReadOnly && imageZoom > 1) { // Left mouse button and zoomed in
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        e.preventDefault();
    }
  };

  useEffect(() => {
    if (disablePanning) {
      setIsPanning(false);
    }
  }, [disablePanning]);
  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      // Ingen zoom for delte kart (isReadOnly)
      if (!isReadOnly) {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setImageZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
      }
    }
  };

  // Touch event handlers for mobile support
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disablePanning) return;
    
    if (e.touches.length === 1) {
      // Single touch - start panning
      if (!isReadOnly && imageZoom > 1) {
        setIsPanning(true);
        setPanStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    } else if (e.touches.length === 2 && !isReadOnly) {
      // Two finger touch - start pinch zoom
      const distance = getTouchDistance(e.touches);
      if (distance) {
        setLastTouchDistance(distance);
        setTouchStartZoom(imageZoom);
      }
      setIsPanning(false);
    }
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disablePanning) return;
    
    if (e.touches.length === 1 && isPanning) {
      // Single touch panning
      const dx = e.touches[0].clientX - panStart.x;
      const dy = e.touches[0].clientY - panStart.y;
      
      if (isReadOnly) {
        // For shared maps: pan the entire map
        if (contentRef.current) {
          const currentTransform = contentRef.current.style.transform;
          const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
          const currentX = translateMatch ? parseFloat(translateMatch[1]) : 0;
          const currentY = translateMatch ? parseFloat(translateMatch[2]) : 0;
          
          const newX = currentX + dx;
          const newY = currentY + dy;
          
          contentRef.current.style.transform = `scale(${scale}) translate(${newX}px, ${newY}px)`;
        }
      } else {
        // For editor: use panOffset
        setPanOffset(prev => {
          const newX = prev.x + dx;
          const newY = prev.y + dy;
          return { x: newX, y: newY };
        });
      }
      setPanStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2 && !isReadOnly && lastTouchDistance) {
      // Two finger pinch zoom
      const distance = getTouchDistance(e.touches);
      if (distance) {
        const scale = distance / lastTouchDistance;
        const newZoom = Math.max(0.1, Math.min(5, touchStartZoom * scale));
        setImageZoom(newZoom);
      }
    }
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      setIsPanning(false);
      setLastTouchDistance(null);
    } else if (e.touches.length === 1) {
      // One finger left, stop zoom but continue panning if needed
      setLastTouchDistance(null);
      if (!isReadOnly && imageZoom > 1) {
        setIsPanning(true);
        setPanStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    }
  };
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor }}>
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Image workspace */}
        <div
          ref={containerRef}
          className={cn("flex-1 flex items-center justify-center p-4 md:p-8 relative", 
            isReadOnly ? "overflow-hidden" : "overflow-auto",
            disablePanning ? '' : (isPanning ? 'cursor-grabbing' : (isReadOnly ? '' : (imageZoom > 1 ? 'cursor-grab' : ''))))}
          onMouseMove={disablePanning ? undefined : handleMouseMove}
          onMouseLeave={disablePanning ? undefined : handleMouseLeave}
          onMouseDown={disablePanning ? undefined : handleMouseDown}
          onMouseUp={disablePanning ? undefined : handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={disablePanning ? undefined : handleTouchStart}
          onTouchMove={disablePanning ? undefined : handleTouchMove}
          onTouchEnd={disablePanning ? undefined : handleTouchEnd}
        >
          <div 
            ref={contentRef} 
            style={{transform: isReadOnly ? 'scale(1)' : `scale(${scale})`}}
            onClick={(e) => {
               if (e.target === e.currentTarget) {
                  setSelectedSliceIndex(null);
                  setEditingSliceIndex(null);
               }
            }}
          >
            {imageSrc && imageDimensions ? (
                <GridDisplayContainer
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
                    splitCols={splitCols}
                    splitRows={splitRows}
                    showCenterCoords={showCenterCoords}
                    onGridCropChange={onGridCropChange}
                    sliceNames={sliceNames}
                    onSliceNameChange={handleSliceNameChange}
                    selectedSliceIndex={selectedSliceIndex}
                    onSliceClick={handleSliceClick}
                    editingSliceIndex={editingSliceIndex}
                    onStartEditing={handleStartEditing}
                    isReadOnly={isReadOnly}
                    imageZoom={imageZoom}
                    panOffset={panOffset}
                />
            ) : imageSrc ? (
                <div className="relative">
                    <Image
                        ref={imageRef}
                        src={imageSrc}
                        alt="Uploaded map"
                        width={500}
                        height={500}
                        className="max-w-none hidden"
                        priority
                        onLoad={(e) => {
                            const img = e.target as HTMLImageElement;
                            onImageLoad({
                                naturalWidth: img.naturalWidth,
                                naturalHeight: img.naturalHeight,
                            });
                        }}
                    />
                </div>
            ) : (
              <div className="text-center text-muted-foreground p-8 border-2 border-dashed border-muted-foreground/30 rounded-xl">
                <UploadCloud className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-medium">Upload an Image</h3>
                <p className="mt-1 text-sm">
                  Click the 'Upload Image' button to get started.
                </p>
              </div>
            )}
        </div>

        {imageSrc && showScaleBar && !isReadOnly && (
          <ScaleBar
            scale={scale}
            cellSize={cellSize}
            unit={unit}
            dpi={dpi}
            color={labelColor}
          />
        )}
        {imageSrc && !isReadOnly && (
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-72 md:w-80 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-lg flex items-center gap-2">
            <button 
              onClick={() => {
                setImageZoom(prev => Math.max(0.1, prev - 0.1));
              }}
              className="p-2 md:p-1 hover:bg-background/50 rounded touch-manipulation"
            >
              <ZoomOut className="h-5 w-5 md:h-4 md:w-4" />
            </button>
            <Slider
                value={[imageZoom]}
                onValueChange={(value) => {
                  setImageZoom(value[0]);
                }}
                min={0.1}
                max={5}
                step={0.05}
                className="flex-1"
            />
            <button 
              onClick={() => {
                setImageZoom(prev => Math.min(5, prev + 0.1));
              }}
              className="p-2 md:p-1 hover:bg-background/50 rounded touch-manipulation"
            >
              <ZoomIn className="h-5 w-5 md:h-4 md:w-4" />
            </button>
            <button 
              onClick={() => {
                setImageZoom(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="p-2 md:p-1 hover:bg-background/50 rounded ml-2 touch-manipulation"
              title="Fit to screen"
            >
              <Maximize2 className="h-5 w-5 md:h-4 md:w-4" />
            </button>
           </div>
        )}
        </div>
      </div>
    </div>
  );
}
