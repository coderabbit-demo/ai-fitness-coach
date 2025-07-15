import { createClient } from '@/utils/supabase/client'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
  path?: string
}

export interface UploadProgress {
  progress: number
  stage: 'compressing' | 'uploading' | 'complete'
}

export class SupabaseStorageClient {
  private supabase = createClient()

  async uploadMealImage(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Generate unique filename
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const fileName = `${userId}/${timestamp}.${fileExtension}`

      onProgress?.({ progress: 0, stage: 'compressing' })

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('meal-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        return { success: false, error: error.message }
      }

      onProgress?.({ progress: 100, stage: 'complete' })

      // Get signed URL for secure access
      const { data: signedUrlData, error: signedUrlError } = await this.supabase.storage
        .from('meal-images')
        .createSignedUrl(data.path, 86400) // 24 hours expiry

      if (signedUrlError) {
        return { success: false, error: signedUrlError.message }
      }

      return { 
        success: true, 
        url: signedUrlData.signedUrl,
        path: data.path
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async deleteMealImage(path: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from('meal-images')
        .remove([path])

      return !error
    } catch {
      return false
    }
  }

  async getMealImageUrl(path: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from('meal-images')
        .createSignedUrl(path, 86400) // 24 hours expiry

      if (error) {
        return null
      }

      return data.signedUrl
    } catch {
      return null
    }
  }
} 