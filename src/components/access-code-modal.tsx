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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface AccessCodeModalProps {
  open: boolean;
  mapName: string;
  onSubmit: (code: string) => void;
  error?: string;
  isLoading?: boolean;
}

export default function AccessCodeModal({ 
  open, 
  mapName, 
  onSubmit, 
  error,
  isLoading = false
}: AccessCodeModalProps) {
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim()) {
      onSubmit(accessCode.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <DialogTitle>Access Code Required</DialogTitle>
          </div>
          <DialogDescription>
            This map "{mapName}" is protected. Please enter the access code to continue.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="access-code">Access Code</Label>
            <div className="relative">
              <Input
                id="access-code"
                type={showCode ? 'text' : 'password'}
                placeholder="Enter access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                disabled={isLoading}
                className="pr-10"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCode(!showCode)}
                disabled={isLoading}
              >
                {showCode ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!accessCode.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Verifying...
                </>
              ) : (
                'Access Map'
              )}
            </Button>
          </div>
        </form>
        
        <p className="text-xs text-muted-foreground text-center">
          Contact the map owner if you don't have the access code.
        </p>
      </DialogContent>
    </Dialog>
  );
}
