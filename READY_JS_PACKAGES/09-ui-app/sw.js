/**
 * OTS Forensic Enterprise - Service Worker v12.0
 * PASEVSU · Denislav Dimitrov Pasev
 * Офлайн режим и кеширане
 */

const CACHE_NAME = 'ots-forensic-v12';
const ASSETS = [
    './',
    './generator.html',
    './style.css',
    './utils.js',
    './context.js',
    './ops.js',
    './timestamp.js',
    './notary.js',
    './merkle.js',
    './calendar.js',
    './detached-timestamp-file.js',
    './esplora.js',
    './bitcoin.js',
    './open-timestamps.js',
    './ots-package-engine.js',
    './main.js',
    './OtsCli.jar'
];

// ================================================================
// ИНСТАЛАЦИЯ
// ================================================================
self.addEventListener('install', event => {
    console.log('📦 Service Worker инсталиране...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Кеширане на файлове...');
                return cache.addAll(ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker инсталиран');
                return self.skipWaiting();
            })
    );
});

// ================================================================
// АКТИВАЦИЯ
// ================================================================
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker активиране...');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('🗑️ Изтриване на стар кеш:', key);
                        return caches.delete(key);
                    })
            );
        })
        .then(() => {
            console.log('✅ Service Worker активиран');
            return self.clients.claim();
        })
    );
});

// ================================================================
// ПРЕХВАТЯНЕ НА ЗАЯВКИ
// ================================================================
self.addEventListener('fetch', event => {
    const request = event.request;
    
    // API заявки - не се кешират
    if (request.url.includes('/api/')) {
        event.respondWith(fetch(request));
        return;
    }
    
    // Статични файлове - от кеш
    event.respondWith(
        caches.match(request)
            .then(response => {
                if (response) {
                    // Обновяване на кеша на фона
                    event.waitUntil(
                        fetch(request).then(fresh => {
                            if (fresh && fresh.status === 200) {
                                const cache = caches.open(CACHE_NAME);
                                cache.then(c => c.put(request, fresh));
                            }
                        }).catch(() => {})
                    );
                    return response;
                }
                
                // Ако не е в кеш, опит от мрежата
                return fetch(request).then(response => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        event.waitUntil(
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(request, clone))
                        );
                    }
                    return response;
                }).catch(() => {
                    // Офлайн режим - показване на fallback
                    return new Response('Офлайн режим. Моля, свържете се с интернет.', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
    );
});

// ================================================================
// СЪОБЩЕНИЯ ОТ КЛИЕНТА
// ================================================================
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});

console.log('✅ sw.js зареден');