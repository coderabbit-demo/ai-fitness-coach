const CACHE_NAME = 'ai-calorie-tracker-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache initial resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Cache expiration settings (in milliseconds)
const CACHE_EXPIRATION = {
  API: 5 * 60 * 1000,      // 5 minutes for API responses
  IMAGES: 24 * 60 * 60 * 1000, // 24 hours for images
  STATIC: 7 * 24 * 60 * 60 * 1000 // 7 days for static assets
};

// Check if cached response is expired
function isCacheExpired(response, maxAge) {
  if (!response) return true;
  
  const cachedDate = response.headers.get('sw-cached-date');
  if (!cachedDate) return true;
  
  const age = Date.now() - parseInt(cachedDate);
  return age > maxAge;
}

// Add timestamp to response before caching
function addTimestampToResponse(response) {
  const modifiedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
  });
  modifiedResponse.headers.set('sw-cached-date', Date.now().toString());
  return modifiedResponse;
}

// Fetch event - serve from cache when offline or use network-first for APIs
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) return;

  // Use network-first strategy for API responses
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone and cache the response with timestamp
          const responseToCache = addTimestampToResponse(response.clone());
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        })
        .catch(() => {
          // Network failed - try cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse && !isCacheExpired(cachedResponse, CACHE_EXPIRATION.API)) {
                return cachedResponse;
              }
              // Return stale cache if available, better than nothing
              return cachedResponse || new Response('Network unavailable', { status: 503 });
            });
        })
    );
    return;
  }

  // Use cache-first strategy for static assets and images
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Determine cache expiration based on request type
        let maxAge = CACHE_EXPIRATION.STATIC;
        if (event.request.destination === 'image') {
          maxAge = CACHE_EXPIRATION.IMAGES;
        }

        // Cache hit - check if expired
        if (response && !isCacheExpired(response, maxAge)) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response and add timestamp
          const responseToCache = addTimestampToResponse(response.clone());

          // Cache static assets and images
          if (
            event.request.destination === 'image' ||
            event.request.destination === 'script' ||
            event.request.destination === 'style'
          ) {
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }

          return response;
        }).catch(() => {
          // Network failed - return stale cache if available
          return response || caches.match('/offline.html');
        });
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-meals') {
    event.waitUntil(syncOfflineMeals());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('AI Calorie Tracker', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function to sync offline meals
async function syncOfflineMeals() {
  try {
    // Get offline meals from IndexedDB
    const db = await openDB();
    const tx = db.transaction('offline-meals', 'readonly');
    const store = tx.objectStore('offline-meals');
    const meals = await store.getAll();

    // Sync each meal
    for (const meal of meals) {
      try {
        const response = await fetch('/api/nutrition-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(meal.data)
        });

        if (response.ok) {
          // Remove from offline store
          const deleteTx = db.transaction('offline-meals', 'readwrite');
          const deleteStore = deleteTx.objectStore('offline-meals');
          await deleteStore.delete(meal.id);
        }
      } catch (error) {
        console.error('Failed to sync meal:', meal.id, error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ai-calorie-tracker', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline-meals')) {
        db.createObjectStore('offline-meals', { keyPath: 'id' });
      }
    };
  });
}