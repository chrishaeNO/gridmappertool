import { useState, useCallback, DragEvent } from 'react';
import { compressImage, shouldCompressFile, formatFileSize, type CompressionResult } from '@/utils/image-compression';

interface UseDragDropOptions {
  onFileUpload: (file: File) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in bytes
  onCompressionStart?: () => void;
  onCompressionComplete?: (result: CompressionResult) => void;
  onError?: (error: string) => void;
}

export function useDragDrop({ 
  onFileUpload, 
  acceptedTypes = ['image/*', 'application/pdf'],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  onCompressionStart,
  onCompressionComplete,
  onError
}: UseDragDropOptions) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const validateFile = useCallback((file: File): boolean => {
    // Check if file type is accepted
    return acceptedTypes.some(type => {
      if (type === 'image/*') {
        return file.type.startsWith('image/');
      }
      if (type === 'application/pdf') {
        return file.type === 'application/pdf';
      }
      return file.type === type;
    });
  }, [acceptedTypes]);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragOver to false if we're leaving the drop zone entirely
    // Check if the related target is not a child of the current target
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFile = useCallback(async (file: File) => {
    try {
      // Validate file type
      if (!validateFile(file)) {
        onError?.(`Unsupported file type. Please upload an image or PDF file.`);
        return;
      }

      // Check file size for PDFs (no compression available)
      if (file.type === 'application/pdf' && file.size > maxFileSize) {
        onError?.(`PDF file is too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(maxFileSize)}.`);
        return;
      }

      // Handle image files with potential compression
      if (file.type.startsWith('image/')) {
        if (shouldCompressFile(file, maxFileSize)) {
          setIsCompressing(true);
          onCompressionStart?.();

          try {
            const result = await compressImage(file, {
              maxSizeBytes: maxFileSize,
              maxWidth: 4096,
              maxHeight: 4096,
              quality: 0.9
            });

            onCompressionComplete?.(result);
            onFileUpload(result.file);
          } catch (compressionError) {
            console.error('Compression failed:', compressionError);
            onError?.(`Failed to compress image. Please try a smaller file or different format.`);
          } finally {
            setIsCompressing(false);
          }
        } else {
          onFileUpload(file);
        }
      } else {
        onFileUpload(file);
      }
    } catch (error) {
      console.error('File processing error:', error);
      onError?.('Failed to process file. Please try again.');
      setIsCompressing(false);
    }
  }, [validateFile, maxFileSize, onFileUpload, onCompressionStart, onCompressionComplete, onError]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0]; // Take the first file

    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const dragProps = {
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  };

  return {
    isDragOver,
    isCompressing,
    dragProps,
    processFile, // Expose for manual file processing
  };
}
