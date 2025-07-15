interface OfflineEntry {
  id: string;
  type: 'meal_log' | 'photo_upload' | 'user_action';
  data: any;
  timestamp: number;
  synced: boolean;
  retryCount: number;
}

export class OfflineStorage {
  private dbName = 'ai-calorie-tracker-offline';
  private version = 1;
  private db: IDBDatabase | null = null;
  
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('offline-entries')) {
          const store = db.createObjectStore('offline-entries', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('cached-meals')) {
          const mealsStore = db.createObjectStore('cached-meals', { keyPath: 'id' });
          mealsStore.createIndex('date', 'date', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('favorite-foods')) {
          const favStore = db.createObjectStore('favorite-foods', { keyPath: 'id' });
          favStore.createIndex('frequency', 'frequency', { unique: false });
        }
      };
    });
  }
  
  async store(entry: Omit<OfflineEntry, 'id' | 'timestamp' | 'synced' | 'retryCount'>): Promise<string> {
    if (!this.db) {
      await this.init();
    }
    
    const id = `${entry.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullEntry: OfflineEntry = {
      ...entry,
      id,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-entries'], 'readwrite');
      const store = transaction.objectStore('offline-entries');
      const request = store.add(fullEntry);
      
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(new Error('Failed to store offline entry'));
    });
  }
  
  async getUnsynced(): Promise<OfflineEntry[]> {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-entries'], 'readonly');
      const store = transaction.objectStore('offline-entries');
      const request = store.getAll();
      
      request.onsuccess = () => {
        // Filter for unsynced entries
        const unsynced = request.result.filter((entry: OfflineEntry) => !entry.synced);
        resolve(unsynced);
      };
      request.onerror = () => reject(new Error('Failed to get unsynced entries'));
    });
  }
  
  async markSynced(id: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-entries'], 'readwrite');
      const store = transaction.objectStore('offline-entries');
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const entry = getRequest.result;
        if (entry) {
          entry.synced = true;
          const updateRequest = store.put(entry);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(new Error('Failed to mark as synced'));
        } else {
          reject(new Error('Entry not found'));
        }
      };
      
      getRequest.onerror = () => reject(new Error('Failed to get entry'));
    });
  }
  
  async incrementRetryCount(id: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-entries'], 'readwrite');
      const store = transaction.objectStore('offline-entries');
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const entry = getRequest.result;
        if (entry) {
          entry.retryCount++;
          const updateRequest = store.put(entry);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(new Error('Failed to update retry count'));
        } else {
          reject(new Error('Entry not found'));
        }
      };
      
      getRequest.onerror = () => reject(new Error('Failed to get entry'));
    });
  }
  
  async delete(id: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-entries'], 'readwrite');
      const store = transaction.objectStore('offline-entries');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete entry'));
    });
  }
  
  async cacheMeal(meal: any): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached-meals'], 'readwrite');
      const store = transaction.objectStore('cached-meals');
      const request = store.put(meal);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to cache meal'));
    });
  }
  
  async getCachedMeals(date?: string): Promise<any[]> {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached-meals'], 'readonly');
      const store = transaction.objectStore('cached-meals');
      
      if (date) {
        const index = store.index('date');
        const request = index.getAll(date);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Failed to get cached meals'));
      } else {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Failed to get cached meals'));
      }
    });
  }
  
  async saveFavoriteFood(food: any): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['favorite-foods'], 'readwrite');
      const store = transaction.objectStore('favorite-foods');
      const request = store.put(food);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save favorite food'));
    });
  }
  
  async getFavoriteFoods(): Promise<any[]> {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['favorite-foods'], 'readonly');
      const store = transaction.objectStore('favorite-foods');
      const index = store.index('frequency');
      const request = index.openCursor(null, 'prev'); // Sort by frequency descending
      
      const favorites: any[] = [];
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          favorites.push(cursor.value);
          cursor.continue();
        } else {
          resolve(favorites);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to get favorite foods'));
    });
  }
  
  async clear(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    
    const stores = ['offline-entries', 'cached-meals', 'favorite-foods'];
    const promises = stores.map(storeName => {
      return new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
      });
    });
    
    await Promise.all(promises);
  }
}

// Singleton instance - only create in browser environment
export const offlineStorage = typeof window !== 'undefined' ? new OfflineStorage() : null as any;