# Audit desain UI: IngatKata

Status: **Fase 1 selesai, menunggu persetujuan.** Belum ada kode tampilan yang diubah
karena audit ini.

## Metode

- Dev server Vite dijalankan, lalu 12 keadaan layar diambil di desktop (1280 x 860) dan
  mobile (390 x 844) dengan Playwright memakai data contoh dari paket bawaan: dashboard
  dua bahasa, beranda dengan kartu jatuh tempo, beranda "target tercapai", deck kosong,
  belajar, jawaban salah, ringkasan, tambah kata, daftar kata, materi, Polyglot.
  Hasilnya ada di `docs/screenshots/before/`.
- Kode di `src/` diperiksa untuk ketujuh pola dengan grep kelas utilitas (gradien,
  shadow, blur, animasi, radius, warna) dan dibaca per layar.
- Kontras dihitung dengan rumus WCAG 2.1 dari nilai hex Tailwind.

Catatan: logika aplikasi sudah diperbaiki sebelum audit ini (lihat commit
`de6e472`). Screenshot "before" mengambil keadaan sesudah perbaikan logika supaya
perbandingan di Fase 4 hanya memperlihatkan perubahan desain.

## Ringkasan

UI ini tidak jatuh ke klise AI yang paling berat: tidak ada mode gelap default, glow,
glassmorphism, teks bergradien, statistik palsu, atau testimoni. Masalahnya ada di
tingkat yang lebih halus: **semua keputusan visual adalah default Tailwind**
(indigo-600, gray, rounded-xl, shadow-lg) dan **komposisinya mengikuti template**
(hero logo di tengah, deret tiga stat card, deret tombol yang sama besar). Akibatnya
layar yang paling khas dari produk ini, yaitu kotak Leitner, kartu kata, dan aksara
asing, tidak tampak sama sekali. Beranda lolos uji tukar dengan aplikasi kebiasaan atau
to-do mana pun.

## Temuan per pola

Dampak: **T** tinggi, **S** sedang, **R** rendah.

### 1. Palet warna AI

| Temuan | Lokasi | Dampak | Usulan |
|---|---|---|---|
| Gradien ungu ke indigo pada tombol Tantangan Polyglot, satu-satunya gradien di aplikasi | `DeckListView.tsx:40` (`from-purple-500 to-indigo-600`) | S | Hapus. Polyglot cukup dibedakan oleh isi (daftar bahasa yang ikut) dan posisi, bukan efek |
| Warna utama adalah indigo-600 bawaan Tailwind, tidak berhubungan dengan produk | 88 kemunculan `*-indigo-*` di `src/views` | T | Turunkan palet dari kepribadian (tekun, jujur, berakar Indonesia) di Fase 2 dan jadikan token |
| Ungu dipakai sebagai warna kedua khusus Polyglot tanpa alasan selain "beda" | `HomeView.tsx:98-106` | S | Satukan ke palet utama |
| Warna tombol aksi dibedakan tanpa arti: Tambah indigo, Materi oranye, Atur abu | `HomeView.tsx:80-82` | S | Warna hanya untuk makna (aksi utama, salah/benar, jatuh tempo) |
| Shadow berwarna (`shadow-indigo-200`) pada tombol utama, efek "glow" ringan | `HomeView.tsx:38`, `MaterialView.tsx:33`, `StudyView.tsx:99`, `SummaryView.tsx:45` | R | Hapus; tombol utama sudah jelas dari isi warnanya |
| Latar halaman `bg-indigo-50` di onboarding dan dashboard, beda dari layar lain (`bg-gray-50`) | `OnboardingView.tsx:27`, `DeckListView.tsx:19` | R | Satu warna latar dari token |
| **Kontras gagal WCAG AA**: teks `gray-400` di atas `gray-50`/putih (2,4-2,5:1), angka `green-500` (2,3:1) dan `orange-500` (2,8:1) di stat, ikon hapus `red-300` (1,9:1) dan ikon ubah `gray-300` (1,5:1) | `HomeView.tsx:52-54`, `ListView.tsx:73`, `:93-94`, `StudyView.tsx:73`, label kecil di banyak layar | T | Tetapkan pasangan warna teks/latar yang lolos 4,5:1 (teks) dan 3:1 (ikon) sebagai token |

