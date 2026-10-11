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
- Mode latihan (ulangi semua, ulangi yang salah, Tantangan Polyglot lintas bahasa) yang
  tidak menaikkan kotak, supaya jadwal tetap jujur.
- Daftar kata dengan pencarian, edit, pindah aktif/antrian, dan hapus massal.
- Cadangkan dan pulihkan semua deck sebagai file JSON.

## Jadwal ulang

| Kotak | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Diulang lagi setelah | langsung | 1 hari | 3 hari | 7 hari | 14 hari | 30 hari |

Jawaban benar menaikkan satu kotak, jawaban salah kembali ke kotak 0 dan muncul lagi
1 menit kemudian. Kotak 4 ke atas dihitung "Master".

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
- `docs/` design brief dan audit desain
