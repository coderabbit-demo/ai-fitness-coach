import { offlineStorage, OfflineStorage } from '../offline-storage';

// Mock IndexedDB
const mockDB = {
  transaction: jest.fn(),
  close: jest.fn(),
  objectStoreNames: {
    contains: jest.fn().mockReturnValue(false)
  }
};

const mockObjectStore = {
  add: jest.fn(),
  put: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  createIndex: jest.fn(),
  index: jest.fn(),
};

const mockTransaction = {
  objectStore: jest.fn().mockReturnValue(mockObjectStore),
  oncomplete: null,
  onerror: null,
};

const mockRequest = {
  onsuccess: null,
  onerror: null,
  onupgradeneeded: null,
  result: mockDB,
};

// Mock global indexedDB
const mockIndexedDB = {
  open: jest.fn().mockReturnValue(mockRequest),
  deleteDatabase: jest.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

describe('OfflineStorage', () => {
  let storage: OfflineStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDB.transaction.mockReturnValue(mockTransaction);
    
    // Create a fresh instance for testing
    storage = new OfflineStorage();
    
    // Mock the index method to return an object with openCursor
    const mockIndex = {
      getAll: jest.fn().mockReturnValue({ 
        onsuccess: jest.fn(), 
        onerror: jest.fn(), 
        result: [] 
      }),
      openCursor: jest.fn().mockReturnValue({
        onsuccess: jest.fn(),
        onerror: jest.fn(),
        result: null
      })
    };
    mockObjectStore.index.mockReturnValue(mockIndex);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize database successfully', async () => {
      const initPromise = storage.init();
      
      // Simulate successful database opening
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({} as Event);
      }
      
      await expect(initPromise).resolves.toBeUndefined();
      expect(mockIndexedDB.open).toHaveBeenCalledWith('ai-calorie-tracker-offline', 1);
    });

    it('should handle database initialization errors', async () => {
      const initPromise = storage.init();
      
      // Simulate database error
      if (mockRequest.onerror) {
        mockRequest.onerror({} as Event);
      }
      
      await expect(initPromise).rejects.toThrow('Failed to open IndexedDB');
    });

    it('should create object stores on upgrade', async () => {
      const initPromise = storage.init();
      
      // Simulate database upgrade
      const upgradeEvent = {
        target: { result: mockDB }
      } as any;
      
      if (mockRequest.onupgradeneeded) {
        mockRequest.onupgradeneeded(upgradeEvent);
      }
      
      // Simulate successful completion
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({} as Event);
      }
      
      await expect(initPromise).resolves.toBeUndefined();
    });
  });

  describe('Store Operations', () => {
    beforeEach(async () => {
      // Mock initialized database
      (storage as any).db = mockDB;
    });

    it('should store meal log entry', async () => {
      const mealEntry = {
        type: 'meal_log' as const,
        data: {
          food_name: 'Apple',
          total_calories: 95,
          confidence_score: 0.9,
          meal_date: '2024-01-15',
          meal_type: 'snack',
          user_id: 'user-1'
        }
      };

      mockObjectStore.add.mockReturnValue({ 
        onsuccess: jest.fn(), 
        onerror: jest.fn() 
      });
      
      const promise = storage.store(mealEntry);
      
      // Simulate successful store
      const addRequest = mockObjectStore.add.mock.results[0].value;
      if (addRequest.onsuccess) {
        addRequest.onsuccess({} as Event);
      }
      
      const result = await promise;
      expect(typeof result).toBe('string'); // Should return an ID
      expect(mockObjectStore.add).toHaveBeenCalled();
      
      // Check that the stored entry has the required fields
      const storedEntry = mockObjectStore.add.mock.calls[0][0];
      expect(storedEntry).toMatchObject({
        ...mealEntry,
        id: expect.any(String),
        timestamp: expect.any(Number),
        synced: false,
        retryCount: 0
      });
    });

    it('should store photo upload entry', async () => {
      const photoEntry = {
        type: 'photo_upload' as const,
        data: {
          fileName: 'meal.jpg',
          base64: 'base64string',
          mimeType: 'image/jpeg',
          user_id: 'user-1'
        }
      };

      mockObjectStore.add.mockReturnValue({ 
        onsuccess: jest.fn(), 
        onerror: jest.fn() 
      });
      
      const promise = storage.store(photoEntry);
      
      // Simulate successful store
      const addRequest = mockObjectStore.add.mock.results[0].value;
      if (addRequest.onsuccess) {
        addRequest.onsuccess({} as Event);
      }
      
      const result = await promise;
      expect(typeof result).toBe('string');
      expect(mockObjectStore.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'photo_upload',
          data: photoEntry.data,
          synced: false,
          retryCount: 0
        })
      );
    });

    it('should handle store errors', async () => {
      const entry = {
        type: 'meal_log' as const,
        data: {
          food_name: 'Apple',
          total_calories: 95,
          confidence_score: 0.9,
          meal_date: '2024-01-15',
          meal_type: 'snack',
          user_id: 'user-1'
        }
      };

      mockObjectStore.add.mockReturnValue({
        onsuccess: jest.fn(),
        onerror: jest.fn(),
      });
      
      const promise = storage.store(entry);
      
      // Simulate storage error
      const addRequest = mockObjectStore.add.mock.results[0].value;
      if (addRequest.onerror) {
        addRequest.onerror({} as Event);
      }
      
      await expect(promise).rejects.toThrow('Failed to store offline entry');
    });
  });

  describe('Retrieval Operations', () => {
    beforeEach(async () => {
      (storage as any).db = mockDB;
    });

    it('should get unsynced entries', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          type: 'meal_log',
          data: {},
          timestamp: Date.now(),
          synced: false,
          retryCount: 0
        },
        {
          id: 'entry-2',
          type: 'meal_log',
          data: {},
          timestamp: Date.now(),
          synced: true,
          retryCount: 0
        }
      ];

      mockObjectStore.getAll.mockReturnValue({
        onsuccess: jest.fn(),
        onerror: jest.fn(),
        result: mockEntries,
      });
      
      const promise = storage.getUnsynced();
      
      // Simulate successful retrieval
      const getAllRequest = mockObjectStore.getAll.mock.results[0].value;
      if (getAllRequest.onsuccess) {
        getAllRequest.onsuccess({ target: { result: mockEntries } } as any);
      }
      
      const result = await promise;
      expect(result).toHaveLength(1); // Only unsynced entries
      expect(result[0].synced).toBe(false);
    });

    it('should handle retrieval errors', async () => {
      mockObjectStore.getAll.mockReturnValue({
        onsuccess: jest.fn(),
        onerror: jest.fn(),
      });
      
      const promise = storage.getUnsynced();
      
      // Simulate error
      const getAllRequest = mockObjectStore.getAll.mock.results[0].value;
      if (getAllRequest.onerror) {
        getAllRequest.onerror({} as Event);
      }
      
      await expect(promise).rejects.toThrow('Failed to get unsynced entries');
    });
  });

  describe('Sync Operations', () => {
    beforeEach(async () => {
      (storage as any).db = mockDB;
    });

    it('should mark entry as synced', async () => {
      const entryId = 'entry-1';
      const mockEntry = {
        id: entryId,
        type: 'meal_log',
        data: {},
        timestamp: Date.now(),
        synced: false,
        retryCount: 0
      };

      mockObjectStore.get.mockReturnValue({
        onsuccess: jest.fn(),
        onerror: jest.fn(),
        result: mockEntry,
      });

      mockObjectStore.put.mockReturnValue({
        onsuccess: jest.fn(),
        onerror: jest.fn(),
      });
      
      const promise = storage.markSynced(entryId);
      
      // Simulate successful get
      const getRequest = mockObjectStore.get.mock.results[0].value;
      if (getRequest.onsuccess) {
        getRequest.onsuccess({ target: { result: mockEntry } } as any);
      }
      
      // Simulate successful put
      const putRequest = mockObjectStore.put.mock.results[0].value;
      if (putRequest.onsuccess) {
        putRequest.onsuccess({} as Event);
      }
      
      await expect(promise).resolves.toBeUndefined();
      expect(mockEntry.synced).toBe(true);
    });

    it('should increment retry count', async () => {
      const entryId = 'entry-1';
      const mockEntry = {
        id: entryId,
        type: 'meal_log',
        data: {},
        timestamp: Date.now(),
        synced: false,
        retryCount: 2
      };

      mockObjectStore.get.mockReturnValue({
        onsuccess: jest.fn(),
        onerror: jest.fn(),
        result: mockEntry,
      });

      mockObjectStore.put.mockReturnValue({
        onsuccess: jest.fn(),
        onerror: jest.fn(),
      });
      
      const promise = storage.incrementRetryCount(entryId);
      
      // Simulate successful get
      const getRequest = mockObjectStore.get.mock.results[0].value;
      if (getRequest.onsuccess) {
        getRequest.onsuccess({ target: { result: mockEntry } } as any);
      }
      
      // Simulate successful put
      const putRequest = mockObjectStore.put.mock.results[0].value;
      if (putRequest.onsuccess) {
        putRequest.onsuccess({} as Event);
      }
      
      await expect(promise).resolves.toBeUndefined();
      expect(mockEntry.retryCount).toBe(3);
    });

    it('should respect maximum retry limit', async () => {
      const entryId = 'entry-1';
      const mockEntry = {
        id: entryId,
        type: 'meal_log',
        data: {},
        timestamp: Date.now(),
        synced: false,
        retryCount: 5 // At maximum limit
      };

      mockObjectStore.get.mockReturnValue({
        onsuccess: jest.fn(),
        onerror: jest.fn(),
        result: mockEntry,
      });
      
      const promise = storage.incrementRetryCount(entryId);
      
      // Simulate successful get
      const getRequest = mockObjectStore.get.mock.results[0].value;
      if (getRequest.onsuccess) {
        getRequest.onsuccess({ target: { result: mockEntry } } as any);
      }
      
      await expect(promise).rejects.toThrow('Maximum retry attempts (5) exceeded');
      expect(mockObjectStore.put).not.toHaveBeenCalled();
    });

    it('should delete entry', async () => {
      const entryId = 'entry-1';
      
      mockObjectStore.delete.mockReturnValue({
        onsuccess: jest.fn(),
        onerror: jest.fn(),
      });

      const promise = storage.delete(entryId);
      
      // Simulate successful delete
      const deleteRequest = mockObjectStore.delete.mock.results[0].value;
      if (deleteRequest.onsuccess) {
        deleteRequest.onsuccess({} as Event);
      }
      
      await expect(promise).resolves.toBeUndefined();
      expect(mockObjectStore.delete).toHaveBeenCalledWith(entryId);
    });
  });

  describe('Meal Caching Operations', () => {
    beforeEach(async () => {
      (storage as any).db = mockDB;
    });

    it('should cache meal data', async () => {
      const mealData = {
        id: 'cached-1',
        date: '2024-01-15',
        food_items: [],
        total_calories: 1500,
        user_id: 'user-1'
      };

      mockObjectStore.put.mockReturnValue({
        onsuccess: jest.fn(),
        onerror: jest.fn(),
      });
      
      const promise = storage.cacheMeal(mealData);
      
      // Simulate successful cache
      const putRequest = mockObjectStore.put.mock.results[0].value;
      if (putRequest.onsuccess) {
        putRequest.onsuccess({} as Event);
      }
      
      await expect(promise).resolves.toBeUndefined();
      expect(mockObjectStore.put).toHaveBeenCalledWith(mealData);
    });

    it('should get cached meals', async () => {
      const mockMeals = [
        {
          id: 'cached-1',
          date: '2024-01-15',
          food_items: [],
          total_calories: 1500,
          user_id: 'user-1'
        }
      ];

      mockObjectStore.getAll.mockReturnValue({
        onsuccess: jest.fn(),
        onerror: jest.fn(),
        result: mockMeals,
      });
      
      const promise = storage.getCachedMeals();
      
      // Simulate successful retrieval
      const getAllRequest = mockObjectStore.getAll.mock.results[0].value;
      if (getAllRequest.onsuccess) {
        getAllRequest.onsuccess({ target: { result: mockMeals } } as any);
      }
      
      const result = await promise;
      expect(result).toEqual(mockMeals);
    });
  });

  describe('Favorite Foods Operations', () => {
    beforeEach(async () => {
      (storage as any).db = mockDB;
    });

    it('should save favorite food', async () => {
      const favoriteFood = {
        id: 'fav-1',
        name: 'Apple',
        calories: 95,
        frequency: 5,
        user_id: 'user-1'
      };

      mockObjectStore.put.mockReturnValue({
        onsuccess: jest.fn(),
        onerror: jest.fn(),
      });
      
      const promise = storage.saveFavoriteFood(favoriteFood);
      
      // Simulate successful save
      const putRequest = mockObjectStore.put.mock.results[0].value;
      if (putRequest.onsuccess) {
        putRequest.onsuccess({} as Event);
      }
      
      await expect(promise).resolves.toBeUndefined();
      expect(mockObjectStore.put).toHaveBeenCalledWith(favoriteFood);
    });

    it('should get favorite foods sorted by frequency', async () => {
      const mockFavorites = [
        {
          id: 'fav-1',
          name: 'Apple',
          frequency: 5,
          user_id: 'user-1'
        }
      ];

      const mockCursor = {
        value: mockFavorites[0],
        continue: jest.fn()
      };

      const mockIndex = {
        openCursor: jest.fn().mockReturnValue({
          onsuccess: jest.fn(),
          onerror: jest.fn(),
          result: mockCursor
        })
      };

      mockObjectStore.index.mockReturnValue(mockIndex);
      
      const promise = storage.getFavoriteFoods();
      
      // Simulate cursor iteration
      const cursorRequest = mockIndex.openCursor.mock.results[0].value;
      
      // First call - return the item
      if (cursorRequest.onsuccess) {
        cursorRequest.onsuccess({ target: { result: mockCursor } } as any);
      }
      
      // Second call - no more items
      cursorRequest.result = null;
      if (cursorRequest.onsuccess) {
        cursorRequest.onsuccess({ target: { result: null } } as any);
      }
      
      const result = await promise;
      expect(result).toEqual(mockFavorites);
      expect(mockIndex.openCursor).toHaveBeenCalledWith(null, 'prev');
    });
  });

  describe('Clear Operations', () => {
    beforeEach(async () => {
      (storage as any).db = mockDB;
    });

    it('should clear all stores', async () => {
      const mockClearRequests = [
        { onsuccess: jest.fn(), onerror: jest.fn() },
        { onsuccess: jest.fn(), onerror: jest.fn() },
        { onsuccess: jest.fn(), onerror: jest.fn() }
      ];

      mockObjectStore.clear
        .mockReturnValueOnce(mockClearRequests[0])
        .mockReturnValueOnce(mockClearRequests[1])
        .mockReturnValueOnce(mockClearRequests[2]);
      
      const promise = storage.clear();
      
      // Simulate successful clear for all stores
      mockClearRequests.forEach(request => {
        if (request.onsuccess) {
          request.onsuccess({} as Event);
        }
      });
      
      await expect(promise).resolves.toBeUndefined();
      expect(mockObjectStore.clear).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      (storage as any).db = mockDB;
    });

    it('should handle missing entries gracefully', async () => {
      const entryId = 'non-existent';
      
      mockObjectStore.get.mockReturnValue({
        onsuccess: jest.fn(),
        onerror: jest.fn(),
        result: undefined,
      });
      
      const promise = storage.markSynced(entryId);
      
      // Simulate successful get but no result
      const getRequest = mockObjectStore.get.mock.results[0].value;
      if (getRequest.onsuccess) {
        getRequest.onsuccess({ target: { result: undefined } } as any);
      }
      
      await expect(promise).rejects.toThrow('Entry not found');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return null in server environment', () => {
      // Mock server environment
      Object.defineProperty(window, 'indexedDB', {
        value: undefined,
        writable: true,
      });
      
      // Import fresh module
      jest.isolateModules(() => {
        const { offlineStorage: serverStorage } = require('../offline-storage');
        expect(serverStorage).toBeNull();
      });
    });

    it('should provide factory function for safe access', () => {
      // Mock server environment
      Object.defineProperty(window, 'indexedDB', {
        value: undefined,
        writable: true,
      });
      
      jest.isolateModules(() => {
        const { getOfflineStorage } = require('../offline-storage');
        expect(() => getOfflineStorage()).toThrow('OfflineStorage is only available in browser environment');
      });
    });
  });
}); 