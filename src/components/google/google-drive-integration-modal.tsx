'use client';

import { useState } from 'react';
import { useGoogleAuth } from '@/contexts/google-auth-context';
import { GoogleDriveFolder } from '@/lib/google-drive';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import GoogleDriveFolderPicker from './google-drive-folder-picker';
import { Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GoogleDriveIntegrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapName: string;
  mapImageBlob?: Blob;
  onSaveComplete?: (result: { driveUrl?: string }) => void;
}

export default function GoogleDriveIntegrationModal({
  open,
  onOpenChange,
  mapName,
  mapImageBlob,
  onSaveComplete
}: GoogleDriveIntegrationModalProps) {
  const { driveService, isAuthenticated, user, login, loading } = useGoogleAuth();
  const { toast } = useToast();
  
  const [selectedFolder, setSelectedFolder] = useState<GoogleDriveFolder | null>(null);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    driveUrl?: string;
  } | null>(null);

  const handleSaveToGoogleDrive = async () => {
    if (!driveService || !mapImageBlob) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Unable to save to Google Drive. Please try again.',
      });
      return;
    }

    setUploading(true);
    
    try {
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${mapName}_${timestamp}.png`;
      
      const result = await driveService.uploadFile(
        fileName,
        mapImageBlob,
        selectedFolder?.id
      );
      
      setUploadResult({ driveUrl: result.webViewLink });
      
      toast({
        title: 'Saved to Google Drive',
        description: `"${fileName}" has been saved successfully.`,
      });
      
      if (onSaveComplete) {
        onSaveComplete({ driveUrl: result.webViewLink });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Failed to save to Google Drive',
      });
    } finally {
      setUploading(false);
    }
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

  const resetState = () => {
    setSelectedFolder(null);
    setUploadResult(null);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google Drive Integration
            </DialogTitle>
            <DialogDescription>
              Save your grid map to Google Drive
            </DialogDescription>
          </DialogHeader>

          {!isAuthenticated ? (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please sign in to your Google account to use Google Drive integration.
                </AlertDescription>
              </Alert>
              
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
                <Button 
                  onClick={handleGoogleLogin} 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign in to Google
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user?.picture ? (
                    <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'
                  )}
                </div>
                <div>
                  <div className="font-medium">{user?.name || 'Google User'}</div>
                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                </div>
                <Badge variant="secondary" className="ml-auto">Connected</Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Save to Google Drive</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a folder in your Google Drive to save "{mapName}"
                  </p>
                </div>

                {/* Folder Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Destination:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFolderPicker(true)}
                    >
                      {selectedFolder ? `📁 ${selectedFolder.name}` : '📁 Select Folder'}
                    </Button>
                  </div>
                  
                  {!selectedFolder && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No folder selected. The file will be saved to your Google Drive root folder.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Upload Result */}
                {uploadResult?.driveUrl && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Successfully saved to Google Drive!{' '}
                      <a 
                        href={uploadResult.driveUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        View file
                      </a>
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleSaveToGoogleDrive}
                  disabled={uploading || !mapImageBlob}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving to Google Drive...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Save to Google Drive
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {uploadResult?.driveUrl ? 'Done' : 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Google Drive Folder Picker */}
      <GoogleDriveFolderPicker
        open={showFolderPicker}
        onOpenChange={setShowFolderPicker}
        onFolderSelected={setSelectedFolder}
        title="Choose Google Drive Folder"
        description="Select where to save your grid map"
      />
    </>
  );
}
