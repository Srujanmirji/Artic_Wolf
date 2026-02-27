const CACHE_NAME = 'aagam-ai-pwa-cache-v1';
const URLS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/aagam-logo.png',
    '/favicon.ico',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(URLS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Try network first, fall back to cache for offline support
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
