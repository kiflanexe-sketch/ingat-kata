# Arah desain: IngatKata (Fase 2, usulan)

Status: **menunggu persetujuan.** Belum ada kode tampilan yang diubah.

Lembar contoh visual: [`design-direction/specimen.html`](design-direction/specimen.html)
(render: [`specimen.png`](design-direction/specimen.png)). Angka di mockup hanya ilustrasi
tata letak, bukan data.

## Dasar keputusan

Dari brief dan jawabanmu:

- Karakter **tenang dan tekun**, pastel lembut boleh.
- Dipakai di **HP dan tablet**, kadang laptop. Di layar Belajar keyboard selalu terbuka.
- Pengguna **pelajar, pekerja, umum**: tidak boleh terasa kekanak-kanakan atau
  terlalu korporat.
- **Tanpa logo dan tanpa warna brand**, jadi identitas datang dari tipografi, warna,
  dan objek produk itu sendiri.

**Gagasan inti: kertas, tinta, dan kartu indeks.** Metode Leitner aslinya adalah kotak
berisi kartu indeks kertas: kartu putih dengan satu garis merah di atas dan garis biru
tipis di bawahnya. Bentuk yang sama ada di buku tulis sekolah Indonesia (garis biru,
margin merah), jadi akrab bagi pelajar maupun pekerja. Motif itu hanya dipakai di **satu
tempat**, yaitu kartu kata di layar Belajar. Sisa aplikasi adalah kertas polos dengan
teks bertinta, supaya tenang dan tidak berubah menjadi tema "skeuomorfik" yang ramai.

Kenapa tidak lagi generik: kotak Leitner, kartu indeks, dan tipografi kamus per aksara
hanya masuk akal untuk aplikasi hafalan kosakata dengan sistem kotak. Kalau logo dan copy
diganti dengan aplikasi to-do atau kursus video, desain ini tidak lagi cocok.

## 1. Palet warna

| Token | Hex | Fungsi | Kontras |
|---|---|---|---|
| `paper` | `#FAF7F0` | latar halaman, putih gading supaya tidak silau di sesi panjang | |
| `card` | `#FFFEFA` | kartu kata, input, sheet | |
| `ink` | `#24262B` | teks utama | 14,2:1 di paper |
| `muted` | `#5C5A55` | teks kedua | 6,4:1 |
| `subtle` | `#67635B` | meta, label kotak | 5,6:1; 4,9:1 di atas baris terpilih |
| `line` | `#E4DED1` | divider (dekoratif) | |
| `control` | `#8E887C` | garis input dan checkbox | 3,3:1 (syarat 3:1 komponen UI) |
| `primary` ("tinta") | `#2E4A78` | satu aksi utama per layar, tautan | 8,3:1; teks putih di atasnya 8,9:1 |
| `primary-soft` | `#E2E9F4` | item terpilih | teks primary 7,3:1 |
| `ok` / `ok-soft` | `#2C6644` / `#E1F0E5` | jawaban benar | 5,8:1 |
| `bad` / `bad-soft` | `#9E3530` / `#F8E2DF` | jawaban salah, hapus | 5,6:1 |
| `due` / `due-soft` | `#7D5410` / `#FAEBCB` | jatuh tempo | 5,7:1 |
| `box-0` ... `box-5` | `#F2D5D1` `#F5E1CA` `#F0E8C4` `#DAEBD4` `#CFE4E5` `#D2DCF0` | kotak Leitner: hangat (baru/salah) ke sejuk (hafal) | teks ink >= 11:1 |
| `rule` / `margin` | `#D3E1F0` / `#E3A29D` | garis kartu indeks, dekoratif | |

Aturan pemakaian:

- **Pastel hanya untuk makna**: kotak 0-5, benar, salah, jatuh tempo, terpilih. Tidak
  ada warna per tombol atau per bahasa.
- **Satu warna aksi.** Tinta biru tua untuk aksi utama dan tautan; aksi berbahaya
  memakai `bad`. Ungu Polyglot, oranye "Materi", dan gradien dihapus.
- Teks tidak pernah memakai warna pastel; pastel selalu latar dengan teks gelap.
- Batang kotak Leitner selalu disertai angka, jadi informasi tidak bergantung pada
  warna pastel yang kontrasnya rendah terhadap kertas.
- Mode gelap ditambahkan kemudian, dengan token yang sama (lihat bagian berikut).

### Mode gelap

