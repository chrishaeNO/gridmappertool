'use client';

import React, {useRef, useEffect, useState} from 'react';
import { useDragDrop } from '@/hooks/use-drag-drop';
import { useToast } from '@/hooks/use-toast';
import { formatFileSize } from '@/utils/image-compression';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Separator} from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {UploadCloud, Palette, Grid, Eye, AlertTriangle, CheckCircle2, FileText, Map, Loader2, RotateCcw, RotateCw, Compass, Target, Navigation } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import type {Dispatch, SetStateAction} from 'react';
import { cn } from "@/lib/utils";
import SliceImageControls from './slice-image-controls';

type ControlPanelProps = {
  onImageUpload: (file: File) => void;
  imageSrc?: string | null;
  imageFile?: File | null;
  imageDimensions?: { width: number; height: number } | null;
  cellSize: number;
  setCellSize: Dispatch<SetStateAction<number>>;
  unit: 'px' | 'mm';
  setUnit: Dispatch<SetStateAction<'px' | 'mm'>>;
  dpi: number;
  setDpi: Dispatch<SetStateAction<number>>;
  hasImage: boolean;
  gridColor: string;
  setGridColor: Dispatch<SetStateAction<string>>;
  labelColor: string;
  setLabelColor: Dispatch<SetStateAction<string>>;
  backgroundColor: string;
  setBackgroundColor: Dispatch<SetStateAction<string>>;
  gridThickness: number;
  setGridThickness: Dispatch<SetStateAction<number>>;
  splitCols: number;
  setSplitCols: Dispatch<SetStateAction<number>>;
  splitRows: number;
  setSplitRows: Dispatch<SetStateAction<number>>;
  sliceNames: string[];
  setSliceNames: (index: number, newName: string) => void;
  showCenterCoords: boolean;
  setShowCenterCoords: Dispatch<SetStateAction<boolean>>;
  showScaleBar: boolean;
  setShowScaleBar: Dispatch<SetStateAction<boolean>>;
  isGridCropped: boolean;
  selectedSliceIndex: number | null;
  setSelectedSliceIndex: Dispatch<SetStateAction<number | null>>;
  mapName: string;
  setMapName: Dispatch<SetStateAction<string>>;
  showReferencePoints?: boolean;
  onToggleReferencePoints?: (enabled: boolean) => void;
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
  compassLetters?: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  };
  onCompassLettersChange?: (letters: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  }) => void;
  sliceImageSettings?: {
    [sliceIndex: number]: {
      zoom: number;
      panOffset: { x: number; y: number };
      rotation?: number;
    }
  };
  globalImageZoom?: number;
  globalPanOffset?: { x: number; y: number };
  onSliceImageSettingsChange?: (sliceIndex: number, settings: { zoom?: number; panOffset?: { x: number; y: number }; rotation?: number }) => void;
  onResetSliceSettings?: (sliceIndex: number) => void;
  onResetAllSliceSettings?: () => void;
  imageRotation?: number;
  onRotateImage?: (direction: 'left' | 'right') => void;
  onSetNorthUp?: () => void;
  isRotationMode?: boolean;
  onToggleRotationMode?: () => void;
};

