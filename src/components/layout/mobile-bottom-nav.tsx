'use client';

import { PanelLeft, Save, Share2, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

type MobileBottomNavProps = {
  onControlsToggle?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onNewMap?: () => void;
  hasImage?: boolean;
  isEditorPage?: boolean;
};

export default function MobileBottomNav({ 
  onControlsToggle, 
  onSave, 
  onShare, 
  onNewMap, 
  hasImage = false,
  isEditorPage = false 
}: MobileBottomNavProps) {
  const { user } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {/* Controls Toggle - Only on editor page */}
        {isEditorPage && onControlsToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onControlsToggle}
            className="flex flex-col items-center gap-1 h-auto py-2 px-3 touch-manipulation"
          >
            <PanelLeft className="h-5 w-5" />
            <span className="text-xs">Controls</span>
          </Button>
        )}

        {/* Save */}
        {isEditorPage && onSave && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            disabled={!hasImage}
            className={cn(
              "flex flex-col items-center gap-1 h-auto py-2 px-3 touch-manipulation",
              !hasImage && "opacity-50"
            )}
          >
            <Save className="h-5 w-5" />
            <span className="text-xs">Save</span>
          </Button>
        )}

        {/* New Map */}
        {onNewMap && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewMap}
            className="flex flex-col items-center gap-1 h-auto py-2 px-3 touch-manipulation"
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs">New</span>
          </Button>
        )}

        {/* Share */}
        {isEditorPage && onShare && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            disabled={!hasImage}
            className={cn(
              "flex flex-col items-center gap-1 h-auto py-2 px-3 touch-manipulation",
              !hasImage && "opacity-50"
            )}
          >
            <Share2 className="h-5 w-5" />
            <span className="text-xs">Share</span>
          </Button>
        )}

        {/* User Profile */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="flex flex-col items-center gap-1 h-auto py-2 px-3 touch-manipulation"
        >
          {user ? (
            <Link href="/dashboard">
              <User className="h-5 w-5" />
              <span className="text-xs">Profile</span>
            </Link>
          ) : (
            <Link href="/login">
              <User className="h-5 w-5" />
              <span className="text-xs">Login</span>
            </Link>
          )}
        </Button>
      </div>
    </div>
  );
}