Pilihan di Pengaturan & data → Tampilan: **Ikut sistem** (bawaan), **Terang**, **Gelap**.
Tema dipasang sebagai `<html data-theme="dark">` oleh `src/lib/theme.ts`, dan oleh skrip
kecil di `index.html` sebelum halaman tampil supaya tidak berkedip putih. Konsepnya
"kertas di malam hari": latar arang yang sedikit hangat, tinta krem, aksen biru muda.
Nilainya bukan hasil membalik warna terang; tiap token dipilih dan diukur ulang.

| Token | Gelap | Kontras |
|---|---|---|
| `paper` / `card` | `#16181C` / `#1F2227` | |
| `ink` | `#EBE8E1` | 14,5:1 di paper; 13,0:1 di card |
| `muted` / `subtle` | `#B7B2A8` / `#A8A297` | 8,4:1 / 7,0:1 di paper; subtle 5,2:1 di primary-soft |
| `line` / `control` | `#33363C` / `#7C776E` | control 3,6:1 di card |
| `primary` / `primary-hover` | `#8DB0E6` / `#A9C4EE` | 8,0:1 di paper; 5,9:1 di primary-soft |
| `on-primary` | `#10203D` | teks tombol utama, 7,3:1 di primary |
| `primary-soft` | `#233149` | |
| `ok` / `ok-soft` | `#86D29F` / `#1B3325` | 7,6:1 |
| `bad` / `bad-soft` / `on-bad` | `#F29B93` / `#3E2220` / `#2A1210` | 6,8:1; teks tombol hapus 8,3:1 |
| `due` / `due-soft` | `#E8BD6C` / `#3A2F18` | 7,5:1 |
| `box-0` ... `box-5` | `#4B2E2B` `#4A3926` `#423D26` `#2B3F2E` `#27393B` `#2B3450` | teks ink >= 8,9:1 |
| `rule` / `margin` | `#2A3546` / `#7D4541` | dekoratif |
| `heat-1` ... `heat-4` | `#3A5680` `#5072AD` `#7797D3` `#B0C8F0` | makin banyak makin terang; langkah teredup 2,4:1 di paper |

Di mode terang, teks tombol utama memakai `on-primary` putih dan kalender aktivitas
memakai `#93ACD8` `#6886BF` `#43629B` `#283F69` (makin banyak makin gelap). Kedua ramp
kalender lolos validator ordinal (satu rona, terang naik/turun monoton, jarak langkah
terlihat, langkah teredup >= 2:1 terhadap latar).

## 2. Tipografi

**Dua keluarga, keduanya font sistem** (tanpa unduhan, tanpa dependensi baru, tetap
cepat di HP dan saat koneksi lemah):

- **UI**: `system-ui` (San Francisco di iOS, Roboto di Android, Segoe di Windows),
  dengan fallback Noto Sans JP/KR/Arabic.
- **Kata di kartu**: serif bergaya kamus per aksara: Iowan Old Style/Charter/Georgia
  untuk Latin, Mincho untuk Jepang, Myungjo untuk Korea, Naskh untuk Arab (gaya buku
  pelajaran). Ini yang membuat kata asing terasa seperti entri kamus, bukan label
  tombol. Teks Arab diberi `dir="auto"`.

| Level | Ukuran / bobot | Dipakai untuk |
|---|---|---|
| word | 44px / 500 serif, turun ke 36 dan 28 untuk kata > 12 dan > 20 karakter | kata di kartu |
| number | 48px / 650, angka tabular | jumlah jatuh tempo, akurasi |
| title | 24px / 650 | judul layar |
| section | 16px / 650 | judul bagian (tanpa huruf kapital semua) |
| body | 16px / 400, tinggi baris 1,5 | isi, input |
| secondary | 14px / 400 | penjelasan |
| meta | 12px / 500 | label kotak, sumber kata |

Input di layar Belajar 20px supaya iOS tidak memperbesar halaman saat fokus.

*Opsional, perlu izinmu:* memasang Noto Serif/Noto Sans via `@fontsource` agar tampilan
sama persis di semua perangkat (menambah dependensi dan sekitar 100-300 KB).
Rekomendasi saya: tetap font sistem.

## 3. Radius

| Token | Nilai | Elemen |
|---|---|---|
| `r-card` | 4px | kartu kata (sudut kertas, sengaja paling kecil) |
| `r-control` | 8px | tombol, input, umpan balik |
| `r-sheet` | 16px | modal / bottom sheet (sudut atas di HP) |
| `r-pill` | 999px | chip kotak dan jatuh tempo saja |
| 0 | | baris daftar, divider |

