export interface CompressionOptions {
  maxSizeBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: 'jpeg' | 'png' | 'webp';
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  wasCompressed: boolean;
}

/**
 * Compresses an image file while trying to maintain quality
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxSizeBytes = 5 * 1024 * 1024, // 5MB default
    maxWidth = 4096,
    maxHeight = 4096,
    quality = 0.9,
    outputFormat = 'jpeg'
  } = options;

  const originalSize = file.size;

  // If file is already small enough, return as-is
  if (originalSize <= maxSizeBytes) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      wasCompressed: false
    };
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = calculateDimensions(img.width, img.height, maxWidth, maxHeight);
        
        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        // Draw image with high quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels to get under the size limit
        compressWithQuality(canvas, outputFormat, quality, maxSizeBytes, file.name)
          .then(result => {
            resolve({
              file: result,
              originalSize,
              compressedSize: result.size,
              compressionRatio: result.size / originalSize,
              wasCompressed: true
            });
          })
          .catch(reject);

      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Scale down if too large
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Compress with different quality levels until size target is met
 */
async function compressWithQuality(
  canvas: HTMLCanvasElement,
  format: string,
  initialQuality: number,
  maxSizeBytes: number,
  originalName: string
): Promise<File> {
  let quality = initialQuality;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, `image/${format}`, quality);
    });

    if (!blob) {
      throw new Error('Failed to create blob from canvas');
    }

    // If size is acceptable or we've tried enough times, return this version
    if (blob.size <= maxSizeBytes || attempts === maxAttempts - 1) {
      const extension = format === 'jpeg' ? 'jpg' : format;
      const name = originalName.replace(/\.[^/.]+$/, `.${extension}`);
      return new File([blob], name, { type: `image/${format}` });
    }

    // Reduce quality for next attempt
    quality *= 0.8;
    attempts++;
  }

  throw new Error('Could not compress image to target size');
}

/**
 * Check if a file needs compression based on size
 */
export function shouldCompressFile(file: File, maxSizeBytes: number = 5 * 1024 * 1024): boolean {
  return file.size > maxSizeBytes && file.type.startsWith('image/');
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
