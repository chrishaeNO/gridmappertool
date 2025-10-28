
'use client';

import {useState, useCallback, useRef, useEffect} from 'react';
import Header from '@/components/layout/header';
import GridMapper from '@/components/grid-mapper';
import FloatingInfoButton from '@/components/floating-info-button';
import {analyzeImageBrightness} from '@/ai/flows/analyze-image-brightness';
import type {ImageDimensions} from '@/components/image-workspace';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { GridMapperProps } from '@/components/grid-mapper';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import LoginModal from '@/components/auth/login-modal';
import ShareModal from '@/components/share-modal';
import MobileBottomNav from '@/components/layout/mobile-bottom-nav';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import ControlPanel from "@/components/control-panel";

function HomeContent() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDimensions, setImageDimensions] =
    useState<ImageDimensions | null>(null);
  const [cellSize, setCellSize] = useState<number>(50.0);
  const [unit, setUnit] = useState<'px' | 'mm'>('px');
  const [dpi, setDpi] = useState<number>(96);
  const [gridOffset, setGridOffset] = useState<{x: number; y: number}>({
    x: 0,
    y: 0,
  });
  const [gridColor, setGridColor] = useState('#FFFFFF');
  const [labelColor, setLabelColor] = useState('#FFFFFF');
  const [backgroundColor, setBackgroundColor] = useState('#0f1729');
  const [gridThickness, setGridThickness] = useState<number>(1);
  const [splitCols, setSplitCols] = useState(1);
  const [splitRows, setSplitRows] = useState(1);
  const [sliceNames, setSliceNames] = useState<string[]>(['Slice 1']);
  const [showCenterCoords, setShowCenterCoords] = useState(false);
  const [showScaleBar, setShowScaleBar] = useState(true);
  const [isGridCropped, setIsGridCropped] = useState(false);
  const [selectedSliceIndex, setSelectedSliceIndex] = useState<number | null>(null);
  const [mapName, setMapName] = useState('My Grid Map');
  const [imageZoom, setImageZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [sliceImageSettings, setSliceImageSettings] = useState<{
    [sliceIndex: number]: {
      zoom: number;
      panOffset: { x: number; y: number };
    }
  }>({});
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [isMapSaved, setIsMapSaved] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReferencePoints, setShowReferencePoints] = useState(false);
  const [referenceColors, setReferenceColors] = useState({
    top: '#ffffff',    // White
    right: '#ff0000',  // Red
    bottom: '#000000', // Black
    left: '#01b050'    // Green (updated standard)
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Set the workerSrc for pdfjs-dist. This is crucial for it to work in a webpack environment.
    // We use a local copy of the worker script served from the public directory.
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }
  }, []);

  useEffect(() => {
    const totalSlices = splitCols * splitRows;
    setSliceNames(prev => {
      const newNames = [...prev];
      while (newNames.length < totalSlices) {
        newNames.push(`Slice ${newNames.length + 1}`);
      }
      return newNames.slice(0, totalSlices);
    });
  }, [splitCols, splitRows]);

  // Load existing map for editing
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || !user) return;

    const loadMapForEditing = async () => {
      try {
        const response = await fetch(`/api/grid-maps/${editId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          toast({
            variant: 'destructive',
            title: 'Map Not Found',
            description: 'The map you are trying to edit could not be found.',
          });
          return;
        }

        const mapData = await response.json();
        
        // Check if user owns this map
        if (mapData.userId !== user.id) {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You can only edit maps that you created.',
          });
          return;
        }

        // Parse JSON fields from Prisma if they are strings
        const parsedImageDimensions = typeof mapData.imageDimensions === 'string' 
          ? JSON.parse(mapData.imageDimensions) 
          : mapData.imageDimensions;
        const parsedGridOffset = typeof mapData.gridOffset === 'string' 
          ? JSON.parse(mapData.gridOffset) 
          : mapData.gridOffset;
        const parsedPanOffset = typeof mapData.panOffset === 'string' 
          ? JSON.parse(mapData.panOffset) 
          : mapData.panOffset;
        const parsedSliceNames = typeof mapData.sliceNames === 'string' 
          ? JSON.parse(mapData.sliceNames) 
          : mapData.sliceNames;
        const parsedReferenceColors = typeof mapData.referenceColors === 'string' 
          ? JSON.parse(mapData.referenceColors) 
          : mapData.referenceColors;
        const parsedSliceImageSettings = typeof mapData.sliceImageSettings === 'string' 
          ? JSON.parse(mapData.sliceImageSettings) 
          : mapData.sliceImageSettings;

        // Load map data into state
        setCurrentMapId(editId);
        setMapName(mapData.name || 'My Grid Map');
        setImageSrc(mapData.imageSrc || null);
        setImageDimensions(parsedImageDimensions || null);
        setCellSize(mapData.cellSize || 50);
        setUnit(mapData.unit || 'px');
        setDpi(mapData.dpi || 96);
        setGridOffset(parsedGridOffset || { x: 0, y: 0 });
        setGridColor(mapData.gridColor || '#000000');
        setLabelColor(mapData.labelColor || '#000000');
        setBackgroundColor(mapData.backgroundColor || '#ffffff');
        setGridThickness(mapData.gridThickness || 1);
        setSplitCols(mapData.splitCols || 1);
        setSplitRows(mapData.splitRows || 1);
        setSliceNames(parsedSliceNames || ['Slice 1']);
        setShowCenterCoords(mapData.showCenterCoords || false);
        setShowScaleBar(mapData.showScaleBar || true);
        setImageZoom(mapData.imageZoom || 1);
        setPanOffset(parsedPanOffset || { x: 0, y: 0 });
        setIsShared(mapData.shared || false);
        setAccessCode(mapData.accessCode || null);
        setShowReferencePoints(mapData.showReferencePoints || false);
        setReferenceColors(parsedReferenceColors || {
          top: '#ffffff',
          right: '#ff0000',
          bottom: '#000000',
          left: '#01b050'
        });
        setSliceImageSettings(parsedSliceImageSettings || {});
        setIsMapSaved(true);

        toast({
          title: 'Map Loaded',
          description: 'Your map has been loaded for editing.',
        });
      } catch (error) {
        console.error('Error loading map for editing:', error);
        toast({
          variant: 'destructive',
          title: 'Load Failed',
          description: 'Failed to load the map for editing.',
        });
      }
    };

    loadMapForEditing();
  }, [searchParams, user, toast]);

    useEffect(() => {
    // Reset pan and zoom when a new image is uploaded
    if (imageSrc) {
      setImageZoom(1);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [imageSrc]);

  // Simple brightness detection fallback function
  const detectImageBrightness = async (dataUrl: string): Promise<number> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(128); // Default to medium brightness
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let brightness = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          brightness += (r + g + b) / 3;
        }
        
        brightness = brightness / (data.length / 4);
        resolve(brightness);
      };
      img.src = dataUrl;
    });
  };

  const processImage = async (dataUrl: string) => {
      setImageSrc(dataUrl);
      if (isMobileSheetOpen) {
        setIsMobileSheetOpen(false);
      }
      
      toast({
        title: 'Analyzing Image...',
        description: 'Automatically adjusting colors for best contrast.',
      });
      try {
        const analysis = await analyzeImageBrightness({ photoDataUri: dataUrl });
        if (analysis?.brightness === 'dark') {
          setGridColor('#FFFFFF');
          setLabelColor('#FFFFFF');
          toast({
            title: 'Color Contrast Set',
            description: 'Grid colors adjusted for dark image.',
          });
        } else if (analysis?.brightness === 'light') {
          setGridColor('#000000');
          setLabelColor('#000000');
          toast({
            title: 'Color Contrast Set',
            description: 'Grid colors adjusted for light image.',
          });
        } else {
          // Fallback: Use simple brightness detection
          const brightness = await detectImageBrightness(dataUrl);
          if (brightness < 128) {
            setGridColor('#FFFFFF');
            setLabelColor('#FFFFFF');
          } else {
            setGridColor('#000000');
            setLabelColor('#000000');
          }
          toast({
            title: 'Color Contrast Set',
            description: 'Grid colors automatically adjusted.',
          });
        }
      } catch (error) {
        console.error('Error analyzing image brightness:', error);
        // Fallback: Use simple brightness detection
        try {
          const brightness = await detectImageBrightness(dataUrl);
          if (brightness < 128) {
            setGridColor('#FFFFFF');
            setLabelColor('#FFFFFF');
          } else {
            setGridColor('#000000');
            setLabelColor('#000000');
          }
          toast({
            title: 'Color Contrast Set',
            description: 'Grid colors automatically adjusted.',
          });
        } catch (fallbackError) {
          // Final fallback to default colors
          setGridColor('#000000');
          setLabelColor('#000000');
          toast({
            variant: 'destructive',
            title: 'Using Default Colors',
            description: 'Could not analyze image brightness.',
          });
        }
      }
  }

  // Functions for handling slice-specific image settings
  const getSliceImageSettings = (sliceIndex: number) => {
    return sliceImageSettings[sliceIndex] || {
      zoom: imageZoom,
      panOffset: { ...panOffset }
    };
  };

  const updateSliceImageSettings = (sliceIndex: number, settings: { zoom?: number; panOffset?: { x: number; y: number } }) => {
    setSliceImageSettings(prev => ({
      ...prev,
      [sliceIndex]: {
        zoom: settings.zoom ?? prev[sliceIndex]?.zoom ?? imageZoom,
        panOffset: settings.panOffset ?? prev[sliceIndex]?.panOffset ?? { ...panOffset }
      }
    }));
  };

  const resetSliceImageSettings = (sliceIndex: number) => {
    setSliceImageSettings(prev => {
      const newSettings = { ...prev };
      delete newSettings[sliceIndex];
      return newSettings;
    });
  };

  const resetAllSliceImageSettings = () => {
    setSliceImageSettings({});
  };

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();

    if (file.type.startsWith('image/')) {
        reader.onload = async e => {
            const result = e.target?.result as string;
            await processImage(result);
        };
        reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
        reader.onload = async e => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            try {
                
                // Check if pdfjs is properly loaded
                if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                    console.error('PDF.js worker not configured');
                    throw new Error('PDF.js worker not properly configured');
                }
                
                const loadingTask = pdfjsLib.getDocument({
                    data: arrayBuffer,
                });
                
                const pdf = await loadingTask.promise;
                
                const page = await pdf.getPage(1); // Get the first page
                
                const viewport = page.getViewport({ scale: 2.0 }); // Increase scale for better resolution
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (!context) {
                    throw new Error("Could not get canvas context");
                }

                await page.render({ canvasContext: context, viewport: viewport }).promise;
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                await processImage(dataUrl);

            } catch (error) {
                console.error("Detailed PDF processing error:", error);
                toast({
                    variant: 'destructive',
                    title: 'PDF Processing Failed',
                    description: error instanceof Error ? error.message : 'Could not render the PDF file.',
                });
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        toast({
            variant: 'destructive',
            title: 'Unsupported File Type',
            description: 'Please upload an image or a PDF file.',
        });
    }
  };

  const saveMap = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!imageSrc) {
      toast({
        variant: 'destructive',
        title: 'No Image',
        description: 'Please upload an image before saving.',
      });
      return;
    }

    try {
      const mapData = {
        name: mapName,
        imageSrc,
        ...(imageFile && {
          imageFile: {
            name: imageFile.name,
            size: imageFile.size,
            type: imageFile.type,
          },
        }),
        imageDimensions,
        cellSize,
        unit,
        dpi,
        gridOffset,
        gridColor,
        labelColor,
        backgroundColor,
        gridThickness,
        splitCols,
        splitRows,
        sliceNames,
        showCenterCoords,
        showScaleBar,
        imageZoom,
        panOffset,
        sliceImageSettings,
        shared: isShared,
        showReferencePoints,
        referenceColors,
      };

      if (currentMapId) {
        // Update existing map
        const response = await fetch(`/api/grid-maps/${currentMapId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(mapData),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Update failed - Status:', response.status);
          console.error('Update failed - Response:', errorData);
          throw new Error(`Failed to update map: ${response.status} - ${errorData}`);
        }

        toast({
          title: 'Map Updated',
          description: 'Your map has been successfully updated.',
        });
      } else {
        // Create new map
        const response = await fetch('/api/grid-maps', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(mapData),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Save failed - Status:', response.status);
          console.error('Save failed - Response:', errorData);
          throw new Error(`Failed to save map: ${response.status} - ${errorData}`);
        }

        const newMap = await response.json();
        setCurrentMapId(newMap.id);
        
        toast({
          title: 'Map Saved',
          description: 'Your map has been successfully saved.',
        });
      }
      
      setIsMapSaved(true);
    } catch (error) {
      console.error('Error saving map:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Failed to save your map. Please try again.',
      });
    }
  };

  const handleShare = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!isMapSaved) {
      // Save first, then share
      saveMap().then(() => {
        setShowShareModal(true);
      });
    } else {
      setShowShareModal(true);
    }
  };

  const handleNewMap = () => {
    // Clear URL parameters (remove edit parameter and map ID)
    router.push('/');
    
    // Reset all state to create a new map
    setImageSrc(null);
    setImageFile(null);
    setImageDimensions(null);
    setCellSize(50.0);
    setUnit('px');
    setDpi(96);
    setGridOffset({ x: 0, y: 0 });
    setGridColor('#FFFFFF');
    setLabelColor('#FFFFFF');
    setBackgroundColor('#0f1729');
    setGridThickness(1);
    setSplitCols(1);
    setSplitRows(1);
    setSliceNames(['Slice 1']);
    setShowCenterCoords(false);
    setShowScaleBar(true);
    setIsGridCropped(false);
    setSelectedSliceIndex(null);
    setMapName('My Grid Map');
    setImageZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setCurrentMapId(null);
    setIsMapSaved(false);
    setIsShared(false);
    setAccessCode(null);
    setShowReferencePoints(false);
    setReferenceColors({
      top: '#ffffff',
      right: '#ff0000',
      bottom: '#000000',
      left: '#01b050'
    });
    
    toast({
      title: 'New Map Created',
      description: 'Ready to upload a new image and create your grid map.',
    });
  };

  const handleToggleShare = async (shared: boolean, accessCode?: string | null) => {
    if (!currentMapId || !user) return;

    try {
      const response = await fetch(`/api/grid-maps/${currentMapId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: mapName,
          imageSrc,
          ...(imageFile && {
            imageFile: {
              name: imageFile.name,
              size: imageFile.size,
              type: imageFile.type,
            },
          }),
          imageDimensions,
          cellSize,
          unit,
          dpi,
          gridOffset,
          gridColor,
          labelColor,
          backgroundColor,
          gridThickness,
          splitCols,
          splitRows,
          sliceNames,
          showCenterCoords,
          showScaleBar,
          imageZoom,
          panOffset,
          shared,
          accessCode,
          showReferencePoints,
          referenceColors,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update map sharing');
      }
      
      setIsShared(shared);
      setAccessCode(accessCode || null);
      
      toast({
        title: isShared ? 'Map Made Private' : 'Map Made Public',
        description: isShared 
          ? 'Your map is now private and can only be accessed by you.'
          : 'Your map is now public and can be accessed by anyone with the link.',
      });
    } catch (error) {
      console.error('Error updating map sharing:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Failed to update map sharing settings.',
      });
    }
  };

  const handleExport = useCallback(async () => {
    if (!imageSrc || !imageDimensions) return;
    
    toast({
      title: 'Exporting Slices...',
      description: 'Generating and compressing your map slices.',
    });

    const zip = new JSZip();
    const EXPORT_DPI = 300;
    const scale = EXPORT_DPI / dpi;
    const { naturalWidth, naturalHeight } = imageDimensions;

    const cellSizePx = unit === 'px' ? cellSize : (cellSize / 25.4) * dpi;
    
    const exportLabelSize = Math.min(25, cellSizePx * 0.4) * scale;


    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const imageLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not load the image for export.'));
    });

    img.src = imageSrc;

    try {
      await imageLoadPromise;

      for (let row = 0; row < splitRows; row++) {
        for (let col = 0; col < splitCols; col++) {
          const sliceIndex = row * splitCols + col;
          const sliceName = sliceNames[sliceIndex] || `slice-${row}-${col}`;
          
          const sliceWidth = naturalWidth / splitCols;
          const sliceHeight = naturalHeight / splitRows;
          const scaledSliceWidth = sliceWidth * scale;
          const scaledSliceHeight = sliceHeight * scale;

          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) continue;
          
          // Calculate extra space needed for reference lines
          let extraWidth = 0;
          let extraHeight = 0;
          let linePadding = 0;
          
          if (showReferencePoints) {
            linePadding = 15 * scale; // Nøyaktig 15px som på skjermen
            const lineThickness = 8 * scale; // Nøyaktig 8px som på skjermen
            extraWidth = linePadding + lineThickness; // Kun høyre margin
            extraHeight = linePadding + lineThickness; // Kun bunn margin
          }
          
          tempCanvas.width = scaledSliceWidth + exportLabelSize + extraWidth;
          tempCanvas.height = scaledSliceHeight + exportLabelSize + extraHeight;
          
          tempCtx.fillStyle = backgroundColor;
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          
          // Get slice-specific settings or use global settings
          const sliceSettings = sliceImageSettings[sliceIndex];
          const effectiveZoom = sliceSettings?.zoom ?? imageZoom;
          const effectivePanOffset = sliceSettings?.panOffset ?? panOffset;
          
          const sliceX = col * sliceWidth;
          const sliceY = row * sliceHeight;

          // Offset image position to account for reference line margins
          const imageOffsetX = exportLabelSize + (showReferencePoints ? linePadding : 0);
          const imageOffsetY = exportLabelSize + (showReferencePoints ? linePadding : 0);
          
          // For slice-specific settings, we need to draw the image differently
          if (sliceSettings && (sliceSettings.zoom !== imageZoom || 
              sliceSettings.panOffset?.x !== panOffset.x || 
              sliceSettings.panOffset?.y !== panOffset.y)) {
            
            // Set up clipping for this slice area
            tempCtx.save();
            tempCtx.beginPath();
            tempCtx.rect(imageOffsetX, imageOffsetY, scaledSliceWidth, scaledSliceHeight);
            tempCtx.clip();
            
            // Calculate what part of the original image to show based on slice settings
            // This mimics the CSS background-position behavior
            const scaledImageWidth = naturalWidth * effectiveZoom;
            const scaledImageHeight = naturalHeight * effectiveZoom;
            
            // Calculate the position offset
            const backgroundPosX = -((sliceX * effectiveZoom) - effectivePanOffset.x);
            const backgroundPosY = -((sliceY * effectiveZoom) - effectivePanOffset.y);
            
            // Draw the full scaled image at the calculated position
            tempCtx.drawImage(
                img,
                0, 0, naturalWidth, naturalHeight,
                imageOffsetX + (backgroundPosX * scale), imageOffsetY + (backgroundPosY * scale),
                scaledImageWidth * scale, scaledImageHeight * scale
            );
            
            tempCtx.restore();
          } else {
            // Standard slice drawing without custom settings
            tempCtx.drawImage(
                img,
                sliceX, sliceY, sliceWidth, sliceHeight,
                imageOffsetX, imageOffsetY, scaledSliceWidth, scaledSliceHeight
            );
          }
          
          const scaledGridOffsetX = gridOffset.x * scale;
          const scaledGridOffsetY = gridOffset.y * scale;
          const scaledCellSize = cellSizePx * scale;

          const gridStartXOnSlice = scaledGridOffsetX - (sliceX * scale);
          const gridStartYOnSlice = scaledGridOffsetY - (sliceY * scale);

          const firstColOffset = gridStartXOnSlice < 0 ? (Math.ceil(Math.abs(gridStartXOnSlice) / scaledCellSize) * scaledCellSize) + gridStartXOnSlice : gridStartXOnSlice % scaledCellSize;
          const firstRowOffset = gridStartYOnSlice < 0 ? (Math.ceil(Math.abs(gridStartYOnSlice) / scaledCellSize) * scaledCellSize) + gridStartYOnSlice : gridStartYOnSlice % scaledCellSize;

          // Beregn startindeks for koordinater basert på slice-posisjon og grid-offset
          // Dette sikrer at hver slice har unike, kontinuerlige koordinater (samme logikk som i image-grid-display)
          const totalColsFromStart = Math.floor((sliceX - gridOffset.x + (firstColOffset / scale)) / cellSizePx);
          const totalRowsFromStart = Math.floor((sliceY - gridOffset.y + (firstRowOffset / scale)) / cellSizePx);

          const startColIndex = Math.max(0, totalColsFromStart);
          const startRowIndex = Math.max(0, totalRowsFromStart);
          
          const numColsToDraw = Math.ceil((scaledSliceWidth - firstColOffset + 1e-9) / scaledCellSize);
          const numRowsToDraw = Math.ceil((scaledSliceHeight - firstRowOffset + 1e-9) / scaledCellSize);
          
          tempCtx.save();
          tempCtx.beginPath();
          tempCtx.rect(imageOffsetX, imageOffsetY, scaledSliceWidth, scaledSliceHeight);
          tempCtx.clip();
          
          tempCtx.translate(imageOffsetX, imageOffsetY);

          tempCtx.strokeStyle = gridColor;
          tempCtx.lineWidth = gridThickness * scale;
          
          for (let i = 0; i < numColsToDraw; i++) {
              const x = firstColOffset + i * scaledCellSize;
              if (x >= 0 && x <= scaledSliceWidth) {
                  tempCtx.beginPath();
                  tempCtx.moveTo(x, 0);
                  tempCtx.lineTo(x, scaledSliceHeight);
                  tempCtx.stroke();
              }
          }
          for (let i = 0; i < numRowsToDraw; i++) {
              const y = firstRowOffset + i * scaledCellSize;
               if (y >= 0 && y <= scaledSliceHeight) {
                  tempCtx.beginPath();
                  tempCtx.moveTo(0, y);
                  tempCtx.lineTo(scaledSliceWidth, y);
                  tempCtx.stroke();
              }
          }
          tempCtx.restore();

          if (exportLabelSize > 0) {
            tempCtx.fillStyle = labelColor;
            const labelFontSize = Math.min(12 * scale, scaledCellSize * 0.3);
            tempCtx.font = `${labelFontSize}px sans-serif`;
            tempCtx.textAlign = 'center';
            tempCtx.textBaseline = 'middle';

            for (let i = 0; i <= numColsToDraw; i++) {
                const xOnSlice = firstColOffset + i * scaledCellSize;
                
                if (xOnSlice >= -scaledCellSize && xOnSlice <= scaledSliceWidth) {
                    const char = String.fromCharCode(65 + startColIndex + i);
                    // Sentrert over cellen - midt i cellen
                    tempCtx.fillText(char, imageOffsetX + xOnSlice + scaledCellSize / 2, (showReferencePoints ? linePadding : 0) + exportLabelSize / 2);
                }
            }
            
            for (let i = 0; i <= numRowsToDraw; i++) {
                const yOnSlice = firstRowOffset + i * scaledCellSize;
                
                if (yOnSlice >= -scaledCellSize && yOnSlice <= scaledSliceHeight) {
                    const numLabel = startRowIndex + i + 1;
                    // Sentrert i forhold til cellen - midt i cellen
                    tempCtx.fillText(numLabel.toString(), (showReferencePoints ? linePadding : 0) + exportLabelSize / 2, imageOffsetY + yOnSlice + scaledCellSize / 2);
                }
            }
          }
          
          // Add reference lines if enabled - INNENFOR canvas
          if (showReferencePoints) {
            const lineThickness = 8 * scale; // Fast tykkelse som på skjermen
            const sliceContentWidth = scaledSliceWidth + exportLabelSize; // 520px på skjermen
            const sliceContentHeight = scaledSliceHeight + exportLabelSize; // 520px på skjermen
            
            // Top line: OVER labels
            tempCtx.fillStyle = referenceColors.top;
            tempCtx.fillRect(exportLabelSize, 0, scaledSliceWidth, lineThickness);
            
            // Right line: TIL HØYRE for slice-innholdet
            tempCtx.fillStyle = referenceColors.right;
            tempCtx.fillRect(exportLabelSize + scaledSliceWidth + linePadding, exportLabelSize, lineThickness, scaledSliceHeight);
            
            // Bottom line: UNDER slice-innholdet
            tempCtx.fillStyle = referenceColors.bottom;
            tempCtx.fillRect(exportLabelSize, exportLabelSize + scaledSliceHeight + linePadding, scaledSliceWidth, lineThickness);
            
            // Left line: TIL VENSTRE for labels
            tempCtx.fillStyle = referenceColors.left;
            tempCtx.fillRect(0, exportLabelSize, lineThickness, scaledSliceHeight);
          }
          
          const blob = await new Promise<Blob | null>(resolve => tempCanvas.toBlob(resolve, 'image/jpeg', 0.9));
          if (blob) {
            zip.file(`${sliceName}.jpg`, blob);
          }
        }
      }

      const zipBlob = await zip.generateAsync({type:"blob"});
      const sanitizedMapName = mapName.replace(/[^a-zA-Z0-9\-_]/g, '_');
      saveAs(zipBlob, `${sanitizedMapName}_gridmapped.zip`);

      toast({
          title: 'Export Successful',
          description: `Your gridded slices have been downloaded as "${sanitizedMapName}_gridmapped.zip".`,
      });
    } catch(err) {
        console.error(err);
        toast({
            variant: 'destructive',
            title: 'Export Failed',
            description: err instanceof Error ? err.message : 'An unknown error occurred during export.',
        });
    }
  }, [
    imageSrc,
    imageDimensions,
    cellSize,
    unit,
    dpi,
    gridOffset,
    toast,
    gridColor,
    labelColor,
    backgroundColor,
    gridThickness,
    splitCols,
    splitRows,
    sliceNames,
    showReferencePoints,
    referenceColors,
    mapName
  ]);

  const gridMapperProps: Omit<GridMapperProps, 'imageSrc' | 'imageDimensions' | 'onImageUpload' | 'onImageLoad' | 'gridOffset'> = {
    cellSize, setCellSize, unit, setUnit, dpi, setDpi, gridColor, setGridColor, labelColor, setLabelColor, backgroundColor, setBackgroundColor, gridThickness, setGridThickness, splitCols, setSplitCols, splitRows, setSplitRows, sliceNames, setSliceNames, showCenterCoords, setShowCenterCoords, showScaleBar, setShowScaleBar, isGridCropped, onGridCropChange: setIsGridCropped, selectedSliceIndex, setSelectedSliceIndex, mapName, setMapName, imageZoom, setImageZoom, panOffset, setPanOffset, sliceImageSettings, onSliceImageSettingsChange: updateSliceImageSettings, onResetSliceSettings: resetSliceImageSettings, onResetAllSliceSettings: resetAllSliceImageSettings
  };

  return (
    <div className="flex flex-col h-dvh bg-background text-foreground">
      <Header
        onExport={handleExport}
        onShare={handleShare}
        onSave={saveMap}
        onNewMap={handleNewMap}
        hasImage={!!imageSrc}
        onImageUpload={handleImageUpload}
        gridMapperProps={gridMapperProps}
        isMobileSheetOpen={isMobileSheetOpen}
        setMobileSheetOpen={setIsMobileSheetOpen}
        onMobileControlsToggle={() => setIsMobileSheetOpen(true)}
        showReferencePoints={showReferencePoints}
        onToggleReferencePoints={setShowReferencePoints}
      />
      <main className="flex-1 overflow-hidden mobile-bottom-spacing md:pb-0">
        <GridMapper
          imageSrc={imageSrc}
          imageDimensions={imageDimensions}
          onImageUpload={handleImageUpload}
          onImageLoad={setImageDimensions}
          gridOffset={gridOffset}
          showReferencePoints={showReferencePoints}
          referenceColors={referenceColors}
          setReferenceColors={setReferenceColors}
          {...gridMapperProps}
        />
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        onControlsToggle={() => setIsMobileSheetOpen(true)}
        onSave={saveMap}
        onShare={handleShare}
        onNewMap={handleNewMap}
        hasImage={!!imageSrc}
        isEditorPage={true}
      />
      
      {/* Mobile Controls Sheet */}
      <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
        <SheetContent side="left" className="p-0 w-full max-w-sm flex flex-col h-full">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Controls</SheetTitle>
            <SheetDescription>
              Adjust your image and grid settings here.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <ControlPanel
            onImageUpload={handleImageUpload}
            hasImage={!!imageSrc}
            showReferencePoints={showReferencePoints}
            referenceColors={referenceColors}
            setReferenceColors={setReferenceColors}
            {...gridMapperProps}
            setSliceNames={(index: number, newName: string) => {
              const newSliceNames = [...sliceNames];
              newSliceNames[index] = newName;
              setSliceNames(newSliceNames);
            }}
          />
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSuccess={() => {
          setShowLoginModal(false);
          // After login, try to save the map again
          if (!isMapSaved) {
            saveMap();
          }
        }}
        title="Sign In to Save Your Map"
        description="Please sign in to save and share your maps. Your work will be preserved."
      />
      
      {/* Share Modal */}
      {currentMapId && (
        <ShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          mapId={currentMapId}
          mapName={mapName}
          isShared={isShared}
          accessCode={accessCode}
          onToggleShare={handleToggleShare}
        />
      )}
      <FloatingInfoButton />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

    
