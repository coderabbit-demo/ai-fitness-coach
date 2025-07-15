import { CameraError } from '@/lib/nutrition-types'

export class CameraUtils {
  static async requestCameraPermission(): Promise<{ 
    granted: boolean 
    error?: CameraError 
  }> {
    try {
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          granted: false,
          error: {
            type: 'not_supported',
            message: 'Camera not supported on this device'
          }
        }
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment' // Use rear camera
        }
      })

      // Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach(track => track.stop())

      return { granted: true }
    } catch (error) {
      const err = error as Error
      
      if (err.name === 'NotAllowedError') {
        return {
          granted: false,
          error: {
            type: 'permission',
            message: 'Camera permission denied'
          }
        }
      }
      
      if (err.name === 'NotFoundError') {
        return {
          granted: false,
          error: {
            type: 'hardware',
            message: 'No camera found'
          }
        }
      }

      return {
        granted: false,
        error: {
          type: 'unknown',
          message: err.message
        }
      }
    }
  }

  static async getCameraStream(): Promise<MediaStream | null> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment'
        }
      })
    } catch {
      return null
    }
  }

  static stopCameraStream(stream: MediaStream): void {
    stream.getTracks().forEach(track => track.stop())
  }
}