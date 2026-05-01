// Service Worker para Galeria Online PWA
const CACHE_NAME = 'galeria-v1';

// Assets que devem ser cacheados na instalação
const urlsToCache = [
  '/',
  '/index.html',
  '/script.js',
  '/styles.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap'
];

// Event: Instalação - cacheia os arquivos principais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cacheando arquivos principais...');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Erro ao cachear arquivos:', err);
      })
  );
  // Ativa o Service Worker imediatamente
  self.skipWaiting();
});

// Event: Ativação - remove caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deletando cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
  self.clients.claim();
});

// Event: Fetch - estratégia de cache
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Não cachear requisições POST, DELETE, PUT
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Estratégia para assets estáticos (cache-first)
  if (url.pathname === '/' || 
      url.pathname === '/index.html' ||
      url.pathname === '/script.js' ||
      url.pathname === '/styles.css' ||
      url.pathname === '/manifest.json') {
    event.respondWith(
      caches.match(request)
        .then(response => {
          // Se estiver em cache, retorna
          if (response) {
            return response;
          }
          // Senão, tenta fetch e cacheia
          return fetch(request)
            .then(response => {
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }
              const cloned = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, cloned);
                });
              return response;
            });
        })
        .catch(() => {
          // Se falhar, tenta servir do cache como fallback
          return caches.match(request);
        })
    );
    return;
  }

  // Estratégia para uploads e API (network-first)
  if (url.pathname.startsWith('/uploads/') || 
      url.pathname === '/gallery' ||
      url.pathname.startsWith('/media/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (!response || response.status !== 200) {
            return response;
          }
          // Cacheia resposta bem-sucedida
          const cloned = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, cloned);
            });
          return response;
        })
        .catch(() => {
          // Se rede falhar, tenta cache
          return caches.match(request);
        })
    );
    return;
  }

  // Para URLs externas (fonts, etc), tenta rede e cacheia
  event.respondWith(
    fetch(request)
      .then(response => {
        if (!response || response.status !== 200) {
          return response;
        }
        const cloned = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(request, cloned);
          });
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});
