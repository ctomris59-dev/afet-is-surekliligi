# Afet & İş Sürekliliği Skorkartı

ISO 22301, UNDRR Sendai Çerçevesi ve 6331 sayılı İş Sağlığı ve Güvenliği Kanunu'na dayanan,
KOBİ'ler için afet/kriz hazırlık öz-değerlendirme aracı. Metodoloji detayları için
`METODOLOJI.md` dosyasına bakın.

## Yerelde çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` açılır.

## Production build

```bash
npm run build
```

Çıktı `dist/` klasörüne yazılır — Vercel bu klasörü otomatik tanır.

## Vercel'e deploy

1. Bu klasörü kendi GitHub reponuza (örn. `afet-is-surekliligi`) push edin.
2. Vercel'de "New Project" → repoyu seçin.
3. Framework olarak **Vite** otomatik algılanır. Build command: `npm run build`,
   Output directory: `dist`.
4. Deploy edin.

## Diğer üç Çorlu TSO aracıyla tutarlılık notları

- Gauge bileşeni, `dijitalolgunluk.vercel.app` ile birebir aynı SVG geometrisini kullanır
  (`cx=110, cy=120, r=88`, yarım daire).
- Tipografi: Space Grotesk (başlıklar/gauge) + IBM Plex Sans (gövde) + IBM Plex Mono (etiketler) —
  mevcut üç uygulamanın font dilinin devamı.
- PDF çıktısı şu an `window.print()` ile üretiliyor (bağımlılıksız). Eğer diğer
  uygulamalarınızda jsPDF/html2canvas gibi bir kütüphane kullanıyorsanız, `App.jsx`
  içindeki `PDF Raporu İndir` butonunun `onClick` fonksiyonunu onunla değiştirebilirsiniz.
- Ana panel sayfasına (`corlu-tso-dijital-araclar.html` / hub) 4. kart olarak eklemek
  isterseniz: accent rengi `#B91C1C` (kırmızı/alarm tonu), etiket `"İSS"` veya `"BCM"`
  kullanılabilir.
