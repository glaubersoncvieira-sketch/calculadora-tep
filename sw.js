// Service Worker — Calculadora TEP Biocor
// Versão do cache — incrementar para forçar atualização
const CACHE_NAME = 'tep-biocor-v1';

// Arquivos a serem armazenados em cache para uso offline
const CACHE_FILES = [
  '/calculadora-tep/',
  '/calculadora-tep/index.html',
  '/calculadora-tep/analisar.html',
  '/calculadora-tep/manifest.json',
  '/calculadora-tep/icon-192.png',
  '/calculadora-tep/icon-512.png'
];

// Instalação: armazena todos os arquivos em cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_FILES);
    })
  );
  self.skipWaiting();
});

// Ativação: remove caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve do cache primeiro, depois da rede
self.addEventListener('fetch', event => {
  // Não interceptar chamadas à API (OpenRouter)
  if (event.request.url.includes('openrouter.ai')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Armazena em cache apenas respostas válidas de mesma origem
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline e não está em cache: retorna index como fallback
        return caches.match('/calculadora-tep/index.html');
      });
    })
  );
});
