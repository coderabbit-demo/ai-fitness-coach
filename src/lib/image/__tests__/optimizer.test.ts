import { ImageOptimizer, imageOptimizer } from '../optimizer';

// Mock URL methods
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock Image constructor
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = '';
  width: number = 800;
  height: number = 600;

  constructor() {
    // Simulate async image loading
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
}

global.Image = MockImage as any;

// Mock Canvas and CanvasRenderingContext2D
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(),
  toBlob: jest.fn(),
  toDataURL: jest.fn(() => 'data:image/jpeg;base64,mockImageData'),
};

const mockContext = {
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
  drawImage: jest.fn(),
};

global.document = {
  createElement: jest.fn(() => mockCanvas),
} as any;

describe('ImageOptimizer', () => {
  let optimizer: ImageOptimizer;

  beforeEach(() => {
    jest.clearAllMocks();
    optimizer = new ImageOptimizer();
    
    // Reset mock implementations
    mockCanvas.getContext.mockReturnValue(mockContext);
    mockCanvas.toBlob.mockImplementation((callback) => {
      const blob = new Blob(['mock-image-data'], { type: 'image/jpeg' });
      callback(blob);
    });
  });

  describe('Initialization', () => {
    it('should create instance with default options', () => {
      expect(optimizer).toBeInstanceOf(ImageOptimizer);
      expect((optimizer as any).defaultOptions).toEqual({
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.85,
        format: 'webp'
      });
    });

    it('should return null in server environment', () => {
      expect(imageOptimizer).toBeNull(); // Since we're in test environment without DOM
    });
  });

  describe('Image Optimization', () => {
    let mockFile: File;

    beforeEach(() => {
      mockFile = new File(['mock-image-data'], 'test-image.jpg', {
        type: 'image/jpeg'
      });
    });

    it('should optimize image with default options', async () => {
      const result = await optimizer.optimizeForUpload(mockFile);
      
      expect(result).toBeInstanceOf(File);
      expect(result.name).toBe('test-image_optimized.webp');
      expect(result.type).toBe('image/webp');
      
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockContext.drawImage).toHaveBeenCalled();
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/webp',
        0.85
      );
    });

    it('should optimize image with custom options', async () => {
      const customOptions = {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.7,
        format: 'jpeg' as const
      };

      const result = await optimizer.optimizeForUpload(mockFile, customOptions);
      
      expect(result.name).toBe('test-image_optimized.jpeg');
      expect(result.type).toBe('image/jpeg');
      
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        0.7
      );
    });

    it('should handle optimization errors', async () => {
      // Mock canvas context not available
      mockCanvas.getContext.mockReturnValue(null);
      
      await expect(optimizer.optimizeForUpload(mockFile))
        .rejects.toThrow('Canvas context not available');
    });

    it('should handle image load errors', async () => {
      // Override MockImage to simulate error
      class ErrorImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';

        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 0);
        }
      }

      global.Image = ErrorImage as any;
      
      await expect(optimizer.optimizeForUpload(mockFile))
        .rejects.toThrow('Failed to load image');
    });

    it('should handle blob creation failure', async () => {
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(null); // Simulate blob creation failure
      });
      
      await expect(optimizer.optimizeForUpload(mockFile))
        .rejects.toThrow('Failed to create blob');
    });

    it('should log compression statistics', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await optimizer.optimizeForUpload(mockFile);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Image optimized:')
      );
      
      consoleSpy.mockRestore();
    });

    it('should clean up object URLs', async () => {
      await optimizer.optimizeForUpload(mockFile);
      
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-object-url');
    });
  });

  describe('Batch Optimization', () => {
    it('should optimize multiple images', async () => {
      const files = [
        new File(['data1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['data2'], 'image2.png', { type: 'image/png' }),
        new File(['data3'], 'image3.webp', { type: 'image/webp' })
      ];

      const results = await optimizer.optimizeBatch(files);
      
      expect(results).toHaveLength(3);
      expect(results[0].name).toBe('image1_optimized.webp');
      expect(results[1].name).toBe('image2_optimized.webp');
      expect(results[2].name).toBe('image3_optimized.webp');
    });

    it('should handle batch optimization with custom options', async () => {
      const files = [
        new File(['data1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['data2'], 'image2.png', { type: 'image/png' })
      ];

      const customOptions = {
        format: 'jpeg' as const,
        quality: 0.9
      };

      const results = await optimizer.optimizeBatch(files, customOptions);
      
      expect(results).toHaveLength(2);
      expect(results[0].type).toBe('image/jpeg');
      expect(results[1].type).toBe('image/jpeg');
    });
  });

  describe('Dimension Calculation', () => {
    it('should preserve original dimensions when smaller than constraints', () => {
      const result = (optimizer as any).calculateDimensions(
        500, 400, { maxWidth: 1024, maxHeight: 768 }
      );
      
      expect(result).toEqual({ width: 500, height: 400 });
    });

    it('should scale down proportionally when width exceeds constraint', () => {
      const result = (optimizer as any).calculateDimensions(
        2048, 1024, { maxWidth: 1024, maxHeight: 768 }
      );
      
      expect(result).toEqual({ width: 1024, height: 512 });
    });

    it('should scale down proportionally when height exceeds constraint', () => {
      const result = (optimizer as any).calculateDimensions(
        800, 1600, { maxWidth: 1024, maxHeight: 768 }
      );
      
      expect(result).toEqual({ width: 384, height: 768 });
    });

    it('should scale down proportionally when both dimensions exceed constraints', () => {
      const result = (optimizer as any).calculateDimensions(
        2048, 1536, { maxWidth: 1024, maxHeight: 768 }
      );
      
      expect(result).toEqual({ width: 1024, height: 768 });
    });

    it('should handle square images correctly', () => {
      const result = (optimizer as any).calculateDimensions(
        1000, 1000, { maxWidth: 500, maxHeight: 500 }
      );
      
      expect(result).toEqual({ width: 500, height: 500 });
    });
  });

  describe('File Name Generation', () => {
    it('should generate optimized filename with new format', () => {
      const result = (optimizer as any).generateFileName('photo.jpg', 'webp');
      expect(result).toBe('photo_optimized.webp');
    });

    it('should handle filenames without extension', () => {
      const result = (optimizer as any).generateFileName('photo', 'png');
      expect(result).toBe('photo_optimized.png');
    });

    it('should handle filenames with multiple dots', () => {
      const result = (optimizer as any).generateFileName('my.photo.image.jpg', 'webp');
      expect(result).toBe('my.photo.image_optimized.webp');
    });

    it('should handle empty filename', () => {
      const result = (optimizer as any).generateFileName('', 'jpeg');
      expect(result).toBe('_optimized.jpeg');
    });
  });

  describe('Thumbnail Creation', () => {
    it('should create thumbnail with default size', async () => {
      const mockFile = new File(['mock-data'], 'image.jpg', { type: 'image/jpeg' });
      
      const result = await optimizer.createThumbnail(mockFile);
      
      expect(result).toBe('data:image/jpeg;base64,mockImageData');
      expect(mockCanvas.width).toBe(150);
      expect(mockCanvas.height).toBe(150);
      expect(mockContext.drawImage).toHaveBeenCalled();
    });

    it('should create thumbnail with custom size', async () => {
      const mockFile = new File(['mock-data'], 'image.jpg', { type: 'image/jpeg' });
      const customSize = 200;
      
      const result = await optimizer.createThumbnail(mockFile, customSize);
      
      expect(result).toBe('data:image/jpeg;base64,mockImageData');
      expect(mockCanvas.width).toBe(customSize);
      expect(mockCanvas.height).toBe(customSize);
    });

    it('should handle thumbnail creation errors', async () => {
      mockCanvas.getContext.mockReturnValue(null);
      const mockFile = new File(['mock-data'], 'image.jpg', { type: 'image/jpeg' });
      
      await expect(optimizer.createThumbnail(mockFile))
        .rejects.toThrow('Canvas context not available');
    });

    it('should calculate crop dimensions for square thumbnail', async () => {
      // Mock rectangular image
      class RectangularImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';
        width: number = 1200;
        height: number = 800;

        constructor() {
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 0);
        }
      }

      global.Image = RectangularImage as any;
      
      const mockFile = new File(['mock-data'], 'image.jpg', { type: 'image/jpeg' });
      await optimizer.createThumbnail(mockFile, 100);
      
      // Should crop from center - the smaller dimension (800) should be used as source size
      // sourceX = (1200 - 800) / 2 = 200, sourceY = (800 - 800) / 2 = 0
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        expect.any(RectangularImage),
        200, 0, 800, 800, // Source crop
        0, 0, 100, 100 // Destination
      );
    });
  });

  describe('Image Validation', () => {
    it('should identify image files correctly', () => {
      const imageFile = new File(['data'], 'image.jpg', { type: 'image/jpeg' });
      const textFile = new File(['data'], 'document.txt', { type: 'text/plain' });
      
      expect(optimizer.isImageFile(imageFile)).toBe(true);
      expect(optimizer.isImageFile(textFile)).toBe(false);
    });

    it('should handle various image types', () => {
      const jpegFile = new File(['data'], 'image.jpg', { type: 'image/jpeg' });
      const pngFile = new File(['data'], 'image.png', { type: 'image/png' });
      const webpFile = new File(['data'], 'image.webp', { type: 'image/webp' });
      const gifFile = new File(['data'], 'image.gif', { type: 'image/gif' });
      
      expect(optimizer.isImageFile(jpegFile)).toBe(true);
      expect(optimizer.isImageFile(pngFile)).toBe(true);
      expect(optimizer.isImageFile(webpFile)).toBe(true);
      expect(optimizer.isImageFile(gifFile)).toBe(true);
    });
  });

  describe('Image Dimensions', () => {
    it('should get image dimensions', async () => {
      const mockFile = new File(['mock-data'], 'image.jpg', { type: 'image/jpeg' });
      
      const dimensions = await optimizer.getImageDimensions(mockFile);
      
      expect(dimensions).toEqual({ width: 800, height: 600 });
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile);
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should handle dimension retrieval errors', async () => {
      class ErrorImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';

        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 0);
        }
      }

      global.Image = ErrorImage as any;
      
      const mockFile = new File(['mock-data'], 'image.jpg', { type: 'image/jpeg' });
      
      await expect(optimizer.getImageDimensions(mockFile))
        .rejects.toThrow('Failed to load image');
    });
  });

  describe('EXIF Data Extraction', () => {
    it('should return mock EXIF data with warning', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockFile = new File(['mock-data'], 'image.jpg', { type: 'image/jpeg' });
      
      const exifData = await optimizer.extractEXIFData(mockFile);
      
      expect(exifData).toEqual({
        orientation: 1,
        dateTime: expect.any(Date),
        make: null,
        model: null,
        gpsInfo: null,
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'extractEXIFData is not implemented - returning mock data'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Quality Settings', () => {
    it('should respect quality settings for different formats', async () => {
      const mockFile = new File(['mock-data'], 'image.jpg', { type: 'image/jpeg' });
      
      // Test JPEG quality
      await optimizer.optimizeForUpload(mockFile, { format: 'jpeg', quality: 0.9 });
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        0.9
      );
      
      // Test WebP quality
      await optimizer.optimizeForUpload(mockFile, { format: 'webp', quality: 0.8 });
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/webp',
        0.8
      );
      
      // Test PNG (quality should still be passed but PNG ignores it)
      await optimizer.optimizeForUpload(mockFile, { format: 'png', quality: 0.7 });
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/png',
        0.7
      );
    });
  });

  describe('Image Smoothing', () => {
    it('should enable high-quality image smoothing', async () => {
      const mockFile = new File(['mock-data'], 'image.jpg', { type: 'image/jpeg' });
      
      await optimizer.optimizeForUpload(mockFile);
      
      expect(mockContext.imageSmoothingEnabled).toBe(true);
      expect(mockContext.imageSmoothingQuality).toBe('high');
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources on success', async () => {
      const mockFile = new File(['mock-data'], 'image.jpg', { type: 'image/jpeg' });
      
      await optimizer.optimizeForUpload(mockFile);
      
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-object-url');
    });

    it('should clean up resources on error', async () => {
      mockCanvas.getContext.mockReturnValue(null);
      const mockFile = new File(['mock-data'], 'image.jpg', { type: 'image/jpeg' });
      
      try {
        await optimizer.optimizeForUpload(mockFile);
      } catch (error) {
        // Expected error
      }
      
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-object-url');
    });
  });
}); 