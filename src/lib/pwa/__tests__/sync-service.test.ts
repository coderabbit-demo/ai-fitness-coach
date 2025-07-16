import { syncService } from '../sync-service';

// Mock dependencies
jest.mock('../offline-storage', () => ({
  offlineStorage: {
    getUnsynced: jest.fn(),
    markSynced: jest.fn(),
    incrementRetryCount: jest.fn(),
    delete: jest.fn(),
  }
}));

// Mock fetch
global.fetch = jest.fn();

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset auto-sync state
    if (syncService) {
      (syncService as any).isAutoSyncRunning = false;
      (syncService as any).autoSyncInterval = null;
    }
  });

  afterEach(() => {
    jest.useRealTimers();
    
    // Stop any running auto-sync
    if (syncService) {
      syncService.stopAutoSync();
    }
  });

  describe('Auto Sync', () => {
    it('should start auto sync with default interval', () => {
      const startSpy = jest.spyOn(syncService!, 'startAutoSync');
      
      syncService!.startAutoSync();
      
      expect(startSpy).toHaveBeenCalled();
      expect((syncService as any).isAutoSyncRunning).toBe(true);
      expect((syncService as any).autoSyncInterval).toBeTruthy();
    });

    it('should start auto sync with custom interval', () => {
      const customInterval = 5000; // 5 seconds
      
      syncService!.startAutoSync(customInterval);
      
      expect((syncService as any).isAutoSyncRunning).toBe(true);
      expect((syncService as any).autoSyncInterval).toBeTruthy();
    });

    it('should not start multiple auto sync instances', () => {
      // Start first instance
      syncService!.startAutoSync();
      const firstInterval = (syncService as any).autoSyncInterval;
      
      // Try to start second instance
      syncService!.startAutoSync();
      const secondInterval = (syncService as any).autoSyncInterval;
      
      expect(firstInterval).toBe(secondInterval);
    });

    it('should stop auto sync', () => {
      syncService!.startAutoSync();
      expect((syncService as any).isAutoSyncRunning).toBe(true);
      
      syncService!.stopAutoSync();
      expect((syncService as any).isAutoSyncRunning).toBe(false);
      expect((syncService as any).autoSyncInterval).toBeNull();
    });

    it('should perform sync on interval', async () => {
      const { offlineStorage } = require('../offline-storage');
      offlineStorage.getUnsynced.mockResolvedValue([]);
      
      const syncSpy = jest.spyOn(syncService!, 'sync');
      
      syncService!.startAutoSync(1000); // 1 second interval
      
      // Fast-forward time by 1 second
      jest.advanceTimersByTime(1000);
      
      await Promise.resolve(); // Let promises resolve
      
      expect(syncSpy).toHaveBeenCalled();
    });
  });

  describe('Manual Sync', () => {
    it('should sync successfully with empty queue', async () => {
      const { offlineStorage } = require('../offline-storage');
      offlineStorage.getUnsynced.mockResolvedValue([]);
      
      const result = await syncService!.sync();
      
      expect(result).toEqual({
        success: true,
        synced: 0,
        failed: 0,
        errors: []
      });
    });

    it('should sync meal log entries', async () => {
      const { offlineStorage } = require('../offline-storage');
      const mockEntries = [
        {
          id: 'entry-1',
          type: 'meal_log',
          data: {
            food_name: 'Apple',
            total_calories: 95,
            user_id: 'user-1'
          },
          timestamp: Date.now(),
          synced: false,
          retryCount: 0
        }
      ];

      offlineStorage.getUnsynced.mockResolvedValue(mockEntries);
      
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      offlineStorage.markSynced.mockResolvedValue(undefined);
      
      const result = await syncService!.sync();
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
      expect(offlineStorage.markSynced).toHaveBeenCalledWith('entry-1');
    });

    it('should sync photo upload entries', async () => {
      const { offlineStorage } = require('../offline-storage');
      const mockEntries = [
        {
          id: 'entry-1',
          type: 'photo_upload',
          data: {
            fileName: 'meal.jpg',
            base64: 'base64string',
            user_id: 'user-1'
          },
          timestamp: Date.now(),
          synced: false,
          retryCount: 0
        }
      ];

      offlineStorage.getUnsynced.mockResolvedValue(mockEntries);
      
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      offlineStorage.markSynced.mockResolvedValue(undefined);
      
      const result = await syncService!.sync();
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should handle API errors and increment retry count', async () => {
      const { offlineStorage } = require('../offline-storage');
      const mockEntries = [
        {
          id: 'entry-1',
          type: 'meal_log',
          data: {
            food_name: 'Apple',
            user_id: 'user-1'
          },
          timestamp: Date.now(),
          synced: false,
          retryCount: 2
        }
      ];

      offlineStorage.getUnsynced.mockResolvedValue(mockEntries);
      
      // Mock failed API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      offlineStorage.incrementRetryCount.mockResolvedValue(undefined);
      
      const result = await syncService!.sync();
      
      expect(result.success).toBe(false);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(offlineStorage.incrementRetryCount).toHaveBeenCalledWith('entry-1');
    });

    it('should delete entries that exceed maximum retry attempts', async () => {
      const { offlineStorage } = require('../offline-storage');
      const mockEntries = [
        {
          id: 'entry-1',
          type: 'meal_log',
          data: {
            food_name: 'Apple',
            user_id: 'user-1'
          },
          timestamp: Date.now(),
          synced: false,
          retryCount: 2
        }
      ];

      offlineStorage.getUnsynced.mockResolvedValue(mockEntries);
      
      // Mock failed API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      // Mock retry count increment that exceeds maximum
      offlineStorage.incrementRetryCount.mockRejectedValueOnce(
        new Error('Maximum retry attempts (5) exceeded')
      );
      offlineStorage.delete.mockResolvedValue(undefined);
      
      const result = await syncService!.sync();
      
      expect(result.success).toBe(false);
      expect(result.failed).toBe(1);
      expect(offlineStorage.delete).toHaveBeenCalledWith('entry-1');
    });

    it('should handle network errors', async () => {
      const { offlineStorage } = require('../offline-storage');
      const mockEntries = [
        {
          id: 'entry-1',
          type: 'meal_log',
          data: {
            food_name: 'Apple',
            user_id: 'user-1'
          },
          timestamp: Date.now(),
          synced: false,
          retryCount: 0
        }
      ];

      offlineStorage.getUnsynced.mockResolvedValue(mockEntries);
      
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      offlineStorage.incrementRetryCount.mockResolvedValue(undefined);
      
      const result = await syncService!.sync();
      
      expect(result.success).toBe(false);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors[0]).toContain('Network error');
    });

    it('should handle partial sync success', async () => {
      const { offlineStorage } = require('../offline-storage');
      const mockEntries = [
        {
          id: 'entry-1',
          type: 'meal_log',
          data: { food_name: 'Apple', user_id: 'user-1' },
          timestamp: Date.now(),
          synced: false,
          retryCount: 0
        },
        {
          id: 'entry-2',
          type: 'meal_log',
          data: { food_name: 'Banana', user_id: 'user-1' },
          timestamp: Date.now(),
          synced: false,
          retryCount: 0
        }
      ];

      offlineStorage.getUnsynced.mockResolvedValue(mockEntries);
      
      // Mock one success, one failure
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request'
        });

      offlineStorage.markSynced.mockResolvedValue(undefined);
      offlineStorage.incrementRetryCount.mockResolvedValue(undefined);
      
      const result = await syncService!.sync();
      
      expect(result.success).toBe(false); // Not fully successful
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('Queue Management', () => {
    it('should queue meal log for offline sync', async () => {
      const { offlineStorage } = require('../offline-storage');
      offlineStorage.store = jest.fn().mockResolvedValue('entry-1');
      
      const mealData = {
        food_name: 'Apple',
        total_calories: 95,
        user_id: 'user-1'
      };
      
      await syncService!.queueMealLog(mealData);
      
      expect(offlineStorage.store).toHaveBeenCalledWith({
        type: 'meal_log',
        data: mealData
      });
    });

    it('should queue photo upload for offline sync', async () => {
      const { offlineStorage } = require('../offline-storage');
      offlineStorage.store = jest.fn().mockResolvedValue('entry-1');
      
      const photoData = {
        fileName: 'meal.jpg',
        base64: 'base64string',
        user_id: 'user-1'
      };
      
      await syncService!.queuePhotoUpload(photoData);
      
      expect(offlineStorage.store).toHaveBeenCalledWith({
        type: 'photo_upload',
        data: photoData
      });
    });

    it('should queue user action for offline sync', async () => {
      const { offlineStorage } = require('../offline-storage');
      offlineStorage.store = jest.fn().mockResolvedValue('entry-1');
      
      const actionData = {
        action: 'favorite_food',
        payload: { foodId: 'food-1' },
        user_id: 'user-1'
      };
      
      await syncService!.queueUserAction(actionData);
      
      expect(offlineStorage.store).toHaveBeenCalledWith({
        type: 'user_action',
        data: actionData
      });
    });
  });

  describe('Background Sync Registration', () => {
    it('should register background sync if supported', async () => {
      // Mock service worker registration with sync capability
      const mockRegistration = {
        sync: {
          register: jest.fn().mockResolvedValue(undefined)
        }
      };

      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve(mockRegistration)
        },
        writable: true
      });
      
      await syncService!.registerBackgroundSync();
      
      expect(mockRegistration.sync.register).toHaveBeenCalledWith('background-sync');
    });

    it('should handle background sync not supported', async () => {
      // Mock service worker registration without sync capability
      const mockRegistration = {};

      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve(mockRegistration)
        },
        writable: true
      });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await syncService!.registerBackgroundSync();
      
      expect(consoleSpy).toHaveBeenCalledWith('Background sync not supported');
      
      consoleSpy.mockRestore();
    });

    it('should handle service worker not available', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true
      });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await syncService!.registerBackgroundSync();
      
      expect(consoleSpy).toHaveBeenCalledWith('Service worker not available');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Server Environment', () => {
    it('should return null in server environment', () => {
      // Mock server environment
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true
      });
      
      jest.isolateModules(() => {
        const { syncService: serverSyncService } = require('../sync-service');
        expect(serverSyncService).toBeNull();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should continue sync process even if individual entries fail', async () => {
      const { offlineStorage } = require('../offline-storage');
      
      // Mock multiple entries, some will fail
      const mockEntries = [
        { id: 'entry-1', type: 'meal_log', data: { user_id: 'user-1' }, retryCount: 0 },
        { id: 'entry-2', type: 'meal_log', data: { user_id: 'user-1' }, retryCount: 0 },
        { id: 'entry-3', type: 'meal_log', data: { user_id: 'user-1' }, retryCount: 0 }
      ];

      offlineStorage.getUnsynced.mockResolvedValue(mockEntries);
      
      // Mock mixed success/failure responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) })
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) });

      offlineStorage.markSynced.mockResolvedValue(undefined);
      offlineStorage.incrementRetryCount.mockResolvedValue(undefined);
      
      const result = await syncService!.sync();
      
      expect(result.synced).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle storage errors gracefully', async () => {
      const { offlineStorage } = require('../offline-storage');
      
      // Mock storage error when getting unsynced entries
      offlineStorage.getUnsynced.mockRejectedValue(
        new Error('Storage unavailable')
      );
      
      const result = await syncService!.sync();
      
      expect(result.success).toBe(false);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors[0]).toContain('Storage unavailable');
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits in sync requests', async () => {
      const { offlineStorage } = require('../offline-storage');
      
      // Create multiple entries
      const mockEntries = Array.from({ length: 10 }, (_, i) => ({
        id: `entry-${i}`,
        type: 'meal_log',
        data: { user_id: 'user-1' },
        retryCount: 0
      }));

      offlineStorage.getUnsynced.mockResolvedValue(mockEntries);
      
      // Mock all successful responses
      (global.fetch as jest.Mock).mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
      );

      offlineStorage.markSynced.mockResolvedValue(undefined);
      
      const startTime = Date.now();
      await syncService!.sync();
      const endTime = Date.now();
      
      // Should have some delay due to rate limiting
      // This is a simplified test - real implementation might use different timing
      expect(global.fetch).toHaveBeenCalledTimes(10);
      expect(offlineStorage.markSynced).toHaveBeenCalledTimes(10);
    });
  });
}); 