Tidak ditemukan: latar gelap default, blur besar, radial glow, teks bergradien, pola
titik/grid.

### 2. Semua dijadikan card

| Temuan | Lokasi | Dampak | Usulan |
|---|---|---|---|
| Card di dalam card: panel putih membungkus tombol-tombol bahasa yang juga berbingkai | `DeckListView.tsx:20` + `:25`; `OnboardingView.tsx:29` + `:37` | T | Buang panel luar. Daftar bahasa menjadi baris yang dipisah divider di atas latar halaman |
| Setiap kata di daftar adalah card berbingkai dan ber-shadow; 30 kata = 30 kotak | `ListView.tsx:57`, `:81`, `:91` | S | Daftar biasa dengan divider; bingkai hanya saat dipilih atau diedit |
| Tiga stat card sama ukuran | `HomeView.tsx:52-54` | T | Lihat pola 3 dan 4 |
| Kotak berwarna untuk pesan: hijau "Target Tercapai", ungu Polyglot, biru "Tip", hijau ringkasan | `HomeView.tsx:61`, `:101`, `MaterialView.tsx:43`, `SummaryView.tsx:40` | S | Jadikan teks biasa dengan hierarki tipografi; kotak hanya untuk peringatan yang memang mendesak |
| Tiap level materi dalam card sendiri | `MaterialView.tsx:29` | R | Baris dengan divider |
| Radius seragam: tombol, input, baris daftar, card, dan banner semua `rounded-xl`; modal, stat, input belajar `rounded-2xl`; panel `rounded-3xl` | seluruh `src/views` | S | Skala radius per fungsi: kecil untuk input dan tombol, sedang untuk kartu kata, pill hanya untuk chip |
| Ikon dalam kotak berwarna tipis | tidak ditemukan | | |

**Dipertahankan dengan alasan:** pertanyaan di layar Belajar boleh tampil sebagai
kartu, karena "kartu" adalah objek domain produk ini (flashcard, kotak Leitner).
Itu satu-satunya tempat container berbentuk kartu yang punya arti.

### 3. Komposisi default AI

| Temuan | Lokasi | Dampak | Usulan |
|---|---|---|---|
| Beranda = logo + nama aplikasi di tengah, subjudul abu, deret 3 stat card, tombol besar, deret 3 tombol sama besar. Persis pola "sapaan, summary card, quick actions" | `HomeView.tsx:48-84` | T | Susun dari tugas: jawaban atas "perlu belajar sekarang?" adalah elemen terbesar, satu tombol utama, sisanya daftar aksi sekunder. Nama aplikasi tidak perlu diulang di tiap beranda |
| Onboarding = ikon tengah, headline besar tengah, subjudul abu, grid pilihan, semuanya di card tengah | `OnboardingView.tsx:27-52` | S | Rata kiri, langsung ke daftar bahasa; jelaskan cara kerja (kotak Leitner, jatah kata) singkat karena itu yang membedakan produk |
| Beranda Polyglot = headline + subjudul + kotak berwarna + tombol | `HomeView.tsx:93-109` | S | Tampilkan komposisi kartu per bahasa sebagai isi utama |
| Pemilih bahasa sebagai pill melayang di pojok kanan atas (`absolute`) | `HomeView.tsx:49`, `:94` | R | Jadikan bagian header biasa bersama nama bahasa yang sedang dipelajari |

### 4. Hierarki visual yang seragam

Pertanyaan kunci dan jawabannya dari kode:

- **Aksi utama Beranda:** "Mulai Belajar" saat ada yang jatuh tempo. Saat tidak ada,
  logika `smartAddCount` sudah menentukan langkah yang disarankan (buka kata baru, atau
  fokus latihan bila akurasi rendah), tetapi UI menampilkan tiga tombol berbobot sama.
