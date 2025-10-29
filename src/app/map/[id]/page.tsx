'use client';

import ImageWorkspace from '@/components/image-workspace';
import { Skeleton } from '@/components/ui/skeleton';
import FloatingInfoButton from '@/components/floating-info-button';
import AccessCodeModal from '@/components/access-code-modal';
import { use, useState, useEffect, useRef } from 'react';
import { notFound } from 'next/navigation';
import { Info, X } from 'lucide-react';
import type { ImageDimensions } from '@/components/image-workspace';

type GridMap = {
  id: string;
  name: string;
  imageSrc: string;
  imageFile?: any;
  imageDimensions?: { naturalWidth: number; naturalHeight: number };
  cellSize: number;
  unit: string;
  dpi: number;
  gridOffset: { x: number; y: number };
  gridColor: string;
  labelColor: string;
  backgroundColor: string;
  gridThickness: number;
  splitCols: number;
  splitRows: number;
  showScaleBar: boolean;
  panOffset: { x: number; y: number };
  sliceImageSettings?: {
    [sliceIndex: number]: {
      zoom: number;
      panOffset: { x: number; y: number };
    }
  };
  shared: boolean;
  accessCode?: string | null;
  showReferencePoints?: boolean;
  referenceColors?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  createdAt: string;
  updatedAt: string;
};
export default function SharedMapPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [mapData, setMapData] = useState<GridMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clickedCoords, setClickedCoords] = useState<{ col: string; row: number } | null>(null);
  const [selectedSliceIndex, setSelectedSliceIndex] = useState<number | null>(null);
  const [sliceNames, setSliceNames] = useState<string[]>([]);
  const [imageZoom, setImageZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [accessCodeError, setAccessCodeError] = useState<string>('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [showReferencePoints, setShowReferencePoints] = useState(false);
  const [referenceColors, setReferenceColors] = useState({
    top: '#ffffff',
    right: '#ff0000',
    bottom: '#000000',
    left: '#01b050'
  });
  const [showReferenceInfo, setShowReferenceInfo] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const fetchMap = async () => {
      try {
        const response = await fetch(`/api/grid-maps/${resolvedParams.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            return notFound();
          }
          throw new Error('Failed to fetch map');
        }

        const data = await response.json();
        
        // Check if map is shared (public access)
        if (!data.shared) {
          return notFound();
        }

        // Check if access code is required
        if (data.accessCode && !isAccessGranted) {
          setMapData(data);
          setShowAccessCodeModal(true);
          setIsLoading(false);
          return;
        }

        // Parse JSON fields from Prisma
        const parsedData = {
          ...data,
          imageDimensions: typeof data.imageDimensions === 'string' 
            ? JSON.parse(data.imageDimensions) 
            : data.imageDimensions,
          gridOffset: typeof data.gridOffset === 'string' 
            ? JSON.parse(data.gridOffset) 
            : data.gridOffset,
          panOffset: typeof data.panOffset === 'string' 
            ? JSON.parse(data.panOffset) 
            : data.panOffset,
          sliceNames: (() => {
            const parsed = typeof data.sliceNames === 'string' 
              ? JSON.parse(data.sliceNames) 
              : data.sliceNames;
            // Convert object to array if needed
            return Array.isArray(parsed) 
              ? parsed 
              : parsed && typeof parsed === 'object'
                ? Object.values(parsed)
                : [];
          })(),
          imageZoom: typeof data.imageZoom === 'string' 
            ? JSON.parse(data.imageZoom) 
            : data.imageZoom,
          referenceColors: typeof data.referenceColors === 'string' 
            ? JSON.parse(data.referenceColors) 
            : data.referenceColors,
          sliceImageSettings: typeof data.sliceImageSettings === 'string' 
            ? JSON.parse(data.sliceImageSettings) 
            : data.sliceImageSettings,
        };

        setMapData(parsedData);
        
        // Set initial state from loaded data
        setSliceNames(parsedData.sliceNames || []);
        // Use saved zoom and pan values to show map exactly as it was saved
        setImageZoom(parsedData.imageZoom || 1);
        setPanOffset(parsedData.panOffset || { x: 0, y: 0 });
        setShowReferencePoints(parsedData.showReferencePoints || false);
        setReferenceColors(parsedData.referenceColors || {
          top: '#ffffff',
          right: '#ff0000',
          bottom: '#000000',
          left: '#01b050'
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMap();
  }, [resolvedParams.id, isAccessGranted]);

  const handleAccessCodeSubmit = async (code: string) => {
    if (!mapData) return;
    
    setIsVerifyingCode(true);
    setAccessCodeError('');
    
    try {
      // Verify access code
      if (code === mapData.accessCode) {
        setIsAccessGranted(true);
        setShowAccessCodeModal(false);
        // Trigger re-fetch to load the full map data
      } else {
        setAccessCodeError('Invalid access code. Please try again.');
      }
    } catch (error) {
      setAccessCodeError('An error occurred. Please try again.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-[600px] w-[800px]" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !mapData) {
    return notFound();
  }

  return (
    <div className="flex flex-col h-dvh bg-background text-foreground overflow-hidden touch-manipulation">
       <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b shrink-0 z-10 bg-card/95 backdrop-blur-md shadow-sm">
        {/* Top row - Title */}
        <div className="flex items-center justify-between h-12 sm:h-16 px-3 sm:px-4 md:px-6 sm:flex-1 sm:min-w-0">
          <h1 className="text-sm sm:text-lg md:text-xl font-semibold text-foreground tracking-tight truncate">
              {mapData.name} <span className="hidden sm:inline">(Shared View)</span>
          </h1>
          {/* Mobile: Show only info button */}
          <div className="sm:hidden">
            {showReferencePoints && (
              <button 
                onClick={() => setShowReferenceInfo(true)}
                className="p-2 hover:bg-background/50 rounded-lg transition-colors bg-primary/10"
                title="Reference Lines Information"
              >
                <Info className="w-4 h-4 text-primary" />
              </button>
            )}
          </div>
        </div>
        
        {/* Bottom row on mobile, right side on desktop */}
        <div className="flex items-center justify-center gap-2 px-3 py-2 bg-muted/30 sm:bg-transparent sm:py-0 sm:px-4 md:px-6 sm:gap-2 md:gap-4">
          {/* Scale Bar */}
          {mapData.showScaleBar && (
            <div className="flex flex-col items-center bg-background/50 backdrop-blur-sm p-1 rounded text-xs">
              <span className="font-semibold text-foreground text-xs">{mapData.cellSize}{mapData.unit}</span>
              <div 
                className="h-1 border-l-2 border-r-2 border-b-2" 
                style={{
                  width: `${Math.min(mapData.cellSize, 40)}px`,
                  borderColor: mapData.labelColor
                }}
              />
            </div>
          )}
          
          {/* Reference Line Color Controls */}
          {showReferencePoints && referenceColors && (
            <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm p-2 rounded-lg shadow-md border border-border/50">
              {/* Mobile: Larger color dots with labels */}
              <div className="flex gap-2 sm:gap-1">
                <div className="flex flex-col items-center gap-1 sm:block">
                  <div className="w-4 h-4 sm:w-3 sm:h-3 rounded-full border-2 border-foreground/20 shadow-sm" style={{backgroundColor: referenceColors.top}} title="Top Side (White Side)"></div>
                  <span className="text-xs font-medium text-muted-foreground sm:hidden">T</span>
                </div>
                <div className="flex flex-col items-center gap-1 sm:block">
                  <div className="w-4 h-4 sm:w-3 sm:h-3 rounded-full border-2 border-foreground/20 shadow-sm" style={{backgroundColor: referenceColors.right}} title="Right Side (Red Side)"></div>
                  <span className="text-xs font-medium text-muted-foreground sm:hidden">R</span>
                </div>
                <div className="flex flex-col items-center gap-1 sm:block">
                  <div className="w-4 h-4 sm:w-3 sm:h-3 rounded-full border-2 border-foreground/20 shadow-sm" style={{backgroundColor: referenceColors.bottom}} title="Bottom Side (Black Side)"></div>
                  <span className="text-xs font-medium text-muted-foreground sm:hidden">B</span>
                </div>
                <div className="flex flex-col items-center gap-1 sm:block">
                  <div className="w-4 h-4 sm:w-3 sm:h-3 rounded-full border-2 border-foreground/20 shadow-sm" style={{backgroundColor: referenceColors.left}} title="Left Side (Green Side)"></div>
                  <span className="text-xs font-medium text-muted-foreground sm:hidden">L</span>
                </div>
              </div>
              
              {/* Desktop: Show info button */}
              <div className="hidden sm:block">
                <button 
                  onClick={() => setShowReferenceInfo(true)}
                  className="p-1 hover:bg-background/50 rounded transition-colors"
                  title="Reference Lines Information"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
       </header>
       <main className="flex-1 overflow-hidden" onClick={() => setClickedCoords(null)}>
        <ImageWorkspace
          imageSrc={mapData.imageSrc}
          imageRef={imageRef}
          imageDimensions={mapData.imageDimensions as ImageDimensions}
          onImageLoad={() => {}}
          cellSize={mapData.cellSize}
          unit={mapData.unit as 'px' | 'mm'}
          dpi={mapData.dpi}
          gridOffset={mapData.gridOffset}
          onHover={() => {}}
          hoveredCoords={null}
          clickedCoords={clickedCoords}
          onCellClick={setClickedCoords}
          gridColor={mapData.gridColor}
          labelColor={mapData.labelColor}
          backgroundColor={mapData.backgroundColor}
          gridThickness={mapData.gridThickness}
          splitCols={mapData.splitCols}
          splitRows={mapData.splitRows}
          showCenterCoords={true}
          showScaleBar={false}
          onGridCropChange={() => {}}
          sliceNames={sliceNames}
          setSliceNames={setSliceNames}
          selectedSliceIndex={selectedSliceIndex}
          setSelectedSliceIndex={setSelectedSliceIndex}
          isReadOnly={true}
          imageZoom={imageZoom}
          setImageZoom={setImageZoom}
          panOffset={panOffset}
          setPanOffset={setPanOffset}
          disablePanning={false}
          showReferencePoints={showReferencePoints}
          referenceColors={referenceColors}
          setReferenceColors={setReferenceColors}
          sliceImageSettings={mapData.sliceImageSettings}
        />
      </main>
      <FloatingInfoButton />
      
      {/* Access Code Modal */}
      <AccessCodeModal
        open={showAccessCodeModal}
        mapName={mapData?.name || 'Shared Map'}
        onSubmit={handleAccessCodeSubmit}
        error={accessCodeError}
        isLoading={isVerifyingCode}
      />
      
      {/* Reference Lines Info Modal */}
      {showReferenceInfo && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowReferenceInfo(false)}
        >
          <div 
            className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Reference Lines Guide</h2>
              <button 
                onClick={() => setShowReferenceInfo(false)}
                className="p-1 hover:bg-background/50 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Reference lines help identify different sides of a building or structure:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" 
                    style={{backgroundColor: referenceColors.top}}
                  />
                  <div>
                    <div className="font-medium text-sm">Top Side (White Side)</div>
                    <div className="text-xs text-muted-foreground">
                      Attack direction (usually the front of the building)
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" 
                    style={{backgroundColor: referenceColors.bottom}}
                  />
                  <div>
                    <div className="font-medium text-sm">Bottom Side (Black Side)</div>
                    <div className="text-xs text-muted-foreground">
                      Opposite side of the top side, usually the back of the building
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" 
                    style={{backgroundColor: referenceColors.right}}
                  />
                  <div>
                    <div className="font-medium text-sm">Right Side (Red Side)</div>
                    <div className="text-xs text-muted-foreground">
                      Side of the building to the right of the top side
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" 
                    style={{backgroundColor: referenceColors.left}}
                  />
                  <div>
                    <div className="font-medium text-sm">Left Side (Green Side)</div>
                    <div className="text-xs text-muted-foreground">
                      Side of the building to the left of the top side
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> These reference lines are typically used in emergency response 
                  and tactical planning to provide clear directional orientation around structures.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
