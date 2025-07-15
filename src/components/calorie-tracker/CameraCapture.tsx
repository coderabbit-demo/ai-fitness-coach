'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, FlipVertical, X } from 'lucide-react'
import { CameraUtils } from '@/utils/camera-utils'
import { CameraError } from '@/lib/nutrition-types'

interface CameraCaptureProps {
  onCapture: (imageBlob: Blob) => void
  onCancel: () => void
  className?: string
}

/**
 * React component that provides a user interface for capturing images from the device camera.
 *
 * Displays a live camera feed, allows toggling between front and rear cameras, and enables users to capture an image as a JPEG blob. Handles camera permission requests, initialization, and error states. Invokes the provided callback with the captured image or when the user cancels the operation.
 *
 * @param onCapture - Callback invoked with the captured image blob when a photo is taken
 * @param onCancel - Callback invoked when the user cancels the capture process
 * @param className - Optional CSS class for custom styling
 * @returns The rendered camera capture UI component
 */
export default function CameraCapture({ onCapture, onCancel, className }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<CameraError | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const initializeCamera = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const permissionResult = await CameraUtils.requestCameraPermission()
    
    if (!permissionResult.granted) {
      setError(permissionResult.error!)
      setIsLoading(false)
      return
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode
        }
      })

      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Camera initialization failed:', error)
      setError({
        type: 'unknown',
        message: 'Failed to initialize camera'
      })
    } finally {
      setIsLoading(false)
    }
  }, [facingMode])

  useEffect(() => {
    initializeCamera()
    return () => {
      if (stream) {
        CameraUtils.stopCameraStream(stream)
      }
    }
  }, [initializeCamera, stream])

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        onCapture(blob)
      } else {
        // Handle blob conversion failure
        console.error('Failed to convert canvas to blob')
        alert('Failed to capture image. Please try again.')
      }
    }, 'image/jpeg', 0.8)
  }

  const toggleCamera = () => {
    if (stream) {
      CameraUtils.stopCameraStream(stream)
    }
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-2">
            <Button onClick={initializeCamera} variant="outline">
              Try Again
            </Button>
            <Button onClick={onCancel} variant="ghost">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto rounded-lg bg-gray-100"
            style={{ aspectRatio: '4/3' }}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Starting camera...</p>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="mt-4 flex justify-between items-center">
          <Button onClick={onCancel} variant="ghost" size="sm">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          <Button
            onClick={captureImage}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Camera className="h-4 w-4 mr-2" />
            Capture
          </Button>
          
          <Button onClick={toggleCamera} variant="outline" size="sm">
            <FlipVertical className="h-4 w-4 mr-2" />
            Flip
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}