'use client';

import { useState, useEffect } from 'react';
import { useMicrosoftAuth } from '@/contexts/microsoft-auth-context';
import { OneDriveItem } from '@/lib/microsoft-graph';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Folder, FolderPlus, ArrowLeft, Upload, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OneDriveFolderPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFolderSelected: (folder: OneDriveItem | null) => void;
  title?: string;
  description?: string;
}

export default function OneDriveFolderPicker({
  open,
  onOpenChange,
  onFolderSelected,
  title = "Select OneDrive Folder",
  description = "Choose where to save your grid map"
}: OneDriveFolderPickerProps) {
  const { graphService, isAuthenticated, login } = useMicrosoftAuth();
  const { toast } = useToast();
  
  const [folders, setFolders] = useState<OneDriveItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<OneDriveItem | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<OneDriveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  useEffect(() => {
    if (open && isAuthenticated && graphService) {
      loadFolders();
    }
  }, [open, isAuthenticated, graphService]);

  const loadFolders = async (folderId?: string) => {
    if (!graphService) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const folderList = await graphService.getOneDriveFolders(folderId);
      setFolders(folderList);
    } catch (err: any) {
      setError(err.message || 'Failed to load folders');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load OneDrive folders',
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = async (folder: OneDriveItem) => {
    setBreadcrumbs(prev => [...prev, currentFolder].filter(Boolean) as OneDriveItem[]);
    setCurrentFolder(folder);
    await loadFolders(folder.id);
  };

  const navigateBack = async () => {
    const previousFolder = breadcrumbs[breadcrumbs.length - 1] || null;
    setBreadcrumbs(prev => prev.slice(0, -1));
    setCurrentFolder(previousFolder);
    await loadFolders(previousFolder?.id);
  };

  const navigateToRoot = async () => {
    setBreadcrumbs([]);
    setCurrentFolder(null);
    await loadFolders();
  };

  const createFolder = async () => {
    if (!graphService || !newFolderName.trim()) return;
    
    setCreatingFolder(true);
    
    try {
      const newFolder = await graphService.createFolder(
        newFolderName.trim(),
        currentFolder?.id
      );
      
      setFolders(prev => [newFolder, ...prev]);
      setNewFolderName('');
      setShowCreateFolder(false);
      
      toast({
        title: 'Folder Created',
        description: `"${newFolder.name}" has been created successfully.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to create folder',
      });
    } finally {
      setCreatingFolder(false);
    }
  };

  const selectCurrentFolder = () => {
    onFolderSelected(currentFolder);
    onOpenChange(false);
  };

  const handleMicrosoftLogin = async () => {
    try {
      await login();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Failed to connect to Microsoft account',
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect to Microsoft</DialogTitle>
            <DialogDescription>
              Sign in to your Microsoft account to access OneDrive
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-center text-muted-foreground">
              Connect your Microsoft account to save grid maps directly to OneDrive
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleMicrosoftLogin} className="bg-blue-600 hover:bg-blue-700">
              Sign in to Microsoft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateToRoot}
            className="h-8 px-2"
          >
            OneDrive
          </Button>
          {breadcrumbs.map((folder, index) => (
            <div key={folder.id} className="flex items-center space-x-2">
              <span className="text-muted-foreground">/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
                  setBreadcrumbs(newBreadcrumbs);
                  setCurrentFolder(folder);
                  loadFolders(folder.id);
                }}
                className="h-8 px-2"
              >
                {folder.name}
              </Button>
            </div>
          ))}
          {currentFolder && (
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{currentFolder.name}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {(breadcrumbs.length > 0 || currentFolder) && (
              <Button variant="outline" size="sm" onClick={navigateBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateFolder(true)}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
          </div>
          
          <Button onClick={selectCurrentFolder}>
            Select {currentFolder ? `"${currentFolder.name}"` : 'Root Folder'}
          </Button>
        </div>

        {/* Folder List */}
        <ScrollArea className="h-64 border rounded-md">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Folder className="w-8 h-8 mb-2" />
              <p>No folders found</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {folders.map((folder) => (
                <Button
                  key={folder.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => navigateToFolder(folder)}
                >
                  <Folder className="w-4 h-4 mr-3 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">{folder.name}</div>
                    {folder.folder && (
                      <div className="text-xs text-muted-foreground">
                        {folder.folder.childCount} items
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Create Folder Dialog */}
        <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Enter a name for the new folder
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFolderName.trim()) {
                      createFolder();
                    }
                  }}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={createFolder}
                disabled={!newFolderName.trim() || creatingFolder}
              >
                {creatingFolder ? 'Creating...' : 'Create Folder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
