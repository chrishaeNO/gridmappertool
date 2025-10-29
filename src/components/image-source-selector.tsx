'use client';

import React, { useState } from 'react';
import { UploadCloud, Map, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MapboxSelector from './mapbox-selector';
import { cn } from '@/lib/utils';
import { useDragDrop } from '@/hooks/use-drag-drop';

interface ImageSourceSelectorProps {
  onImageUpload: (file: File) => void;
  onMapboxImageSelect: (imageData: string, dimensions: { naturalWidth: number; naturalHeight: number }) => void;
}

type SourceType = 'selection' | 'upload' | 'mapbox';

export default function ImageSourceSelector({ onImageUpload, onMapboxImageSelect }: ImageSourceSelectorProps) {
  const [currentView, setCurrentView] = useState<SourceType>('selection');
  
  const { dragProps, isDragOver } = useDragDrop({
    onFileUpload: (file: File) => {
      onImageUpload(file);
    },
    acceptedTypes: ['image/*', 'application/pdf']
  });

  if (currentView === 'mapbox') {
    return (
      <div className="w-full h-full">
        <MapboxSelector
          onImageSelect={onMapboxImageSelect}
          onClose={() => setCurrentView('selection')}
        />
      </div>
    );
  }

  if (currentView === 'upload') {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="w-full max-w-2xl">
          {/* Back button */}
          <div className="mb-6">
            <Button 
              onClick={() => setCurrentView('selection')} 
              variant="ghost" 
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Options
            </Button>
          </div>

          {/* Upload area */}
          <div 
            {...dragProps}
            className={cn(
              "text-center text-muted-foreground p-12 border-2 border-dashed rounded-xl transition-colors relative",
              isDragOver 
                ? "border-primary bg-primary/5 border-solid" 
                : "border-muted-foreground/30",
              "cursor-pointer hover:border-muted-foreground/50"
            )}
          >
            <UploadCloud className={cn("mx-auto h-16 w-16 mb-6", isDragOver && "text-primary")} />
            <h3 className={cn("text-2xl font-medium mb-4", isDragOver && "text-primary")}>
              {isDragOver ? "Drop your file here" : "Upload an Image or PDF"}
            </h3>
            <p className={cn("text-base mb-6", isDragOver && "text-primary")}>
              {isDragOver 
                ? "Release to upload your image or PDF" 
                : "Drag and drop an image or PDF file here, or click the button below to browse. Large images will be compressed automatically."
              }
            </p>
            
            {!isDragOver && (
              <Button 
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*,.pdf';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      onImageUpload(file);
                    }
                  };
                  input.click();
                }}
                size="lg"
                className="mt-4"
              >
                <UploadCloud className="h-5 w-5 mr-2" />
                Choose File
              </Button>
            )}

            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl border-2 border-primary border-dashed">
                <div className="text-center">
                  <UploadCloud className="mx-auto h-20 w-20 text-primary mb-4" />
                  <p className="text-xl font-medium text-primary">Drop file here to upload</p>
                </div>
              </div>
            )}
          </div>

          {/* Supported formats */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Supported formats: JPG, PNG, GIF, BMP, WebP, SVG, PDF
            </p>
          </div>
        </div>

        {/* Full-screen drag overlay */}
        {isDragOver && (
          <div className="fixed inset-0 bg-primary/10 border-4 border-primary border-dashed flex items-center justify-center z-50 pointer-events-none">
            <div className="text-center">
              <UploadCloud className="mx-auto h-32 w-32 text-primary mb-6" />
              <h2 className="text-3xl font-bold text-primary mb-4">Drop your file anywhere</h2>
              <p className="text-xl text-primary">Release to upload your image or PDF</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Selection view
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Choose Your Image Source</h2>
          <p className="text-lg text-muted-foreground">
            Start by uploading your own image or selecting an area from satellite imagery
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Option */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50"
            onClick={() => setCurrentView('upload')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <UploadCloud className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Upload Image or PDF</CardTitle>
              <CardDescription className="text-base">
                Upload your own image file or PDF document to create grids and measurements
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Support for JPG, PNG, GIF, BMP, WebP, SVG, PDF</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Automatic compression for large files</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Drag and drop support</span>
                </div>
              </div>
              <Button className="w-full mt-6" variant="outline">
                Choose Upload
              </Button>
            </CardContent>
          </Card>

          {/* Mapbox Option */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50"
            onClick={() => setCurrentView('mapbox')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Map className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Satellite Imagery</CardTitle>
              <CardDescription className="text-base">
                Select any area from high-resolution satellite maps from around the world
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>High-resolution satellite imagery</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Global coverage</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Perfect for outdoor events and operations</span>
                </div>
              </div>
              <Button className="w-full mt-6" variant="outline">
                Select from Map
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Both options support the same grid functionality, labels, and reference lines
          </p>
        </div>
      </div>
    </div>
  );
}
