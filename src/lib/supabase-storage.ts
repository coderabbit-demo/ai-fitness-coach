import { createClient } from '@/utils/supabase/client'
import { createClient as createServerClient } from '@/utils/supabase/server'

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

// Server-side storage client
export class SupabaseStorageServerClient {
  private async getSupabase() {
    return await createServerClient()
  }

  async verifyUserAccess(userId: string, imagePath: string): Promise<boolean> {
    try {
      // Validate input parameters
      if (!userId || !imagePath) {
        return false
      }

      // Sanitize imagePath to prevent path traversal attacks
      const sanitizedPath = imagePath.replace(/\.\./g, '').replace(/\/+/g, '/')
      
      // Check if path starts with user ID (basic path validation)
      if (!sanitizedPath.startsWith(`${userId}/`)) {
        return false
      }

      // Get Supabase client and verify user session
      const supabase = await this.getSupabase()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user || user.id !== userId) {
        return false
      }

      // Additional validation: Check if user has access to this specific image path
      const { data, error: queryError } = await supabase
        .from('nutrition_logs')
        .select('id')
        .eq('user_id', userId)
        .like('image_url', `%${sanitizedPath}%`)
        .maybeSingle()

      if (queryError) {
        return false
      }

      return data !== null
    } catch {
      return false
    }
  }
}