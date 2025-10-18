'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Copy, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapId: string;
  mapName: string;
  isShared: boolean;
  accessCode?: string | null;
  onToggleShare: (shared: boolean, accessCode?: string | null) => Promise<void>;
}

export default function ShareModal({ 
  open, 
  onOpenChange, 
  mapId, 
  mapName, 
  isShared, 
  accessCode,
  onToggleShare 
}: ShareModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [useAccessCode, setUseAccessCode] = useState(!!accessCode);
  const [currentAccessCode, setCurrentAccessCode] = useState(accessCode || '');
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/map/${mapId}`;

  const handleToggleShare = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      const codeToUse = checked && useAccessCode ? currentAccessCode : null;
      await onToggleShare(checked, codeToUse);
      toast({
        title: checked ? 'Map Shared' : 'Map Made Private',
        description: checked 
          ? useAccessCode 
            ? 'Your map is now accessible via the share link with access code protection.'
            : 'Your map is now publicly accessible via the share link.'
          : 'Your map is now private and can only be accessed by you.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update sharing settings. Please try again.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateAccessCode = async () => {
    if (!isShared) return;
    
    setIsUpdating(true);
    try {
      const codeToUse = useAccessCode ? currentAccessCode : null;
      await onToggleShare(true, codeToUse);
      toast({
        title: 'Access Code Updated',
        description: useAccessCode 
          ? 'Access code has been set for your shared map.'
          : 'Access code has been removed from your shared map.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update access code. Please try again.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link Copied',
        description: 'Share link has been copied to your clipboard.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Failed to copy link to clipboard.',
      });
    }
  };

  const openInNewTab = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{mapName}"</DialogTitle>
          <DialogDescription>
            Control who can access your map and get a shareable link.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="share-toggle">Public Access</Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone with the link to view this map
              </p>
            </div>
            <Switch
              id="share-toggle"
              checked={isShared}
              onCheckedChange={handleToggleShare}
              disabled={isUpdating}
            />
          </div>
          
          {isShared && (
            <div className="space-y-4">
              {/* Access Code Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="access-code-toggle">Require Access Code</Label>
                    <p className="text-sm text-muted-foreground">
                      Protect your map with a custom access code
                    </p>
                  </div>
                  <Switch
                    id="access-code-toggle"
                    checked={useAccessCode}
                    onCheckedChange={setUseAccessCode}
                    disabled={isUpdating}
                  />
                </div>
                
                {useAccessCode && (
                  <div className="space-y-2">
                    <Label htmlFor="access-code">Access Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="access-code"
                        type="text"
                        placeholder="Enter access code"
                        value={currentAccessCode}
                        onChange={(e) => setCurrentAccessCode(e.target.value)}
                        disabled={isUpdating}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleUpdateAccessCode}
                        disabled={isUpdating || !currentAccessCode.trim()}
                        variant="outline"
                      >
                        {isUpdating ? 'Updating...' : 'Update'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Visitors will need to enter this code to access your map.
                    </p>
                  </div>
                )}
              </div>

              {/* Share Link Section */}
              <div className="space-y-2">
                <Label htmlFor="share-url">Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-url"
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyToClipboard}
                    title="Copy link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={openInNewTab}
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {useAccessCode 
                    ? 'Visitors will need the access code to view your map.'
                    : 'Anyone with this link can view your map, but cannot edit it.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
