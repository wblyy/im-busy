const CACHE = 'im-busy-v4'

const PRECACHE = [
  '/scenes/placeholder.svg',
]

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Scene photos: cache-first (large files, don't change)
  if (url.pathname.startsWith('/scenes/')) {
    e.respondWith(
      caches.match(request).then(cached =>
        cached || fetch(request).then(resp => {
          const clone = resp.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
          return resp
        })
      )
    )
    return
  }

  // App shell (HTML, JS, CSS): network-first, fall back to cache
  e.respondWith(
    fetch(request)
      .then(resp => {
        const clone = resp.clone()
        caches.open(CACHE).then(c => c.put(request, clone))
        return resp
      })
      .catch(() => caches.match(request))
  )
})
