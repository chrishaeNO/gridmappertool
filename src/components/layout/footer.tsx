import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            Built by{' '}
            <span className="font-medium text-foreground">Christian Hæ</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
