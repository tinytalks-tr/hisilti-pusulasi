import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

/* ------------------------------------------------------------------ */
/*  Çevrimdışı çalışma                                                 */
/* ------------------------------------------------------------------ */

const ONBELLEK = 'hisilti-pusulasi-v1'

// Servis çalışanı ilk ziyarette sayfa yüklendikten sonra devreye girdiği için
// o ziyaretin istekleri onun eline geçmez. Sayfanın yüklediği dosyaları
// doğrudan aynı önbelleğe yazarak ilk ziyaretten sonra çevrimdışı açılmayı
// garantiye alıyoruz.
function onbellegiIsit() {
  if (!('caches' in window)) return
  try {
    const adresler = new Set(['./'])
    performance.getEntriesByType('resource').forEach((kayit) => {
      if (kayit.name.indexOf(window.location.origin) === 0) adresler.add(kayit.name)
    })
    caches
      .open(ONBELLEK)
      .then((onbellek) => onbellek.addAll(Array.from(adresler)))
      .catch(() => {})
  } catch (e) {
    /* önbellek yoksa uygulama normal çalışır */
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(onbellegiIsit)
      .catch(() => {
        /* kayıt başarısız olursa uygulama çevrimiçi çalışmaya devam eder */
      })
  })
}
