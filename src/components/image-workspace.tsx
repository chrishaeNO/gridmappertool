import React, { useState, useEffect, useMemo, useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import { cn } from '@/lib/utils';
import { getColumnLabel } from '@/utils/columnLabels';
import Image from "next/image";
import { UploadCloud, ZoomIn, ZoomOut, Maximize2, Palette, RotateCcw } from "lucide-react";
import GridDisplayContainer from './grid-display-container';
import ImageGridDisplay from './image-grid-display';
import ScaleBar from './scale-bar';
import { Slider } from "@/components/ui/slider";
import { useDragDrop } from '@/hooks/use-drag-drop';
import { useToast } from '@/hooks/use-toast';
import { formatFileSize } from '@/utils/image-compression';
import './shared-map-styles.css';

export type ImageDimensions = {
  width: number;
  height: number;
};

type ImageWorkspaceProps = {
  imageSrc: string | null;
  imageRef: React.RefObject<HTMLImageElement>;
  imageDimensions: ImageDimensions | null;
  onImageLoad: (dimensions: ImageDimensions) => void;
  onImageUpload?: (file: File) => void;
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
  onImageUpload,
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
  const { toast } = useToast();

  // Drag and drop functionality for when no image is loaded
  const { isDragOver, isCompressing, dragProps } = useDragDrop({
    onFileUpload: onImageUpload || (() => {}),
    acceptedTypes: ['image/*', 'application/pdf'],
    maxFileSize: 8 * 1024 * 1024, // 8MB limit
    onCompressionStart: () => {
      toast({
        title: 'Compressing Image',
        description: 'Large image detected. Compressing to optimize size...',
      });
    },
    onCompressionComplete: (result) => {
      if (result.wasCompressed) {
        const savedSpace = ((1 - result.compressionRatio) * 100).toFixed(1);
        toast({
          title: 'Image Compressed Successfully',
          description: `File size reduced from ${formatFileSize(result.originalSize)} to ${formatFileSize(result.compressedSize)} (${savedSpace}% smaller)`,
        });
      }
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: error,
      });
    }
  });

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

    const contentWidth = imageDimensions.width + splitCols * labelSize + ((splitCols - 1) * sliceSpacing) + (splitCols * splitRows > 1 ? 54 : 0); // Extra space for left/right reference lines + padding for right edge
    const contentHeight = imageDimensions.height + splitRows * labelSize + ((splitRows - 1) * sliceSpacing) + (splitCols * splitRows > 1 ? 54 : 0); // Extra space for top/bottom reference lines + padding for bottom edge
    
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

    const sliceWidth = imageDimensions.width / splitCols;
    const sliceHeight = imageDimensions.height / splitRows;
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
    
    if (gridMouseX < 0 || gridMouseY < 0 || imageX > imageDimensions.width || imageY > imageDimensions.height) {
      onHover(null);
      return;
    }

    const colIndex = Math.floor(gridMouseX / cellSizePx);
    const rowIndex = Math.floor(gridMouseY / cellSizePx);

    const totalCols = Math.floor((imageDimensions.width - gridOffset.x) / cellSizePx);

    if (colIndex >= 0 && colIndex < totalCols + 1 && rowIndex >= 0) {
      const col = getColumnLabel(colIndex);
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
  
  // Function to deselect slice when clicking on background (not on any slice)
  const handleBackgroundClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only deselect if clicking directly on the background container
    if (e.target === e.currentTarget) {
      setSelectedSliceIndex(null);
      setEditingSliceIndex(null);
    }
  }, [setSelectedSliceIndex]);

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
      {/* Main content area - uses full available space with scroll */}
      <div className="flex-1 relative overflow-auto">
        {/* Image workspace - professional full-screen layout */}
        <div
          ref={containerRef}
          className={cn("absolute inset-0", 
            isReadOnly ? "shared-map-container scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent" : "overflow-auto flex items-center justify-center",
            disablePanning ? '' : (isPanning ? 'cursor-grabbing' : (isReadOnly ? '' : (imageZoom > 1 ? 'cursor-grab' : ''))),
            // Add drag and drop styling when no image is loaded
            !imageSrc && onImageUpload && isDragOver ? 'bg-primary/5' : ''
          )}
          style={{ 
            paddingBottom: showScaleBar ? '80px' : '0px'
          }}
          // Add drag and drop events when no image is loaded
          {...(!imageSrc && onImageUpload ? dragProps : {})}
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
            onClick={handleBackgroundClick}
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
                                width: img.width,
                                height: img.height,
                            });
                        }}
                    />
                </div>
            ) : (
              <div 
                {...(onImageUpload ? dragProps : {})}
                className={cn(
                  "text-center text-muted-foreground p-8 border-2 border-dashed rounded-xl transition-colors relative max-w-md mx-auto",
                  onImageUpload && isDragOver 
                    ? "border-primary bg-primary/5 border-solid" 
                    : "border-muted-foreground/30",
                  onImageUpload ? "cursor-pointer hover:border-muted-foreground/50" : ""
                )}
              >
                <UploadCloud className={cn("mx-auto h-12 w-12", isDragOver && "text-primary")} />
                <h3 className={cn("mt-4 text-lg font-medium", isDragOver && "text-primary")}>
                  {isDragOver ? "Drop your file here" : "Upload an Image"}
                </h3>
                <p className={cn("mt-1 text-sm", isDragOver && "text-primary")}>
                  {isDragOver 
                    ? "Release to upload your image or PDF" 
                    : onImageUpload 
                      ? "Drag and drop an image or PDF file anywhere on this area, or click the 'Upload Image' button to get started. Large images will be compressed automatically."
                      : "Click the 'Upload Image' button to get started."
                  }
                </p>
                {onImageUpload && isDragOver && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl border-2 border-primary border-dashed">
                    <div className="text-center">
                      <UploadCloud className="mx-auto h-16 w-16 text-primary mb-4" />
                      <p className="text-lg font-medium text-primary">Drop file here to upload</p>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Full-screen drag overlay when dragging over the entire area */}
        {!imageSrc && onImageUpload && isDragOver && (
          <div className="absolute inset-0 bg-primary/10 border-4 border-primary border-dashed flex items-center justify-center z-50 pointer-events-none">
            <div className="text-center">
              <UploadCloud className="mx-auto h-24 w-24 text-primary mb-4" />
              <h2 className="text-2xl font-bold text-primary mb-2">Drop your file anywhere</h2>
              <p className="text-lg text-primary">Release to upload your image or PDF</p>
            </div>
          </div>
        )}

        </div>
      </div>
      
      {/* Scale Bar - Only show if enabled */}
      {imageSrc && showScaleBar && (
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg p-2 shadow-lg">
          <ScaleBar 
            scale={imageZoom}
            cellSize={cellSize}
            unit={unit}
            dpi={dpi}
            color={gridColor}
          />
        </div>
      )}
    </div>
  );
}
