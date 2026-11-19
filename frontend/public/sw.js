const CACHE_NAME = 'mcpherson-attendance-v2'
const CACHE_PREFIX = 'mcpherson-attendance-'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response && response.ok && response.type === 'basic') {
      await cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await cache.match(request) || await cache.match('/index.html')
    if (cached) return cached
    throw error
  }
}

function staleWhileRevalidate(request, event) {
  const cachePromise = caches.open(CACHE_NAME)
  const network = fetch(request).then(async (response) => {
    if (response && response.ok && response.type === 'basic') {
      const cache = await cachePromise
      await cache.put(request, response.clone())
    }
    return response
  }).catch(() => null)
  event.waitUntil(network.then(() => undefined))
  return cachePromise.then((cache) => cache.match(request))
    .then((cached) => cached || network)
    .then((response) => response || Response.error())
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname === '/api' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    event.respondWith(fetch(request).catch(() => new Response(
      JSON.stringify({ error: 'Offline' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )))
    return
  }

  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(networkFirst(request))
    return
  }

  event.respondWith(staleWhileRevalidate(request, event))
})
