'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RotateCcw, Trash2, Upload } from 'lucide-react'
import { FileValidator } from '@/utils/file-validation'

interface ImagePreviewProps {
  imageUrl: string
  file: File
  onConfirm: () => void
  onRetake: () => void
  onCancel: () => void
  isUploading?: boolean
  uploadProgress?: number
  className?: string
}

/**
 * Displays a preview of an image file with interactive controls for rotation, retake, cancel, and upload actions.
 *
 * Shows the image with optional rotation, file size, and any validation warnings. Provides buttons for retaking the image, rotating it, canceling the operation, and confirming the upload. During upload, overlays a progress indicator and disables the upload button.
 *
 * @returns The rendered image preview component.
 */
export default function ImagePreview({
  imageUrl,
  file,
  onConfirm,
  onRetake,
  onCancel,
  isUploading = false,
  uploadProgress = 0,
  className
}: ImagePreviewProps) {
  const [rotation, setRotation] = useState(0)
  
  const validation = FileValidator.validateImage(file)
  const fileSize = FileValidator.formatFileSize(file.size)

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Preview Image</span>
          <Badge variant="outline">{fileSize}</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          <img
            src={imageUrl}
            alt="Food preview"
            className="w-full h-auto rounded-lg"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
          />
          
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm">Uploading... {uploadProgress}%</p>
              </div>
            </div>
          )}
        </div>

        {validation.warnings && (
          <div className="mt-2 text-sm text-amber-600">
            {validation.warnings.map((warning, index) => (
              <p key={index}>{warning}</p>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-between items-center">
          <div className="flex gap-2">
            <Button onClick={onRetake} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Retake
            </Button>
            <Button onClick={handleRotate} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Rotate
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={onCancel} variant="ghost" size="sm">
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}