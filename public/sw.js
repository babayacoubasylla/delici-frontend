// Service Worker pour DeliCI PWA
const CACHE_NAME = 'delici-v1';
const STATIC_CACHE = 'delici-static-v1';
const DYNAMIC_CACHE = 'delici-dynamic-v1';

// Fichiers à mettre en cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

// URLs et patterns à ne pas mettre en cache
const EXCLUDED_PATTERNS = [
  '/api/',
  '/socket.io/',
  '/login',
  '/inscription',
  'chrome-extension://',
  'moz-extension://',
  'chrome://',
  'about:'
];

// Vérifier si une URL doit être exclue
const shouldExclude = (url) => {
  const urlString = url.toString();
  return EXCLUDED_PATTERNS.some(pattern => urlString.includes(pattern));
};

// Vérifier si la requête peut être mise en cache
const isCacheable = (request) => {
  // Seulement les requêtes GET
  if (request.method !== 'GET') return false;

  // Exclure les extensions et APIs
  if (shouldExclude(request.url)) return false;

  return true;
};

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation');

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Mise en cache des assets statiques');
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  event.waitUntil(clients.claim());
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non cacheables
  if (!isCacheable(event.request)) {
    return;
  }

  const url = new URL(event.request.url);

  // Stratégie: Network first avec fallback cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache la réponse uniquement si c'est une GET réussie
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseClone).catch((err) => {
              console.warn('[SW] Erreur mise en cache:', err.message);
            });
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback: retourner depuis le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Si c'est une page HTML, retourner la page d'erreur
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }

          return new Response('Hors ligne', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('[SW] Notification push reçue', event);

  let data = {
    title: 'DeliCI',
    body: 'Nouvelle notification',
    icon: '/favicon.svg',
    badge: '/favicon.svg'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Gestion du clic sur une notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Clic sur notification', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Gestion de la synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('[SW] Synchronisation', event);

  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

// Fonction de synchronisation des commandes
async function syncOrders() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const offlineOrders = await cache.match('/offline-orders');

    if (offlineOrders) {
      const orders = await offlineOrders.json();
      for (const order of orders) {
        await fetch('/api/commandes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(order)
        });
      }
      await cache.delete('/offline-orders');
    }
  } catch (error) {
    console.error('[SW] Erreur synchronisation:', error);
  }
}