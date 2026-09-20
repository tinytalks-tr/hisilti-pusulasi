import React, { useMemo, useState } from 'react'

/* ------------------------------------------------------------------ */
/*  Modifiye Astım Prediktif İndeksi (mAPI) — aile diliyle.            */
/*  Giriş koşulu: yılda ≥4 hışıltı atağı, en az biri hekim doğrulamalı. */
/*  Majör: ebeveyn astımı · egzama · aeroalerjen duyarlanması          */
/*  Minör: besin duyarlanması · hastalıksız hışıltı · eozinofil ≥%4    */
/* ------------------------------------------------------------------ */

const SORULAR = [
  {
    id: 'yas',
    tip: 'secim',
    baslik: 'Çocuğunuz kaç yaşında?',
    alt: 'Bu pusula en çok okul öncesi dönemde işe yarıyor.',
    secenekler: [
      { deger: 'kucuk', etiket: '3 yaşından küçük' },
      { deger: 'orta', etiket: '3–5 yaş arası' },
      { deger: 'buyuk', etiket: '5 yaşında ya da daha büyük' },
    ],
  },
  {
    id: 'hisilti',
    tip: 'secim',
    gorunur: (c) => c.yas !== 'buyuk',
    baslik: 'Son bir yılda kaç kez hışıltılı bir dönem geçirdi?',
    alt: 'Hışıltı, göğüsten gelen ıslık gibi sestir. Bir günden uzun süren ve uykusunu bölen dönemleri sayın.',
    secenekler: [
      { deger: 'yok', etiket: 'Hiç olmadı' },
      { deger: 'ara', etiket: '1 ile 3 kez arasında' },
      { deger: 'sik', etiket: '4 kez ya da daha fazla' },
    ],
  },
  {
    id: 'hekim',
    tip: 'evet',
    gorunur: (c) => c.yas !== 'buyuk' && c.hisilti === 'sik',
    baslik: 'Bu hışıltıların en az birini doktor muayenede duydu mu?',
    alt: 'Değerlendirmenin en önemli şartı bu. Sadece sizin duyduğunuz sesler için “hayır” diyebilirsiniz.',
  },
  {
    id: 'ebeveyn',
    tip: 'evet',
    grup: 'buyuk',
    gorunur: (c) => c.yas !== 'buyuk' && c.hisilti === 'sik',
    baslik: 'Annesinde ya da babasında astım var mı?',
    alt: 'Doktorun koyduğu bir astım tanısı kastediliyor; “nefesi daralır” demek yeterli değil.',
  },
  {
    id: 'egzama',
    tip: 'evet',
    grup: 'buyuk',
    gorunur: (c) => c.yas !== 'buyuk' && c.hisilti === 'sik',
    baslik: 'Çocuğunuza egzama tanısı kondu mu?',
    alt: 'Kıvrım yerlerinde kaşınan, kuruyan, tekrarlayan kızarıklıklar için doktor “egzama” ya da “atopik dermatit” dediyse evet.',
  },
  {
    id: 'aeroalerjen',
    tip: 'evet',
    grup: 'buyuk',
    gorunur: (c) => c.yas !== 'buyuk' && c.hisilti === 'sik',
    baslik: 'Havadaki alerjenlere karşı duyarlılığı saptandı mı?',
    alt: 'Ev tozu akarı, polen, küf, kedi ya da köpek için yapılan deri testi veya kan tahlili pozitif çıktıysa evet. Test yapılmadıysa “Bilmiyorum” deyin.',
  },
  {
    id: 'besin',
    tip: 'evet',
    grup: 'kucuk',
    gorunur: (c) => c.yas !== 'buyuk' && c.hisilti === 'sik',
    baslik: 'Süt, yumurta ya da fıstığa karşı alerjisi saptandı mı?',
    alt: 'Deri testi ya da kan tahliliyle gösterilmiş bir duyarlılık kastediliyor; “yemeyi sevmiyor” değil.',
  },
  {
    id: 'hastaliksiz',
    tip: 'evet',
    grup: 'kucuk',
    gorunur: (c) => c.yas !== 'buyuk' && c.hisilti === 'sik',
    baslik: 'Hasta olmadığı zamanlarda da hışıltı oluyor mu?',
    alt: 'Örneğin koşarken, gülerken, kediyle oynarken ya da tozlu bir odada — ortada nezle grip yokken.',
  },
  {
    id: 'eozinofil',
    tip: 'evet',
    grup: 'kucuk',
    gorunur: (c) => c.yas !== 'buyuk' && c.hisilti === 'sik',
    baslik: 'Kan sayımında “eozinofil” yüksek bulundu mu?',
    alt: 'Tam kan sayımı sonucunda EOS% satırı %4’ün üzerindeyse evet. Bilmiyorsanız çekinmeyin, işaretleyin.',
  },
]