- **Metrik paling kritis:** jumlah jatuh tempo. "Master" dan "Antrian" informatif saja.
- **Setting yang butuh ruang penuh:** hampir tidak ada. Hapus deck dan cadangan cukup
  aksi teks kecil.

| Temuan | Lokasi | Dampak | Usulan |
|---|---|---|---|
| "Siap Review", "Master", "Antrian" tampil sama besar padahal hanya satu yang memicu tindakan | `HomeView.tsx:51-55` | T | Jatuh tempo menjadi angka utama; sebaran kotak 0-5 tampil kecil sebagai progres |
| Saat tidak ada yang jatuh tempo, "Ulangi Semua", "Ulangi Salah", "+5 Kata Baru" berbobot sama | `HomeView.tsx:66-75` | T | Tombol yang disarankan logika jatah kata menjadi aksi utama, dua lainnya sekunder |
| Tambah, Materi, Atur selalu tampil sama besar, juga saat pengguna perlu belajar | `HomeView.tsx:79-83` | S | Turunkan ke baris aksi sekunder |
| Semua layar rata tengah, termasuk daftar dan form | seluruh `src/views` | S | Rata kiri untuk daftar, form, dan teks panjang; rata tengah hanya untuk kata di layar Belajar |
| Bagian "Aktif" dan "Antrian" di daftar kata berbobot sama | `ListView.tsx:170-171` | R | Antrian bisa diringkas atau dilipat; ia belum dipelajari |
| Judul layar berubah-ubah ukuran tanpa sistem (2xl, 3xl, 4xl, 5xl) | `DeckListView.tsx:22`, `OnboardingView.tsx:31`, `HomeView.tsx:50`, `SummaryView.tsx:22` | S | Skala tipografi dengan level yang jelas di Fase 2 |

### 5. UI dekoratif

| Elemen | Lokasi | Hierarki? | State? | Membantu paham? | Brand? | Keputusan |
|---|---|---|---|---|---|---|
| `hover:scale-105` pada tombol mulai | `HomeView.tsx:58`, `:106` | tidak | tidak | tidak | tidak | Hapus |
| `shadow-lg`/`shadow-xl`/`shadow-2xl` di tombol, panel, modal | 20+ tempat | sebagian (modal) | tidak | tidak | tidak | Hapus, kecuali satu shadow untuk lapisan di atas konten (modal, bar aksi) |
| Gradien tombol Polyglot | `DeckListView.tsx:40` | tidak | tidak | tidak | tidak | Hapus |
| `animate-fade-in` di akar hampir setiap layar | 10 layar | tidak | tidak | tidak | tidak | Kelas ini **tidak didefinisikan** di `tailwind.config.js`, jadi tidak berefek. Hapus |
| `animate-shake` pada jawaban salah | `StudyView.tsx:93` | | ya | ya | | Juga tidak didefinisikan. Umpan balik salah memang state; ganti dengan perubahan warna/teks yang jelas, getar opsional dengan `prefers-reduced-motion` |
| `animate-slide-up` bar aksi massal | `ListView.tsx:179` | | ya | | | Tidak didefinisikan. Cukup muncul tanpa animasi |
| `animate-bounce` pada "Benar!" | `StudyView.tsx:105` | | ya | | | Memantul terus selama tampil. Ganti dengan state warna statis |
| Transisi lebar progress bar | `StudyView.tsx:70` | | ya | ya | | Pertahankan |
| Emoji sebagai ilustrasi: 📦, 🎉, 💡 | `HomeView.tsx:37`, `:62`, `MaterialView.tsx:43` | tidak | tidak | sedikit | tidak | Hapus; ganti dengan kalimat yang jelas |
| Ikon jam di tombol "Mulai Belajar" | `HomeView.tsx:58`, `:106` | tidak | tidak | menyesatkan (bukan sesi berwaktu) | tidak | Hapus |
| Ikon roda gigi untuk "Atur" yang membuka daftar kata | `HomeView.tsx:82` | | | menyesatkan | | Label dan ikon yang sesuai isi ("Daftar kata") |
| Ikon otak sebagai logo | `HomeView.tsx:35`, `:50`, `DeckListView.tsx:21` | | | | lemah | Generik untuk semua aplikasi belajar; putuskan di Fase 2 (wordmark teks saja juga pilihan sah) |

