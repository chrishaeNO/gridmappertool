'use client';

import ImageWorkspace from '@/components/image-workspace';
import { Skeleton } from '@/components/ui/skeleton';
import Footer from '@/components/layout/footer';
import AccessCodeModal from '@/components/access-code-modal';
import { use, useState, useEffect, useRef } from 'react';
import { notFound } from 'next/navigation';
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
  shared: boolean;
  accessCode?: string | null;
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
          sliceNames: typeof data.sliceNames === 'string' 
            ? JSON.parse(data.sliceNames) 
            : data.sliceNames,
          imageZoom: typeof data.imageZoom === 'string' 
            ? JSON.parse(data.imageZoom) 
            : data.imageZoom,
        };

        setMapData(parsedData);
        
        // Set initial state from loaded data
        setSliceNames(parsedData.sliceNames || []);
        // Use saved zoom and pan values to show map exactly as it was saved
        setImageZoom(parsedData.imageZoom || 1);
        setPanOffset(parsedData.panOffset || { x: 0, y: 0 });
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
    <div className="flex flex-col h-dvh bg-background text-foreground overflow-hidden">
       <header className="flex items-center justify-center h-16 px-4 md:px-6 border-b shrink-0 z-10 bg-card/80 backdrop-blur-sm">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
            {mapData.name} (Shared View)
        </h1>
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
          showScaleBar={mapData.showScaleBar}
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
        />
      </main>
      <Footer />
      
      {/* Access Code Modal */}
      <AccessCodeModal
        open={showAccessCodeModal}
        mapName={mapData?.name || 'Shared Map'}
        onSubmit={handleAccessCodeSubmit}
        error={accessCodeError}
        isLoading={isVerifyingCode}
      />
    </div>
  );
}