/* ------------------------------------------------------------------ */

const SONUCLAR = {
  pusulaYok: {
    ton: 'notr',
    etiket: 'Bu pusula şimdilik gerekmiyor',
    astimli: null,
    baslik: 'Hışıltı yoksa bu sorunun cevabını aramaya gerek yok.',
    ozet:
      'Hışıltı Pusulası, göğsünden tekrar tekrar ıslık sesi gelen çocuklar için hazırlandı. Böyle bir şikâyet olmadığı sürece astım riskini hesaplamak anlamlı değil.',
    yapilacaklar: [
      'Nefesle ilgili yeni bir şikâyet başlarsa buraya tekrar dönebilirsiniz.',
      'Öksürük gece uykusunu bölüyorsa, hışıltı olmasa bile doktorunuza söyleyin.',
    ],
  },
  araSira: {
    ton: 'iyi',
    etiket: 'Henüz hesaplamaya gerek yok',
    astimli: null,
    baslik: 'Ara sıra gelen hışıltı, çoğu çocukta büyüdükçe geçiyor.',
    ozet:
      'Bu pusulanın dayandığı araştırma, yılda dört ya da daha fazla hışıltılı dönem geçiren çocuklar için tasarlandı. Daha seyrek atakları olan çocuklarda astım ihtimali belirgin şekilde düşük; bu yüzden size bir sayı vermek doğru olmaz. Okul öncesi hışıltının büyük kısmı, hava yolları büyüyüp genişledikçe kendiliğinden kayboluyor.',
    yapilacaklar: [
      'Atakları bir not defterine yazın: ne zaman oldu, kaç gün sürdü, ne yaparken başladı.',
      'Evde sigara içilmesin — bu, gidişatı en çok değiştiren tek şey.',
      'Atak sayısı yılda dördü geçerse ya da hasta olmadığı zamanlarda da başlarsa pusulayı yeniden çevirin.',
    ],
  },
  buyukYas: {
    ton: 'notr',
    etiket: 'Bu yaşta artık tahmin değil, tanı konuşulur',
    astimli: null,
    baslik: 'Çocuğunuz için “ileride olur mu” sorusunun vakti geçti — artık “şu an var mı” sorulmalı.',
    ozet:
      'Bu pusula, üç yaşından küçük çocuklarda ileride astım gelişip gelişmeyeceğini tahmin etmek için tasarlandı. Beş yaşından sonra tahmine gerek kalmıyor: bu yaşta çocuklar nefes ölçüm testini (solunum fonksiyon testi) yapabilecek hale geliyor, yani doktorunuz olasılık hesaplamak yerine doğrudan bakabiliyor. Size bir yüzde vermek, elinizde daha kesin bir yol varken yanıltıcı olurdu.',
    yapilacaklar: [
      'Çocuk doktorunuza başvurun ve nefes ölçüm testi (solunum fonksiyon testi) yapılabilir mi diye sorun.',
      'Gidene kadar bir liste hazırlayın: son bir yılda kaç kez göğsünden ses geldi, kaç gece öksürükten uyandı, koşarken zorlanıyor mu.',
      'Öksürük ya da hışıltı için kullandığınız ilaçların işe yarayıp yaramadığını not edin — doktorun en çok işine yarayacak bilgi bu.',
      'Evde sigara içilmesin.',
    ],
  },
  dusuk: {
    ton: 'iyi',
    etiket: 'Şimdilik rahat olabilirsiniz',
    astimli: 9,
    baslik: 'Benzer 100 çocuktan yaklaşık 91’inde okul çağında astım görülmemiş.',
    ozet:
      'Çocuğunuzun atakları sık, ama alerjik yatkınlığı gösteren işaretler bir araya gelmemiş. Bu birleşim olmadan, tekrarlayan hışıltının astıma dönüşme ihtimali belirgin şekilde düşük kalıyor.',
    yapilacaklar: [
      'Atak günlüğü tutmaya devam edin: tarih, süre, tetikleyici.',
      'Evde sigara içilmesin — bu, sonucu en çok değiştiren tek şey.',
      'Egzama, alerji ya da yeni bir tahlil sonucu ortaya çıkarsa pusulayı yeniden çevirin; sonuç değişebilir.',
    ],
  },
  yuksek: {
    ton: 'dikkat',
    etiket: 'Doktorla konuşulmalı',
    astimli: 72,
    baslik: 'Benzer 100 çocuktan yaklaşık 28’inde okul çağında astım görülmemiş.',
    ozet:
      'Sık tekrarlayan hışıltı ve alerjik yatkınlık işaretleri bir arada. Bu çocukların çoğunda okul çağında astım belirtileri görülmüş. Buradaki iyi haber şu: astım, bugün en iyi kontrol edilebilen çocukluk hastalıklarından biri — erken fark edilmesi işleri kolaylaştırıyor, zorlaştırmıyor.',
    yapilacaklar: [
      'Bu sonucu çocuk doktorunuza gösterin ve düzenli bir izlem planı isteyin.',
      'Henüz yapılmadıysa alerji değerlendirmesi gündeme gelebilir; korkulacak bir şey değil.',
      'Atak günlüğü tutun: tarih, süre, tetikleyici, verilen ilaç.',
      'Evde sigara içilmemesi bu grupta en yüksek faydayı sağlayan adımdır.',
    ],
  },
}

