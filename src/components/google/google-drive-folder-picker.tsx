'use client';

import { useState, useEffect } from 'react';
import { useGoogleAuth } from '@/contexts/google-auth-context';
import { GoogleDriveFolder } from '@/lib/google-drive';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Folder, FolderPlus, ArrowLeft, Home, AlertTriangle, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GoogleDriveFolderPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFolderSelected: (folder: GoogleDriveFolder | null) => void;
  title?: string;
  description?: string;
}

export default function GoogleDriveFolderPicker({
  open,
  onOpenChange,
  onFolderSelected,
  title = "Select Google Drive Folder",
  description = "Choose where to save your grid map"
}: GoogleDriveFolderPickerProps) {
  const { driveService, isAuthenticated, login } = useGoogleAuth();
  const { toast } = useToast();
  
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<GoogleDriveFolder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<GoogleDriveFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleDriveFolder[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  useEffect(() => {
    if (open && isAuthenticated && driveService) {
      loadSavedFolder();
    }
  }, [open, isAuthenticated, driveService]);

  // Load saved folder from localStorage
  const loadSavedFolder = async () => {
    const savedFolderId = localStorage.getItem('google_drive_selected_folder_id');
    const savedFolderData = localStorage.getItem('google_drive_selected_folder_data');
    
    if (savedFolderId && savedFolderData) {
      try {
        const folderData = JSON.parse(savedFolderData);
        setCurrentFolder(folderData);
        await loadFolders(savedFolderId);
        
        // Build breadcrumbs for saved folder
        if (driveService && savedFolderId !== 'root') {
          const path = await driveService.getFolderPath(savedFolderId);
          const breadcrumbFolders: GoogleDriveFolder[] = [];
          
          // We need to build proper folder objects for breadcrumbs
          // This is a simplified approach - in a full implementation you'd want to fetch each folder
          for (let i = 0; i < path.length - 1; i++) {
            breadcrumbFolders.push({
              id: `folder-${i}`, // This is a placeholder - ideally we'd have the real IDs
              name: path[i],
              mimeType: 'application/vnd.google-apps.folder' as const
            });
          }
          setBreadcrumbs(breadcrumbFolders);
        }
      } catch (error) {
        console.error('Error loading saved folder:', error);
        localStorage.removeItem('google_drive_selected_folder_id');
        localStorage.removeItem('google_drive_selected_folder_data');
        await loadFolders();
      }
    } else {
      await loadFolders();
    }
  };

  const loadFolders = async (folderId?: string) => {
    if (!driveService) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const folderList = await driveService.getFolders(folderId);
      setFolders(folderList);
    } catch (err: any) {
      setError(err.message || 'Failed to load folders');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load Google Drive folders',
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = async (folder: GoogleDriveFolder) => {
    setBreadcrumbs(prev => [...prev, currentFolder].filter(Boolean) as GoogleDriveFolder[]);
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
    if (!driveService || !newFolderName.trim()) return;
    
    setCreatingFolder(true);
    
    try {
      const newFolder = await driveService.createFolder(
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

  const searchFolders = async (term: string) => {
    if (!driveService || !term.trim()) {
      setSearchResults([]);
      setIsSearchMode(false);
      return;
    }
    
    setIsSearching(true);
    setIsSearchMode(true);
    
    try {
      const results = await driveService.searchFolders(term.trim());
      setSearchResults(results);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Search Error',
        description: 'Failed to search folders',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setIsSearchMode(false);
  };

  const selectCurrentFolder = () => {
    // Save selected folder to localStorage
    if (currentFolder) {
      localStorage.setItem('google_drive_selected_folder_id', currentFolder.id);
      localStorage.setItem('google_drive_selected_folder_data', JSON.stringify(currentFolder));
    } else {
      localStorage.setItem('google_drive_selected_folder_id', 'root');
      localStorage.removeItem('google_drive_selected_folder_data');
    }
    
    onFolderSelected(currentFolder);
    onOpenChange(false);
  };

  const handleGoogleLogin = async () => {
    try {
      await login();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Failed to connect to Google account',
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect to Google</DialogTitle>
            <DialogDescription>
              Sign in to your Google account to access Google Drive
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <p className="text-center text-muted-foreground">
              Connect your Google account to save grid maps directly to Google Drive
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleGoogleLogin} className="bg-blue-600 hover:bg-blue-700">
              Sign in to Google
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
            <Home className="w-4 h-4 mr-1" />
            My Drive
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

        {/* Search */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search folders..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value.trim()) {
                  searchFolders(e.target.value);
                } else {
                  clearSearch();
                }
              }}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {isSearchMode && (
            <div className="text-sm text-muted-foreground">
              {isSearching ? 'Searching...' : `Found ${searchResults.length} folder${searchResults.length !== 1 ? 's' : ''}`}
            </div>
          )}
        </div>

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
            Select {currentFolder ? `"${currentFolder.name}"` : 'My Drive'}
          </Button>
        </div>

        {/* Folder List */}
        <ScrollArea className="h-64 border rounded-md">
          {(loading || isSearching) ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : isSearchMode ? (
            searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Search className="w-8 h-8 mb-2" />
                <p>No folders found matching "{searchTerm}"</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {searchResults.map((folder) => (
                  <Button
                    key={folder.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => {
                      setCurrentFolder(folder);
                      clearSearch();
                      onFolderSelected(folder);
                      onOpenChange(false);
                      // Save selected folder
                      localStorage.setItem('google_drive_selected_folder_id', folder.id);
                      localStorage.setItem('google_drive_selected_folder_data', JSON.stringify(folder));
                    }}
                  >
                    <Folder className="w-4 h-4 mr-3 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium">{folder.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {folder.modifiedTime && new Date(folder.modifiedTime).toLocaleDateString()}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )
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
                    <div className="text-xs text-muted-foreground">
                      {folder.modifiedTime && new Date(folder.modifiedTime).toLocaleDateString()}
                    </div>
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
