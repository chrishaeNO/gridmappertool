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
import {UploadCloud, Palette, Grid, Eye, AlertTriangle, CheckCircle2, FileText, Map, Loader2} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import type {Dispatch, SetStateAction} from 'react';
import { cn } from "@/lib/utils";
import SliceImageControls from './slice-image-controls';

type ControlPanelProps = {
  onImageUpload: (file: File) => void;
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
  sliceImageSettings?: {
    [sliceIndex: number]: {
      zoom: number;
      panOffset: { x: number; y: number };
    }
  };
  globalImageZoom?: number;
  globalPanOffset?: { x: number; y: number };
  onSliceImageSettingsChange?: (sliceIndex: number, settings: { zoom?: number; panOffset?: { x: number; y: number } }) => void;
  onResetSliceSettings?: (sliceIndex: number) => void;
  onResetAllSliceSettings?: () => void;
};

export default function ControlPanel({
  onImageUpload,
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
  referenceColors,
  setReferenceColors,
  sliceImageSettings,
  globalImageZoom = 1,
  globalPanOffset = { x: 0, y: 0 },
  onSliceImageSettingsChange,
  onResetSliceSettings,
  onResetAllSliceSettings,
}: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { isDragOver, isCompressing, dragProps, processFile } = useDragDrop({
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
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold tracking-tight">Controls</h2>
            <p className="text-sm text-muted-foreground">
              Adjust your image and grid settings.
            </p>
          </div>
          <Separator className="hidden md:block" />
          
          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center">
              <UploadCloud className="mr-2 h-4 w-4" />
              Image
            </h3>
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
                  hasImage ? 'Change Image' : 'Upload Image or PDF'
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
          </div>

          {/* Settings */}
          {hasImage && (
            <Accordion type="single" collapsible className="w-full">
              
              {/* Map Splitting */}
              <AccordionItem value="map-splitting">
                <AccordionTrigger className="font-semibold py-2">
                  <div className="flex items-center">
                    <Grid className="mr-2 h-4 w-4" />
                    Map Splitting
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

              {/* Grid Settings */}
              <AccordionItem value="grid-settings">
                <AccordionTrigger className="font-semibold py-2">
                  <div className="flex items-center">
                    <Grid className="mr-2 h-4 w-4" />
                    Grid Settings
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

              {/* Display Settings */}
              <AccordionItem value="display-settings">
                <AccordionTrigger className="font-semibold py-2">
                  <div className="flex items-center">
                    <Eye className="mr-2 h-4 w-4" />
                    Display
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

              {/* Color Settings */}
              <AccordionItem value="color-settings" disabled={!hasImage}>
                <AccordionTrigger className="font-semibold py-2">
                  <div className="flex items-center">
                    <Palette className="mr-2 h-4 w-4" />
                    Color Settings
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

              {/* Reference Points Section */}
              {showReferencePoints && referenceColors && setReferenceColors && (
                <AccordionItem value="reference-points">
                  <AccordionTrigger className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-primary/10">
                        <Palette className="h-4 w-4 text-primary" />
                      </div>
                      Reference Points Colors
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ref-top-color">Top</Label>
                        <Input
                          id="ref-top-color"
                          type="color"
                          value={referenceColors.top}
                          onChange={e => setReferenceColors(prev => ({ ...prev, top: e.target.value }))}
                          className="p-1 h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ref-right-color">Right</Label>
                        <Input
                          id="ref-right-color"
                          type="color"
                          value={referenceColors.right}
                          onChange={e => setReferenceColors(prev => ({ ...prev, right: e.target.value }))}
                          className="p-1 h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ref-bottom-color">Bottom</Label>
                        <Input
                          id="ref-bottom-color"
                          type="color"
                          value={referenceColors.bottom}
                          onChange={e => setReferenceColors(prev => ({ ...prev, bottom: e.target.value }))}
                          className="p-1 h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ref-left-color">Left</Label>
                        <Input
                          id="ref-left-color"
                          type="color"
                          value={referenceColors.left}
                          onChange={e => setReferenceColors(prev => ({ ...prev, left: e.target.value }))}
                          className="p-1 h-10"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

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
