import { Grid, Download, PanelLeft, Share2, LogOut, LayoutDashboard, Save, Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ControlPanel from "@/components/control-panel";
import type { GridMapperProps } from "@/components/grid-mapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import UserAvatar from "@/components/user-avatar";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";


type HeaderProps = {
  onExport?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onNewMap?: () => void;
  hasImage: boolean;
  onImageUpload?: (file: File) => void;
  gridMapperProps?: Omit<GridMapperProps, 'imageSrc' | 'imageDimensions' | 'onImageUpload' | 'onImageLoad' | 'gridOffset'>;
  isMobileSheetOpen?: boolean;
  setMobileSheetOpen?: Dispatch<SetStateAction<boolean>>;
};

function AuthActions() {
    const { user, logout } = useAuth();

    const handleSignOut = async () => {
        await logout();
    };

    if (!user) {
        return (
            <Button asChild>
                <Link href="/login">Sign In</Link>
            </Button>
        );
    }
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <UserAvatar />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                 <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                     <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function Header({ onExport, onShare, onSave, onNewMap, hasImage, onImageUpload, gridMapperProps, isMobileSheetOpen, setMobileSheetOpen }: HeaderProps) {
  const [isEditingMapName, setIsEditingMapName] = useState(false);
  const mapNameInputRef = useRef<HTMLInputElement>(null);

  const handleSliceNameChange = (index: number, newName: string) => {
    if (!gridMapperProps) return;
    const newSliceNames = [...gridMapperProps.sliceNames];
    newSliceNames[index] = newName;
    gridMapperProps.setSliceNames(newSliceNames);
  };

  const handleMapNameDoubleClick = () => {
    setIsEditingMapName(true);
  };

  const handleMapNameSubmit = () => {
    setIsEditingMapName(false);
  };

  const handleMapNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMapNameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingMapName(false);
    }
  };

  useEffect(() => {
    if (isEditingMapName && mapNameInputRef.current) {
      mapNameInputRef.current.focus();
      mapNameInputRef.current.select();
    }
  }, [isEditingMapName]);

  const isEditorPage = !!onExport;

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b shrink-0 z-10 bg-card/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {isEditorPage && (
            <div className="md:hidden">
            <Sheet open={isMobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle Controls</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-full max-w-sm">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>Controls</SheetTitle>
                    <SheetDescription>
                        Adjust your image and grid settings here.
                    </SheetDescription>
                    </SheetHeader>
                {gridMapperProps && onImageUpload && (
                    <ControlPanel
                        onImageUpload={onImageUpload}
                        hasImage={hasImage}
                        {...gridMapperProps}
                        setSliceNames={handleSliceNameChange}
                    />
                )}
                </SheetContent>
            </Sheet>
            </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-9 bg-primary/10 rounded-lg shadow-inner">
            <Grid className="size-5 text-primary" />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              GridMapper
            </h1>
            {gridMapperProps?.mapName && (
              <>
                <span className="text-muted-foreground">•</span>
                {isEditingMapName ? (
                  <input
                    ref={mapNameInputRef}
                    type="text"
                    value={gridMapperProps.mapName}
                    onChange={(e) => gridMapperProps.setMapName(e.target.value)}
                    onBlur={handleMapNameSubmit}
                    onKeyDown={handleMapNameKeyDown}
                    className="text-lg font-medium bg-transparent border-none outline-none focus:bg-background focus:border focus:border-ring rounded px-2 py-1 min-w-[120px]"
                  />
                ) : (
                  <span 
                    className="text-lg font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                    onDoubleClick={handleMapNameDoubleClick}
                    title="Double-click to edit map name"
                  >
                    {gridMapperProps.mapName}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onNewMap && (
          <>
            <Button onClick={onNewMap} variant="outline" size="icon" className="md:hidden">
              <Plus className="h-4 w-4" />
              <span className="sr-only">New Gridmap</span>
            </Button>
            <Button onClick={onNewMap} variant="outline" className="hidden md:inline-flex">
              <Plus className="mr-2 h-4 w-4" />
              New Gridmap
            </Button>
          </>
        )}
        {isEditorPage && onShare && onExport && onSave &&(
            <>
                <Button onClick={onSave} disabled={!hasImage} variant="outline" size="icon" className="md:hidden">
                    <Save className="h-4 w-4" />
                    <span className="sr-only">Save</span>
                </Button>
                <Button onClick={onShare} disabled={!hasImage} variant="outline" size="icon" className="md:hidden">
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share</span>
                </Button>
                <Button onClick={onExport} disabled={!hasImage} size="icon" className="md:hidden">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Export</span>
                </Button>
                <Button onClick={onSave} disabled={!hasImage} variant="outline" className="hidden md:inline-flex">
                    <Save className="mr-2 h-4 w-4" />
                    Save
                </Button>
                <Button onClick={onShare} disabled={!hasImage} variant="outline" className="hidden md:inline-flex">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                </Button>
                <Button onClick={onExport} disabled={!hasImage} className="hidden md:inline-flex">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
             </>
        )}
        <AuthActions />
      </div>
    </header>
  );
}
