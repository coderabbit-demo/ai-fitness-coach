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