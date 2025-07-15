import { createClient } from '@/utils/supabase/server'

// Server-side storage client
export class SupabaseStorageServerClient {
  private async getSupabase() {
    return await createClient()
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

      // Efficient validation: Use exact match on indexed image_path column
      const { data, error: queryError } = await supabase
        .from('nutrition_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('image_path', sanitizedPath)
        .maybeSingle()

      if (queryError) {
        return false
      }

      return data !== null
    } catch {
      return false
    }
  }

  /**
   * Generate a signed URL for secure image access with RLS enforcement
   * @param userId - User ID for authorization
   * @param imagePath - Path to the image in storage
   * @param expiresInSeconds - Expiration time in seconds (default: 1 hour)
   * @returns Promise<string | null> - Signed URL or null if failed
   */
  async getSignedImageUrl(userId: string, imagePath: string, expiresInSeconds: number = 3600): Promise<string | null> {
    try {
      // Verify user access first
      const hasAccess = await this.verifyUserAccess(userId, imagePath)
      if (!hasAccess) {
        return null
      }

      const supabase = await this.getSupabase()
      
      // Generate signed URL with short expiration for security
      const { data, error } = await supabase.storage
        .from('meal-images')
        .createSignedUrl(imagePath, expiresInSeconds)

      if (error) {
        return null
      }

      return data.signedUrl
    } catch {
      return null
    }
  }

  /**
   * Get nutrition log with fresh signed URL
   * @param userId - User ID for authorization
   * @param logId - Nutrition log ID
   * @returns Promise<{id: string, imageUrl: string | null} | null>
   */
  async getNutritionLogWithSignedUrl(userId: string, logId: string): Promise<{id: string, imageUrl: string | null} | null> {
    try {
      const supabase = await this.getSupabase()
      
      // Get the nutrition log with image_path
      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('id, image_path')
        .eq('user_id', userId)
        .eq('id', logId)
        .maybeSingle()

      if (error || !data) {
        return null
      }

      // Generate fresh signed URL if image_path exists
      let imageUrl: string | null = null
      if (data.image_path) {
        imageUrl = await this.getSignedImageUrl(userId, data.image_path)
      }

      return {
        id: data.id,
        imageUrl
      }
    } catch {
      return null
    }
  }
} 