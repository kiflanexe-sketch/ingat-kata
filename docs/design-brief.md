# Design brief: IngatKata

Semua isi brief ini diturunkan dari kode dan data di repo (README, `src/data/words.ts`,
`src/lib/srs.ts`, `src/views/*`, copy yang tampil). Bagian yang berupa dugaan ditandai
**[dugaan]** dan masuk ke daftar pertanyaan di akhir.

## Apa produk ini

IngatKata ("ingat kata") adalah aplikasi hafalan kosakata dengan sistem kotak Leitner.
Pengguna mengetik jawaban, bukan membalik kartu. Kartu yang benar naik kotak dan baru
muncul lagi 1, 3, 7, 14, lalu 30 hari kemudian; kartu yang salah turun ke kotak 0 dan
muncul lagi semenit kemudian (`src/lib/srs.ts`).

Ciri yang membedakannya dari aplikasi flashcard umum:

- **Arah belajar dari bahasa Indonesia.** Setiap kartu adalah pasangan kata asing dan
  arti Indonesia, ditanyakan acak dua arah.
- **Jatah kata baru dibatasi oleh akurasi.** Kata baru dibuka dari "antrian" 5 sekaligus
  bila review terakhir >= 80%, 2 bila >= 50%, dan tidak sama sekali di bawahnya
  (`smartAddCount`). Aplikasi menolak menambah beban saat pengguna belum siap.
- **Beberapa bahasa sekaligus.** Satu deck per bahasa, plus "Tantangan Polyglot" yang
  mencampur semua bahasa.
- **Beberapa aksara.** Paket bawaan memuat Latin, kanji/kana, hangul, dan huruf Arab
  (`Watashi (私)`, `Sarang (사랑)`, `Shukran (شكرا)`).
- **Tanpa akun.** Semua data di localStorage, dengan cadangan manual ke file JSON.

## Siapa penggunanya

- Penutur bahasa Indonesia. Seluruh copy berbahasa Indonesia dengan sapaan "kamu", dan
  arti kata mengikuti KBBI.
- Pelajar yang mengikuti jenjang baku. Level paket memakai CEFR (A1, B1, C1) untuk
  Inggris dan Jerman serta JLPT (N5, N3, N1) untuk Jepang.
- Sebagian kemungkinan belajar bahasa Arab untuk konteks keagamaan; paket Arab memuat
  *Deen*, *Aakhira*, *Dunya*. **[dugaan]**, tidak cukup untuk dijadikan arah desain.
- Pemakaian pribadi di perangkat sendiri (tanpa login, data hanya di browser).

**Situasi pemakaian.** Sesi pendek yang berulang: buka aplikasi, lihat apakah ada kartu
jatuh tempo, selesaikan, tutup. Interval Leitner dan hitungan "Siap Review" dibuat untuk
kebiasaan harian. Karena jawaban diketik, keyboard selalu terbuka di layar belajar; di HP
artinya separuh layar bawah tertutup. **[dugaan]** bahwa HP adalah perangkat utama.

## Tugas utama per layar

| Layar | Komponen | Tugas utama pengguna | Tugas sekunder |
|---|---|---|---|
| Pilih bahasa (onboarding) | `OnboardingView` | Memilih bahasa yang mau dipelajari | Membuat bahasa sendiri |
| Dashboard | `DeckListView` | Memilih bahasa mana yang diulang hari ini | Polyglot, cadangkan/pulihkan, bahasa baru |
| Beranda bahasa | `HomeView` | Memulai review kartu yang jatuh tempo | Bila tidak ada yang jatuh tempo: buka kata baru, latihan; kelola kata |
| Beranda Polyglot | `PolyglotHomeView` | Memulai latihan campuran | Keluar |
| Belajar | `StudyView` | Membaca kata, mengetik jawaban, melihat koreksi | Dengar pengucapan, menyerah, akhiri sesi |
| Ringkasan | `SummaryView` | Melihat kata yang salah | Melatih ulang yang salah, kembali |
| Tambah kata | `AddView` | Memasukkan pasangan kata dengan cepat | Tempel banyak sekaligus |
| Daftar kata | `ListView` | Mencari dan membetulkan kata | Pindah aktif/antrian, hapus, hapus deck |
| Materi | `MaterialView` | Menambah paket level | |

Layar Belajar adalah tempat pengguna menghabiskan hampir seluruh waktunya. Layar lain
adalah jalan masuk dan keluar dari layar itu.

## Data yang paling penting

Diurutkan dari yang paling menentukan tindakan pengguna:

1. **Kata yang sedang ditanyakan**, lalu **jawaban yang benar** saat salah (Belajar).
2. **Jumlah kartu jatuh tempo** per bahasa (Dashboard, Beranda). Ini yang memutuskan
   apakah pengguna perlu belajar sekarang.
3. **Kata yang salah** di sesi barusan (Ringkasan).
4. **Kapan kartu berikutnya jatuh tempo** dan **jatah kata baru** saat tidak ada yang
   perlu diulang (Beranda).
5. **Sebaran kartu di kotak 0-5** dan jumlah "Master" (kotak >= 4). Ini progres jangka
   panjang, informatif tetapi tidak memicu tindakan.
6. Ukuran antrian, sumber kata (paket atau buatan sendiri).

## Kepribadian produk

1. **Tekun.** Produk ini tentang pengulangan kecil yang konsisten: kotak Leitner, kata
   baru dibuka bertahap, kartu salah diulang di akhir sesi.
2. **Jujur.** Akurasi ditampilkan apa adanya, kata baru ditahan saat akurasi rendah,
   latihan tidak menaikkan kotak. Tidak ada poin, lencana, atau angka yang dibesarkan.
3. **Berakar di bahasa Indonesia.** Titik berangkatnya selalu bahasa Indonesia, dengan
   copy santai ("kamu") dan ejaan KBBI.
4. **Multi-aksara.** Huruf Latin, kanji, hangul, dan Arab tampil berdampingan dan harus
   sama terbacanya.
5. **Pribadi dan ringan.** Tanpa akun, tanpa server, data milik pengguna.

## Jawaban pemilik produk

1. **Perangkat**: HP dan tablet (Android/iOS), sebagian juga membuka dari laptop.
2. **Audiens**: pelajar, pekerja, dan umum.
3. **Brand**: tidak perlu logo, tidak ada warna brand khusus.
4. **Karakter**: tenang dan tekun; warna pastel lembut cocok, keputusan akhir diserahkan.
5. **Sapaan**: "kamu" di semua layar (usulan, belum dibantah).

Dengan ini dugaan "HP sebagai perangkat utama" dikonfirmasi, dan dugaan konteks
keagamaan untuk paket Arab tidak dipakai sebagai arah desain.
