'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sliceNames: string[];
  splitCols: number;
  splitRows: number;
  onExport: (selectedSlices: boolean[]) => void;
}

export default function ExportDialog({
  open,
  onOpenChange,
  sliceNames,
  splitCols,
  splitRows,
  onExport,
}: ExportDialogProps) {
  const [selectedSlices, setSelectedSlices] = useState<boolean[]>([]);

  // Initialize selectedSlices when dialog opens or slice count changes
  useEffect(() => {
    if (open && sliceNames.length > 0) {
      setSelectedSlices(new Array(sliceNames.length).fill(true));
    }
  }, [open, sliceNames.length]);

  const handleSelectAll = () => {
    setSelectedSlices(new Array(sliceNames.length).fill(true));
  };

  const handleSelectNone = () => {
    setSelectedSlices(new Array(sliceNames.length).fill(false));
  };

  const handleSliceToggle = (index: number, checked: boolean) => {
    const newSelected = [...selectedSlices];
    newSelected[index] = checked;
    setSelectedSlices(newSelected);
  };

  const selectedCount = selectedSlices.filter(Boolean).length;
  const totalSlices = sliceNames.length;

  const handleExport = () => {
    if (selectedCount === 0) return;
    onExport(selectedSlices);
    onOpenChange(false);
  };

  // For single slice (no splitting), export directly
  if (splitCols === 1 && splitRows === 1) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Map
            </DialogTitle>
            <DialogDescription>
              Export your map as a high-resolution image file.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleExport()}>
              Export Map
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Slices
          </DialogTitle>
          <DialogDescription>
            Select which slices to export. Each slice will be saved as a separate high-resolution image.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Select Slices ({selectedCount} of {totalSlices})
            </Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="h-8 px-3 text-xs"
              >
                All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectNone}
                className="h-8 px-3 text-xs"
              >
                None
              </Button>
            </div>
          </div>
          
          <div 
            className="grid gap-3 max-h-60 overflow-y-auto" 
            style={{ gridTemplateColumns: `repeat(${Math.min(splitCols, 3)}, 1fr)` }}
          >
            {sliceNames.map((name, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`export-slice-${index}`}
                  checked={selectedSlices[index] || false}
                  onCheckedChange={(checked) => handleSliceToggle(index, checked === true)}
                />
                <Label 
                  htmlFor={`export-slice-${index}`}
                  className="text-sm cursor-pointer truncate"
                  title={name}
                >
                  {name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={selectedCount === 0}
          >
            Export {selectedCount > 0 ? `${selectedCount} Slice${selectedCount > 1 ? 's' : ''}` : 'Slices'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
