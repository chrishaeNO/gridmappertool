'use client';

import { useState, useEffect } from 'react';
import { useMicrosoftAuth } from '@/contexts/microsoft-auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, Share2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  displayName: string;
  description?: string;
}

interface Channel {
  id: string;
  displayName: string;
  description?: string;
}

interface TeamsShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapName: string;
  mapUrl?: string;
  onShare?: (teamId: string, channelId: string, message: string) => void;
}

export default function TeamsShareDialog({
  open,
  onOpenChange,
  mapName,
  mapUrl,
  onShare
}: TeamsShareDialogProps) {
  const { graphService, isAuthenticated, login } = useMicrosoftAuth();
  const { toast } = useToast();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && isAuthenticated && graphService) {
      loadTeams();
    }
  }, [open, isAuthenticated, graphService]);

  useEffect(() => {
    if (selectedTeam && graphService) {
      loadChannels(selectedTeam.id);
    }
  }, [selectedTeam, graphService]);

  useEffect(() => {
    // Set default message when map name changes
    setMessage(`Check out this grid map: "${mapName}"`);
  }, [mapName]);

  const loadTeams = async () => {
    if (!graphService) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userTeams = await graphService.getUserTeams();
      setTeams(userTeams);
    } catch (err: any) {
      setError(err.message || 'Failed to load Teams');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load your Teams',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async (teamId: string) => {
    if (!graphService) return;
    
    try {
      // Note: Getting channels requires additional permissions
      // For now, we'll use a default "General" channel
      setChannels([
        { id: '19:general', displayName: 'General', description: 'General channel' }
      ]);
    } catch (err: any) {
      console.error('Failed to load channels:', err);
      // Fallback to General channel
      setChannels([
        { id: '19:general', displayName: 'General', description: 'General channel' }
      ]);
    }
  };

  const handleShare = async () => {
    if (!selectedTeam || !selectedChannel || !graphService) return;
    
    setSharing(true);
    
    try {
      let shareMessage = message;
      
      // Add map URL if available
      if (mapUrl) {
        shareMessage += `\n\n🗺️ View map: ${mapUrl}`;
      }
      
      // For now, we'll create a share link instead of posting directly
      // as posting to Teams channels requires specific app permissions
      const shareLink = mapUrl || window.location.href;
      
      // Copy to clipboard as fallback
      await navigator.clipboard.writeText(
        `${message}\n\nMap: ${mapName}\nLink: ${shareLink}`
      );
      
      toast({
        title: 'Ready to Share',
        description: 'Message copied to clipboard. You can now paste it in your Teams channel.',
      });
      
      if (onShare) {
        onShare(selectedTeam.id, selectedChannel.id, shareMessage);
      }
      
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Share Failed',
        description: err.message || 'Failed to share to Teams',
      });
    } finally {
      setSharing(false);
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

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect to Microsoft</DialogTitle>
            <DialogDescription>
              Sign in to your Microsoft account to share with Teams
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-center text-muted-foreground">
              Connect your Microsoft account to share grid maps with your Teams
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
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share to Microsoft Teams
          </DialogTitle>
          <DialogDescription>
            Share "{mapName}" with your team members
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Team Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Select Team</Label>
            {loading ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ScrollArea className="h-32 border rounded-md">
                <div className="p-2 space-y-1">
                  {teams.map((team) => (
                    <Card
                      key={team.id}
                      className={`cursor-pointer transition-colors ${
                        selectedTeam?.id === team.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedTeam(team)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="font-medium">{team.displayName}</div>
                            {team.description && (
                              <div className="text-xs text-muted-foreground">
                                {team.description}
                              </div>
                            )}
                          </div>
                          {selectedTeam?.id === team.id && (
                            <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Channel Selection */}
          {selectedTeam && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Select Channel</Label>
              <div className="space-y-2">
                {channels.map((channel) => (
                  <Card
                    key={channel.id}
                    className={`cursor-pointer transition-colors ${
                      selectedChannel?.id === channel.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedChannel(channel)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                        <div>
                          <div className="font-medium">#{channel.displayName}</div>
                          {channel.description && (
                            <div className="text-xs text-muted-foreground">
                              {channel.description}
                            </div>
                          )}
                        </div>
                        {selectedChannel?.id === channel.id && (
                          <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          {selectedTeam && selectedChannel && (
            <div className="space-y-3">
              <Label htmlFor="share-message" className="text-base font-medium">
                Message
              </Label>
              <Textarea
                id="share-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message to share with your team..."
                rows={3}
              />
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The message will be copied to your clipboard. You can then paste it directly in your Teams channel.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={!selectedTeam || !selectedChannel || sharing}
          >
            {sharing ? 'Preparing...' : 'Share to Teams'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
