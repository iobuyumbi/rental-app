// Service Worker for RentSmart - Rental Management

const CACHE_NAME = 'rentsmart-v1';
const OFFLINE_CACHE = 'rentsmart-offline';
const API_CACHE = 'rentsmart-api';

// Files to cache for offline use
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/offline.html',
  // Add other static assets you want to cache
];

// Cache configuration
const CACHE_CONFIG = {
  // Cache successful GET requests for these paths
  cacheablePaths: [
    '/',
    '/index.html',
    '/manifest.json',
    '/offline.html',
    /\.[a-z0-9]+\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
  ],
  
  // Don't cache these paths
  blacklist: [
    '/sockjs-node',
    '/api',
    '/socket.io',
  ],
  
  // Cache API responses separately
  apiCacheName: API_CACHE,
  
  // Cache version
  version: 'v1',
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return Promise.all(
          PRECACHE_ASSETS.map((asset) => {
            // Skip favicon.ico if it's not found
            if (asset === '/favicon.ico') {
              return Promise.resolve();
            }
            return cache.add(asset).catch(err => {
              console.warn(`Failed to cache ${asset}:`, err);
            });
          })
        );
      })
      .then(() => {
        console.log('All assets are now cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE && cacheName !== API_CACHE) {
            console.log('Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        }).filter(Boolean)
      );
    }).then(() => self.clients.claim())
  );
});

// Check if a request should be cached
function shouldCache(request) {
  const url = new URL(request.url);
  const isHttp = url.protocol.startsWith('http');
  const isGet = request.method === 'GET';
  const isExtension = url.pathname.includes('extension')
  const isDev = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  
  // Don't cache non-GET requests, extensions, or dev server requests
  if (!isHttp || !isGet || isExtension || isDev) {
    return false;
  }
  
  // Check against blacklist
  if (CACHE_CONFIG.blacklist.some(path => url.pathname.startsWith(path))) {
    return false;
  }
  
  // Check if path matches cacheable patterns
  return CACHE_CONFIG.cacheablePaths.some(pattern => {
    if (typeof pattern === 'string') {
      return url.pathname === pattern;
    } else if (pattern instanceof RegExp) {
      return pattern.test(url.pathname);
    }
    return false;
  });
}

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests (like POST, PUT, DELETE)
  if (request.method !== 'GET') {
    // For API requests, let them go to the network
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(fetch(request));
    }
    return;
  }

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API requests with NetworkFirst strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Only cache successful responses
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // If network fails, try to get from cache
            return caches.match(request).then((response) => {
              // If not in cache, return a fallback response
              return response || new Response(
                JSON.stringify({ error: 'You are offline and this data is not available.' }), 
                { 
                  status: 503, 
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
          });
      })
    );
    return;
  }

  // For all other requests, try cache first, then network
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If both cache and network fail, return offline page for HTML requests
            if (request.headers.get('Accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'RentSmart';
  const options = {
    body: data.body || 'You have new updates',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no matching window/tab is found, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync implementation
async function syncData() {
  // This would contain the logic to sync any pending operations
  // that were queued while offline
  console.log('Syncing data in the background...');
  
  // Example: Get all clients and notify them to sync their data
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_DATA' });
  });
  
  return Promise.resolve();
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_API_DATA') {
    // Handle API caching requests from the app
    const { request, response } = event.data.payload;
    caches.open(API_CACHE)
      .then(cache => cache.put(request, new Response(JSON.stringify(response))));
  }
});
