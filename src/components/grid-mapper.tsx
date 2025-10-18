'use client';

import {useState, useRef, type Dispatch, type SetStateAction} from 'react';
import type {ImageDimensions} from '@/components/image-workspace';
import ImageWorkspace from '@/components/image-workspace';
import ControlPanel from './control-panel';

export type GridMapperProps = {
    imageSrc: string | null;
    imageDimensions: ImageDimensions | null;
    onImageUpload: (file: File) => void;
    onImageLoad: (dimensions: ImageDimensions) => void;
    cellSize: number;
    setCellSize: Dispatch<SetStateAction<number>>;
    unit: 'px' | 'mm';
    setUnit: Dispatch<SetStateAction<'px' | 'mm'>>;
    dpi: number;
    setDpi: Dispatch<SetStateAction<number>>;
    gridOffset: {x: number, y: number};
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
    setSliceNames: Dispatch<SetStateAction<string[]>>;
    showCenterCoords: boolean;
    setShowCenterCoords: Dispatch<SetStateAction<boolean>>;
    showScaleBar: boolean;
    setShowScaleBar: Dispatch<SetStateAction<boolean>>;
    isGridCropped: boolean;
    onGridCropChange: (isCropped: boolean) => void;
    selectedSliceIndex: number | null;
    setSelectedSliceIndex: Dispatch<SetStateAction<number | null>>;
    mapName: string;
    setMapName: Dispatch<SetStateAction<string>>;
    imageZoom: number;
    setImageZoom: Dispatch<SetStateAction<number>>;
    panOffset: { x: number; y: number };
    setPanOffset: Dispatch<SetStateAction<{ x: number; y: number }>>;
};

export default function GridMapper({
    imageSrc,
    imageDimensions,
    onImageUpload,
    onImageLoad,
    cellSize,
    setCellSize,
    unit,
    setUnit,
    dpi,
    setDpi,
    gridOffset,
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
    onGridCropChange,
    selectedSliceIndex,
    setSelectedSliceIndex,
    mapName,
    setMapName,
    imageZoom,
    setImageZoom,
    panOffset,
    setPanOffset,
}: GridMapperProps) {
  const [clickedCoords, setClickedCoords] = useState<{
    col: string;
    row: number;
  } | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);

  const handleSliceNameChange = (index: number, newName: string) => {
    const newSliceNames = [...sliceNames];
    newSliceNames[index] = newName;
    setSliceNames(newSliceNames);
  };

  return (
    <div className="grid md:grid-cols-[350px_1fr] h-full" onClick={() => setClickedCoords(null)}>
      <div className="border-r bg-card/50 backdrop-blur-sm">
        <ControlPanel
          onImageUpload={onImageUpload}
          cellSize={cellSize}
          setCellSize={setCellSize}
          unit={unit}
          setUnit={setUnit}
          dpi={dpi}
          setDpi={setDpi}
          hasImage={!!imageSrc}
          gridColor={gridColor}
          setGridColor={setGridColor}
          labelColor={labelColor}
          setLabelColor={setLabelColor}
          backgroundColor={backgroundColor}
          setBackgroundColor={setBackgroundColor}
          gridThickness={gridThickness}
          setGridThickness={setGridThickness}
          splitCols={splitCols}
          setSplitCols={setSplitCols}
          splitRows={splitRows}
          setSplitRows={setSplitRows}
          sliceNames={sliceNames}
          setSliceNames={handleSliceNameChange}
          showCenterCoords={showCenterCoords}
          setShowCenterCoords={setShowCenterCoords}
          showScaleBar={showScaleBar}
          setShowScaleBar={setShowScaleBar}
          isGridCropped={isGridCropped}
          selectedSliceIndex={selectedSliceIndex}
          setSelectedSliceIndex={setSelectedSliceIndex}
          mapName={mapName}
          setMapName={setMapName}
        />
      </div>
      <ImageWorkspace
        imageSrc={imageSrc}
        imageRef={imageRef}
        onImageLoad={onImageLoad}
        imageDimensions={imageDimensions}
        cellSize={cellSize}
        unit={unit}
        dpi={dpi}
        gridOffset={gridOffset}
        onHover={() => {}}
        hoveredCoords={null}
        clickedCoords={clickedCoords}
        onCellClick={setClickedCoords}
        gridColor={gridColor}
        labelColor={labelColor}
        backgroundColor={backgroundColor}
        gridThickness={gridThickness}
        splitCols={splitCols}
        splitRows={splitRows}
        showCenterCoords={showCenterCoords}
        showScaleBar={showScaleBar}
        onGridCropChange={onGridCropChange}
        sliceNames={sliceNames}
        setSliceNames={setSliceNames}
        selectedSliceIndex={selectedSliceIndex}
        setSelectedSliceIndex={setSelectedSliceIndex}
        imageZoom={imageZoom}
        setImageZoom={setImageZoom}
        panOffset={panOffset}
        setPanOffset={setPanOffset}
      />
    </div>
  );
}
