"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/utils/supabase/client'
import { Upload, X, Loader2 } from 'lucide-react'
import { logError } from '@/lib/logger'
import Image from 'next/image'

export function PhotoUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image must be less than 5MB' })
        return
      }

      setSelectedFile(file)
      setMessage(null)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Upload image to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(fileName, selectedFile)

      if (uploadError) {
        throw uploadError
      }

      // Get signed URL for secure access
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('meal-images')
        .createSignedUrl(fileName, 86400) // 24 hours expiry

      if (signedUrlError) {
        throw signedUrlError
      }

      // Create nutrition log entry (will be processed by AI later)
      const { data: nutritionLog, error: logError } = await supabase
        .from('nutrition_logs')
        .insert({
          user_id: user.id,
          image_url: signedUrlData.signedUrl,
          food_items: null, // Will be populated by AI
          total_calories: null, // Will be populated by AI
          confidence_score: null, // Will be populated by AI
          notes: 'Processing...'
        })
        .select()
        .single()

      if (logError) {
        throw logError
      }

      // TODO: Trigger AI processing via Inngest
      // This would be implemented in Phase 2 of the project
      console.log('Nutrition log created:', nutritionLog)

      setMessage({ 
        type: 'success', 
        text: 'Image uploaded successfully! AI analysis will be available soon.' 
      })
      
      // Reset form
      setSelectedFile(null)
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Refresh the page to show new meal
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (error) {
      logError(error, 'photo_upload')
      setMessage({ 
        type: 'error', 
        text: 'Failed to upload image. Please try again.' 
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreview(null)
    setMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* File Input */}
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="meal-photo">Meal Photo</Label>
        <Input
          id="meal-photo"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          ref={fileInputRef}
          disabled={isUploading}
        />
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative">
          <Image 
            src={preview} 
            alt="Meal preview" 
            width={384}
            height={256}
            className="w-full max-w-md h-64 object-cover rounded-lg border"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleCancel}
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="flex-1 max-w-sm"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Analyze
            </>
          )}
        </Button>
        
        {selectedFile && (
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Messages */}
      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}