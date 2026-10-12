# IngatKata

Aplikasi flashcard untuk menghafal kosakata bahasa asing dari bahasa Indonesia.
Pengguna mengetik jawaban (bukan sekadar membalik kartu), dan setiap kata dijadwalkan ulang
dengan FSRS (Free Spaced Repetition Scheduler). Semua data tersimpan di browser (localStorage), tanpa akun
dan tanpa server.

## Fitur

- Sekitar 1.000 kata bawaan untuk Inggris, Jepang, Korea, Jerman, dan Arab, dalam paket
  yang diurutkan dari termudah: paket huruf (hiragana, katakana, hangul, hijaiyah), level
  umum (CEFR, JLPT, TOPIK), dan paket tes resmi atau kerja (TOEIC, TOEFL, IELTS, GRE,
  JFT-Basic, EPS-TOPIK, Pflege, TestDaF, TOAFL). Bahasa lain bisa diisi sendiri.
- Tambah kata satu per satu atau sekaligus (pemisah `<>`, tab, ` = `, atau ` - `).
- Sesi review dua arah (asing ke Indonesia dan sebaliknya), kartu yang salah diulang di
  akhir sesi, lalu ringkasan berisi daftar kata yang perlu diulang.
- Pemeriksa jawaban yang memaafkan: beberapa arti (`Perlu/Penting`), aksara asli dalam
  kurung (`Watashi (私)`), awalan `to`, diakritik, artikel Jerman yang terlupa, dan salah
  ketik kecil pada kata panjang.
- Pengucapan lewat Web Speech API untuk bahasa bawaan, diputar setelah setiap jawaban
  (bisa dimatikan). Kata Jepang, Korea, dan Arab diucapkan dari aksara aslinya, huruf lepas
  sebagai suku kata. Suara berasal dari perangkat; Pengaturan & data menunjukkan bahasa
  mana yang suaranya belum terpasang beserta cara memasangnya.
- Jadwal ulang per kata dengan FSRS: kata yang dikuasai makin jarang muncul, yang sering
  salah lebih sering; target ingatan bisa dipilih (85%, 90%, 95%).
- Kata baru dibuka bertahap dari antrian sesuai akurasi review terakhir
  (>= 80%: 5 kata, >= 50%: 2 kata, di bawahnya: fokus dulu).
- Mode latihan (latih semua, latih yang salah, latihan campuran lintas bahasa) yang
  tidak menaikkan kotak, supaya jadwal tetap jujur.
- Daftar kata dengan pencarian, edit, pindah aktif/antrian, dan hapus massal.
- Pengaturan arah pertanyaan (bolak-balik, asing ke Indonesia, Indonesia ke asing) dan
  suara otomatis.
- Bisa dipasang sebagai aplikasi (PWA) di Android, iOS, dan desktop, dan dibuka offline.
- Transisi antarlayar dan antarkartu dengan View Transitions API (mati otomatis bila
  perangkat meminta gerak dikurangi).

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

## Jadwal ulang (FSRS)

Jadwal dihitung dengan [FSRS](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm)
lewat library [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs) (MIT). Untuk tiap kata
FSRS menyimpan **kesulitan** dan **stabilitas** (berapa lama ingatan bertahan), lalu menjadwalkan
ulangan saat peluang ingat turun ke target pengguna (bawaan 90%, bisa 85% atau 95% di Pengaturan).

Nilai jawaban diturunkan otomatis dari jawaban yang diketik:

| Jawaban | Nilai FSRS |
|---|---|
| Salah atau "Tidak tahu" | Again: diulang semenit kemudian, kata dianggap lebih sulit |
| Benar dengan salah ketik kecil atau artikel Jerman terlupa | Hard |
| Benar | Good |

Contoh dengan target 90%: kata baru yang dijawab benar muncul lagi sekitar 2 hari, lalu 11, 46,
dan 160-an hari bila terus benar (jarak maksimal 365 hari, digeser sedikit acak supaya tidak
menumpuk). Lupa tidak mengulang dari nol: setelah belajar ulang, kata yang tadinya berjarak
5 bulan kembali muncul sekitar 5 hari kemudian.

**Kotak 0-5** di tampilan menunjukkan jarak ulang saat ini: kurang dari 1 hari, 1-3, 3-7, 7-21,
21-60, dan lebih dari 60 hari. Kotak 4 ke atas (21 hari atau lebih) dihitung "hafal".

Mode latihan (latih semua, latih yang salah, latihan campuran) tidak mengubah jadwal bila benar,
tetapi jawaban salah tetap dicatat. Progres dari versi Leitner diubah otomatis: jarak kotak lama
dipakai sebagai tebakan awal stabilitas.

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
