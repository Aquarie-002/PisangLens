const cachePrefix = 'pisanglens-shell-';
const cacheName = `${cachePrefix}v10`;
const shellUrls = [
    './',
    './index.html',
    './manifest.webmanifest',
    './js/config.js',
    './js/predict.js',
    './petani-daftar.html',
    './petani-kamera.html',
    './admin-verifikasi.html',
    './admin-masuk.html',
    './botani-akun.html',
    './css/app.css',
    './css/dashboard.css',
    './icons/daun.svg',
    './js/api.js',
    './js/auth.js',
    './js/staff.js',
    './js/botani.js',
    './js/dashboard.js',
    './js/camera.js',
    './js/crypto.js',
    './js/db.js',
    './js/dictionary.js',
    './js/petani.js',
    './js/sync.js',
    './js/consultations.js',
    './js/chat.js',
    './js/photos.js',
    './js/directory.js',
    './js/region-examples.js',
    './js/app-update.js',
].map(path => new URL(path, self.registration.scope).href);

self.addEventListener('install', event => {
    event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(shellUrls)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(
        keys.filter(key => key.startsWith(cachePrefix) && key !== cacheName)
            .map(key => caches.delete(key))
    )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET' || !shellUrls.includes(request.url)) return;

    event.respondWith(caches.open(cacheName).then(async cache => {
        const response = await cache.match(request);
        return response ?? fetch(request);
    }));
});
