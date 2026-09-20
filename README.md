# Hışıltı Pusulası

Okul öncesi dönemde hışıltısı olan çocuklarda okul çağı astım olasılığını **ailelere sade dille**
anlatan ücretsiz web aracı. TinyTalks (@tinytalksbydrirem) için hazırlandı.

Yedi kısa soru sorar ve sonucu "benzer 100 çocuktan kaçında astım görülmemiş" biçiminde,
100 noktalık görsel bir grafikle anlatır. Hiçbir veri kaydedilmez, hiçbir yere gönderilmez —
tüm hesaplama tarayıcıda yapılır.

## Bilimsel temel

Araç, **Modifiye Astım Prediktif İndeksi**'ni (mAPI) temel alır. mAPI, orijinal API'nin
(Castro-Rodríguez, Tucson kohortu) PEAK çalışması için gözden geçirilmiş halidir: alerjik rinit
kriterlerden çıkarılmış, aeroallerjen duyarlanması majör kritere yükseltilmiş, besin duyarlanması
minör kriter olarak eklenmiştir.

**Giriş koşulu:** son 1 yılda ≥4 hışıltı atağı (her biri >1 gün süren ve uykuyu etkileyen),
en az biri hekim tarafından doğrulanmış.

| Uygulamadaki soru | mAPI karşılığı |
|---|---|
| Son bir yılda ≥4 hışıltılı dönem | Giriş koşulu |
| Atağı doktor duydu mu | Giriş koşulu (hekim doğrulaması) |
| Annesinde ya da babasında astım | Majör |
| Egzama tanısı | Majör |
| Havadaki alerjenlere duyarlılık (SPT/sIgE) | Majör |
| Süt, yumurta ya da fıstık duyarlılığı | Minör |
| Hasta değilken de hışıltı | Minör |
| Eozinofil ≥ %4 | Minör |

**Pozitiflik kuralı:** giriş koşulu + (≥1 majör **veya** ≥2 minör).

### Gösterilen yüzdeler

Sonuç ekranındaki sayılar, Chang ve ark. (2013) tarafından bildirilen *unselected population*
senaryosundan türetilmiştir: %10 ön-test olasılığı üzerine mAPI'nin yayımlanmış olabilirlik
oranları uygulanmıştır.

- **mAPI pozitif** → son-test olasılık ≈ %72 → *100 çocuktan ~28'inde astım görülmemiş*
- **mAPI negatif** → son-test olasılık ≈ %9 → *100 çocuktan ~91'inde astım görülmemiş*

Farklı bir ön-test olasılığı tercih edilirse `src/App.jsx` içindeki `SONUCLAR` nesnesinde
`astimli` alanları güncellenir; başka yerde değişiklik gerekmez.

### Yüzde verilmeyen durumlar

Uygulama üç durumda bilerek sayı vermez ve yönlendirme ekranı gösterir:

- **Hışıltı öyküsü yok** — indeksin giriş koşulu karşılanmıyor.
- **Yılda 1–3 atak** — mAPI ≥4 atak gerektirir; daha seyrek ataklar için geçerli bir tahmin yok.
- **5 yaş ve üzeri** — indeks ilk 3 yıldaki özelliklerden okul çağı astımını öngörür; 5 yaşından
  sonra tahmin penceresi kapanmıştır ve spirometri yapılabildiği için doğrudan tanısal
  değerlendirme mümkündür. Bu yaşta bir olasılık üretmek yanıltıcı olurdu.

### Kaynaklar

- Castro-Rodríguez JA, Holberg CJ, Wright AL, Martinez FD. A clinical index to define risk of
  asthma in young children with recurrent wheezing. *Am J Respir Crit Care Med.* 2000;162(4):1403–6.
- Guilbert TW, Morgan WJ, Zeiger RS, et al. Atopic characteristics of children with recurrent
  wheezing at high risk for the development of childhood asthma. *J Allergy Clin Immunol.*
  2004;114(6):1282–7.
- Chang TS, Lemanske RF, Guilbert TW, et al. Evaluation of the modified asthma predictive index in
  high-risk preschool children. *J Allergy Clin Immunol Pract.* 2013;1(2):152–6.

## Geliştirme

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
npm run preview
```

## Netlify'a kurulum

Depoyu GitHub'a yükleyin, Netlify'da **Add new site → Import an existing project** ile bağlayın.
`netlify.toml` zaten hazır:

- Build command: `npm run build`
- Publish directory: `dist`

## Teknik

React 18 · Vite 5 · Tailwind CSS 3. Harici API çağrısı, analitik veya çerez yok.

## Sorumluluk reddi

Bu araç tıbbi tanı koymaz, tedavi önermez ve hekim değerlendirmesinin yerine geçmez.
Risk iletişimi ve aile eğitimi amaçlıdır.

---

Dr. İrem Kunter · TinyTalks
