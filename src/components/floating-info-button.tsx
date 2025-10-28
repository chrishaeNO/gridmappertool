'use client';

import React, { useState, useEffect } from 'react';
import { Info, X, Github, Calendar, User, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
}

export default function FloatingInfoButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [version, setVersion] = useState<string>('Loading...');
  const [releaseDate, setReleaseDate] = useState<string>('');
  const [releaseUrl, setReleaseUrl] = useState<string>('');

  useEffect(() => {
    // Fetch latest release info from GitHub API
    const fetchVersionInfo = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/chrishaeNO/gridmappertool/releases/latest');
        if (response.ok) {
          const release: GitHubRelease = await response.json();
          setVersion(release.tag_name || release.name || 'v1.0.0');
          setReleaseDate(new Date(release.published_at).toLocaleDateString());
          setReleaseUrl(release.html_url);
        } else {
          // Fallback if API fails
          setVersion('v1.0.0');
          setReleaseDate(new Date().toLocaleDateString());
        }
      } catch (error) {
        console.log('Could not fetch version info:', error);
        setVersion('v1.0.0');
        setReleaseDate(new Date().toLocaleDateString());
      }
    };

    fetchVersionInfo();
  }, []);

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        variant="outline"
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-2"
        aria-label="App Information"
      >
        <Info className="h-5 w-5" />
      </Button>

      {/* Info Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 bg-primary/10 rounded-lg shadow-inner">
                <Code className="size-4 text-primary" />
              </div>
              GridMapper
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Version Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Github className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Version:</span>
                <span className="text-muted-foreground">{version}</span>
              </div>
              
              {releaseDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Released:</span>
                  <span className="text-muted-foreground">{releaseDate}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Built by:</span>
                <span className="text-muted-foreground">Christian Hæ</span>
              </div>
            </div>

            {/* About GridMapper */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">About GridMapper</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A powerful web application for creating interactive grid overlays on maps and images. 
                Perfect for tabletop gaming, urban planning, cartography, and any scenario where you 
                need precise grid-based measurements and coordinates.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Key Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Interactive grid system with customizable overlays</li>
                <li>• Map splitting for large images</li>
                <li>• High-quality export with slice-specific settings</li>
                <li>• Secure sharing with access controls</li>
                <li>• Real-time collaboration and cloud storage</li>
              </ul>
            </div>

            {/* Links */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open('https://github.com/chrishaeNO/gridmappertool', '_blank')}
              >
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </Button>
              
              {releaseUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(releaseUrl, '_blank')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Release Notes
                </Button>
              )}
            </div>

            {/* Copyright */}
            <div className="pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} GridMapper. Built with ❤️ for the mapping community.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