## 4. Spacing dan container

- Skala 4px: 4, 8, 12, 16, 24, 32, 48.
- Satu kolom, gutter 20px di HP, lebar konten maksimum 34rem (544px) di tablet dan
  laptop supaya baris tidak terlalu panjang.
- Target sentuh minimal 44px.
- **Container hanya untuk empat hal**: kartu kata, input, modal/sheet, dan bar aksi
  massal. Umpan balik benar/salah memakai latar pastel tanpa bingkai.
- **Divider** untuk daftar (bahasa, kata, paket, aksi sekunder).
- **Whitespace** (32-48px) dan judul bagian untuk memisahkan bagian; tidak ada banner
  berwarna untuk info biasa.
- Rata kiri untuk semua layar kecuali kartu kata.

## 5. Motion

Animasi hanya untuk state, umpan balik, dan orientasi. Diterapkan dengan View
Transitions API dan `@starting-style` (tanpa library), di `src/lib/transition.ts` dan
bagian "Gerak" di `src/index.css`:

- **Pindah layar** 280ms: layar yang lebih dalam (beranda ke daftar kata, ke sesi) masuk
  dari kanan, kembali masuk dari kiri, seperti navigasi aplikasi native. Arah diambil dari
  kedalaman layar (`VIEW_DEPTH` di `App.tsx`).
- **Kartu berikutnya**: kartu lama disisihkan ke kiri dengan sedikit miring, kartu baru
  masuk dari kanan, progress bar memanjang mulus. Ini memperkuat metafora kartu indeks.
- **Sheet konfirmasi** naik dari bawah di HP (dari sedikit di bawah di layar lebar),
  latar meredup.
- **Umpan balik** benar/salah muncul naik lembut 220ms; jawaban salah diberi satu dorongan
  kecil ke samping.
- **Pilihan "Satu kata / Sekaligus"**: pil aktif bergeser ke opsi yang dipilih.
- Pergantian warna input 150ms.
- **Dihapus**: `hover:scale`, `animate-bounce`, shadow besar, kelas `animate-*` yang
  tidak terdefinisi.
- Browser tanpa View Transitions langsung berganti layar tanpa animasi. Semua animasi
  mati bila `prefers-reduced-motion` aktif.

## 6. Struktur layar (hasil dari tugas pengguna)

- **Beranda**: header (kembali ke Bahasa, nama bahasa, Daftar kata). Jumlah jatuh tempo
  sebagai angka utama + satu tombol. Saat tidak ada yang jatuh tempo, aksi yang
  disarankan logika jatah kata menjadi tombol utama dengan alasannya ("Akurasi review
  terakhirmu 85%, jadi 5 kata baru dibuka"). Lalu "rak" kotak 0-5. Aksi lain sebagai
  daftar tautan di bawah.
- **Belajar**: konten rata atas (bukan tengah) agar kartu dan input tidak tertutup
  keyboard. Kartu indeks berisi label arah dan chip kotak. Umpan balik menyebut akibatnya
  pada jadwal ("Naik ke kotak 3, muncul lagi 7 hari lagi").
- **Dashboard ("Bahasamu")**: daftar bahasa dengan divider, chip jatuh tempo atau
  "besok", lalu latihan campuran sebagai bagian biasa, lalu Bahasa baru dan cadangan.
- **Ringkasan, Tambah, Daftar kata, Paket kata, Onboarding**: mengikuti aturan yang sama
  (judul rata kiri, divider, satu tombol utama).

## 7. Kosakata UI

Satu istilah per konsep: **kotak** (bukan level SRS), **jatuh tempo** (bukan siap
review), **antrian** (bukan reserve), **hafal** (kotak 4-5, bukan master), **paket
kata** (bukan materi/level), **tambah sekaligus** (bukan bulk), **kata sendiri** (bukan
custom). Sapaan "kamu". Tanpa emoji ilustrasi, dan tanpa bendera di tampilan.

## Penerapan

Semua nilai di atas menjadi variabel CSS di `src/index.css` dan dipetakan di
`tailwind.config.js` (`bg-paper`, `text-ink`, `bg-box-3`, `rounded-card`, dst.), jadi
perubahan berikutnya cukup di satu tempat. Urutan pengerjaan mengikuti Fase 3: token,
konten, hierarki per layar, mengurangi container, membuang dekorasi, dengan commit kecil
per layar.

Referensi pola produk nyata (Mobbin) tidak tersedia karena MCP-nya tidak terhubung di
sesi ini.
