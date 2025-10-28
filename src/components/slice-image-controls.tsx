'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

interface SliceImageControlsProps {
  selectedSliceIndex: number | null;
  sliceNames: string[];
  sliceImageSettings?: {
    [sliceIndex: number]: {
      zoom: number;
      panOffset: { x: number; y: number };
    }
  };
  globalImageZoom: number;
  globalPanOffset: { x: number; y: number };
  onSliceImageSettingsChange?: (sliceIndex: number, settings: { zoom?: number; panOffset?: { x: number; y: number } }) => void;
  onResetSliceSettings?: (sliceIndex: number) => void;
  onResetAllSliceSettings?: () => void;
}

export default function SliceImageControls({
  selectedSliceIndex,
  sliceNames,
  sliceImageSettings,
  globalImageZoom,
  globalPanOffset,
  onSliceImageSettingsChange,
  onResetSliceSettings,
  onResetAllSliceSettings,
}: SliceImageControlsProps) {
  
  // Detect if user is on Mac for showing correct key
  const isMac = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Mac|iPod|iPhone|iPad/.test(navigator.userAgent) || 
           (navigator.platform && navigator.platform.includes('Mac'));
  }, []);

  const modifierKey = isMac ? '⌥ Option' : 'Alt';
  
  if (selectedSliceIndex === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Move className="w-4 h-4" />
            Background Image Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a slice to adjust its background image position and zoom individually.
          </p>
          {Object.keys(sliceImageSettings || {}).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetAllSliceSettings}
              className="mt-3 w-full"
            >
              <RotateCcw className="w-3 h-3 mr-2" />
              Reset All Slice Settings
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const sliceName = sliceNames[selectedSliceIndex] || `Slice ${selectedSliceIndex + 1}`;
  const currentSettings = sliceImageSettings?.[selectedSliceIndex];
  const effectiveZoom = currentSettings?.zoom ?? globalImageZoom;
  const effectivePanOffset = currentSettings?.panOffset ?? globalPanOffset;

  const handleZoomChange = (value: number[]) => {
    if (onSliceImageSettingsChange) {
      onSliceImageSettingsChange(selectedSliceIndex, { zoom: value[0] });
    }
  };

  const handlePanChange = (axis: 'x' | 'y', value: number[]) => {
    if (onSliceImageSettingsChange) {
      const newPanOffset = { ...effectivePanOffset };
      newPanOffset[axis] = value[0];
      onSliceImageSettingsChange(selectedSliceIndex, { panOffset: newPanOffset });
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(effectiveZoom * 1.2, 5);
    if (onSliceImageSettingsChange) {
      onSliceImageSettingsChange(selectedSliceIndex, { zoom: newZoom });
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(effectiveZoom / 1.2, 0.1);
    if (onSliceImageSettingsChange) {
      onSliceImageSettingsChange(selectedSliceIndex, { zoom: newZoom });
    }
  };

  const handleReset = () => {
    if (onResetSliceSettings) {
      onResetSliceSettings(selectedSliceIndex);
    }
  };

  const isCustomized = currentSettings !== undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Move className="w-4 h-4" />
          Background: {sliceName}
        </CardTitle>
        {isCustomized && (
          <p className="text-xs text-blue-600 font-medium">
            ✨ Custom settings applied
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zoom Controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Zoom</Label>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                className="h-6 w-6 p-0"
              >
                <ZoomOut className="w-3 h-3" />
              </Button>
              <span className="text-xs font-mono min-w-[3rem] text-center">
                {(effectiveZoom * 100).toFixed(0)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                className="h-6 w-6 p-0"
              >
                <ZoomIn className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <Slider
            value={[effectiveZoom]}
            onValueChange={handleZoomChange}
            min={0.1}
            max={5}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Pan Controls */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Horizontal Position</Label>
            <Slider
              value={[effectivePanOffset.x]}
              onValueChange={(value) => handlePanChange('x', value)}
              min={-1000}
              max={1000}
              step={10}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground text-center">
              {effectivePanOffset.x}px
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Vertical Position</Label>
            <Slider
              value={[effectivePanOffset.y]}
              onValueChange={(value) => handlePanChange('y', value)}
              min={-1000}
              max={1000}
              step={10}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground text-center">
              {effectivePanOffset.y}px
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="w-full"
          disabled={!isCustomized}
        >
          <RotateCcw className="w-3 h-3 mr-2" />
          Reset to Global Settings
        </Button>

        {/* Info */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <p className="font-medium mb-1">💡 Tips:</p>
          <p className="mb-1">• Use sliders to adjust zoom and position</p>
          <p className="mb-1">• Hold <kbd className="px-1 py-0.5 bg-background rounded text-xs font-mono">{modifierKey}</kbd> + drag directly on the slice to move the background</p>
          <p>• Changes only affect this slice</p>
        </div>
      </CardContent>
    </Card>
  );
}
