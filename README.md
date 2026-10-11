# IngatKata

Aplikasi flashcard untuk menghafal kosakata bahasa asing dari bahasa Indonesia.
Pengguna mengetik jawaban (bukan sekadar membalik kartu), dan kartu dijadwalkan ulang
dengan sistem kotak Leitner. Semua data tersimpan di browser (localStorage), tanpa akun
dan tanpa server.

## Fitur

- Paket kata bawaan untuk Inggris, Jepang, Korea, Jerman, dan Arab (tiga level per bahasa),
  plus bahasa lain yang kosakatanya diisi sendiri.
- Tambah kata satu per satu atau sekaligus (pemisah `<>`, tab, ` = `, atau ` - `).
- Sesi review dua arah (asing ke Indonesia dan sebaliknya), kartu yang salah diulang di
  akhir sesi, lalu ringkasan berisi daftar kata yang perlu diulang.
- Pemeriksa jawaban yang memaafkan: beberapa arti (`Perlu/Penting`), aksara asli dalam
  kurung (`Watashi (私)`), awalan `to`, diakritik, artikel Jerman yang terlupa, dan salah
  ketik kecil pada kata panjang.
- Pengucapan lewat Web Speech API untuk bahasa bawaan.
- Kata baru dibuka bertahap dari antrian sesuai akurasi review terakhir
  (>= 80%: 5 kata, >= 50%: 2 kata, di bawahnya: fokus dulu).
- Mode latihan (latih semua, latih yang salah, latihan campuran lintas bahasa) yang
  tidak menaikkan kotak, supaya jadwal tetap jujur.
- Daftar kata dengan pencarian, edit, pindah aktif/antrian, dan hapus massal.
- Pengaturan arah pertanyaan (bolak-balik, asing ke Indonesia, Indonesia ke asing) dan
  suara otomatis.
- Bisa dipasang sebagai aplikasi (PWA) di Android, iOS, dan desktop, dan dibuka offline.

## Data dan pindah perangkat

Tidak ada server atau akun: semua kata, progres, dan pengaturan ada di localStorage
browser. Karena itu:

- **Pengaturan & data → Simpan file cadangan** mengunduh satu file JSON berisi semua
  bahasa, kotak tiap kartu, akurasi terakhir, dan pengaturan. Di HP ada juga **Kirim
  cadangan** lewat share sheet (WhatsApp, Google Drive, email).
- Di perangkat baru, buka IngatKata lalu **Pulihkan dari file cadangan** (tautannya ada di
  layar pertama). Pilih **Gabungkan** (data di kedua perangkat disatukan; untuk kartu yang
  sama, progres yang terakhir diulang yang dipakai) atau **Ganti semua**.
- Dashboard mengingatkan bila ada 10 kata atau lebih dan belum dicadangkan lebih dari 7 hari.
- Aplikasi meminta penyimpanan persisten ke browser. Di iOS, memasang aplikasi ke Layar
  Utama juga mencegah Safari menghapus data situs yang lama tidak dibuka.

## Jadwal ulang

| Kotak | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Diulang lagi setelah | langsung | 1 hari | 3 hari | 7 hari | 14 hari | 30 hari |

Jawaban benar menaikkan satu kotak, jawaban salah kembali ke kotak 0 dan muncul lagi
1 menit kemudian. Kotak 4 ke atas dihitung "hafal".

## Deploy

`npm run build` menghasilkan folder `dist/` statis yang bisa diunggah ke hosting mana pun
(Netlify, Vercel, GitHub Pages, Cloudflare Pages). Path dibuat relatif (`base: './'`), jadi
subfolder juga bisa. PWA dan service worker hanya aktif lewat **HTTPS** (atau localhost).

Service worker dibuat saat build oleh plugin kecil di `vite.config.ts` dari
`pwa/sw.js`, berisi daftar aset untuk dibuka offline. Versi baru terpakai otomatis pada
kunjungan berikutnya saat online.

## Pengembangan

```bash
npm install
npm run dev     # server pengembangan Vite
npm test        # unit test logika (node:test, tanpa dependensi tambahan)
npm run lint
npm run build   # type-check + build produksi
```

Struktur:

- `src/data/` paket kosakata dan metadata bahasa
- `src/lib/` logika murni: SRS (`srs.ts`), pemeriksa jawaban (`answer.ts`), parser bulk,
  penyimpanan dan cadangan
- `src/views/` satu komponen per layar, `src/App.tsx` mengatur state dan navigasi
- `tests/` unit test untuk `src/lib`
- `src/index.css` token desain (warna, font) sebagai variabel CSS, dipetakan di
  `tailwind.config.js`
- `pwa/sw.js` service worker, `public/` manifest dan ikon
- `docs/` design brief, audit, arah desain, dan screenshot sebelum/sesudah
