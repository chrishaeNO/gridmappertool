'use client';

import React, { useState } from 'react';
import { Info, Github, User, Code, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


export default function FloatingInfoButton() {
  const [isOpen, setIsOpen] = useState(false);
  const version = 'v1.0.0';
  const releaseDate = new Date().toLocaleDateString();

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        variant="outline"
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-black/90 backdrop-blur supports-[backdrop-filter]:bg-black/80 text-white hover:bg-black/95 hover:text-white border-0 shadow-md hover:shadow-lg"
        aria-label="App Information"
      >
        <Info className="h-5 w-5" />
      </Button>

      {/* Info Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto sm:max-w-md">
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
                <span className="text-muted-foreground">chrishaeNO</span>
              </div>
            </div>

            {/* About GridMapper */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">About GridMapper</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A specialized web application designed for creating precise grid overlays on maps and images. 
                Primarily built for security operations at large events, emergency response coordination, 
                and any scenario where accurate positioning and grid-based navigation is critical for safety and logistics.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Key Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Precise grid overlays for accurate positioning</li>
                <li>• Map splitting for large event areas</li>
                <li>• High-quality export for security briefings</li>
                <li>• Secure sharing with access controls</li>
                <li>• Coordinate system for emergency response</li>
              </ul>
            </div>

            {/* Links */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open('https://github.com/chrishaeNO/gridmappertool', '_blank')}
              >
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </Button>
            </div>

            {/* Copyright */}
            <div className="pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} GridMapper. Built with ❤️ for security professionals and event organizers.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
