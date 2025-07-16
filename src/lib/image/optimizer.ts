interface ImageOptimizationOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
}

export class ImageOptimizer {
  private defaultOptions: ImageOptimizationOptions = {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.85,
    format: 'webp'
  };

  async optimizeForUpload(
    file: File, 
    options?: Partial<ImageOptimizationOptions>
  ): Promise<File> {
    const opts = { ...this.defaultOptions, ...options };
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            { maxWidth: opts.maxWidth, maxHeight: opts.maxHeight }
          );
          
          canvas.width = width;
          canvas.height = height;
          
          // Apply smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }
              
              const optimizedFile = new File(
                [blob], 
                this.generateFileName(file.name, opts.format),
                { type: `image/${opts.format}` }
              );
              
              // Log compression stats
              const compressionRatio = ((file.size - optimizedFile.size) / file.size * 100).toFixed(1);
              console.log(`Image optimized: ${file.size} → ${optimizedFile.size} bytes (${compressionRatio}% reduction)`);
              
              resolve(optimizedFile);
            },
            `image/${opts.format}`,
            opts.quality
          );
        } catch (error) {
          reject(error);
        } finally {
          // Clean up
          URL.revokeObjectURL(img.src);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  async optimizeBatch(
    files: File[], 
    options?: Partial<ImageOptimizationOptions>
  ): Promise<File[]> {
    const promises = files.map(file => this.optimizeForUpload(file, options));
    return Promise.all(promises);
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    constraints: { maxWidth: number; maxHeight: number }
  ): { width: number; height: number } {
    // If image is already smaller than constraints, return original dimensions
    if (originalWidth <= constraints.maxWidth && originalHeight <= constraints.maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }
    
    // Calculate scaling ratio
    const widthRatio = constraints.maxWidth / originalWidth;
    const heightRatio = constraints.maxHeight / originalHeight;
    const ratio = Math.min(widthRatio, heightRatio);
    
    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  }

  private generateFileName(originalName: string, format: string): string {
    const nameParts = originalName.split('.');
    const baseName = nameParts.slice(0, -1).join('.') || originalName;
    return `${baseName}_optimized.${format}`;
  }

  async createThumbnail(
    file: File, 
    size: number = 150
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        try {
          // Square thumbnail
          canvas.width = size;
          canvas.height = size;
          
          // Calculate crop dimensions
          const sourceSize = Math.min(img.width, img.height);
          const sourceX = (img.width - sourceSize) / 2;
          const sourceY = (img.height - sourceSize) / 2;
          
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceSize, sourceSize,
            0, 0, size, size
          );
          
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(thumbnailUrl);
        } catch (error) {
          reject(error);
        } finally {
          URL.revokeObjectURL(img.src);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  async extractEXIFData(_file: File): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
    // ⚠️ UNIMPLEMENTED: This method is a placeholder and does not extract real EXIF data
    // TODO: Implement EXIF extraction using a library like:
    // - exif-js: https://github.com/exif-js/exif-js
    // - piexifjs: https://github.com/hMatoba/piexifjs  
    // - exifr: https://github.com/MikeKovarik/exifr
    console.warn('extractEXIFData is not implemented - returning mock data');
    
    return {
      orientation: 1, // Default orientation (no rotation needed)
      dateTime: new Date(), // Current date as placeholder
      make: null, // Camera manufacturer - not extracted
      model: null, // Camera model - not extracted
      gpsInfo: null, // GPS coordinates - not extracted
      // Real implementation should extract actual EXIF metadata from the image file
    };
  }
}

// Singleton instance - only create in browser environment
export const imageOptimizer = typeof window !== 'undefined' ? new ImageOptimizer() : null as any;