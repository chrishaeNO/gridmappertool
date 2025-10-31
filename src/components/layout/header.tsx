import { Grid, Download, PanelLeft, Share2, LogOut, LayoutDashboard, Save, Menu, Plus, Target, ZoomIn, ZoomOut, Maximize2, Palette, User, Map } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import UserAvatar from "@/components/user-avatar";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import { BiLogoMicrosoftTeams } from "react-icons/bi";
import { ImOnedrive } from "react-icons/im";
import { FaGoogleDrive } from "react-icons/fa";


type HeaderProps = {
  onExport?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onNewMap?: () => void;
  onOneDriveIntegration?: () => void;
  onTeamsIntegration?: () => void;
  onGoogleDriveIntegration?: () => void;
  hasImage: boolean;
  onImageUpload?: (file: File) => void;
  gridMapperProps?: Omit<GridMapperProps, 'imageSrc' | 'imageDimensions' | 'onImageUpload' | 'onImageLoad' | 'gridOffset'>;
  isMobileSheetOpen?: boolean;
  setMobileSheetOpen?: Dispatch<SetStateAction<boolean>>;
  onMobileControlsToggle?: () => void;
  showReferencePoints?: boolean;
  onToggleReferencePoints?: (enabled: boolean) => void;
  // Zoom controls
  imageZoom?: number;
  onZoomChange?: (zoom: number) => void;
  onFitToScreen?: () => void;
  // Reference colors
  referenceColors?: { top: string; right: string; bottom: string; left: string };
  onReferenceColorsChange?: (colors: { top: string; right: string; bottom: string; left: string }) => void;
};

