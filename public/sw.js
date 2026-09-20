/* Hışıltı Pusulası — çevrimdışı önbellek */
const CACHE = 'hisilti-pusulasi-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

function sakla(request, response) {
  const kopya = response.clone()
  caches.open(CACHE).then((cache) => cache.put(request, kopya)).catch(() => {})
  return response
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  let url
  try {
    url = new URL(request.url)
  } catch (e) {
    return
  }
  if (url.origin !== self.location.origin) return

  // Sayfa istekleri: önce ağ, olmazsa önbellek (güncel sürümü kaçırmamak için)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => sakla(request, res))
        .catch(() => caches.match(request).then((r) => r || caches.match('./index.html'))),
    )
    return
  }

  // Varlıklar: önce önbellek (dosya adları özetli, değişince yenisi inilir)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((res) => sakla(request, res))
    }),
  )
})
