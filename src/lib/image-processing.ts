export interface ImageProcessingOptions {
  maxWidth: number
  maxHeight: number
  quality: number
  format: 'jpeg' | 'webp'
}

export interface ProcessedImage {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

export class ImageProcessor {
  private defaultOptions: ImageProcessingOptions = {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    format: 'jpeg'
  }

  async processImage(
    file: File,
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<ProcessedImage> {
    const opts = { ...this.defaultOptions, ...options }
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate dimensions
        const { width, height } = this.calculateDimensions(
          img.width,
          img.height,
          opts.maxWidth,
          opts.maxHeight
        )

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, {
                type: `image/${opts.format}`,
                lastModified: Date.now()
              })

              resolve({
                file: processedFile,
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio: blob.size / file.size
              })
            } else {
              reject(new Error('Failed to process image'))
            }
          },
          `image/${opts.format}`,
          opts.quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight

    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight }
    }

    if (aspectRatio > 1) {
      return {
        width: Math.min(maxWidth, originalWidth),
        height: Math.min(maxWidth / aspectRatio, originalHeight)
      }
    } else {
      return {
        width: Math.min(maxHeight * aspectRatio, originalWidth),
        height: Math.min(maxHeight, originalHeight)
      }
    }
  }
}