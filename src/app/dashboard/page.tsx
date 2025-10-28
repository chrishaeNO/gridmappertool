'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, PlusCircle, Edit, Trash2, Share2, Eye } from 'lucide-react';
import FloatingInfoButton from '@/components/floating-info-button';
import Header from '@/components/layout/header';
import ShareModal from '@/components/share-modal';
import MobileBottomNav from '@/components/layout/mobile-bottom-nav';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type GridMap = {
  id: string;
  name: string;
  createdAt: string;
  shared: boolean;
  accessCode?: string | null;
};

type MapCardProps = {
  map: GridMap;
  onEdit: (mapId: string) => void;
  onShare: (map: GridMap) => void;
  onDelete: (mapId: string, mapName: string) => void;
  onRename: (mapId: string, newName: string) => void;
};

const MapCard = memo(({ map, onEdit, onShare, onDelete, onRename }: MapCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(map.name);

  const handleNameSubmit = () => {
    if (editName.trim() && editName !== map.name) {
      onRename(map.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditName(map.name);
      setIsEditing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none focus:bg-background focus:border focus:border-ring rounded px-2 py-1 mr-2 text-base md:text-lg font-semibold"
              autoFocus
            />
          ) : (
            <span 
              className="cursor-pointer hover:text-primary transition-colors touch-manipulation"
              onDoubleClick={() => setIsEditing(true)}
              onClick={() => setIsEditing(true)}
              title="Tap to edit name"
            >
              {map.name}
            </span>
          )}
          {map.shared && (
            <div className="flex items-center text-green-600 text-sm">
              <Share2 className="h-4 w-4 mr-1" />
              Shared
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Created: {new Date(map.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-col gap-3">
        <div className="flex gap-2 w-full">
          <Button 
            onClick={() => onEdit(map.id)} 
            variant="outline" 
            className="flex-1 h-11 md:h-10 touch-manipulation"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button 
            onClick={() => onShare(map)} 
            variant="outline" 
            className="flex-1 h-11 md:h-10 touch-manipulation"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
        <div className="flex gap-2 w-full">
          {map.shared && (
            <Button 
              asChild 
              variant="secondary" 
              className="flex-1 h-11 md:h-10 touch-manipulation"
            >
              <Link href={`/map/${map.id}`} target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                View Public
              </Link>
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className={`${map.shared ? "flex-1" : "w-full"} h-11 md:h-10 touch-manipulation`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Map</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{map.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="touch-manipulation">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete(map.id, map.name)}
                  className="touch-manipulation"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
});

MapCard.displayName = 'MapCard';

function MapList() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedMap, setSelectedMap] = useState<GridMap | null>(null);
  const [maps, setMaps] = useState<GridMap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMaps = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/grid-maps', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMaps(data);
      }
    } catch (error) {
      console.error('Error fetching maps:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load your maps.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMaps();
  }, [fetchMaps]);

  const handleEdit = useCallback((mapId: string) => {
    router.push(`/?edit=${mapId}`);
  }, [router]);

  const handleDelete = useCallback(async (mapId: string, mapName: string) => {
    try {
      const response = await fetch(`/api/grid-maps/${mapId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete map');
      }

      // Remove from local state
      setMaps(prev => prev.filter(map => map.id !== mapId));
      
      toast({
        title: 'Map Deleted',
        description: `"${mapName}" has been successfully deleted.`,
      });
    } catch (error) {
      console.error('Error deleting map:', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Failed to delete the map. Please try again.',
      });
    }
  }, [toast]);

  const handleShare = useCallback((map: GridMap) => {
    setSelectedMap(map);
    setShareModalOpen(true);
  }, []);

  const handleRename = useCallback(async (mapId: string, newName: string) => {
    try {
      const response = await fetch(`/api/grid-maps/${mapId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename map');
      }

      // Update local state
      setMaps(prev => prev.map(map => 
        map.id === mapId ? { ...map, name: newName } : map
      ));
      
      toast({
        title: 'Map Renamed',
        description: `Map has been renamed to "${newName}".`,
      });
    } catch (error) {
      console.error('Error renaming map:', error);
      toast({
        variant: 'destructive',
        title: 'Rename Failed',
        description: 'Failed to rename the map. Please try again.',
      });
    }
  }, [toast]);

  const handleToggleShare = useCallback(async (shared: boolean, accessCode?: string | null) => {
    if (!selectedMap) return;
    
    try {
      const response = await fetch(`/api/grid-maps/${selectedMap.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ shared, accessCode }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(`Failed to update share status: ${errorData.details || errorData.error || response.statusText}`);
      }

      // Update local state
      setSelectedMap(prev => prev ? { ...prev, shared, accessCode } : null);
      setMaps(prev => prev.map(map => 
        map.id === selectedMap.id ? { ...map, shared, accessCode } : map
      ));
    } catch (error) {
      console.error('Error updating share status:', error);
      throw error;
    }
  }, [selectedMap]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardFooter className="flex flex-col gap-2">
              <div className="flex gap-2 w-full">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
              <div className="flex gap-2 w-full">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!maps || maps.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-muted-foreground/20 rounded-lg">
        <h2 className="text-xl font-semibold">No Maps Yet</h2>
        <p className="text-muted-foreground mt-2">Create your first grid map to see it here.</p>
        <Button asChild className="mt-4">
          <Link href="/">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create a New Map
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {maps.map((map) => (
          <MapCard
            key={map.id}
            map={map}
            onEdit={handleEdit}
            onShare={handleShare}
            onDelete={handleDelete}
            onRename={handleRename}
          />
        ))}
      </div>
      
      {/* Share Modal */}
      {selectedMap && (
        <ShareModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          mapId={selectedMap.id}
          mapName={selectedMap.name}
          isShared={selectedMap.shared}
          accessCode={selectedMap.accessCode}
          onToggleShare={handleToggleShare}
        />
      )}
    </>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    const handleNewMap = () => {
      router.push('/');
    };
    
    return (
       <div className="flex flex-col h-dvh bg-background text-foreground">
         <Header hasImage={false} onNewMap={handleNewMap} />
         <main className="flex-1 container mx-auto p-4 md:p-8">
            <Skeleton className="h-10 w-1/4 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-2">
                      <div className="flex gap-2 w-full">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 flex-1" />
                      </div>
                      <div className="flex gap-2 w-full">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 flex-1" />
                      </div>
                    </CardFooter>
                </Card>
                ))}
            </div>
         </main>
         <FloatingInfoButton />
       </div>
    );
  }


  const handleNewMap = () => {
    router.push('/');
  };

  return (
    <div className="flex flex-col h-dvh bg-background text-foreground">
       <Header hasImage={false} onNewMap={handleNewMap} />
       <main className="flex-1 container mx-auto p-4 md:p-8 mobile-bottom-spacing md:pb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Your Maps</h1>
            <MapList />
       </main>
       
       {/* Mobile Bottom Navigation */}
       <MobileBottomNav
         onNewMap={handleNewMap}
         isEditorPage={false}
       />
       
       <FloatingInfoButton />
    </div>
  );
}
