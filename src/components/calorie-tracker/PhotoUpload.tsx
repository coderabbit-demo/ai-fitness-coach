'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, Upload, FileImage } from 'lucide-react'
import CameraCapture from './CameraCapture'
import ImagePreview from './ImagePreview'
import NutritionEntryForm from './NutritionEntryForm'
import { SupabaseStorageClient } from '@/lib/supabase-storage'
import { ImageProcessor } from '@/lib/image-processing'
import { FileValidator } from '@/utils/file-validation'
import { UploadState, NutritionLogInput } from '@/lib/nutrition-types'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type ViewState = 'initial' | 'camera' | 'preview' | 'form'

interface PhotoUploadProps {
  className?: string
}

export default function PhotoUpload({ className }: PhotoUploadProps) {
  const [currentView, setCurrentView] = useState<ViewState>('initial')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    stage: 'idle'
  })
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  const router = useRouter()
  const storageClient = new SupabaseStorageClient()
  const imageProcessor = new ImageProcessor()
  const supabase = createClient()

  // Get user ID on component mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    setError(null)
    
    // Validate file
    const validation = FileValidator.validateImage(file)
    if (!validation.isValid) {
      setError(validation.error!)
      return
    }

    // Create preview URL
    const url = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(url)
    setCurrentView('preview')
  }, [])

  const handleCameraCapture = useCallback((imageBlob: Blob) => {
    const file = new File([imageBlob], 'meal-photo.jpg', { type: 'image/jpeg' })
    handleFileSelect(file)
  }, [handleFileSelect])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleImageUpload = async () => {
    if (!selectedFile || !userId) return

    setError(null)
    setUploadState({ isUploading: true, progress: 0, stage: 'compressing' })

    try {
      // Process image
      const processedImage = await imageProcessor.processImage(selectedFile)
      
      setUploadState({ isUploading: true, progress: 25, stage: 'uploading' })

      // Upload to Supabase
      const result = await storageClient.uploadMealImage(
        processedImage.file,
        userId,
        (progress) => {
          setUploadState({
            isUploading: true,
            progress: 25 + (progress.progress * 0.75),
            stage: progress.stage
          })
        }
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      setUploadedImageUrl(result.url!)
      setUploadState({ isUploading: false, progress: 100, stage: 'complete' })
      setCurrentView('form')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadState({ isUploading: false, progress: 0, stage: 'error' })
    }
  }

  const handleNutritionSave = async (data: NutritionLogInput) => {
    try {
      const response = await fetch('/api/nutrition-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to save nutrition log')
      }

      // Redirect to success page or dashboard
      router.push('/calorie-tracker?success=true')
    } catch (err) {
      throw err
    }
  }

  const resetState = () => {
    setCurrentView('initial')
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadedImageUrl(null)
    setUploadState({ isUploading: false, progress: 0, stage: 'idle' })
    setError(null)
  }

  // Render different views based on current state
  if (currentView === 'camera') {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onCancel={() => setCurrentView('initial')}
        className={className}
      />
    )
  }

  if (currentView === 'preview' && selectedFile && previewUrl) {
    return (
      <ImagePreview
        imageUrl={previewUrl}
        file={selectedFile}
        onConfirm={handleImageUpload}
        onRetake={() => setCurrentView('camera')}
        onCancel={resetState}
        isUploading={uploadState.isUploading}
        uploadProgress={uploadState.progress}
        className={className}
      />
    )
  }

  if (currentView === 'form') {
    return (
      <NutritionEntryForm
        imageUrl={uploadedImageUrl || undefined}
        onSave={handleNutritionSave}
        onCancel={resetState}
        className={className}
      />
    )
  }

  // Initial view
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Add Meal Photo</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4">
          <Button
            onClick={() => setCurrentView('camera')}
            className="h-20 flex-col gap-2"
            variant="outline"
          >
            <Camera className="h-6 w-6" />
            <span>Take Photo</span>
          </Button>

          <div className="relative">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button
              type="button"
              className="w-full h-20 flex-col gap-2"
              variant="outline"
            >
              <FileImage className="h-6 w-6" />
              <span>Upload Photo</span>
            </Button>
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={() => setCurrentView('form')}
            variant="ghost"
            className="text-sm"
          >
            Skip photo and enter manually
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}