const TONLAR = {
  iyi: { nokta: '#5B8A8A', rozet: 'bg-teal/15 text-tealKoyu' },
  dikkat: { nokta: '#E8A87C', rozet: 'bg-mercan/30 text-lacivert' },
  notr: { nokta: '#8A8FA3', rozet: 'bg-lacivert/10 text-lacivert' },
}

/* ------------------------------------------------------------------ */

function YuzNokta({ astimli, renk }) {
  const noktalar = Array.from({ length: 100 }, (_, i) => i < astimli)
  return (
    <div className="grid grid-cols-10 gap-[5px] sm:gap-[7px] max-w-[320px]">
      {noktalar.map((astim, i) => (
        <span
          key={i}
          className="nokta-gir aspect-square rounded-full"
          style={{
            background: astim ? renk : '#FFFFFF',
            border: astim ? 'none' : '1.5px solid rgba(45,49,66,.16)',
            animationDelay: `${i * 6}ms`,
          }}
        />
      ))}
    </div>
  )
}

function Ilerleme({ adim, toplam }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      {Array.from({ length: toplam }, (_, i) => (
        <span
          key={i}
          className="h-[5px] flex-1 rounded-full transition-colors duration-300"
          style={{ background: i <= adim ? '#5B8A8A' : 'rgba(45,49,66,.13)' }}
        />
      ))}
    </div>
  )
}

function Dugme({ children, onClick, secili, ipucu }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left rounded-2xl border-2 px-5 py-4 transition-all duration-150',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-teal/35',
        secili
          ? 'border-teal bg-teal/10'
          : 'border-kremKoyu bg-white hover:border-teal/60 hover:-translate-y-[1px] hover:shadow-yumusak',
      ].join(' ')}
    >
      <span className="block text-[17px] font-semibold leading-snug">{children}</span>
      {ipucu && <span className="mt-0.5 block text-[14px] text-lacivertYumusak">{ipucu}</span>}
    </button>
  )
}

/* ------------------------------------------------------------------ */

function gorunenSorular(cevaplar) {
  return SORULAR.filter((s) => !s.gorunur || s.gorunur(cevaplar))
}

