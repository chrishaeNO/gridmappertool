'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Download, RotateCcw, ZoomIn, ZoomOut, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';

// Dynamically import mapbox to avoid SSR issues
const Map = dynamic(() => import('react-map-gl/mapbox').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  )
});

const Source = dynamic(() => import('react-map-gl/mapbox').then(mod => mod.Source), { ssr: false });
const Layer = dynamic(() => import('react-map-gl/mapbox').then(mod => mod.Layer), { ssr: false });

interface MapboxSelectorProps {
  onImageSelect: (imageData: string, dimensions: { naturalWidth: number; naturalHeight: number }) => void;
  onClose: () => void;
}

interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export default function MapboxSelector({ onImageSelect, onClose }: MapboxSelectorProps) {
  const mapRef = useRef<any>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedArea, setSelectedArea] = useState<BoundingBox | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { toast } = useToast();

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    console.log('MapboxSelector component mounted');
    console.log('Mapbox token check:', mapboxToken ? 'Token found' : 'No token');
    console.log('Full token:', mapboxToken);
    if (!mapboxToken) {
      console.error('Mapbox token missing');
      toast({
        variant: 'destructive',
        title: 'Mapbox Not Configured',
        description: 'Mapbox access token is required for satellite map functionality.',
      });
    }
  }, [mapboxToken, toast]);

  // Handle window resize to ensure map resizes properly
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current && mapLoaded) {
        setTimeout(() => {
          mapRef.current.resize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mapLoaded]);

  const searchAddress = async () => {
    if (!searchQuery.trim() || !mapboxToken) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        
        mapRef.current?.flyTo({
          center: [lng, lat],
          zoom: 15,
          duration: 2000
        });
        
        toast({
          title: 'Location Found',
          description: `Navigated to ${data.features[0].place_name}`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Location Not Found',
          description: 'Could not find the specified address. Please try a different search term.',
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        variant: 'destructive',
        title: 'Search Error',
        description: 'Failed to search for the address. Please try again.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapClick = useCallback((event: any) => {
    if (!isSelecting) return;

    const { lng, lat } = event.lngLat;
    
    if (!selectedArea) {
      // First click - start selection
      setSelectedArea({
        north: lat,
        south: lat,
        east: lng,
        west: lng,
      });
    } else {
      // Second click - complete selection
      setSelectedArea({
        north: Math.max(lat, selectedArea.north),
        south: Math.min(lat, selectedArea.south),
        east: Math.max(lng, selectedArea.east),
        west: Math.min(lng, selectedArea.west),
      });
      setIsSelecting(false);
    }
  }, [isSelecting, selectedArea]);

  const handleMouseMove = useCallback((event: any) => {
    if (!isSelecting || !selectedArea) return;

    const { lng, lat } = event.lngLat;
    
    setSelectedArea({
      north: Math.max(lat, selectedArea.south),
      south: Math.min(lat, selectedArea.south),
      east: Math.max(lng, selectedArea.west),
      west: Math.min(lng, selectedArea.west),
    });
  }, [isSelecting, selectedArea]);

  const startSelection = () => {
    setIsSelecting(true);
    setSelectedArea(null);
    toast({
      title: 'Select Area',
      description: 'Click two points on the map to define your area.',
    });
  };

  const clearSelection = () => {
    setSelectedArea(null);
    setIsSelecting(false);
  };

  const exportSelectedArea = async () => {
    if (!selectedArea || !mapRef.current) return;

    setIsExporting(true);
    
    try {
      // Calculate dimensions for a reasonable resolution
      const width = 1024;
      const height = 768;
      
      // Create static map URL
      const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/[${selectedArea.west},${selectedArea.south},${selectedArea.east},${selectedArea.north}]/${width}x${height}@2x?access_token=${mapboxToken}`;
      
      // Fetch the image
      const response = await fetch(staticMapUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch satellite image');
      }
      
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onload = () => {
        const imageData = reader.result as string;
        onImageSelect(imageData, {
          naturalWidth: width * 2, // @2x resolution
          naturalHeight: height * 2,
        });
        
        toast({
          title: 'Satellite Image Loaded',
          description: 'Your selected area has been loaded successfully.',
        });
        
        onClose();
      };
      
      reader.readAsDataURL(blob);
      
    } catch (error) {
      console.error('Error exporting satellite image:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to load satellite image. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const zoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const zoomOut = () => {
    mapRef.current?.zoomOut();
  };

  if (!mapboxToken) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Mapbox Configuration Required</CardTitle>
            <CardDescription>
              To use satellite map functionality, please add your Mapbox access token to the environment variables.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                1. Get a free Mapbox access token from{' '}
                <a href="https://www.mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  mapbox.com
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                2. Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env file
              </p>
              <p className="text-sm text-muted-foreground">
                3. Restart the development server
              </p>
              <Button onClick={onClose} variant="outline" className="w-full">
                Back to Upload
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // GeoJSON for selected area visualization
  const selectedAreaGeoJSON = selectedArea ? {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [[
        [selectedArea.west, selectedArea.north],
        [selectedArea.east, selectedArea.north],
        [selectedArea.east, selectedArea.south],
        [selectedArea.west, selectedArea.south],
        [selectedArea.west, selectedArea.north],
      ]],
    },
  } : null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      {/* Header */}
      <div style={{ 
        height: '60px', 
        background: '#f8fafc', 
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1e293b' }}>Select Satellite Area</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button onClick={zoomOut} size="sm" variant="outline">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button onClick={zoomIn} size="sm" variant="outline">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Input
              type="text"
              placeholder="Search address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  searchAddress();
                }
              }}
              style={{ paddingRight: '80px' }}
            />
            <Button 
              onClick={searchAddress} 
              disabled={isSearching || !searchQuery.trim()}
              size="sm"
              style={{ position: 'absolute', right: '4px', top: '4px', height: '32px' }}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
          
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>
      </div>

      {/* FULL SCREEN MAP */}
      <div style={{ 
        position: 'absolute',
        top: '60px',
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: 'calc(100vh - 60px)'
      }}>
        {!mapLoaded && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.1)',
            zIndex: 10
          }}>
            <div style={{ textAlign: 'center', background: 'white', padding: '20px', borderRadius: '8px' }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              <p>Loading satellite map...</p>
            </div>
          </div>
        )}
        
        <div style={{ width: '100%', height: '100%' }}>
          <Map
            ref={mapRef}
            mapboxAccessToken={mapboxToken}
            initialViewState={{
              longitude: 10.7522,
              latitude: 59.9139,
              zoom: 6,
            }}
            style={{ 
              width: '100%', 
              height: '100%'
            }}
            mapStyle="mapbox://styles/mapbox/satellite-v9"
            onClick={handleMapClick}
            onMouseMove={handleMouseMove}
            cursor={isSelecting ? 'crosshair' : 'grab'}
            onLoad={() => {
              console.log('Mapbox map loaded successfully');
              setMapLoaded(true);
              setTimeout(() => {
                if (mapRef.current) {
                  mapRef.current.resize();
                }
              }, 200);
            }}
            onError={(error) => {
              console.error('Mapbox error:', error);
              setMapLoaded(false);
              toast({
                variant: 'destructive',
                title: 'Map Loading Error',
                description: 'Failed to load the satellite map.',
              });
            }}
          >
            {selectedAreaGeoJSON && (
              <Source id="selected-area" type="geojson" data={selectedAreaGeoJSON}>
                <Layer
                  id="selected-area-fill"
                  type="fill"
                  paint={{
                    'fill-color': '#3b82f6',
                    'fill-opacity': 0.2,
                  }}
                />
                <Layer
                  id="selected-area-border"
                  type="line"
                  paint={{
                    'line-color': '#3b82f6',
                    'line-width': 2,
                    'line-dasharray': [2, 2],
                  }}
                />
              </Source>
            )}
          </Map>
        </div>

        {/* Control Panel */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          maxWidth: '800px',
          margin: '0 auto',
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {!selectedArea ? (
            <Button 
              onClick={startSelection} 
              disabled={isSelecting}
              size="lg"
              style={{ minWidth: '200px' }}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {isSelecting ? 'Click two points on map...' : 'Select Area'}
            </Button>
          ) : (
            <>
              <div style={{ 
                fontSize: '14px', 
                color: '#666',
                minWidth: '200px',
                textAlign: 'center'
              }}>
                Selected: {Math.abs(selectedArea.east - selectedArea.west).toFixed(4)}° × {Math.abs(selectedArea.north - selectedArea.south).toFixed(4)}°
              </div>
              <Button onClick={clearSelection} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button 
                onClick={exportSelectedArea} 
                disabled={isExporting}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Loading...' : 'Use This Area'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
