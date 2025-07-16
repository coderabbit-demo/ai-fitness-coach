'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RotateCw, Zap, ZapOff, Grid3X3, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CameraProps {
  onCapture: (image: File) => void;
  onCancel: () => void;
  showGuidelines?: boolean;
  enableBatch?: boolean;
}

export const OptimizedCamera: React.FC<CameraProps> = ({
  onCapture,
  onCancel,
  showGuidelines = true,
  enableBatch = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [guidelines, setGuidelines] = useState(showGuidelines);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lightingQuality, setLightingQuality] = useState<'poor' | 'fair' | 'good'>('fair');
  const [batchPhotos, setBatchPhotos] = useState<File[]>([]);
  const [showTips, setShowTips] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const lightingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Camera tips
  const tips = [
    "Hold camera 12-18 inches from food",
    "Ensure good lighting - avoid shadows",
    "Include the entire meal in frame",
    "Keep camera steady for clear photos"
  ];
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    startCamera();
    
    // Rotate tips
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 4000);

    return () => {
      clearInterval(tipInterval);
      // Clean up lighting analysis interval
      if (lightingIntervalRef.current) {
        clearInterval(lightingIntervalRef.current);
      }
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      // Clean up existing stream before starting new one
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // Clear any existing lighting analysis
      if (lightingIntervalRef.current) {
        clearInterval(lightingIntervalRef.current);
      }

      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraError(null); // Clear any previous errors
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Start lighting analysis
      analyzeLighting();
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Unable to access camera';
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Camera access denied. Please allow camera permissions.';
            break;
          case 'NotFoundError':
            errorMessage = 'No camera found on this device.';
            break;
          case 'NotReadableError':
            errorMessage = 'Camera is already in use by another application.';
            break;
          case 'OverconstrainedError':
            errorMessage = 'Camera does not support the requested configuration.';
            break;
          default:
            errorMessage = 'Camera access failed. Please try again.';
        }
      }
      
      setCameraError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const analyzeLighting = () => {
    lightingIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 100;
      canvas.height = 100;
      ctx.drawImage(videoRef.current, 0, 0, 100, 100);

      const imageData = ctx.getImageData(0, 0, 100, 100);
      const data = imageData.data;
      
      let brightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
      }
      brightness = brightness / (data.length / 4);

      if (brightness < 50) {
        setLightingQuality('poor');
      } else if (brightness < 120) {
        setLightingQuality('fair');
      } else {
        setLightingQuality('good');
      }
    }, 1000);
  };

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply flash effect if enabled
    if (flashMode === 'on') {
      video.style.filter = 'brightness(1.5)';
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    ctx.drawImage(video, 0, 0);

    // Reset flash effect
    if (flashMode === 'on') {
      video.style.filter = 'brightness(1)';
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `meal-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        if (enableBatch) {
          setBatchPhotos([...batchPhotos, file]);
        } else {
          onCapture(file);
        }
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.9);
  }, [flashMode, enableBatch, batchPhotos, onCapture]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const toggleFlash = () => {
    setFlashMode(prev => prev === 'off' ? 'on' : 'off');
  };

  const toggleGuidelines = () => {
    setGuidelines(!guidelines);
  };

  const handleBatchComplete = () => {
    if (batchPhotos.length > 0) {
      // In a real implementation, you'd handle multiple photos
      onCapture(batchPhotos[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Camera stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Error display */}
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="max-w-md mx-4 p-6 bg-white rounded-lg text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Error</h3>
            <p className="text-gray-600 mb-4">{cameraError}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={startCamera} variant="outline">
                Try Again
              </Button>
              <Button onClick={onCancel} variant="default">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Guidelines overlay */}
      {guidelines && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-2 border-white/30">
            <div className="grid grid-cols-3 grid-rows-3 h-full">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/20" />
              ))}
            </div>
          </div>
          
          {/* Center focus circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-20 h-20 border-2 border-white rounded-full animate-pulse" />
          </div>
        </div>
      )}
      
      {/* Tips overlay */}
      {showTips && (
        <div className="absolute top-4 left-4 right-4 bg-black/70 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-white" />
              <p className="text-white text-sm font-medium">
                {tips[currentTip]}
              </p>
            </div>
            <button
              onClick={() => setShowTips(false)}
              className="text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Lighting feedback */}
      <div className="absolute bottom-32 left-4 right-4">
        <div className={cn(
          "p-3 rounded-lg transition-colors",
          lightingQuality === 'good' && "bg-green-500/80",
          lightingQuality === 'fair' && "bg-yellow-500/80",
          lightingQuality === 'poor' && "bg-red-500/80"
        )}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">
              {lightingQuality === 'good' && 'Perfect lighting!'}
              {lightingQuality === 'fair' && 'Lighting is OK'}
              {lightingQuality === 'poor' && 'Poor lighting - try moving to better light'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Camera controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
        <div className="flex items-center justify-between mb-4">
          {/* Left controls */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCamera}
              className="text-white hover:bg-white/20"
            >
              <RotateCw className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFlash}
              className="text-white hover:bg-white/20"
            >
              {flashMode === 'on' ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleGuidelines}
              className="text-white hover:bg-white/20"
            >
              <Grid3X3 className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Right controls */}
          <div>
            {enableBatch && batchPhotos.length > 0 && (
              <span className="text-white text-sm mr-4">
                {batchPhotos.length} photos
              </span>
            )}
          </div>
        </div>
        
        {/* Main controls */}
        <div className="flex items-center justify-center gap-8">
          <Button
            variant="ghost"
            size="lg"
            onClick={onCancel}
            className="text-white hover:bg-white/20"
          >
            Cancel
          </Button>
          
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className={cn(
              "w-20 h-20 rounded-full border-4 border-white bg-white/20",
              "hover:bg-white/30 transition-all",
              "disabled:opacity-50",
              isCapturing && "scale-90"
            )}
          >
            <Camera className="w-8 h-8 mx-auto text-white" />
          </button>
          
          {enableBatch && batchPhotos.length > 0 && (
            <Button
              variant="ghost"
              size="lg"
              onClick={handleBatchComplete}
              className="text-white hover:bg-white/20"
            >
              Done ({batchPhotos.length})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};