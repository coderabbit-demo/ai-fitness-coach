import { getOfflineStorage } from './offline-storage';
import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

interface SyncResult {
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

interface SyncEntry {
  id: string;
  type: 'meal_log' | 'photo_upload' | 'user_action';
  data: unknown;
  timestamp: number;
  synced: boolean;
  retryCount: number;
}

interface MealLogData {
  meal_name?: string;
  notes?: string;
  user_id: string;
  meal_date: string;
  meal_type: string;
  confidence_score: number;
  [key: string]: unknown;
}

interface PhotoUploadData {
  fileName: string;
  base64?: string;
  blob?: Blob;
  mimeType: string;
  user_id: string;
}

interface UserActionData {
  action: string;
  payload: Record<string, unknown>;
  user_id: string;
}

export class SyncService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncInProgress: boolean = false;
  private syncInterval: number | null = null;
  
  constructor() {
    // Only set up event listeners in browser environment
    if (typeof window !== 'undefined') {
      // Listen for online/offline events
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }
  
  private handleOnline(): void {
    console.log('Connection restored - starting sync');
    this.isOnline = true;
    this.startAutoSync();
    this.syncNow(); // Immediate sync when coming online
  }
  
  private handleOffline(): void {
    console.log('Connection lost - stopping sync');
    this.isOnline = false;
    this.stopAutoSync();
  }
  
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      return; // Already running
    }
    
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncNow();
      }
    }, intervalMs);
  }
  
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  async syncNow(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return { success: 0, failed: 0, errors: [] };
    }
    
    if (!this.isOnline) {
      console.log('Cannot sync - offline');
      return { success: 0, failed: 0, errors: [] };
    }
    
    this.syncInProgress = true;
    const result: SyncResult = { success: 0, failed: 0, errors: [] };
    
    try {
      const unsynced = await getOfflineStorage().getUnsynced();
      console.log(`Found ${unsynced.length} unsynced entries`);
      
      for (const entry of unsynced) {
        try {
          await this.syncEntry(entry);
          await getOfflineStorage().markSynced(entry.id);
          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            id: entry.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          // Increment retry count
          await getOfflineStorage().incrementRetryCount(entry.id);
          
          // Delete if too many retries
          if (entry.retryCount >= 5) {
            console.error(`Deleting entry ${entry.id} after 5 failed attempts`);
            await getOfflineStorage().delete(entry.id);
          }
        }
      }
      
      console.log(`Sync complete: ${result.success} success, ${result.failed} failed`);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.syncInProgress = false;
    }
    
    return result;
  }
  
  private async syncEntry(entry: SyncEntry): Promise<void> {
    const supabase = createClient();
    
    switch (entry.type) {
      case 'meal_log':
        await this.syncMealLog(supabase, entry.data as MealLogData);
        break;
        
      case 'photo_upload':
        const signedUrl = await this.syncPhotoUpload(supabase, entry.data as PhotoUploadData);
        // Note: For background sync, we don't return the URL as the original caller is no longer waiting
        console.log('Photo uploaded with signed URL:', signedUrl);
        break;
        
      case 'user_action':
        await this.syncUserAction(supabase, entry.data as UserActionData);
        break;
        
      default:
        throw new Error(`Unknown entry type: ${entry.type}`);
    }
  }
  
  private async syncMealLog(supabase: SupabaseClient, data: MealLogData): Promise<void> {
    const { error } = await supabase
      .from('nutrition_logs')
      .insert({
        user_id: data.user_id,
        meal_date: data.meal_date,
        meal_type: data.meal_type,
        meal_name: data.meal_name,
        food_items: data.food_items,
        total_calories: data.total_calories,
        total_protein_g: data.total_protein_g,
        total_carbs_g: data.total_carbs_g,
        total_fat_g: data.total_fat_g,
        total_fiber_g: data.total_fiber_g,
        confidence_score: data.confidence_score,
        notes: data.notes || `Synced from offline at ${new Date().toISOString()}`,
        image_path: data.image_path
      });
      
    if (error) {
      throw new Error(`Failed to sync meal log: ${error.message}`);
    }
  }
  
  private async syncPhotoUpload(supabase: SupabaseClient, data: PhotoUploadData): Promise<string> {
    // Convert base64 to blob if needed
    const blob = data.blob || (data.base64 ? this.base64ToBlob(data.base64, data.mimeType) : new Blob());
    
    const fileName = `${data.user_id}/${Date.now()}_${data.fileName}`;
    const { error } = await supabase.storage
      .from('meal-images')
      .upload(fileName, blob, {
        contentType: data.mimeType,
        upsert: false
      });
      
    if (error) {
      throw new Error(`Failed to sync photo: ${error.message}`);
    }

    // Generate and return signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('meal-images')
      .createSignedUrl(fileName, 86400); // 24 hours expiry

    if (signedUrlError) {
      throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
    }

    return signedUrlData.signedUrl;
  }
  
  private async syncUserAction(supabase: SupabaseClient, data: UserActionData): Promise<void> {
    // Handle various user actions like profile updates, settings changes, etc.
    switch (data.action) {
      case 'update_profile':
        await supabase
          .from('user_profiles')
          .update(data.payload)
          .eq('user_id', data.user_id);
        break;
        
      case 'update_preferences':
        await supabase
          .from('user_profiles')
          .update({ preferences: data.payload })
          .eq('user_id', data.user_id);
        break;
        
      default:
        console.warn(`Unknown user action: ${data.action}`);
    }
  }
  
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
  
  async queueMealLog(mealData: MealLogData): Promise<void> {
    if (this.isOnline) {
      // Try to sync immediately if online
      try {
        const supabase = createClient();
        await this.syncMealLog(supabase, mealData);
      } catch (error) {
        // If sync fails, queue it
        console.error('Direct sync failed, queueing for later:', error);
        await getOfflineStorage().store({
          type: 'meal_log',
          data: mealData
        });
      }
    } else {
      // Queue for later sync
      await getOfflineStorage().store({
        type: 'meal_log',
        data: mealData
      });
    }
  }
  
  async queuePhotoUpload(photoData: PhotoUploadData): Promise<string | null> {
    // If online, upload immediately and return signed URL
    if (this.isOnline) {
      try {
        const supabase = createClient();
        return await this.syncPhotoUpload(supabase, photoData);
      } catch (error) {
        console.error('Failed to upload photo immediately:', error);
        // Fall through to queue for later
      }
    }

    // If offline or immediate upload failed, queue for later
    await getOfflineStorage().store({
      type: 'photo_upload',
      data: photoData
    });
    
    if (this.isOnline) {
      this.syncNow(); // Try to sync immediately
    }

    return null; // No URL available for offline queuing
  }
  
  async queueUserAction(action: string, payload: Record<string, unknown>, userId: string): Promise<void> {
    await getOfflineStorage().store({
      type: 'user_action',
      data: { action, payload, user_id: userId }
    });
    
    if (this.isOnline) {
      this.syncNow(); // Try to sync immediately
    }
  }
}

// Singleton instance - only create in browser environment
export const syncService: SyncService | null = typeof window !== 'undefined' ? new SyncService() : null;

// Factory function for safe access to the sync service instance
export function getSyncService(): SyncService {
  if (typeof window === 'undefined') {
    throw new Error('SyncService is only available in browser environment');
  }
  if (!syncService) {
    throw new Error('SyncService instance not initialized');
  }
  return syncService;
}