'use client';

import { useState } from 'react';
import { useMicrosoftAuth } from '@/contexts/microsoft-auth-context';
import { OneDriveItem } from '@/lib/microsoft-graph';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import OneDriveFolderPicker from './onedrive-folder-picker';
import TeamsShareDialog from './teams-share-dialog';
import { Cloud, Users, Download, Share2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MicrosoftIntegrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapName: string;
  mapImageBlob?: Blob;
  mapUrl?: string;
  onSaveComplete?: (result: { oneDriveUrl?: string; teamsShared?: boolean }) => void;
}

export default function MicrosoftIntegrationModal({
  open,
  onOpenChange,
  mapName,
  mapImageBlob,
  mapUrl,
  onSaveComplete
}: MicrosoftIntegrationModalProps) {
  const { graphService, isAuthenticated, user, login, loading } = useMicrosoftAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('onedrive');
  const [selectedFolder, setSelectedFolder] = useState<OneDriveItem | null>(null);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showTeamsDialog, setShowTeamsDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    oneDriveUrl?: string;
    teamsShared?: boolean;
  } | null>(null);

  const handleSaveToOneDrive = async () => {
    if (!graphService || !mapImageBlob) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Unable to save to OneDrive. Please try again.',
      });
      return;
    }

    setUploading(true);
    
    try {
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${mapName}_${timestamp}.png`;
      
      const result = await graphService.uploadFile(
        fileName,
        mapImageBlob,
        selectedFolder?.id
      );
      
      setUploadResult(prev => ({ ...prev, oneDriveUrl: result.webUrl }));
      
      toast({
        title: 'Saved to OneDrive',
        description: `"${fileName}" has been saved successfully.`,
      });
      
      if (onSaveComplete) {
        onSaveComplete({ oneDriveUrl: result.webUrl });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Failed to save to OneDrive',
      });
    } finally {
      setUploading(false);
    }
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

  const handleTeamsShare = (teamId: string, channelId: string, message: string) => {
    setUploadResult(prev => ({ ...prev, teamsShared: true }));
    
    if (onSaveComplete) {
      onSaveComplete({ 
        oneDriveUrl: uploadResult?.oneDriveUrl,
        teamsShared: true 
      });
    }
  };

  const resetState = () => {
    setSelectedFolder(null);
    setUploadResult(null);
    setActiveTab('onedrive');
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
              <Cloud className="w-5 h-5 text-blue-600" />
              Microsoft Integration
            </DialogTitle>
            <DialogDescription>
              Save your grid map to OneDrive and share with Teams
            </DialogDescription>
          </DialogHeader>

          {!isAuthenticated ? (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please sign in to your Microsoft account to use OneDrive and Teams integration.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col items-center space-y-4 py-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Cloud className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-center text-muted-foreground">
                  Connect your Microsoft account to save grid maps directly to OneDrive and share with Teams
                </p>
                <Button 
                  onClick={handleMicrosoftLogin} 
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
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Sign in to Microsoft
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
                  {(user as any)?.name?.charAt(0) || (user as any)?.username?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="font-medium">{(user as any)?.name || 'Microsoft User'}</div>
                  <div className="text-sm text-muted-foreground">{(user as any)?.username}</div>
                </div>
                <Badge variant="secondary" className="ml-auto">Connected</Badge>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="onedrive" className="flex items-center gap-2">
                    <Cloud className="w-4 h-4" />
                    OneDrive
                  </TabsTrigger>
                  <TabsTrigger value="teams" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Teams
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="onedrive" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Save to OneDrive</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose a folder in your OneDrive to save "{mapName}"
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
                            No folder selected. The file will be saved to your OneDrive root folder.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Upload Result */}
                    {uploadResult?.oneDriveUrl && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          Successfully saved to OneDrive!{' '}
                          <a 
                            href={uploadResult.oneDriveUrl} 
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
                      onClick={handleSaveToOneDrive}
                      disabled={uploading || !mapImageBlob}
                      className="w-full"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving to OneDrive...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Save to OneDrive
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="teams" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Share with Teams</h3>
                      <p className="text-sm text-muted-foreground">
                        Share "{mapName}" with your team members in Microsoft Teams
                      </p>
                    </div>

                    {uploadResult?.teamsShared && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          Ready to share with Teams! Message copied to clipboard.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={() => setShowTeamsDialog(true)}
                      className="w-full"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share to Teams
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {uploadResult?.oneDriveUrl || uploadResult?.teamsShared ? 'Done' : 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OneDrive Folder Picker */}
      <OneDriveFolderPicker
        open={showFolderPicker}
        onOpenChange={setShowFolderPicker}
        onFolderSelected={setSelectedFolder}
        title="Choose OneDrive Folder"
        description="Select where to save your grid map"
      />

      {/* Teams Share Dialog */}
      <TeamsShareDialog
        open={showTeamsDialog}
        onOpenChange={setShowTeamsDialog}
        mapName={mapName}
        mapUrl={mapUrl}
        onShare={handleTeamsShare}
      />
    </>
  );
}
