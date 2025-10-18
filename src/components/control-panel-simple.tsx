'use client';

import React, {useRef, useEffect} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {UploadCloud, Palette, Grid, Eye, AlertTriangle, CheckCircle2, FileText, Map} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import type {Dispatch, SetStateAction} from 'react';
import { cn } from "@/lib/utils";

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
}: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
    <div className="h-full w-full overflow-auto">
      <div className="p-4 flex flex-col h-full">
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
            <Button
              onClick={handleUploadClick}
              className="w-full"
              variant="outline"
            >
              {hasImage ? 'Change Image' : 'Upload Image or PDF'}
            </Button>
          </div>

          {/* Basic Settings */}
          {hasImage && (
            <Accordion type="single" collapsible className="w-full">
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
                      <Label htmlFor="cell-size">Cell Size</Label>
                      <Input
                        id="cell-size"
                        type="number"
                        value={cellSize}
                        onChange={e => setCellSize(Number(e.target.value))}
                        min="1"
                        max="500"
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}