Tidak ditemukan: glassmorphism, border bercahaya, titik berdenyut, bentuk melayang,
chart.

### 6. Konten generik AI

| Temuan | Lokasi | Dampak | Usulan |
|---|---|---|---|
| "Mulai Petualangan Baru" | `OnboardingView.tsx:31` | S | Copy yang menyebut apa yang terjadi: memilih bahasa dan paket kata pertama |
| "Siap menguji kemampuan otak berpindah bahasa?" | `HomeView.tsx:102` | S | Jelaskan isi sesi: berapa kata dari bahasa apa |
| "Target Tercapai!" + 🎉, padahal pengguna tidak pernah menetapkan target | `HomeView.tsx:62` | S | "Tidak ada kartu jatuh tempo" + kapan berikutnya |
| "Dashboard Saya" | `DeckListView.tsx:22` | R | Judul yang menjelaskan isi, mis. "Bahasamu" |
| Istilah Inggris di UI Indonesia: Bulk, Custom, Reserve, Master, Review | `AddView.tsx:69-70`, `HomeView.tsx:40`, `:52-53`, `MaterialView.tsx:43` | S | Satu kosakata Indonesia yang konsisten: kotak, antrian, jatuh tempo, sekaligus, kata sendiri |
| "Kembali ke Dashboard" padahal kembali ke Beranda | `MaterialView.tsx:21` | S | "Kembali" atau "Ke beranda" |
| Campuran "Anda" dan "kamu" | `HomeView.tsx:99` | R | "kamu" di semua tempat |
| Placeholder "Contoh kata Inggris (Latin/Asli)" membingungkan | `AddView.tsx:74` | R | Contoh nyata dari paket bahasa itu |
| Bendera sebagai penanda bahasa (Arab = Arab Saudi, Inggris = Inggris Raya) | `src/data/words.ts` (kunci bahasa) | S | Kunci tetap (dipakai sebagai kunci penyimpanan), tetapi tampilan memakai `displayLangName` tanpa bendera, atau contoh aksara sebagai penanda |
| Empty state daftar kata "Tidak ada kata aktif." tanpa langkah berikutnya | `ListView.tsx:170` | R | Arahkan ke Materi atau Tambah kata |

Tidak ditemukan: testimoni, jumlah pengguna, statistik bulat, lorem ipsum, data chart
acak, activity feed palsu. `Math.random` hanya dipakai untuk mengacak urutan dan arah
kartu, yang memang fungsinya. Data contoh (paket kata) adalah kosakata nyata.

### 7. Tidak ada yang spesifik untuk produk

Yang seharusnya membuat UI ini jelas milik IngatKata, tetapi belum tampak:

- **Kotak Leitner.** Inti mekanisme (6 kotak, kartu naik dan turun) hanya muncul sebagai
  teks kecil "Kotak 0/5". Progres per bahasa memakai progress bar generik.
- **Kartu kata.** Kata ditanyakan sebagai teks besar di tengah layar kosong, tanpa
  bentuk kartu yang menjadi nama produknya.
- **Aksara.** Tidak ada keputusan font sama sekali (default `font-sans` Tailwind).
  Kanji, hangul, dan huruf Arab jatuh ke font sistem acak dengan tinggi dan bobot yang
  tidak serasi dengan teks Latin. Teks Arab tidak diberi arah (`dir`).
- **Kejujuran jatah kata.** Aturan "akurasi >= 80% buka 5 kata" adalah keputusan produk
  yang paling khas, tetapi UI hanya mewarnai tombol hijau/oranye/abu tanpa menjelaskan.

