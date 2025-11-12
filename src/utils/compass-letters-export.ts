/**
 * Utility functions for drawing compass letters (N, S, E, W) on canvas during export
 */

export interface CompassLettersSettings {
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
}

export interface CanvasDrawOptions {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scale: number; // Export scale factor
  imageOffsetX: number; // X offset of the image content
  imageOffsetY: number; // Y offset of the image content
  imageWidth: number; // Width of the image content
  imageHeight: number; // Height of the image content
  showReferencePoints: boolean; // Whether reference lines are shown
  labelColor: string; // Color to use for compass letters (same as grid labels)
}

/**
 * Calculates the extra space needed for compass letters
 * Letters should be positioned outside grid labels and reference lines
 */
export function getCompassLettersSpacing(
  settings: CompassLettersSettings,
  scale: number,
  showReferencePoints: boolean
): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  const letterSize = 16 * scale; // Smaller letter size (tynnere)
  const letterSpacing = 2 * scale; // Minimal spacing
  const referenceLineOffset = showReferencePoints ? 7 * scale : 0; // Exactly 7px from reference lines
  const labelOffset = 30 * scale; // Space for grid labels (A,B,C... and 1,2,3...)
  
  // Total space needed: letter size + spacing + reference line offset + label offset
  const totalSpacing = letterSize + letterSpacing + referenceLineOffset + labelOffset;
  
  return {
    top: settings.north ? totalSpacing : 0,
    right: settings.east ? totalSpacing : 0,
    bottom: settings.south ? totalSpacing : 0,
    left: settings.west ? totalSpacing : 0
  };
}

/**
 * Draws compass letters on the canvas outside the reference lines
 */
export function drawCompassLetters(
  settings: CompassLettersSettings,
  options: CanvasDrawOptions
): void {
  const { canvas, ctx, scale, imageOffsetX, imageOffsetY, imageWidth, imageHeight, showReferencePoints, labelColor } = options;
  
  if (!settings.north && !settings.south && !settings.east && !settings.west) {
    return; // No letters to draw
  }

  const letterSize = 16 * scale; // Smaller letter size (tynnere)
  const letterSpacing = 2 * scale; // Minimal spacing
  const referenceLineOffset = showReferencePoints ? 7 * scale : 0; // Exactly 7px from reference lines
  const labelOffset = 30 * scale; // Space for grid labels
  
  ctx.save();
  
  // Set font properties for compass letters (tynnere og nærmere)
  ctx.font = `${letterSize}px Arial, sans-serif`; // Removed bold for thinner appearance
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = labelColor; // Same color as grid labels
  ctx.strokeStyle = '#ffffff'; // White outline for better visibility
  ctx.lineWidth = 1 * scale; // Thinner outline

  // Draw North (N) at the top - close to reference line or grid labels
  if (settings.north) {
    const x = imageOffsetX + imageWidth / 2;
    let y;
    
    if (showReferencePoints) {
      // Position exactly 7px above the reference line
      const referenceLineY = imageOffsetY - labelOffset - 10 * scale;
      y = referenceLineY - referenceLineOffset - letterSize / 2;
    } else {
      // Position close to grid labels when no reference lines
      y = imageOffsetY - labelOffset / 2 - letterSize / 2 - 5 * scale; // 5px above labels
    }
    
    ctx.strokeText('N', x, y);
    ctx.fillText('N', x, y);
  }

  // Draw South (S) at the bottom - close to reference line or grid labels
  if (settings.south) {
    const x = imageOffsetX + imageWidth / 2;
    let y;
    
    if (showReferencePoints) {
      // Position exactly 7px below the reference line
      const referenceLineY = imageOffsetY + imageHeight + labelOffset + 10 * scale;
      y = referenceLineY + referenceLineOffset + letterSize / 2;
    } else {
      // Position close to grid labels when no reference lines
      y = imageOffsetY + imageHeight + labelOffset / 2 + letterSize / 2 + 5 * scale; // 5px below labels
    }
    
    ctx.strokeText('S', x, y);
    ctx.fillText('S', x, y);
  }

  // Draw East (E) at the right - close to reference line or grid labels
  if (settings.east) {
    let x;
    const y = imageOffsetY + imageHeight / 2;
    
    if (showReferencePoints) {
      // Position exactly 7px right of the reference line
      const referenceLineX = imageOffsetX + imageWidth + labelOffset + 10 * scale;
      x = referenceLineX + referenceLineOffset + letterSize / 2;
    } else {
      // Position close to grid labels when no reference lines
      x = imageOffsetX + imageWidth + labelOffset / 2 + letterSize / 2 + 5 * scale; // 5px right of labels
    }
    
    ctx.strokeText('E', x, y);
    ctx.fillText('E', x, y);
  }

  // Draw West (W) at the left - close to reference line or grid labels
  if (settings.west) {
    let x;
    const y = imageOffsetY + imageHeight / 2;
    
    if (showReferencePoints) {
      // Position exactly 7px left of the reference line
      const referenceLineX = imageOffsetX - labelOffset - 10 * scale;
      x = referenceLineX - referenceLineOffset - letterSize / 2;
    } else {
      // Position close to grid labels when no reference lines
      x = imageOffsetX - labelOffset / 2 - letterSize / 2 - 5 * scale; // 5px left of labels
    }
    
    ctx.strokeText('W', x, y);
    ctx.fillText('W', x, y);
  }

  ctx.restore();
}

/**
 * Checks if any compass letters are enabled
 */
export function hasCompassLetters(settings: CompassLettersSettings): boolean {
  return settings.north || settings.south || settings.east || settings.west;
}
