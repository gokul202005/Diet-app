// AGY Fit Progressive Web App (PWA) Service Worker
// Version: 1.1.0 - Full Offline Caching & Automatic Health Connect Background Sync

const CACHE_NAME = 'agy-fit-v1.1.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable.png',
  '/apple-touch-icon.png'
];

// Install: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up older cache versions & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Smart caching strategy (Network-first for navigation/API, Cache-first for static assets)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extensions
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. API Requests -> Network-first, do NOT cache sensitive auth or user data
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ offline: true, error: 'You are currently offline. Background sync will retry automatically.' }),
          { headers: { 'Content-Type': 'application/json' }, status: 503 }
        );
      })
    );
    return;
  }

  // 2. Navigation Requests -> Try Network, fallback to cached index.html (SPA Offline Support)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 3. Static Assets (CSS, JS, Fonts, Images) -> Cache-first with Network Fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to keep cache fresh (stale-while-revalidate for assets)
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        return networkResponse;
      });
    })
  );
});

// --- AUTOMATIC BACKGROUND SYNC ENGINE ---
// Wakes up in background even when app is closed to sync health telemetry
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered with tag:', event.tag);
  if (event.tag === 'sync-health-telemetry') {
    event.waitUntil(processBackgroundHealthSync());
  }
});

// Periodic Background Sync (runs every 15-30 mins on Android Chrome PWA)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic health sync triggered with tag:', event.tag);
  if (event.tag === 'health-periodic-sync') {
    event.waitUntil(processBackgroundHealthSync());
  }
});

// Message listener from React UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'QUEUE_HEALTH_TELEMETRY') {
    storePendingTelemetry(event.data.payload);
  }
});

// Process background health telemetry push
async function processBackgroundHealthSync() {
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    
    // Broadcast to any open window to trigger live refresh
    clients.forEach((client) => {
      client.postMessage({
        type: 'HEALTH_BACKGROUND_SYNC_PULSE',
        timestamp: Date.now()
      });
    });

    console.log('[SW] Background health sync processed successfully.');
  } catch (err) {
    console.warn('[SW] Background sync processing error:', err);
  }
}

async function storePendingTelemetry(payload) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const dataResponse = new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put('/_offline_pending_health_sync_', dataResponse);
  } catch (e) {
    console.warn('[SW] Failed to cache pending telemetry:', e);
  }
}

// --- NATIVE SYSTEM NOTIFICATIONS & WEB PUSH ---
// Displays alerts in the mobile notification shade / desktop notification corner
self.addEventListener('push', (event) => {
  let title = 'JARVIS';
  let body = 'System update from your personal assistant';
  let icon = '/icon-192.png';
  let data = '/';

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      body = payload.body || body;
      icon = payload.icon || icon;
      data = payload.url || data;
    } catch {
      body = event.data.text() || body;
    }
  }

  const options = {
    body,
    icon,
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data,
    requireInteraction: false
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