## Uji tukar per halaman

Pertanyaan: kalau logo dan copy diganti produk lain di kategori yang sama, apakah
desainnya masih cocok?

| Halaman | Masih cocok untuk produk lain? | Kenapa | Yang seharusnya membuatnya milik IngatKata |
|---|---|---|---|
| Onboarding | Ya | Pemilih kursus dengan bendera, sama dengan aplikasi bahasa mana pun | Contoh aksara tiap bahasa, penjelasan singkat cara kerja kotak dan jatah kata |
| Dashboard | Ya | Daftar kursus dengan progress bar dan lencana | Jatuh tempo hari ini per bahasa sebagai info utama, sebaran kotak Leitner sebagai progres |
| Beranda | Ya, bahkan untuk aplikasi non-bahasa | "4 / 3 / 5" + tombol besar cocok untuk to-do atau habit tracker | Pertanyaan "perlu belajar sekarang?" dijawab langsung, kotak Leitner terlihat, aturan jatah kata dijelaskan |
| Belajar | Sebagian | Mekanisme mengetik spesifik, tampilannya kuis umum | Kartu sebagai objek, tipografi multi-aksara, kotak kartu saat ini terlihat sebagai posisi di 6 kotak |
| Ringkasan | Ya | Persentase besar + daftar, pola umum | Kata salah dengan kunci jawabannya dan arah pertanyaan, kotak yang dituju |
| Tambah kata | Ya | Form CRUD umum | Contoh pasangan nyata, pratinjau baris bulk sebagai kartu |
| Daftar kata | Ya | Daftar CRUD dengan card per baris | Kolom kotak sebagai elemen visual, kata asing dengan tipografi aksaranya |
| Materi | Ya | Mirip daftar paket/harga | Level CEFR/JLPT dengan contoh kata dari paket |
| Polyglot | Ya | Hero + CTA | Komposisi bahasa di sesi sebagai isi utama |

## 5 perbaikan dengan dampak terbesar

1. **Susun ulang Beranda dari tugasnya.** Satu fokus: jumlah kartu jatuh tempo dan
   satu tombol utama. Saat tidak ada yang jatuh tempo, aksi yang disarankan oleh logika
   jatah kata menjadi tombol utama dan aturannya ditulis jelas. Hapus hero logo, deret
   stat card, dan deret tombol sama besar. (Pola 3, 4, 7)
2. **Palet dan token yang diturunkan dari produk, sekaligus memperbaiki kontras.** Ganti
   indigo default, ungu Polyglot, dan warna acak per tombol dengan palet kecil yang
   punya arti (aksi utama, benar, salah, jatuh tempo, kotak 0-5). Semua pasangan teks
   lolos AA. (Pola 1)
3. **Tipografi multi-aksara di layar Belajar.** Pilih font dan skala yang membuat
   Latin, kanji, hangul, dan Arab serasi; ukuran kata menyesuaikan panjangnya; teks Arab
   diberi arah; status benar/salah jelas tanpa animasi pantul. Ini layar tempat
   pengguna menghabiskan waktu. (Pola 4, 5, 7)
4. **Kurangi container.** Buang panel di dalam panel (Dashboard, Onboarding), ubah
   daftar kata dan materi menjadi baris dengan divider, ganti banner berwarna dengan
   teks. Sisakan bentuk kartu hanya untuk kartu kata. (Pola 2)
5. **Copy dan kosakata UI yang konsisten.** Hapus emoji ilustrasi dan copy generik
   ("Petualangan", "Target Tercapai", "menguji kemampuan otak"), satukan istilah
   Indonesia (kotak, antrian, jatuh tempo), perbaiki label yang salah arah ("Kembali ke
   Dashboard", ikon jam, ikon roda gigi). (Pola 5, 6)

## Langkah berikutnya

Setelah audit ini disetujui, Fase 2 berisi usulan arah desain (palet dengan cek
kontras, skala tipografi, radius, spacing, motion) untuk disetujui sebelum implementasi.