function AuthActions() {
    const { user, logout } = useAuth();
    const [mapCount, setMapCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const MAX_MAPS = 10;

    useEffect(() => {
        if (user) {
            fetchMapCount();
        }
    }, [user]);

    // Add a custom event listener to refresh map count when maps change
    useEffect(() => {
        const handleMapCountChange = () => {
            if (user) {
                fetchMapCount();
            }
        };

        window.addEventListener('mapCountChanged', handleMapCountChange);
        return () => window.removeEventListener('mapCountChanged', handleMapCountChange);
    }, [user]);

    const fetchMapCount = async () => {
        try {
            const response = await fetch('/api/grid-maps-simple');
            if (response.ok) {
                const data = await response.json();
                setMapCount(data.maps?.length || 0);
            }
        } catch (error) {
            console.error('Failed to fetch map count:', error);
        } finally {
            setLoading(false);
        }
    };

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
                        <p className="text-sm font-medium leading-none">
                          {user.name || user.email.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Grid Maps Usage */}
                <div className="px-2 py-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Map className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Grid Maps</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                            {loading ? '...' : `${mapCount}/${MAX_MAPS}`}
                        </span>
                    </div>
                    <Progress 
                        value={loading ? 0 : (mapCount / MAX_MAPS) * 100} 
                        className={`h-2 ${
                          loading ? '' : 
                          mapCount <= 5 ? '[&>div]:bg-green-500' : // Green when 5 or less
                          mapCount <= 8 ? '[&>div]:bg-orange-500' : // Orange when 6-8
                          '[&>div]:bg-red-500' // Red when 9-10
                        }`}
                    />
                    {mapCount >= MAX_MAPS && (
                        <p className="text-xs text-destructive mt-1">
                            Map limit reached
                        </p>
                    )}
                </div>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                     <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                     <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
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

export default function Header({ onExport, onShare, onSave, onNewMap, onOneDriveIntegration, onTeamsIntegration, onGoogleDriveIntegration, hasImage, onImageUpload, gridMapperProps, isMobileSheetOpen, setMobileSheetOpen, onMobileControlsToggle, showReferencePoints, onToggleReferencePoints, imageZoom, onZoomChange, onFitToScreen, referenceColors, onReferenceColorsChange }: HeaderProps) {
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
    <header className="flex items-center justify-between h-16 px-3 md:px-6 border-b shrink-0 z-10 bg-card/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <div className="flex items-center justify-center size-8 md:size-9 bg-primary/10 rounded-lg shadow-inner shrink-0">
            <Grid className="size-4 md:size-5 text-primary" />
          </div>
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <h1 className="text-lg md:text-xl font-semibold text-foreground tracking-tight shrink-0">
              GridMapper
            </h1>
            {gridMapperProps?.mapName && (
              <>
                <span className="text-muted-foreground hidden sm:inline">•</span>
                {isEditingMapName ? (
                  <input
                    ref={mapNameInputRef}
                    type="text"
                    value={gridMapperProps.mapName}
                    onChange={(e) => gridMapperProps.setMapName(e.target.value)}
                    onBlur={handleMapNameSubmit}
                    onKeyDown={handleMapNameKeyDown}
                    className="text-sm md:text-lg font-medium bg-transparent border-none outline-none focus:bg-background focus:border focus:border-ring rounded px-1 md:px-2 py-1 min-w-[80px] md:min-w-[120px] flex-1"
                  />
                ) : (
                  <span 
                    className="text-sm md:text-lg font-medium text-foreground cursor-pointer hover:text-primary transition-colors truncate min-w-0"
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
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        {/* Mobile: Only Export button */}
        {isEditorPage && onExport && (
          <Button onClick={onExport} disabled={!hasImage} size="icon" className="md:hidden h-9 w-9 touch-manipulation">
            <Download className="h-4 w-4" />
            <span className="sr-only">Export</span>
          </Button>
        )}
        
        {/* Desktop: All buttons */}
        {onNewMap && (
          <Button onClick={onNewMap} variant="outline" className="hidden md:inline-flex">
            <Plus className="mr-2 h-4 w-4" />
            New Gridmap
          </Button>
        )}
        
        {/* Reference Points Toggle - Only show when image is loaded */}
        {hasImage && onToggleReferencePoints && (
          <div className="hidden md:flex items-center space-x-2 px-3 py-2 border rounded-md bg-background">
            <Target className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="reference-points" className="text-sm font-medium cursor-pointer">
              Reference Points
            </Label>
            <Switch
              id="reference-points"
              checked={showReferencePoints || false}
              onCheckedChange={onToggleReferencePoints}
            />
          </div>
        )}
        
        {/* Zoom Controls - Only show when image is loaded and not read-only */}
        {hasImage && imageZoom !== undefined && onZoomChange && onFitToScreen && (
          <div className="hidden md:flex items-center gap-1 px-2 py-1 border rounded-md bg-background">
            <Button
              onClick={() => onZoomChange(Math.max(0.1, imageZoom - 0.1))}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-2 min-w-[3rem] text-center">
              {Math.round(imageZoom * 100)}%
            </span>
            <Button
              onClick={() => onZoomChange(Math.min(5, imageZoom + 0.1))}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              onClick={onFitToScreen}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 ml-1"
              title="Fit to Screen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {isEditorPage && onShare && onExport && onSave &&(
            <>
                <Button onClick={onSave} disabled={!hasImage} variant="outline" size="icon" className="hidden md:inline-flex" title="Save">
                    <Save className="h-4 w-4" />
                </Button>
                <Button onClick={onShare} disabled={!hasImage} variant="outline" size="icon" className="hidden md:inline-flex" title="Share">
                    <Share2 className="h-4 w-4" />
                </Button>
                {onOneDriveIntegration && (
                  <Button onClick={onOneDriveIntegration} disabled={!hasImage} variant="outline" size="icon" className="hidden md:inline-flex" title="Save to OneDrive">
                    <ImOnedrive className="h-4 w-4 text-blue-600" />
                  </Button>
                )}
                {onTeamsIntegration && (
                  <Button onClick={onTeamsIntegration} disabled={!hasImage} variant="outline" size="icon" className="hidden md:inline-flex" title="Share to Teams">
                    <BiLogoMicrosoftTeams className="h-4 w-4 text-purple-600" />
                  </Button>
                )}
                {onGoogleDriveIntegration && (
                  <Button onClick={onGoogleDriveIntegration} disabled={!hasImage} variant="outline" size="icon" className="hidden md:inline-flex" title="Save to Google Drive">
                    <FaGoogleDrive className="h-4 w-4 text-green-600" />
                  </Button>
                )}
                <Button onClick={onExport} disabled={!hasImage} className="hidden md:inline-flex">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
             </>
        )}
        
        {/* Desktop: Auth Actions */}
        <div className="hidden md:block">
          <AuthActions />
        </div>
      </div>
    </header>
  );
}