export default function App() {
  const [ekran, setEkran] = useState('giris')
  const [adim, setAdim] = useState(0)
  const [cevaplar, setCevaplar] = useState({})
  const [kaynakAcik, setKaynakAcik] = useState(false)
  const [kopyalandi, setKopyalandi] = useState(false)

  const gorunen = gorunenSorular(cevaplar)
  const soru = gorunen[Math.min(adim, gorunen.length - 1)]

  const sonuc = useMemo(() => {
    if (ekran !== 'sonuc') return null
    const { yas, hisilti, ebeveyn, egzama, aeroalerjen, besin, hastaliksiz, eozinofil } = cevaplar

    if (yas === 'buyuk') return { ...SONUCLAR.buyukYas, anahtar: 'buyukYas' }
    if (!hisilti || hisilti === 'yok') return { ...SONUCLAR.pusulaYok, anahtar: 'pusulaYok' }
    if (hisilti === 'ara') return { ...SONUCLAR.araSira, anahtar: 'araSira' }

    const buyuk = [ebeveyn, egzama, aeroalerjen].filter((c) => c === 'evet').length
    const kucuk = [besin, hastaliksiz, eozinofil].filter((c) => c === 'evet').length
    const isaretVar = buyuk >= 1 || kucuk >= 2

    return isaretVar
      ? { ...SONUCLAR.yuksek, anahtar: 'yuksek', buyuk, kucuk }
      : { ...SONUCLAR.dusuk, anahtar: 'dusuk', buyuk, kucuk }
  }, [ekran, cevaplar])

  const bilinmeyen = Object.entries(cevaplar).filter(
    ([k, v]) => v === 'bilmiyorum' && k !== 'hekim',
  ).length

  function cevapla(deger) {
    const yeni = { ...cevaplar, [soru.id]: deger }
    setCevaplar(yeni)

    // 5 yaş üstünde bu indeks uygulanmaz; tahmin yerine tanı yoluna yönlendir.
    if (soru.id === 'yas' && deger === 'buyuk') {
      setEkran('sonuc')
      return
    }
    // Hışıltı yoksa ya da seyrekse bu indeks uygulanmaz; kalan soruları sormayalım.
    if (soru.id === 'hisilti' && deger !== 'sik') {
      setEkran('sonuc')
      return
    }
    const yeniGorunen = gorunenSorular(yeni)
    if (adim >= yeniGorunen.length - 1) setEkran('sonuc')
    else setAdim(adim + 1)
  }

  function geri() {
    if (adim === 0) setEkran('giris')
    else setAdim(adim - 1)
  }

  function bastanBasla() {
    setCevaplar({})
    setAdim(0)
    setKaynakAcik(false)
    setEkran('giris')
  }

  function ozetiKopyala() {
    const satirlar = [
      'HIŞILTI PUSULASI — sonuç özeti',
      '',
      `Yaş: ${etiketBul('yas', cevaplar.yas)}`,
      cevaplar.yas === 'buyuk' ? '' : `Son bir yıldaki hışıltılı dönem: ${etiketBul('hisilti', cevaplar.hisilti)}`,
      cevaplar.hisilti === 'sik' ? `Atağı hekim duydu mu: ${evetHayir(cevaplar.hekim)}` : '',
      cevaplar.hisilti === 'sik' ? `Ailede astım: ${evetHayir(cevaplar.ebeveyn)}` : '',
      cevaplar.hisilti === 'sik' ? `Egzama tanısı: ${evetHayir(cevaplar.egzama)}` : '',
      cevaplar.hisilti === 'sik' ? `Aeroalerjen duyarlılığı: ${evetHayir(cevaplar.aeroalerjen)}` : '',
      cevaplar.hisilti === 'sik' ? `Süt/yumurta/fıstık duyarlılığı: ${evetHayir(cevaplar.besin)}` : '',
      cevaplar.hisilti === 'sik' ? `Hastalık dışı hışıltı: ${evetHayir(cevaplar.hastaliksiz)}` : '',
      cevaplar.hisilti === 'sik' ? `Eozinofil yüksekliği: ${evetHayir(cevaplar.eozinofil)}` : '',
      '',
      `Sonuç: ${sonuc?.etiket}`,
      sonuc?.astimli != null
        ? `Benzer 100 çocuktan yaklaşık ${100 - sonuc.astimli}’inde okul çağında astım görülmemiş.`
        : '',
      '',
      'Not: Bu bir tanı değildir. Modifiye Astım Prediktif İndeksi (mAPI) temel alınarak',
      'aileler için hazırlanmıştır. Değerlendirme hekime aittir.',
      'TinyTalks · @tinytalksbydrirem',
    ].filter(Boolean)

    const metin = satirlar.join('\n')
    const bitti = () => {
      setKopyalandi(true)
      setTimeout(() => setKopyalandi(false), 2000)
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(metin).then(bitti, () => yedekKopya(metin, bitti))
    } else {
      yedekKopya(metin, bitti)
    }
  }

  return (
    <div className="min-h-screen bg-krem px-4 pb-16 pt-[max(24px,env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-[640px]">
        <header className="mb-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="text-[13px] font-bold uppercase tracking-[.16em] text-tealKoyu">
              TinyTalks
            </span>
          </div>
          {ekran !== 'giris' && (
            <button
              type="button"
              onClick={bastanBasla}
              className="rounded-full border border-kremKoyu bg-white px-3.5 py-1.5 text-[13px] font-semibold text-lacivertYumusak transition hover:border-teal hover:text-tealKoyu"
            >
              Baştan başla
            </button>
          )}
        </header>

        {ekran === 'giris' && <Giris onBasla={() => setEkran('soru')} />}

        {ekran === 'soru' && soru && (
          <section className="kart-gir" key={soru.id}>
            <Ilerleme adim={adim} toplam={gorunen.length} />
            <p className="mt-5 text-[13px] font-bold uppercase tracking-[.14em] text-tealKoyu">
              Soru {adim + 1} / {gorunen.length}
            </p>
            <h1 className="mt-2 font-baslik text-[27px] font-semibold leading-[1.18] tracking-[-.01em] sm:text-[32px]">
              {soru.baslik}
            </h1>
            <p className="mt-3 text-[16px] leading-relaxed text-lacivertYumusak">{soru.alt}</p>

            <div className="mt-6 flex flex-col gap-3">
              {(soru.tip === 'secim'
                ? soru.secenekler
                : [
                    { deger: 'evet', etiket: 'Evet' },
                    { deger: 'hayir', etiket: 'Hayır' },
                    { deger: 'bilmiyorum', etiket: 'Bilmiyorum', ipucu: 'Emin değilseniz bunu seçin' },
                  ]
              ).map((s) => (
                <Dugme
                  key={s.deger}
                  ipucu={s.ipucu}
                  secili={cevaplar[soru.id] === s.deger}
                  onClick={() => cevapla(s.deger)}
                >
                  {s.etiket}
                </Dugme>
              ))}
            </div>

            <button
              type="button"
              onClick={geri}
              className="mt-6 text-[15px] font-semibold text-lacivertYumusak underline decoration-kremKoyu underline-offset-4 transition hover:text-tealKoyu"
            >
              ← Önceki soru
            </button>
          </section>
        )}

        {ekran === 'sonuc' && sonuc && (
          <Sonuc
            sonuc={sonuc}
            cevaplar={cevaplar}
            bilinmeyen={bilinmeyen}
            kaynakAcik={kaynakAcik}
            setKaynakAcik={setKaynakAcik}
            onKopyala={ozetiKopyala}
            kopyalandi={kopyalandi}
            onTekrar={bastanBasla}
          />
        )}

        <Altbilgi />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Giris({ onBasla }) {
  return (
    <section className="kart-gir">
      <h1 className="font-baslik text-[34px] font-semibold leading-[1.1] tracking-[-.015em] sm:text-[42px]">
        Hışıltı Pusulası
      </h1>
      <p className="mt-4 text-[18px] leading-relaxed text-lacivertYumusak">
        Küçük çocukların göğsünden gelen ıslık sesinin çoğu, büyüdükçe kendiliğinden geçer. Bir
        kısmı ise astıma dönüşür. Bu iki yolu birbirinden ayırmaya yarayan birkaç işaret var.
      </p>
      <p className="mt-3 text-[18px] leading-relaxed text-lacivertYumusak">
        Birkaç kısa soru soracağız, sonunda size bir sayı vereceğiz:{' '}
        <strong className="font-bold text-lacivert">
          çocuğunuza benzeyen 100 çocuktan kaçında okul çağında astım görülmemiş
        </strong>
        .
      </p>

      <div className="mt-7 rounded-2xl bg-white p-5 shadow-yumusak">
        <p className="text-[15px] font-bold text-lacivert">Başlamadan önce</p>
        <ul className="mt-2.5 flex flex-col gap-2 text-[16px] leading-relaxed text-lacivertYumusak">
          <li>• Bu bir tanı aracı değil. Sonuç, doktorunuzla konuşmanız için bir başlangıç.</li>
          <li>• Hiçbir bilgi kaydedilmez, hiçbir yere gönderilmez.</li>
          <li>• Alerji testi ya da kan tahlili sonucunu bilmiyorsanız “Bilmiyorum” demek tamamen normal.</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={onBasla}
        className="mt-7 w-full rounded-2xl bg-lacivert px-6 py-4 text-[18px] font-bold text-krem shadow-yumusak transition hover:bg-lacivertYumusak focus:outline-none focus-visible:ring-4 focus-visible:ring-teal/40"
      >
        Başla
      </button>

      <Acil />
    </section>
  )
}

function Sonuc({ sonuc, cevaplar, bilinmeyen, kaynakAcik, setKaynakAcik, onKopyala, kopyalandi, onTekrar }) {
  const ton = TONLAR[sonuc.ton]
  const astimsiz = sonuc.astimli == null ? null : 100 - sonuc.astimli
  const hekimYok = cevaplar.hisilti === 'sik' && cevaplar.hekim !== 'evet'

  return (
    <section className="kart-gir">
      <span
        className={`inline-block rounded-full px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-[.1em] ${ton.rozet}`}
      >
        {sonuc.etiket}
      </span>

      <h1 className="mt-4 font-baslik text-[28px] font-semibold leading-[1.16] tracking-[-.015em] sm:text-[34px]">
        {sonuc.baslik}
      </h1>

      {astimsiz !== null && (
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-yumusak">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <YuzNokta astimli={sonuc.astimli} renk={ton.nokta} />
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <span
                  className="mt-[5px] h-3.5 w-3.5 flex-none rounded-full"
                  style={{ border: '1.5px solid rgba(45,49,66,.16)', background: '#fff' }}
                />
                <span className="text-[16px] leading-snug">
                  <strong className="text-[20px] font-bold">{astimsiz}</strong> çocukta okul çağında
                  astım <strong>görülmemiş</strong>
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span
                  className="mt-[5px] h-3.5 w-3.5 flex-none rounded-full"
                  style={{ background: ton.nokta }}
                />
                <span className="text-[16px] leading-snug">
                  <strong className="text-[20px] font-bold">{sonuc.astimli}</strong> çocukta astım
                  belirtileri görülmüş
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="mt-6 text-[18px] leading-relaxed text-lacivertYumusak">{sonuc.ozet}</p>

      {sonuc.anahtar === 'buyukYas' && <Spirometri />}

      {hekimYok && (
        <p className="mt-4 rounded-2xl bg-mercan/20 px-5 py-4 text-[16px] leading-relaxed">
          Hışıltıların en az birinin doktor tarafından muayenede duyulmuş olması, bu
          değerlendirmenin temel şartı. Henüz olmadıysa bir sonraki atakta çocuğunuzu doktora
          götürün — sonuç değişebilir.
        </p>
      )}

      {bilinmeyen > 0 && (
        <p className="mt-4 rounded-2xl bg-white px-5 py-4 text-[16px] leading-relaxed shadow-yumusak">
          {bilinmeyen} soruya “bilmiyorum” dediniz. Özellikle alerji testi, egzama ve kan tahlili
          soruları sonucu değiştirebilir; doktorunuzla birlikte netleştirdikten sonra pusulayı
          yeniden çevirin.
        </p>
      )}

      <div className="mt-7 rounded-3xl bg-white p-6 shadow-yumusak">
        <h2 className="font-baslik text-[21px] font-semibold">Şimdi ne yapmalı?</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {sonuc.yapilacaklar.map((y, i) => (
            <li key={i} className="flex gap-3 text-[16.5px] leading-relaxed text-lacivertYumusak">
              <span className="mt-[9px] h-2 w-2 flex-none rounded-full bg-mercan" />
              <span>{y}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onKopyala}
        className="mt-5 w-full rounded-2xl bg-lacivert px-6 py-4 text-[17px] font-bold text-krem shadow-yumusak transition hover:bg-lacivertYumusak focus:outline-none focus-visible:ring-4 focus-visible:ring-teal/40"
      >
        {kopyalandi ? 'Kopyalandı ✓' : 'Sonucu kopyala ve doktoruna göster'}
      </button>

      <div className="mt-5 overflow-hidden rounded-2xl border border-kremKoyu bg-white">
        <button
          type="button"
          onClick={() => setKaynakAcik(!kaynakAcik)}
          aria-expanded={kaynakAcik}
          className="flex w-full items-center justify-between px-5 py-4 text-left text-[16px] font-bold transition hover:text-tealKoyu"
        >
          Bu sayılar nereden geliyor?
          <span className="text-tealKoyu">{kaynakAcik ? '−' : '+'}</span>
        </button>
        {kaynakAcik && (
          <div className="border-t border-kremKoyu px-5 py-4 text-[16px] leading-relaxed text-lacivertYumusak">
            <p>
              Sık hışıltısı olan küçük çocuklar yıllarca izlenmiş, hangilerinin okul çağında astım
              olduğu tek tek sayılmış. Ortaya çıkan tablo şu: ailede astım, egzama, havadaki
              alerjenlere duyarlılık, besin alerjisi, hasta olmadan gelen hışıltı ve kan
              tahlilindeki eozinofil yüksekliği — bu işaretler birikince astım ihtimali belirgin
              şekilde artıyor.
            </p>
            <p className="mt-3">
              Buradaki sayılar, bu işaretlerin bir araya geldiği çocuklarda astım ihtimalinin
              yaklaşık dörtte üçe çıktığını, işaretler yokken ise ondan birinin altında kaldığını
              gösteren araştırmalardan alındı.
            </p>
            <p className="mt-3 text-[15px]">
              Kaynaklar: Castro-Rodríguez JA ve ark., <em>Am J Respir Crit Care Med</em> 2000;
              Guilbert TW ve ark., <em>J Allergy Clin Immunol</em> 2004; Chang TS ve ark.,{' '}
              <em>J Allergy Clin Immunol Pract</em> 2013. Bu araç, o çalışmalardaki{' '}
              <strong>Modifiye Astım Prediktif İndeksi</strong>’ni aile diline çevirir.
            </p>
            <p className="mt-3 text-[15px]">
              Sayılar bir grubun ortalamasıdır; tek bir çocuk için kesin bir kader değildir.
            </p>
          </div>
        )}
      </div>

      <Acil />

      <button
        type="button"
        onClick={onTekrar}
        className="mt-6 w-full rounded-2xl border-2 border-kremKoyu bg-white px-6 py-3.5 text-[16px] font-bold text-lacivertYumusak transition hover:border-teal hover:text-tealKoyu"
      >
        Baştan başla
      </button>
    </section>
  )
}

function Spirometri() {
  const [acik, setAcik] = React.useState(false)
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border-2 border-teal/35 bg-white">
      <button
        type="button"
        onClick={() => setAcik(!acik)}
        aria-expanded={acik}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[16.5px] font-bold transition hover:text-tealKoyu"
      >
        Nefes ölçüm testi nedir, nasıl değerlendirilir?
        <span className="text-[22px] leading-none text-tealKoyu">{acik ? '−' : '+'}</span>
      </button>

      {acik && (
        <div className="border-t border-kremKoyu px-5 py-5 text-[16.5px] leading-relaxed text-lacivertYumusak">
          <h3 className="font-baslik text-[19px] font-semibold text-lacivert">Testte ne oluyor?</h3>
          <p className="mt-2">
            Çocuk bir ağızlığa derin nefes alır, sonra gücünün yettiği kadar <strong>hızlı ve
            uzun</strong> üfler. İğne yok, acıtmıyor, birkaç dakika sürüyor. Çoğu merkezde ekranda
            mum söndürme ya da balon şişirme oyunu var. Genellikle 5–6 yaşından sonra yapılabiliyor,
            çünkü çocuğun komutu takip edebilmesi gerekiyor. Sonuç güvenilir olsun diye üfleme
            birkaç kez tekrarlanır.
          </p>

          <h3 className="mt-5 font-baslik text-[19px] font-semibold text-lacivert">
            Neyi ölçüyor?
          </h3>
          <p className="mt-2">
            İki sayı önemli: <strong>bir saniyede</strong> üflediği hava ve <strong>toplamda</strong>{' '}
            üflediği hava. Asıl bakılan, bu ikisinin birbirine oranı.
          </p>

          <h3 className="mt-5 font-baslik text-[19px] font-semibold text-lacivert">
            Neden bir saniye?
          </h3>
          <p className="mt-2">
            Astımda nefes boruları daralmıştır. Dar boru havanın <em>miktarını</em> değil,{' '}
            <em>hızını</em> düşürür — ucunu sıktığınız bir hortumdan suyun yavaş çıkması gibi. Bu
            yüzden çocuk toplamda neredeyse normal kadar hava üflese bile, ilk saniyede çıkarabildiği
            hava azalır. Test tam olarak bu farkı yakalar.
          </p>

          <h3 className="mt-5 font-baslik text-[19px] font-semibold text-lacivert">
            İkinci bölüm: açıcı ilaç denemesi
          </h3>
          <p className="mt-2">
            İlk üflemeden sonra nefes açıcı bir ilaç verilir, yaklaşık 15 dakika beklenir ve test
            tekrarlanır. Sayılar belirgin şekilde yükseldiyse, daralmanın <strong>geri
            döndürülebilir</strong> olduğu anlaşılır. Astımın en karakteristik imzası budur: boru
            kalıcı olarak değil, geçici olarak daralıyor.
          </p>

          <h3 className="mt-5 font-baslik text-[19px] font-semibold text-lacivert">
            Test normal çıkarsa astım yok mu demek?
          </h3>
          <p className="mt-2">
            Hayır. Çocuk iyi olduğu bir günde test normal çıkabilir — astımda hava yolları her zaman
            dar değil, ataklarla daralıyor. Doktorunuz bu durumda koşu testi gibi bir kışkırtma
            testi ya da nefesteki iltihap ölçümünü (FeNO) isteyebilir, ya da bir süre günlük tutup
            testi tekrarlamayı önerebilir.
          </p>

          <div className="mt-5 rounded-xl bg-krem px-4 py-4">
            <p className="text-[15px] font-bold text-lacivert">Teste giderken</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-[15.5px]">
              <li>• Nefes açıcı ilaçların testten kaç saat önce kesilmesi gerektiğini önceden sorun.</li>
              <li>• Tok karnına gitmeyin; dar kıyafet üflemeyi zorlaştırır.</li>
              <li>• Çocuk o gün nezle ya da grip olduysa randevuyu erteletmek daha doğru olabilir.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function Acil() {
  return (
    <div className="mt-7 rounded-2xl border-2 border-mercan/60 bg-mercan/10 p-5">
      <p className="text-[15px] font-bold uppercase tracking-[.1em] text-lacivert">
        Hemen acile gidin
      </p>
      <p className="mt-2 text-[16px] leading-relaxed text-lacivertYumusak">
        Nefes alırken kaburga araları içeri çöküyorsa, dudak ya da tırnak morarıyorsa, konuşurken
        cümlesini tamamlayamıyorsa ya da çok halsizse en yakın acile gidin.
      </p>
    </div>
  )
}

function Altbilgi() {
  return (
    <footer className="mt-12 border-t border-kremKoyu pt-6 text-[14px] leading-relaxed text-lacivertYumusak">
      <p>
        <strong className="text-lacivert">Hışıltı Pusulası</strong> — TinyTalks tarafından aileler
        için hazırlandı. Tıbbi tanı ya da tedavi yerine geçmez; çocuğunuzu tanıyan hekimin
        değerlendirmesinin yerini alamaz.
      </p>
      <p className="mt-2">Dr. İrem Kunter · @tinytalksbydrirem</p>
    </footer>
  )
}

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="13" r="12" fill="#5B8A8A" />
      <path
        d="M7 15.5c2.2-3.6 4.2-5.4 6-5.4 1.8 0 2.7 1.2 2.7 2.5 0 1.1-.8 2-1.9 2-1 0-1.7-.6-1.7-1.5"
        stroke="#F7F1E8"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="18.4" cy="9.2" r="1.7" fill="#E8A87C" />
    </svg>
  )
}

/* ---------------------------- yardımcılar --------------------------- */

function etiketBul(soruId, deger) {
  const s = SORULAR.find((x) => x.id === soruId)
  const bulunan = s?.secenekler?.find((x) => x.deger === deger)
  return bulunan ? bulunan.etiket : '—'
}

function evetHayir(deger) {
  if (deger === 'evet') return 'Evet'
  if (deger === 'hayir') return 'Hayır'
  if (deger === 'bilmiyorum') return 'Bilinmiyor'
  return '—'
}

function yedekKopya(metin, bitti) {
  const ta = document.createElement('textarea')
  ta.value = metin
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    bitti()
  } catch (e) {
    /* sessizce geç */
  }
  document.body.removeChild(ta)
}