export default function ControlPanel({
  onImageUpload,
  imageSrc,
  imageFile,
  imageDimensions,
  cellSize,
  setCellSize,
  unit,
  setUnit,
  dpi,
  setDpi,
  hasImage,
  gridColor,
  setGridColor,
  labelColor,
  setLabelColor,
  backgroundColor,
  setBackgroundColor,
  gridThickness,
  setGridThickness,
  splitCols,
  setSplitCols,
  splitRows,
  setSplitRows,
  sliceNames,
  setSliceNames,
  showCenterCoords,
  setShowCenterCoords,
  showScaleBar,
  setShowScaleBar,
  isGridCropped,
  selectedSliceIndex,
  setSelectedSliceIndex,
  mapName,
  setMapName,
  showReferencePoints,
  onToggleReferencePoints,
  referenceColors,
  setReferenceColors,
  compassLetters = { north: false, south: false, east: false, west: false },
  onCompassLettersChange,
  sliceImageSettings,
  globalImageZoom = 1,
  globalPanOffset = { x: 0, y: 0 },
  onSliceImageSettingsChange,
  onResetSliceSettings,
  onResetAllSliceSettings,
  imageRotation = 0,
  onRotateImage,
  onSetNorthUp,
  isRotationMode = false,
  onToggleRotationMode,
}: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [isCompressing, setIsCompressing] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(() => {
    // Image upload accordion open by default, others closed
    return hasImage ? [] : ['image-upload'];
  });

  // Auto-close image upload accordion when image is loaded (only once)
  const [hasAutoClosedUpload, setHasAutoClosedUpload] = useState(false);
  
  useEffect(() => {
    if (hasImage && openSections.includes('image-upload') && !hasAutoClosedUpload) {
      setOpenSections(prev => prev.filter(section => section !== 'image-upload'));
      setHasAutoClosedUpload(true);
    } else if (!hasImage && !openSections.includes('image-upload')) {
      setOpenSections(prev => [...prev, 'image-upload']);
      setHasAutoClosedUpload(false);
    }
  }, [hasImage, openSections, hasAutoClosedUpload]);

  const { isDragOver, dragProps, processFile } = useDragDrop({
    onFileUpload: onImageUpload,
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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-3 md:p-4 flex flex-col h-full overflow-y-auto mobile-scroll">
        <div className="space-y-6 flex-1">
          {/* Image Info - Show when image is loaded, replace Controls header */}
          {hasImage && imageDimensions && (
            <div className="hidden md:block">
              <div className="p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-start gap-3">
                  {/* Small thumbnail */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-muted rounded border overflow-hidden">
                      <img 
                        src={imageSrc || undefined} 
                        alt="Uploaded image" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* Image details */}
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium truncate">
                      {imageFile?.name || 'Uploaded Image'}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>Size: {imageFile ? formatFileSize(imageFile.size) : 'Unknown'}</div>
                      <div>{imageDimensions.width} × {imageDimensions.height} px</div>
                      <div>
                        {((imageDimensions.width / dpi) * 25.4).toFixed(1)} × {((imageDimensions.height / dpi) * 25.4).toFixed(1)} mm
                      </div>
                      <div>DPI: {dpi}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Image Upload - Collapsible accordion, right under image info */}
              <div className="mt-4">
                <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="w-full">
                  <AccordionItem value="image-upload">
                    <AccordionTrigger className="font-semibold py-2">
                      <div className="flex items-center justify-between w-full mr-2">
                        <div className="flex items-center">
                          <UploadCloud className="mr-2 h-4 w-4" />
                          Change Image
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <Input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,application/pdf"
                      />
                      <div
                        {...dragProps}
                        className={cn(
                          "relative border-2 border-dashed rounded-lg p-4 transition-colors",
                          isDragOver 
                            ? "border-primary bg-primary/5 border-solid" 
                            : "border-muted-foreground/30 hover:border-muted-foreground/50"
                        )}
                      >
                        <Button
                          onClick={handleUploadClick}
                          className="w-full h-11 md:h-10 touch-manipulation"
                          variant="outline"
                          disabled={isCompressing}
                        >
                          {isCompressing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Compressing...
                            </>
                          ) : (
                            'Change Image'
                          )}
                        </Button>
                        {isDragOver && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg border-2 border-primary border-dashed">
                            <div className="text-center">
                              <UploadCloud className="mx-auto h-8 w-8 text-primary mb-2" />
                              <p className="text-sm font-medium text-primary">Drop file here</p>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Or drag and drop an image or PDF file here<br />
                          <span className="text-xs">Max size: 8MB (images will be compressed automatically)</span>
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          )}

          {/* Image Upload - Show when no image is loaded */}
          {!hasImage && (
            <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="w-full">
              <AccordionItem value="image-upload">
                <AccordionTrigger className="font-semibold py-2">
                  <div className="flex items-center justify-between w-full mr-2">
                    <div className="flex items-center">
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Upload Image
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <Input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                  />
                  <div
                    {...dragProps}
                    className={cn(
                      "relative border-2 border-dashed rounded-lg p-4 transition-colors",
                      isDragOver 
                        ? "border-primary bg-primary/5 border-solid" 
                        : "border-muted-foreground/30 hover:border-muted-foreground/50"
                    )}
                  >
                    <Button
                      onClick={handleUploadClick}
                      className="w-full h-11 md:h-10 touch-manipulation"
                      variant="outline"
                      disabled={isCompressing}
                    >
                      {isCompressing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Compressing...
                        </>
                      ) : (
                        'Upload Image or PDF'
                      )}
                    </Button>
                    {isDragOver && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg border-2 border-primary border-dashed">
                        <div className="text-center">
                          <UploadCloud className="mx-auto h-8 w-8 text-primary mb-2" />
                          <p className="text-sm font-medium text-primary">Drop file here</p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Or drag and drop an image or PDF file here<br />
                      <span className="text-xs">Max size: 8MB (images will be compressed automatically)</span>
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          <Separator className="hidden md:block" />



          {/* Settings */}
          {hasImage && (
            <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="w-full">
              
              {/* Grid Settings - Most important first */}
              <AccordionItem value="grid-settings">
                <AccordionTrigger className="font-semibold py-2">
                  <div className="flex items-center justify-between w-full mr-2">
                    <div className="flex items-center">
                      <Grid className="mr-2 h-4 w-4" />
                      Grid Settings
                    </div>
                    <div className="flex items-center gap-2">
                      {(cellSize !== 5.5 || unit !== 'mm' || dpi !== 96) && (
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                          Modified
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {cellSize}{unit}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cell-size">Cell Size (supports decimals)</Label>
                      <Input
                        id="cell-size"
                        type="number"
                        value={cellSize}
                        onChange={e => setCellSize(Number(e.target.value))}
                        min="0.01"
                        max="500"
                        step="0.01"
                        placeholder="e.g. 28.5"
                        className="h-11 md:h-10 text-base md:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <RadioGroup value={unit} onValueChange={(value) => setUnit(value as 'px' | 'mm')}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="px" id="px" />
                          <Label htmlFor="px">px</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mm" id="mm" />
                          <Label htmlFor="mm">mm</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  {unit === 'mm' && (
                    <div className="space-y-2">
                      <Label htmlFor="dpi">DPI</Label>
                      <Input
                        id="dpi"
                        type="number"
                        value={dpi}
                        onChange={e => setDpi(Number(e.target.value))}
                        min="72"
                        max="600"
                      />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Image Rotation */}
              <AccordionItem value="image-rotation">
                <AccordionTrigger className="font-semibold py-2">
                  <div className="flex items-center justify-between w-full mr-2">
                    <div className="flex items-center">
                      <Compass className="mr-2 h-4 w-4" />
                      Image Rotation
                    </div>
                    <div className="flex items-center gap-2">
                      {isRotationMode && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                      {(imageRotation !== 0 || Object.values(sliceImageSettings || {}).some(s => s.rotation && s.rotation !== 0)) && (
                        <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded">
                          Rotated
                        </span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {selectedSliceIndex !== null ? `Slice ${selectedSliceIndex + 1} rotation:` : 'Global rotation:'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {selectedSliceIndex !== null && sliceImageSettings?.[selectedSliceIndex]?.rotation !== undefined 
                          ? sliceImageSettings[selectedSliceIndex].rotation 
                          : imageRotation
                        }°
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRotateImage?.('left')}
                        className="flex-1"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Rotate Left
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRotateImage?.('right')}
                        className="flex-1"
                      >
                        <RotateCw className="h-4 w-4 mr-2" />
                        Rotate Right
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={onSetNorthUp}
                        className="flex-1"
                      >
                        <Compass className="h-4 w-4 mr-2" />
                        North Up
                      </Button>
                      <Button
                        variant={isRotationMode ? "default" : "outline"}
                        size="sm"
                        onClick={onToggleRotationMode}
                        className="flex-1"
                      >
                        <Compass className="h-4 w-4 mr-2" />
                        {isRotationMode ? 'Exit Rotate' : 'Rotate Mode'}
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {isRotationMode 
                        ? "Drag on the image to rotate it precisely. Click 'Exit Rotate' when done."
                        : selectedSliceIndex !== null
                          ? `Rotating Slice ${selectedSliceIndex + 1}. Click another slice or empty area to rotate globally.`
                          : "Click a slice to rotate individually, or use buttons for global rotation."
                      }
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Map Splitting */}
              <AccordionItem value="map-splitting">
                <AccordionTrigger className="font-semibold py-2">
                  <div className="flex items-center justify-between w-full mr-2">
                    <div className="flex items-center">
                      <Grid className="mr-2 h-4 w-4" />
                      Map Splitting
                    </div>
                    <div className="flex items-center gap-2">
                      {(splitCols > 1 || splitRows > 1) && (
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                          {splitCols}×{splitRows}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {splitCols * splitRows} slice{splitCols * splitRows !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="split-cols">Columns</Label>
                      <Input
                        id="split-cols"
                        type="number"
                        value={splitCols}
                        onChange={e => setSplitCols(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        max="10"
                        className="h-11 md:h-10 text-base md:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="split-rows">Rows</Label>
                      <Input
                        id="split-rows"
                        type="number"
                        value={splitRows}
                        onChange={e => setSplitRows(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        max="10"
                        className="h-11 md:h-10 text-base md:text-sm"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Color Settings */}
              <AccordionItem value="color-settings">
                <AccordionTrigger className="font-semibold py-2">
                  <div className="flex items-center justify-between w-full mr-2">
                    <div className="flex items-center">
                      <Palette className="mr-2 h-4 w-4" />
                      Color Settings
                    </div>
                    <div className="flex items-center gap-2">
                      {(backgroundColor !== '#0f1729' || gridColor !== '#FFFFFF' || labelColor !== '#FFFFFF') && (
                        <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded">
                          Custom
                        </span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="background-color">BG</Label>
                      <Input
                        id="background-color"
                        type="color"
                        value={backgroundColor}
                        onChange={e => setBackgroundColor(e.target.value)}
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grid-color">Grid</Label>
                      <Input
                        id="grid-color"
                        type="color"
                        value={gridColor}
                        onChange={e => setGridColor(e.target.value)}
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="label-color">Labels</Label>
                      <Input
                        id="label-color"
                        type="color"
                        value={labelColor}
                        onChange={e => setLabelColor(e.target.value)}
                        className="p-1 h-10"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Display Settings - Less important, moved to bottom */}
              <AccordionItem value="display-settings">
                <AccordionTrigger className="font-semibold py-2">
                  <div className="flex items-center justify-between w-full mr-2">
                    <div className="flex items-center">
                      <Eye className="mr-2 h-4 w-4" />
                      Display
                    </div>
                    <div className="flex items-center gap-2">
                      {(showCenterCoords || !showScaleBar) && (
                        <span className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                          Modified
                        </span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-center-coords">Click to Show Coordinates</Label>
                      <p className="text-xs text-muted-foreground">
                        Click on grid cells to display coordinates.
                      </p>
                    </div>
                    <Switch
                      id="show-center-coords"
                      checked={showCenterCoords}
                      onCheckedChange={setShowCenterCoords}
                      disabled={!hasImage}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-scale-bar">Show Scale Bar</Label>
                      <p className="text-xs text-muted-foreground">
                        Display a scale bar for reference.
                      </p>
                    </div>
                    <Switch
                      id="show-scale-bar"
                      checked={showScaleBar}
                      onCheckedChange={setShowScaleBar}
                      disabled={!hasImage}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Reference Points Colors - Desktop only */}
              <AccordionItem value="reference-colors" className="hidden md:block">
                <AccordionTrigger className="font-semibold py-2">
                  <div className="flex items-center justify-between w-full mr-2">
                    <div className="flex items-center">
                      <Target className="mr-2 h-4 w-4" />
                      Reference Line Colors
                    </div>
                    {showReferencePoints && (
                      <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                        Active
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {showReferencePoints && referenceColors && setReferenceColors ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ref-top-color-desktop">Top</Label>
                        <Input
                          id="ref-top-color-desktop"
                          type="color"
                          value={referenceColors.top}
                          onChange={e => setReferenceColors(prev => ({ ...prev, top: e.target.value }))}
                          className="p-1 h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ref-right-color-desktop">Right</Label>
                        <Input
                          id="ref-right-color-desktop"
                          type="color"
                          value={referenceColors.right}
                          onChange={e => setReferenceColors(prev => ({ ...prev, right: e.target.value }))}
                          className="p-1 h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ref-bottom-color-desktop">Bottom</Label>
                        <Input
                          id="ref-bottom-color-desktop"
                          type="color"
                          value={referenceColors.bottom}
                          onChange={e => setReferenceColors(prev => ({ ...prev, bottom: e.target.value }))}
                          className="p-1 h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ref-left-color-desktop">Left</Label>
                        <Input
                          id="ref-left-color-desktop"
                          type="color"
                          value={referenceColors.left}
                          onChange={e => setReferenceColors(prev => ({ ...prev, left: e.target.value }))}
                          className="p-1 h-10"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Enable reference points in the header to customize colors.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Reference Points Section - Mobile only */}
              <AccordionItem value="reference-points" className="md:hidden">
                <AccordionTrigger className="font-semibold py-2">
                  <div className="flex items-center justify-between w-full mr-2">
                    <div className="flex items-center">
                      <Target className="mr-2 h-4 w-4" />
                      Reference Points
                    </div>
                    <div className="flex items-center gap-2">
                      {showReferencePoints && (
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {/* Toggle Reference Points */}
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="toggle-reference-points-mobile">Enable Reference Points</Label>
                      <p className="text-xs text-muted-foreground">
                        Show colored reference lines around the grid for orientation.
                      </p>
                    </div>
                    <Switch
                      id="toggle-reference-points-mobile"
                      checked={showReferencePoints || false}
                      onCheckedChange={onToggleReferencePoints}
                    />
                  </div>

                  {/* Reference Points Colors - Only show when enabled */}
                  {showReferencePoints && referenceColors && setReferenceColors && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="ref-top-color-mobile">Top</Label>
                          <Input
                            id="ref-top-color-mobile"
                            type="color"
                            value={referenceColors.top}
                            onChange={e => setReferenceColors(prev => ({ ...prev, top: e.target.value }))}
                            className="p-1 h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ref-right-color-mobile">Right</Label>
                          <Input
                            id="ref-right-color-mobile"
                            type="color"
                            value={referenceColors.right}
                            onChange={e => setReferenceColors(prev => ({ ...prev, right: e.target.value }))}
                            className="p-1 h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ref-bottom-color-mobile">Bottom</Label>
                          <Input
                            id="ref-bottom-color-mobile"
                            type="color"
                            value={referenceColors.bottom}
                            onChange={e => setReferenceColors(prev => ({ ...prev, bottom: e.target.value }))}
                            className="p-1 h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ref-left-color-mobile">Left</Label>
                          <Input
                            id="ref-left-color-mobile"
                            type="color"
                            value={referenceColors.left}
                            onChange={e => setReferenceColors(prev => ({ ...prev, left: e.target.value }))}
                            className="p-1 h-10"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Compass Letters Section */}
              <AccordionItem value="compass-letters">
                <AccordionTrigger className="font-semibold py-2">
                  <div className="flex items-center justify-between w-full mr-2">
                    <div className="flex items-center">
                      <Navigation className="mr-2 h-4 w-4" />
                      Compass Letters (N, S, E, W)
                    </div>
                    {(compassLetters.north || compassLetters.south || compassLetters.east || compassLetters.west) && (
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                        Active
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enable compass direction letters that appear outside reference lines when enabled. Letters will be included in exports and map splitting.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="compass-north">North (N)</Label>
                        <p className="text-xs text-muted-foreground">
                          Show "N" at the top
                        </p>
                      </div>
                      <Switch
                        id="compass-north"
                        checked={compassLetters.north}
                        onCheckedChange={(checked) => 
                          onCompassLettersChange?.({ ...compassLetters, north: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="compass-south">South (S)</Label>
                        <p className="text-xs text-muted-foreground">
                          Show "S" at the bottom
                        </p>
                      </div>
                      <Switch
                        id="compass-south"
                        checked={compassLetters.south}
                        onCheckedChange={(checked) => 
                          onCompassLettersChange?.({ ...compassLetters, south: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="compass-east">East (E)</Label>
                        <p className="text-xs text-muted-foreground">
                          Show "E" at the right
                        </p>
                      </div>
                      <Switch
                        id="compass-east"
                        checked={compassLetters.east}
                        onCheckedChange={(checked) => 
                          onCompassLettersChange?.({ ...compassLetters, east: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="compass-west">West (W)</Label>
                        <p className="text-xs text-muted-foreground">
                          Show "W" at the left
                        </p>
                      </div>
                      <Switch
                        id="compass-west"
                        checked={compassLetters.west}
                        onCheckedChange={(checked) => 
                          onCompassLettersChange?.({ ...compassLetters, west: checked })
                        }
                      />
                    </div>
                  </div>

                  {showReferencePoints && (compassLetters.north || compassLetters.south || compassLetters.east || compassLetters.west) && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Note:</strong> Compass letters will appear outside the reference lines when both are enabled. Export canvas will be automatically sized to include the letters.
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          )}

          {/* Slice Image Controls - Only show when map splitting is enabled */}
          {hasImage && splitCols * splitRows > 1 && (
            <div className="mt-4">
              <SliceImageControls
                selectedSliceIndex={selectedSliceIndex}
                sliceNames={sliceNames}
                sliceImageSettings={sliceImageSettings}
                globalImageZoom={globalImageZoom}
                globalPanOffset={globalPanOffset}
                onSliceImageSettingsChange={onSliceImageSettingsChange}
                onResetSliceSettings={onResetSliceSettings}
                onResetAllSliceSettings={onResetAllSliceSettings}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
