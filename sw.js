// sw.js - DetailCalc Service Worker
// Estrategia: Cache First, con fallback a red

const CACHE_NAME = 'detailcalc-v1';

// Todos los archivos necesarios para funcionar sin internet
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './data.js',
    './calculator.js',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// --- INSTALL: cachea todos los assets al instalar ---
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Cacheando assets de la app...');
            // Usamos addAll con manejo individual para que un fallo externo no bloquee la instalación
            return Promise.allSettled(
                ASSETS_TO_CACHE.map(url => cache.add(url).catch(err => {
                    console.warn('[SW] No se pudo cachear:', url, err);
                }))
            );
        })
    );
    self.skipWaiting(); // Activa el SW inmediatamente sin esperar al cierre de tabs
});

// --- ACTIVATE: limpia caches de versiones anteriores ---
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                          .map(name => {
                              console.log('[SW] Eliminando cache antigua:', name);
                              return caches.delete(name);
                          })
            );
        })
    );
    self.clients.claim(); // Toma control de todas las tabs abiertas
});

// --- FETCH: Cache First para archivos locales, Network First para externos ---
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Para archivos locales de la app: Cache First
    if (url.origin === location.origin) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                // No está en caché: buscar en red y actualizar caché
                return fetch(event.request).then((networkResponse) => {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                    return networkResponse;
                });
            })
        );
        return;
    }

    // Para recursos externos (CDN, Fonts): Network First con fallback a caché
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                return networkResponse;
            })
            .catch(() => caches.match(event.request))
    );
});
