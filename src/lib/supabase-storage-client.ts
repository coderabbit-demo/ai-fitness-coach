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

  // Define allowed file extensions for security
  private readonly ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const
  
  // Sanitize userId to prevent path traversal attacks
  private sanitizeUserId(userId: string): string {
    // Remove any path traversal characters and keep only alphanumeric, hyphens, and underscores
    return userId.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 100) // Also limit length
  }

  // Validate and sanitize file extension
  private validateFileExtension(fileName: string): string | null {
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (!extension || !(this.ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
      return null
    }
    return extension
  }

  async uploadMealImage(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Validate and sanitize userId
      const sanitizedUserId = this.sanitizeUserId(userId)
      if (!sanitizedUserId) {
        return { success: false, error: 'Invalid user ID' }
      }

      // Validate file extension
      const validExtension = this.validateFileExtension(file.name)
      if (!validExtension) {
        return { 
          success: false, 
          error: `Invalid file type. Allowed extensions: ${this.ALLOWED_EXTENSIONS.join(', ')}` 
        }
      }

      // Generate unique filename with sanitized inputs
      const timestamp = Date.now()
      const fileName = `${sanitizedUserId}/${timestamp}.${validExtension}`

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
      // Validate input
      if (!path || typeof path !== 'string') {
        return false
      }

      // Extract user ID from path for authorization check
      const pathParts = path.split('/')
      if (pathParts.length < 2) {
        return false
      }

      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user || pathParts[0] !== user.id) {
        return false
      }

      // Additional security: Validate the path format to prevent path traversal
      const sanitizedPath = path.replace(/\.\./g, '').replace(/\/+/g, '/')
      if (sanitizedPath !== path) {
        return false
      }

      // Check if the image exists and belongs to the user in the database
      const { data: logData, error: logError } = await this.supabase
        .from('nutrition_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('image_path', path)
        .maybeSingle()

      if (logError || !logData) {
        // Image doesn't exist in database or doesn't belong to user
        return false
      }

      // Perform the actual deletion from storage
      const { error } = await this.supabase.storage
        .from('meal-images')
        .remove([path])

      if (error) {
        return false
      }

      // Update the nutrition_logs table to clear both image_path and image_url
      await this.supabase
        .from('nutrition_logs')
        .update({ 
          image_path: null,
          image_url: null 
        })
        .eq('id', logData.id)

      return true
    } catch {
      return false
    }
  }

  async getMealImageUrl(path: string): Promise<string | null> {
    try {
      // Validate input
      if (!path || typeof path !== 'string') {
        return null
      }

      // Extract user ID from path for authorization check
      const pathParts = path.split('/')
      if (pathParts.length < 2) {
        return null
      }

      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user || pathParts[0] !== user.id) {
        return null
      }

      // Additional security: Validate the path format to prevent path traversal
      const sanitizedPath = path.replace(/\.\./g, '').replace(/\/+/g, '/')
      if (sanitizedPath !== path) {
        return null
      }

      // Check if the image exists and belongs to the user in the database
      const { data: logData, error: logError } = await this.supabase
        .from('nutrition_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('image_path', path)
        .maybeSingle()

      if (logError || !logData) {
        // Image doesn't exist in database or doesn't belong to user
        return null
      }

      // Create signed URL only after authorization checks pass
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