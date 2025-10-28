import React, { useState, useEffect, useMemo, useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import { UploadCloud, ZoomIn, ZoomOut, Maximize2, Palette, RotateCcw } from "lucide-react";
import GridDisplayContainer from './grid-display-container';
import ImageGridDisplay from './image-grid-display';
import ScaleBar from './scale-bar';
import { Slider } from "@/components/ui/slider";
import './shared-map-styles.css';
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
  sliceImageSettings?: {
    [sliceIndex: number]: {
      zoom: number;
      panOffset: { x: number; y: number };
    }
  };
  onSliceImageSettingsChange?: (sliceIndex: number, settings: { zoom?: number; panOffset?: { x: number; y: number } }) => void;
  clickedCoords?: { col: string; row: number } | null;
  onCellClick?: (coords: { col: string; row: number } | null) => void;
  disablePanning?: boolean;
  showReferencePoints?: boolean;
  referenceColors?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  setReferenceColors?: Dispatch<SetStateAction<{
    top: string;
    right: string;
    bottom: string;
    left: string;
  }>>;
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
  sliceImageSettings,
  onSliceImageSettingsChange,
  clickedCoords,
  onCellClick,
  disablePanning = false,
  showReferencePoints = false,
  referenceColors = {
    top: '#ffffff',    // White
    right: '#ff0000',  // Red
    bottom: '#000000', // Black
    left: '#01b050'    // Green (updated standard)
  },
  setReferenceColors,
}: ImageWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const [editingSliceIndex, setEditingSliceIndex] = useState<number | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [localReferenceColors, setLocalReferenceColors] = useState(referenceColors);
  
  // Sync local colors with props changes
  useEffect(() => {
    setLocalReferenceColors(referenceColors);
  }, [referenceColors]);
  
  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColorPicker && !(event.target as Element)?.closest('.color-picker-container')) {
        setShowColorPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker]);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [touchStartZoom, setTouchStartZoom] = useState<number>(1);

  const fitAndCenter = useCallback(() => {
    if (!imageDimensions || !containerRef.current) {
        return;
    };
    
    // For shared maps (isReadOnly), don't auto-scale - let users scroll instead
    if (isReadOnly) {
        setScale(1);
        return;
    };
    
    const cellSizePx = unit === 'px' ? cellSize : (cellSize / 25.4) * dpi;
    const labelSize = isReadOnly ? 0 : Math.min(25, cellSizePx * 0.4); // No labels on shared maps
    const sliceSpacing = splitCols * splitRows > 1 ? 60 : 0; // Space between slices (increased for better separation)

    const contentWidth = imageDimensions.naturalWidth + splitCols * labelSize + ((splitCols - 1) * sliceSpacing) + (splitCols * splitRows > 1 ? 54 : 0); // Extra space for left/right reference lines + padding for right edge
    const contentHeight = imageDimensions.naturalHeight + splitRows * labelSize + ((splitRows - 1) * sliceSpacing) + (splitCols * splitRows > 1 ? 54 : 0); // Extra space for top/bottom reference lines + padding for bottom edge
    
    const { offsetWidth: containerWidth, offsetHeight: containerHeight } = containerRef.current;
    
    // Reserve space for bottom controls if they exist, otherwise just padding
    const hasBottomControls = showScaleBar || (!isReadOnly && showReferencePoints) || !isReadOnly;
    const availableHeight = containerHeight - (hasBottomControls ? (showScaleBar ? 100 : 80) : 20);
    const availableWidth = containerWidth - 40;
    
    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1);
    
    setScale(newScale);
  }, [imageDimensions, containerRef, splitCols, splitRows, cellSize, unit, dpi, isReadOnly, showScaleBar]);
  
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
    const sliceSpacing = splitCols * splitRows > 1 ? 60 : 0; // Space between slices (increased for better separation)

    const sliceCol = Math.floor(mouseXInContent / (sliceWidth + labelSize + sliceSpacing));
    const sliceRow = Math.floor(mouseYInContent / (sliceHeight + labelSize + sliceSpacing));
    
    const xInSlice = (mouseXInContent % (sliceWidth + labelSize + sliceSpacing)) - labelSize;
    const yInSlice = (mouseYInContent % (sliceHeight + labelSize + sliceSpacing)) - labelSize;
    
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
    <div className="h-full w-full flex flex-col relative" style={{ backgroundColor }}>
      {/* Main content area - uses full available space */}
      <div className="flex-1 relative overflow-hidden">
        {/* Image workspace - professional full-screen layout */}
        <div
          ref={containerRef}
          className={cn("absolute inset-0", 
            isReadOnly ? "shared-map-container scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent" : "overflow-auto flex items-center justify-center",
            disablePanning ? '' : (isPanning ? 'cursor-grabbing' : (isReadOnly ? '' : (imageZoom > 1 ? 'cursor-grab' : ''))))}
          style={{ 
            paddingBottom: showScaleBar ? '80px' : '20px'
          }}
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
            className={isReadOnly ? "shared-map-content" : ""}
            style={{
              transform: isReadOnly ? 'scale(1)' : `scale(${scale})`
            }}
            onClick={(e) => {
               if (e.target === e.currentTarget) {
                  setSelectedSliceIndex(null);
                  setEditingSliceIndex(null);
               }
            }}
          >
            {imageSrc && imageDimensions ? (
                <>
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
                      sliceImageSettings={sliceImageSettings}
                      onSliceImageSettingsChange={onSliceImageSettingsChange}
                      showReferencePoints={showReferencePoints}
                      referenceColors={localReferenceColors}
                  />
                  
                  {/* Reference Points are now handled entirely by ImageGridDisplay */}
                </>
            ) : imageSrc ? (
                <div className="relative">
                    <Image
                        ref={imageRef}
                        src={imageSrc || ''}
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

        </div>
      </div>
      
      {/* Fixed Scale Bar and Controls at Bottom - Only show if there's content */}
      {imageSrc && (showScaleBar || (!isReadOnly && showReferencePoints) || !isReadOnly) && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 shadow-lg">
          <div className="flex items-center justify-between p-3 gap-4">
            {/* Scale Bar - Left Side */}
            {showScaleBar && (
              <div className="flex-1 min-w-0">
                <ScaleBar
                  scale={scale}
                  cellSize={cellSize}
                  unit={unit}
                  dpi={dpi}
                  color={labelColor}
                />
              </div>
            )}
            
            {/* Slice Controls - Center (only when map splitting is active) */}
            {!isReadOnly && splitCols * splitRows > 1 && (
              <div 
                className="flex items-center gap-1 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {selectedSliceIndex !== null ? (
                  <>
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-xs font-medium">
                      <span className="text-primary">
                        {sliceNames[selectedSliceIndex] || `Slice ${selectedSliceIndex + 1}`}
                      </span>
                      {sliceImageSettings?.[selectedSliceIndex] && (
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="Custom settings applied" />
                      )}
                    </div>
                    <div className="h-4 w-px bg-border mx-1" />
                    <button
                      onClick={() => {
                        const currentSettings = sliceImageSettings?.[selectedSliceIndex];
                        const currentZoom = currentSettings?.zoom ?? imageZoom;
                        const newZoom = Math.max(0.1, currentZoom - 0.1);
                        onSliceImageSettingsChange?.(selectedSliceIndex, { zoom: newZoom });
                      }}
                      className="p-1 hover:bg-background/50 rounded touch-manipulation transition-colors"
                      title="Zoom Out Slice"
                    >
                      <ZoomOut className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        const currentSettings = sliceImageSettings?.[selectedSliceIndex];
                        const currentZoom = currentSettings?.zoom ?? imageZoom;
                        const newZoom = Math.min(5, currentZoom + 0.1);
                        onSliceImageSettingsChange?.(selectedSliceIndex, { zoom: newZoom });
                      }}
                      className="p-1 hover:bg-background/50 rounded touch-manipulation transition-colors"
                      title="Zoom In Slice"
                    >
                      <ZoomIn className="h-3 w-3" />
                    </button>
                    <div className="text-xs text-muted-foreground px-1">
                      {Math.round(((sliceImageSettings?.[selectedSliceIndex]?.zoom ?? imageZoom) * 100))}%
                    </div>
                    <button
                      onClick={() => {
                        // Reset slice to global settings by removing custom settings
                        onSliceImageSettingsChange?.(selectedSliceIndex, { 
                          zoom: imageZoom, 
                          panOffset: { ...panOffset }
                        });
                      }}
                      className="p-1 hover:bg-background/50 rounded touch-manipulation transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Reset Slice to Global Settings"
                      disabled={!sliceImageSettings?.[selectedSliceIndex]}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground px-2 py-1">
                    Select a slice to control
                  </span>
                )}
              </div>
            )}
            
            {/* Reference Line Color Controls - Center */}
            {showReferencePoints && !isReadOnly && (
              <div 
                className="flex items-center gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-sm relative color-picker-container"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-2 hover:bg-background/50 rounded touch-manipulation transition-colors"
                  title="Reference Line Colors"
                >
                  <Palette className="h-4 w-4" />
                </button>
                
                {showColorPicker && (
                  <div className="absolute bottom-full mb-2 left-0 bg-background border border-border rounded-lg p-3 shadow-lg z-50 min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">Reference Line Colors</div>
                      <button
                        onClick={() => {
                          const defaultColors = {
                            top: '#ffffff',
                            right: '#ff0000',
                            bottom: '#000000',
                            left: '#01b050'
                          };
                          setLocalReferenceColors(defaultColors);
                          setReferenceColors?.(defaultColors);
                        }}
                        className="p-1 hover:bg-background/50 rounded transition-colors"
                        title="Reset to default colors"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {/* Top Line Color */}
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border" style={{ backgroundColor: localReferenceColors.top }}></div>
                        <span className="text-xs flex-1">Top</span>
                        <input 
                          type="color" 
                          value={localReferenceColors.top}
                          onChange={(e) => {
                            const newColors = { ...localReferenceColors, top: e.target.value };
                            setLocalReferenceColors(newColors);
                            setReferenceColors?.(newColors);
                          }}
                          className="w-6 h-6 rounded border-0 cursor-pointer"
                        />
                      </div>
                      {/* Right Line Color */}
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border" style={{ backgroundColor: localReferenceColors.right }}></div>
                        <span className="text-xs flex-1">Right</span>
                        <input 
                          type="color" 
                          value={localReferenceColors.right}
                          onChange={(e) => {
                            const newColors = { ...localReferenceColors, right: e.target.value };
                            setLocalReferenceColors(newColors);
                            setReferenceColors?.(newColors);
                          }}
                          className="w-6 h-6 rounded border-0 cursor-pointer"
                        />
                      </div>
                      {/* Bottom Line Color */}
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border" style={{ backgroundColor: localReferenceColors.bottom }}></div>
                        <span className="text-xs flex-1">Bottom</span>
                        <input 
                          type="color" 
                          value={localReferenceColors.bottom}
                          onChange={(e) => {
                            const newColors = { ...localReferenceColors, bottom: e.target.value };
                            setLocalReferenceColors(newColors);
                            setReferenceColors?.(newColors);
                          }}
                          className="w-6 h-6 rounded border-0 cursor-pointer"
                        />
                      </div>
                      {/* Left Line Color */}
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border" style={{ backgroundColor: localReferenceColors.left }}></div>
                        <span className="text-xs flex-1">Left</span>
                        <input 
                          type="color" 
                          value={localReferenceColors.left}
                          onChange={(e) => {
                            const newColors = { ...localReferenceColors, left: e.target.value };
                            setLocalReferenceColors(newColors);
                            setReferenceColors?.(newColors);
                          }}
                          className="w-6 h-6 rounded border-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Zoom Controls - Right Side (only for editor mode) */}
            {!isReadOnly && (
              <div 
                className="flex items-center gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => {
                    setImageZoom(prev => Math.max(0.1, prev - 0.1));
                  }}
                  className="p-2 hover:bg-background/50 rounded touch-manipulation transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <div className="w-32">
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
                </div>
                <button 
                  onClick={() => {
                    setImageZoom(prev => Math.min(5, prev + 0.1));
                  }}
                  className="p-2 hover:bg-background/50 rounded touch-manipulation transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => {
                    setImageZoom(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="p-2 hover:bg-background/50 rounded ml-2 touch-manipulation transition-colors"
                  title="Fit to screen"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
