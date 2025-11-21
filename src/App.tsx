import React, { useState, useEffect, useRef } from 'react';

// --- TIPE DATA ---
type Card = {
  id: string;
  front: string; 
  back: string;  
  box: number;
  nextReview: number;
  lastReviewed: number | null;
  status: 'active' | 'reserve'; 
  source: string; 
};

type StudyItem = {
  card: Card;
  direction: 'forward' | 'backward'; 
  originLang?: string; 
};

type LangStats = {
  lang: string;
  totalDeck: number;
  mastered: number;
  active: number;
  reserve: number;
};

// --- DATABASE KOSAKATA ---
const WORD_DATABASE: Record<string, Record<string, {f: string, b: string}[]>> = {
  'Inggris 🇬🇧': {
    'Pemula (A1)': [
      { f: 'Apple', b: 'Apel' }, { f: 'Book', b: 'Buku' }, { f: 'Cat', b: 'Kucing' },
      { f: 'Dog', b: 'Anjing' }, { f: 'House', b: 'Rumah' }, { f: 'Water', b: 'Air' },
      { f: 'Food', b: 'Makanan' }, { f: 'To eat', b: 'Makan' }, { f: 'To sleep', b: 'Tidur' },
      { f: 'Happy', b: 'Senang' }, { f: 'Sad', b: 'Sedih' }, { f: 'Big', b: 'Besar' },
      { f: 'Small', b: 'Kecil' }, { f: 'Red', b: 'Merah' }, { f: 'Blue', b: 'Biru' },
      { f: 'Friend', b: 'Teman' }, { f: 'Family', b: 'Keluarga' }, { f: 'School', b: 'Sekolah' },
      { f: 'Teacher', b: 'Guru' }, { f: 'Student', b: 'Murid' }, { f: 'Car', b: 'Mobil' },
      { f: 'Money', b: 'Uang' }, { f: 'Time', b: 'Waktu' }, { f: 'Day', b: 'Hari' },
      { f: 'Night', b: 'Malam' }, { f: 'Table', b: 'Meja' }, { f: 'Chair', b: 'Kursi' },
      { f: 'Door', b: 'Pintu' }, { f: 'Window', b: 'Jendela' }, { f: 'Tree', b: 'Pohon' },
      { f: 'Sun', b: 'Matahari' }, { f: 'Moon', b: 'Bulan' }, { f: 'Star', b: 'Bintang' }
    ],
    'Menengah (B1)': [
      { f: 'Environment', b: 'Lingkungan' }, { f: 'Decision', b: 'Keputusan' },
      { f: 'Usually', b: 'Biasanya' }, { f: 'To improve', b: 'Meningkatkan' },
      { f: 'Government', b: 'Pemerintah' }, { f: 'Experience', b: 'Pengalaman' },
      { f: 'To suggest', b: 'Menyarankan' }, { f: 'Relationship', b: 'Hubungan' },
      { f: 'Opportunity', b: 'Kesempatan' }, { f: 'Recently', b: 'Baru-baru ini' },
      { f: 'However', b: 'Akan tetapi' }, { f: 'Although', b: 'Meskipun' },
      { f: 'Condition', b: 'Kondisi' }, { f: 'Available', b: 'Tersedia' },
      { f: 'To develop', b: 'Mengembangkan' }, { f: 'Behavior', b: 'Perilaku' },
      { f: 'Necessary', b: 'Perlu/Penting' }, { f: 'Especially', b: 'Terutama' },
      { f: 'To achieve', b: 'Mencapai' }, { f: 'Challenge', b: 'Tantangan' },
      { f: 'Knowledge', b: 'Pengetahuan' }, { f: 'Purpose', b: 'Tujuan' },
      { f: 'Solution', b: 'Solusi' }, { f: 'To mention', b: 'Menyebutkan' },
      { f: 'Common', b: 'Umum' }, { f: 'Various', b: 'Beragam' },
      { f: 'Influence', b: 'Pengaruh' }, { f: 'Particular', b: 'Khusus/Tertentu' },
      { f: 'To reduce', b: 'Mengurangi' }, { f: 'Immediate', b: 'Segera' }
    ],
    'Mahir (C1)': [
      { f: 'Inevitable', b: 'Tak terelakkan' }, { f: 'To elaborate', b: 'Menjelaskan rinci' },
      { f: 'Ambiguous', b: 'Ambigu' }, { f: 'To distinguish', b: 'Membedakan' },
      { f: 'Hypothesis', b: 'Hipotesis' }, { f: 'Substantial', b: 'Substansial' },
      { f: 'Consequently', b: 'Akibatnya' }, { f: 'Nevertheless', b: 'Namun demikian' },
      { f: 'To advocate', b: 'Menganjurkan' }, { f: 'Reluctant', b: 'Enggan' },
      { f: 'Prevalent', b: 'Lazim' }, { f: 'To scrutinize', b: 'Meneliti cermat' },
      { f: 'Ubiquitous', b: 'Ada dimana-mana' }, { f: 'To mitigate', b: 'Mengurangi dampak' },
      { f: 'Discrepancy', b: 'Ketidaksesuaian' }, { f: 'To fluctuate', b: 'Naik turun' },
      { f: 'Unprecedented', b: 'Belum pernah terjadi' }, { f: 'To implement', b: 'Menerapkan' },
      { f: 'Comprehensive', b: 'Menyeluruh' }, { f: 'Viable', b: 'Layak' },
      { f: 'To exacerbate', b: 'Memperburuk' }, { f: 'Alleviate', b: 'Meringankan' },
      { f: 'Conundrum', b: 'Teka-teki sulit' }, { f: 'Ephemeral', b: 'Sementara' },
      { f: 'Pragmatic', b: 'Pragmatis' }, { f: 'Resilient', b: 'Tangguh' },
      { f: 'To articulate', b: 'Menyuarakan' }, { f: 'Benevolent', b: 'Baik hati' },
      { f: 'Malevolent', b: 'Jahat' }, { f: 'Candid', b: 'Jujur/Terus terang' }
    ]
  },
  'Jepang 🇯🇵': {
    'Pemula (N5)': [
      { f: 'Watashi (私)', b: 'Saya' }, { f: 'Neko (猫)', b: 'Kucing' },
      { f: 'Inu (犬)', b: 'Anjing' }, { f: 'Hon (本)', b: 'Buku' },
      { f: 'Taberu (食べる)', b: 'Makan' }, { f: 'Nomu (飲む)', b: 'Minum' },
      { f: 'Iku (行く)', b: 'Pergi' }, { f: 'Kuru (来る)', b: 'Datang' },
      { f: 'Oishii (美味しい)', b: 'Enak' }, { f: 'Kawaii (可愛い)', b: 'Lucu' },
      { f: 'Arigatou (ありがとう)', b: 'Terima kasih' }, { f: 'Sumimasen (すみません)', b: 'Maaf' },
      { f: 'Sensei (先生)', b: 'Guru' }, { f: 'Gakusei (学生)', b: 'Murid' },
      { f: 'Tomodachi (友達)', b: 'Teman' }, { f: 'Mizu (水)', b: 'Air' },
      { f: 'Gohan (ご飯)', b: 'Nasi' }, { f: 'Pan (パン)', b: 'Roti' },
      { f: 'Sakana (魚)', b: 'Ikan' }, { f: 'Niku (肉)', b: 'Daging' },
      { f: 'Yasai (野菜)', b: 'Sayuran' }, { f: 'Kudamono (果物)', b: 'Buah' },
      { f: 'Tamago (卵)', b: 'Telur' }, { f: 'Gyuunyuu (牛乳)', b: 'Susu' },
      { f: 'Koohii (コーヒー)', b: 'Kopi' }, { f: 'Ocha (お茶)', b: 'Teh' },
      { f: 'Eki (駅)', b: 'Stasiun' }, { f: 'Gakkou (学校)', b: 'Sekolah' },
      { f: 'Kaisha (会社)', b: 'Perusahaan' }, { f: 'Ie (家)', b: 'Rumah' }
    ],
    'Menengah (N3)': [
      { f: 'Shakai (社会)', b: 'Masyarakat' }, { f: 'Keiken (経験)', b: 'Pengalaman' },
      { f: 'Setsumei (説明)', b: 'Penjelasan' }, { f: 'Riyou (利用)', b: 'Penggunaan' },
      { f: 'Kankyou (環境)', b: 'Lingkungan' }, { f: 'Kekka (結果)', b: 'Hasil' },
      { f: 'Kanojo (彼女)', b: 'Dia (Pr)/Pacar' }, { f: 'Kare (彼)', b: 'Dia (Lk)/Pacar' },
      { f: 'Jouhou (情報)', b: 'Informasi' }, { f: 'Mondai (問題)', b: 'Masalah' },
      { f: 'Kaiketsu (解決)', b: 'Penyelesaian' }, { f: 'Shigoto (仕事)', b: 'Pekerjaan' },
      { f: 'Katsudou (活動)', b: 'Aktivitas' }, { f: 'Seikatsu (生活)', b: 'Kehidupan' },
      { f: 'Bunka (文化)', b: 'Budaya' }, { f: 'Keizai (経済)', b: 'Ekonomi' },
      { f: 'Seiji (政治)', b: 'Politik' }, { f: 'Kokusai (国際)', b: 'Internasional' },
      { f: 'Kankei (関係)', b: 'Hubungan' }, { f: 'Rikai (理解)', b: 'Pemahaman' },
      { f: 'Kyouryoku (協力)', b: 'Kerja sama' }, { f: 'Sanka (参加)', b: 'Partisipasi' },
      { f: 'Hantai (反対)', b: 'Berlawanan' }, { f: 'Sansei (賛成)', b: 'Setuju' },
      { f: 'Shuukan (習慣)', b: 'Kebiasaan' }, { f: 'Dentou (伝統)', b: 'Tradisi' },
      { f: 'Gijutsu (技術)', b: 'Teknologi' }, { f: 'Hattensuru (発展する)', b: 'Berkembang' },
      { f: 'Seikou (成功)', b: 'Sukses' }, { f: 'Shippai (失敗)', b: 'Gagal' }
    ],
    'Mahir (N1)': [
      { f: 'Keikou (傾向)', b: 'Kecenderungan' }, { f: 'Kouken (貢献)', b: 'Kontribusi' },
      { f: 'Haaku (把握)', b: 'Memahami' }, { f: 'Issei ni (一斉に)', b: 'Serentak' },
      { f: 'Kibishii (厳しい)', b: 'Ketat/Keras' }, { f: 'Kougi (抗議)', b: 'Protes' },
      { f: 'Koushou (交渉)', b: 'Negosiasi' }, { f: 'Shinchou (慎重)', b: 'Hati-hati' },
      { f: 'Tettei (徹底)', b: 'Tuntas/Menyeluruh' }, { f: 'Haishi (廃止)', b: 'Penghapusan' },
      { f: 'Kaigo (介護)', b: 'Perawatan lansia' }, { f: 'Kibou (希望)', b: 'Harapan' },
      { f: 'Zetsubou (絶望)', b: 'Keputusasaan' }, { f: 'Yuukou (有効)', b: 'Valid/Efektif' },
      { f: 'Mukou (無効)', b: 'Tidak valid' }, { f: 'Kouka (効果)', b: 'Efek' },
      { f: 'Eikyou (影響)', b: 'Pengaruh' }, { f: 'Sochi (措置)', b: 'Tindakan' },
      { f: 'Taisaku (対策)', b: 'Penanggulangan' }, { f: 'Houshin (方針)', b: 'Kebijakan' },
      { f: 'Kisei (規制)', b: 'Regulasi' }, { f: 'Kanwa (緩和)', b: 'Pelonggaran' },
      { f: 'Kakudai (拡大)', b: 'Perluasan' }, { f: 'Shukushou (縮小)', b: 'Pengurangan' },
      { f: 'Iji (維持)', b: 'Pemeliharaan' }, { f: 'Kanri (管理)', b: 'Manajemen' },
      { f: 'Unei (運営)', b: 'Pengoperasian' }, { f: 'Soshiki (組織)', b: 'Organisasi' },
      { f: 'Kiban (基盤)', b: 'Landasan' }, { f: 'Tenbou (展望)', b: 'Prospek' }
    ]
  },
  'Korea 🇰🇷': {
    'Pemula': [
      { f: 'Annyeong (안녕)', b: 'Halo' }, { f: 'Sarang (사랑)', b: 'Cinta' },
      { f: 'Hada (하다)', b: 'Melakukan' }, { f: 'Meokda (먹다)', b: 'Makan' },
      { f: 'Gada (가다)', b: 'Pergi' }, { f: 'Mul (물)', b: 'Air' },
      { f: 'Bap (밥)', b: 'Nasi' }, { f: 'Chingu (친구)', b: 'Teman' },
      { f: 'Hakgyo (학교)', b: 'Sekolah' }, { f: 'Jip (집)', b: 'Rumah' },
      { f: 'Eomma (엄마)', b: 'Ibu' }, { f: 'Appa (아빠)', b: 'Ayah' },
      { f: 'Namja (남자)', b: 'Pria' }, { f: 'Yeoja (여자)', b: 'Wanita' },
      { f: 'Oneul (오늘)', b: 'Hari ini' }, { f: 'Naeil (내일)', b: 'Besok' },
      { f: 'Eoje (어제)', b: 'Kemarin' }, { f: 'Don (돈)', b: 'Uang' },
      { f: 'Sigan (시간)', b: 'Waktu' }, { f: 'Ireum (이름)', b: 'Nama' },
      { f: 'Gamsa (감사)', b: 'Terima kasih' }, { f: 'Mian (미안)', b: 'Maaf' },
      { f: 'Juseyo (주세요)', b: 'Tolong beri' }, { f: 'Igeo (이것)', b: 'Ini' },
      { f: 'Geugeo (그것)', b: 'Itu' }, { f: 'Eodi (어디)', b: 'Dimana' },
      { f: 'Mwo (뭐)', b: 'Apa' }, { f: 'Nugu (누구)', b: 'Siapa' },
      { f: 'Wae (왜)', b: 'Kenapa' }, { f: 'Eotteoke (어떻게)', b: 'Bagaimana' }
    ],
    'Menengah': [
      { f: 'Yaksok (약속)', b: 'Janji' }, { f: 'Haengbok (행복)', b: 'Kebahagiaan' },
      { f: 'Munhwa (문화)', b: 'Budaya' }, { f: 'Seonggyeok (성격)', b: 'Kepribadian' },
      { f: 'Gyeongheom (경험)', b: 'Pengalaman' }, { f: 'Gihoe (기회)', b: 'Kesempatan' },
      { f: 'Mokpyo (목표)', b: 'Tujuan' }, { f: 'Seonggong (성공)', b: 'Sukses' },
      { f: 'Silpae (실패)', b: 'Gagal' }, { f: 'Gyeoljeong (결정)', b: 'Keputusan' },
      { f: 'Hwangyeong (환경)', b: 'Lingkungan' }, { f: 'Saenghwal (생활)', b: 'Kehidupan' },
      { f: 'Sahoe (사회)', b: 'Masyarakat' }, { f: 'Gwangye (관계)', b: 'Hubungan' },
      { f: 'Uimun (의문)', b: 'Pertanyaan' }, { f: 'Dap (답)', b: 'Jawaban' },
      { f: 'Iyagi (이야기)', b: 'Cerita' }, { f: 'Sasil (사실)', b: 'Fakta' },
      { f: 'Iyu (이유)', b: 'Alasan' }, { f: 'Gyeolgwa (결과)', b: 'Hasil' },
      { f: 'Juyohada (중요하다)', b: 'Penting' }, { f: 'Piryohada (필요하다)', b: 'Perlu' },
      { f: 'Ganunghada (가능하다)', b: 'Mungkin' }, { f: 'Bulganunghada (불가능하다)', b: 'Tidak mungkin' },
      { f: 'Simgakhada (심각하다)', b: 'Serius' }, { f: 'Wihyeomhada (위험하다)', b: 'Berbahaya' },
      { f: 'Anjeonhada (안전하다)', b: 'Aman' }, { f: 'Pyeonhada (편하다)', b: 'Nyaman' },
      { f: 'Bulpyeonhada (불편하다)', b: 'Tidak nyaman' }, { f: 'Bokjaphada (복잡하다)', b: 'Rumit' }
    ],
    'Mahir': [
      { f: 'Gyeongje (경제)', b: 'Ekonomi' }, { f: 'Jeongchi (정치)', b: 'Politik' },
      { f: 'Baljeon (발전)', b: 'Perkembangan' }, { f: 'Gwanjeom (관점)', b: 'Sudut pandang' },
      { f: 'Yeonghyang (영향)', b: 'Pengaruh' }, { f: 'Hyogwa (효과)', b: 'Efek' },
      { f: 'Daanchaek (대안책)', b: 'Alternatif' }, { f: 'Haegyeol (해결)', b: 'Solusi' },
      { f: 'Bipan (비판)', b: 'Kritik' }, { f: 'Noneui (논의)', b: 'Diskusi' },
      { f: 'Hyeopryeok (협력)', b: 'Kerjasama' }, { f: 'Gyeongjaeng (경쟁)', b: 'Kompetisi' },
      { f: 'Gaehyeok (개혁)', b: 'Reformasi' }, { f: 'Jeongchaek (정책)', b: 'Kebijakan' },
      { f: 'Jedoo (제도)', b: 'Sistem' }, { f: 'Gujo (구조)', b: 'Struktur' },
      { f: 'Bunseok (분석)', b: 'Analisis' }, { f: 'Tonggye (통계)', b: 'Statistik' },
      { f: 'Josa (조사)', b: 'Investigasi' }, { f: 'Yeongu (연구)', b: 'Penelitian' },
      { f: 'Balkyeon (발견)', b: 'Penemuan' }, { f: 'Balmyeong (발명)', b: 'Ciptaan' },
      { f: 'Gisul (기술)', b: 'Teknologi' }, { f: 'San-eop (산업)', b: 'Industri' },
      { f: 'Sijang (시장)', b: 'Pasar' }, { f: 'Tuja (투자)', b: 'Investasi' },
      { f: 'Sobija (소비자)', b: 'Konsumen' }, { f: 'Saengsan (생산)', b: 'Produksi' },
      { f: 'Subeul (수출)', b: 'Ekspor' }, { f: 'Suip (수입)', b: 'Impor' }
    ]
  },
  'Jerman 🇩🇪': {
    'Pemula (A1)': [
      { f: 'Hallo', b: 'Halo' }, { f: 'Danke', b: 'Terima kasih' },
      { f: 'Bitte', b: 'Silakan' }, { f: 'Das Haus', b: 'Rumah' },
      { f: 'Der Hund', b: 'Anjing' }, { f: 'Die Katze', b: 'Kucing' },
      { f: 'Essen', b: 'Makan' }, { f: 'Trinken', b: 'Minum' },
      { f: 'Guten Morgen', b: 'Selamat pagi' }, { f: 'Guten Tag', b: 'Selamat siang' },
      { f: 'Guten Abend', b: 'Selamat malam' }, { f: 'Tschüss', b: 'Dah' },
      { f: 'Ja', b: 'Ya' }, { f: 'Nein', b: 'Tidak' },
      { f: 'Der Mann', b: 'Pria' }, { f: 'Die Frau', b: 'Wanita' },
      { f: 'Das Kind', b: 'Anak' }, { f: 'Die Schule', b: 'Sekolah' },
      { f: 'Die Arbeit', b: 'Pekerjaan' }, { f: 'Das Wasser', b: 'Air' },
      { f: 'Das Brot', b: 'Roti' }, { f: 'Der Apfel', b: 'Apel' },
      { f: 'Die Milch', b: 'Susu' }, { f: 'Der Kaffee', b: 'Kopi' },
      { f: 'Das Buch', b: 'Buku' }, { f: 'Der Tisch', b: 'Meja' },
      { f: 'Der Stuhl', b: 'Kursi' }, { f: 'Das Auto', b: 'Mobil' },
      { f: 'Der Zug', b: 'Kereta' }, { f: 'Das Flugzeug', b: 'Pesawat' }
    ],
    'Menengah (B1)': [
      { f: 'Die Erfahrung', b: 'Pengalaman' }, { f: 'Die Entscheidung', b: 'Keputusan' },
      { f: 'Vielleicht', b: 'Mungkin' }, { f: 'Die Zukunft', b: 'Masa depan' },
      { f: 'Die Umwelt', b: 'Lingkungan' }, { f: 'Die Regierung', b: 'Pemerintah' },
      { f: 'Die Wirtschaft', b: 'Ekonomi' }, { f: 'Die Gesellschaft', b: 'Masyarakat' },
      { f: 'Die Bildung', b: 'Pendidikan' }, { f: 'Die Gesundheit', b: 'Kesehatan' },
      { f: 'Entwickeln', b: 'Mengembangkan' }, { f: 'Verbessern', b: 'Meningkatkan' },
      { f: 'Verstehen', b: 'Mengerti' }, { f: 'Erklären', b: 'Menjelaskan' },
      { f: 'Besuchen', b: 'Mengunjungi' }, { f: 'Reisen', b: 'Bepergian' },
      { f: 'Der Urlaub', b: 'Liburan' }, { f: 'Der Ausflug', b: 'Tamasya' },
      { f: 'Die Gelegenheit', b: 'Kesempatan' }, { f: 'Der Erfolg', b: 'Sukses' },
      { f: 'Das Ziel', b: 'Tujuan' }, { f: 'Die Lösung', b: 'Solusi' },
      { f: 'Das Problem', b: 'Masalah' }, { f: 'Die Meinung', b: 'Pendapat' },
      { f: 'Der Grund', b: 'Alasan' }, { f: 'Das Ergebnis', b: 'Hasil' },
      { f: 'Wichtig', b: 'Penting' }, { f: 'Richtig', b: 'Benar' },
      { f: 'Falsch', b: 'Salah' }, { f: 'Möglich', b: 'Mungkin' }
    ],
    'Mahir (C1)': [
      { f: 'Die Verantwortung', b: 'Tanggung jawab' }, { f: 'Die Gesellschaft', b: 'Masyarakat' },
      { f: 'Unabhängig', b: 'Independen' }, { f: 'Die Herausforderung', b: 'Tantangan' },
      { f: 'Die Auswirkung', b: 'Dampak' }, { f: 'Die Maßnahme', b: 'Tindakan' },
      { f: 'Die Verhandlung', b: 'Negosiasi' }, { f: 'Die Zusammenarbeit', b: 'Kerjasama' },
      { f: 'Die Entwicklung', b: 'Perkembangan' }, { f: 'Die Forschung', b: 'Penelitian' },
      { f: 'Die Wissenschaft', b: 'Sains' }, { f: 'Die Technologie', b: 'Teknologi' },
      { f: 'Der Fortschritt', b: 'Kemajuan' }, { f: 'Die Veränderung', b: 'Perubahan' },
      { f: 'Die Globalisierung', b: 'Globalisasi' }, { f: 'Der Klimawandel', b: 'Perubahan iklim' },
      { f: 'Die Nachhaltigkeit', b: 'Keberlanjutan' }, { f: 'Die Innovation', b: 'Inovasi' },
      { f: 'Die Perspektive', b: 'Perspektif' }, { f: 'Der Kontext', b: 'Konteks' },
      { f: 'Die Analyse', b: 'Analisis' }, { f: 'Die Strategie', b: 'Strategi' },
      { f: 'Das Konzept', b: 'Konsep' }, { f: 'Das Prinzip', b: 'Prinsip' },
      { f: 'Die Theorie', b: 'Teori' }, { f: 'Die Praxis', b: 'Praktek' },
      { f: 'Die Kompetenz', b: 'Kompetensi' }, { f: 'Die Qualifikation', b: 'Kualifikasi' },
      { f: 'Die Effizienz', b: 'Efisiensi' }, { f: 'Die Qualität', b: 'Kualitas' }
    ]
  },
  'Arab 🇸🇦': {
    'Pemula': [
      { f: 'Salam (سلام)', b: 'Halo' }, { f: 'Shukran (شكرا)', b: 'Terima kasih' },
      { f: 'Kitaab (كتاب)', b: 'Buku' }, { f: 'Qalam (قلم)', b: 'Pena' },
      { f: 'Bayt (بيت)', b: 'Rumah' }, { f: 'Madrasah (مدرسة)', b: 'Sekolah' },
      { f: 'Umm (أم)', b: 'Ibu' }, { f: 'Ab (أب)', b: 'Ayah' },
      { f: 'Akh (أخ)', b: 'Saudara' }, { f: 'Ukht (أخت)', b: 'Saudari' },
      { f: 'Maa (ماء)', b: 'Air' }, { f: 'Khubz (خبز)', b: 'Roti' },
      { f: 'Akl (أكل)', b: 'Makan' }, { f: 'Nawm (نوم)', b: 'Tidur' },
      { f: 'Shams (شمس)', b: 'Matahari' }, { f: 'Qamar (قمر)', b: 'Bulan' },
      { f: 'Najm (نجم)', b: 'Bintang' }, { f: 'Samaa (سماء)', b: 'Langit' },
      { f: 'Ard (أرض)', b: 'Bumi' }, { f: 'Yawm (يوم)', b: 'Hari' },
      { f: 'Layl (ليل)', b: 'Malam' }, { f: 'Sabah (صباح)', b: 'Pagi' },
      { f: 'Masaa (مساء)', b: 'Sore' }, { f: 'Kabeer (كبير)', b: 'Besar' },
      { f: 'Sagheer (صغير)', b: 'Kecil' }, { f: 'Jameel (جميل)', b: 'Indah' },
      { f: 'Jadeed (جديد)', b: 'Baru' }, { f: 'Qadeem (قديم)', b: 'Lama' },
      { f: 'Rajul (رجل)', b: 'Pria' }, { f: 'Imraa (امرأة)', b: 'Wanita' }
    ],
    'Menengah': [
      { f: 'Sadaqa (صداقة)', b: 'Persahabatan' }, { f: 'Mustaqbal (مستقبل)', b: 'Masa depan' },
      { f: 'Hayat (حياة)', b: 'Kehidupan' }, { f: 'Amal (عمل)', b: 'Kerja' },
      { f: 'Ilm (علم)', b: 'Ilmu' }, { f: 'Deen (دين)', b: 'Agama' },
      { f: 'Dunya (دنيا)', b: 'Dunia' }, { f: 'Aakhira (آخرة)', b: 'Akhirat' },
      { f: 'Hukuma (حكومة)', b: 'Pemerintah' }, { f: 'Shaab (شعب)', b: 'Rakyat' },
      { f: 'Dawla (دولة)', b: 'Negara' }, { f: 'Madina (مدينة)', b: 'Kota' },
      { f: 'Qarya (قرية)', b: 'Desa' }, { f: 'Tareeq (طريق)', b: 'Jalan' },
      { f: 'Safar (سفر)', b: 'Perjalanan' }, { f: 'Matar (مطار)', b: 'Bandara' },
      { f: 'Funduq (فندق)', b: 'Hotel' }, { f: 'Mataam (مطعم)', b: 'Restoran' },
      { f: 'Mustashfa (مستشفى)', b: 'Rumah sakit' }, { f: 'Tabib (طبيب)', b: 'Dokter' },
      { f: 'Dawaa (دواء)', b: 'Obat' }, { f: 'Sehha (صحة)', b: 'Kesehatan' },
      { f: 'Marad (مرض)', b: 'Penyakit' }, { f: 'Mushkila (مشكلة)', b: 'Masalah' },
      { f: 'Hal (حل)', b: 'Solusi' }, { f: 'Sual (سؤال)', b: 'Pertanyaan' },
      { f: 'Jawab (جواب)', b: 'Jawaban' }, { f: 'Fikra (فكرة)', b: 'Ide' },
      { f: 'Raay (رأي)', b: 'Pendapat' }, { f: 'Hiwar (حوار)', b: 'Dialog' }
    ],
    'Mahir': [
      { f: 'Iqtisad (اقتصاد)', b: 'Ekonomi' }, { f: 'Siyasa (سياسة)', b: 'Politik' },
      { f: 'Thaqafa (ثقافة)', b: 'Budaya' }, { f: 'Tarikh (تاريخ)', b: 'Sejarah' },
      { f: 'Jughrafiya (جغرافيا)', b: 'Geografi' }, { f: 'Falsafa (فلسفة)', b: 'Filsafat' },
      { f: 'Adab (أدب)', b: 'Sastra' }, { f: 'Fan (فن)', b: 'Seni' },
      { f: 'Musiqa (موسيقى)', b: 'Musik' }, { f: 'Riyada (رياضة)', b: 'Olahraga' },
      { f: 'Tiknulujiya (تكنولوجيا)', b: 'Teknologi' }, { f: 'Itisal (اتصال)', b: 'Komunikasi' },
      { f: 'Ilam (إعلام)', b: 'Media' }, { f: 'Sahafa (صحافة)', b: 'Jurnalistik' },
      { f: 'Qanun (قانون)', b: 'Hukum' }, { f: 'Haqq (حق)', b: 'Hak' },
      { f: 'Wajib (واجب)', b: 'Kewajiban' }, { f: 'Hurriya (حرية)', b: 'Kebebasan' },
      { f: 'Adl (عدل)', b: 'Keadilan' }, { f: 'Salam (سلام)', b: 'Perdamaian' },
      { f: 'Harb (حرب)', b: 'Perang' }, { f: 'Amn (أمن)', b: 'Keamanan' },
      { f: 'Irhab (إرهاب)', b: 'Terorisme' }, { f: 'Bi-a (بيئة)', b: 'Lingkungan' },
      { f: 'Taluwuth (تلوث)', b: 'Polusi' }, { f: 'Taghayyur (تغير)', b: 'Perubahan' },
      { f: 'Tatawwur (تطور)', b: 'Perkembangan' }, { f: 'Tanmiya (تنمية)', b: 'Pembangunan' },
      { f: 'Taawun (تعاون)', b: 'Kerjasama' }, { f: 'Tasamuh (تسامح)', b: 'Toleransi' }
    ]
  }
};

// --- IKON SVG ---
const Icon = {
  Brain: () => (<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A5.5 5.5 0 0 0 4 7.5a5.5 5.5 0 0 0 4 5.5c0 4 2 7 2 7h4s2-3 2-7a5.5 5.5 0 0 0 4-5.5A5.5 5.5 0 0 0 14.5 2c-1.5 0-2.8.8-3.5 2-.7-1.2-2-2-3.5-2Z"/><path d="M12 15v4"/><path d="M9 19v2h6v-2"/></svg>),
  Check: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  Plus: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>),
  Clock: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  Settings: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>),
  Trash2: () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>),
  ArrowLeft: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>),
  TrendingUp: () => (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>),
  FileText: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>),
  Database: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>),
  Repeat: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>),
  Download: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>),
  AlertCircle: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>),
  Globe: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>),
  LogOut: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>),
  Star: () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  Book: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>),
  Shuffle: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l14.2-13"/><path d="M22 22v-5h-5"/><path d="M2 6h1.4c1.3 0 2.5.6 3.3 1.7l3.2 2.9"/><path d="M13.7 15.7l3.2 2.9c.8 1.1 2 1.7 3.3 1.7H22"/><path d="M22 2v5h-5"/></svg>),
  Edit: () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>),
  MoveDown: () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 18L12 22L16 18"/><path d="M12 2L12 22"/></svg>),
  MoveUp: () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 6L12 2L8 6"/><path d="M12 22L12 2"/></svg>)
};

const ONE_MINUTE = 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;
const SRS_INTERVALS = [0, ONE_DAY, 3*ONE_DAY, 7*ONE_DAY, 14*ONE_DAY, 30*ONE_DAY];

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function checkAnswerSmart(input: string, correctAnswer: string): boolean {
  const cleanInput = input.trim().toLowerCase();
  const cleanAnswer = correctAnswer.trim().toLowerCase();
  const generateVariations = (text: string) => {
    const variations = new Set<string>();
    variations.add(text);
    const parts = text.split(/[\(（]/);
    if (parts.length > 1) variations.add(parts[0].trim());
    const currentVars = Array.from(variations);
    currentVars.forEach(v => { if (v.startsWith('to ')) variations.add(v.replace(/^to\s+/, '').trim()); });
    return variations;
  };
  return generateVariations(cleanAnswer).has(cleanInput);
}

const getLanguageStats = (lang: string): LangStats | null => {
  try {
    const data = localStorage.getItem(`ingatkata-deck-${lang}`);
    if (!data) return null;
    const cards: Card[] = JSON.parse(data);
    const active = cards.filter(c => c.status === 'active');
    return {
      lang,
      totalDeck: cards.length,
      mastered: active.filter(c => c.box >= 4).length,
      active: active.length,
      reserve: cards.filter(c => c.status === 'reserve').length
    };
  } catch (e) { return null; }
};

const getSavedLanguages = (): string[] => {
  const langs: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('ingatkata-deck-')) {
      langs.push(key.replace('ingatkata-deck-', ''));
    }
  }
  return langs;
};

// --- KOMPONEN MODAL/POPUP KUSTOM ---
const Modal = ({ isOpen, title, message, onConfirm, onCancel, type = 'confirm' }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel?: () => void, type?: 'confirm'|'alert' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6 whitespace-pre-line">{message}</p>
        <div className="flex gap-3 justify-end">
          {type === 'confirm' && (
            <button onClick={onCancel} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors">Batal</button>
          )}
          <button onClick={onConfirm} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
            {type === 'alert' ? 'Mengerti' : 'Ya, Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- KOMPONEN ONBOARDING ---
const OnboardingView = ({ onComplete, hasExistingDecks, onCancel }: any) => {
  const languages = Object.keys(WORD_DATABASE);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-indigo-50 animate-fade-in relative">
      {hasExistingDecks && <button onClick={onCancel} className="absolute top-6 left-6 text-gray-500 hover:text-gray-800 flex items-center gap-2 font-medium"><Icon.ArrowLeft /> Batal</button>}
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-indigo-100">
        <div className="flex justify-center mb-6 text-indigo-600"><Icon.Globe /></div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mulai Petualangan Baru</h1>
        <p className="text-gray-500 mb-8">Bahasa apa yang ingin kamu pelajari?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {languages.map(lang => (
            <button key={lang} onClick={() => onComplete(lang)} className="p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all font-bold text-lg text-gray-700 flex items-center justify-between group"><span>{lang}</span><span className="group-hover:translate-x-1 transition-transform text-indigo-500">→</span></button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- MATERIAL MANAGER ---
const MaterialManager = ({ currentLang, cards, onImportLevel, onBack, onShowAlert }: any) => {
  const availableLevels = Object.keys(WORD_DATABASE[currentLang] || {});
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="mb-6 text-gray-500 hover:text-gray-800 flex items-center gap-2 font-medium"><Icon.ArrowLeft /> Kembali ke Dashboard</button>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Kelola Materi Belajar</h1>
        <p className="text-gray-500 mb-8">Tambahkan paket kata ke dalam deck {currentLang} kamu.</p>
        <div className="space-y-4">
          {availableLevels.map(level => {
            const isAdded = cards.some((c: Card) => c.source === `preset-${level}`);
            const count = WORD_DATABASE[currentLang][level].length;
            return (
              <div key={level} className="bg-white p-5 rounded-xl border-2 border-gray-100 flex justify-between items-center">
                <div><h3 className="text-xl font-bold text-gray-800">{level}</h3><p className="text-sm text-gray-500">{count} Kata</p></div>
                {isAdded ? <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold text-sm flex items-center gap-2"><Icon.Check /> Sudah Ditambah</span> : <button onClick={() => { onImportLevel(level); onShowAlert('Sukses', `Paket ${level} berhasil ditambahkan!`); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">+ Tambahkan</button>}
              </div>
            );
          })}
           <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-sm">💡 <strong>Tip:</strong> Kamu bisa menambahkan beberapa level sekaligus. Kata-kata akan masuk ke "Antrian" (Reserve) dan muncul secara bertahap saat kamu belajar.</div>
        </div>
      </div>
    </div>
  );
};

// --- HOME VIEW ---
const HomeView = ({ currentLang, dueCount, learnedCount, reserveCount, lastAccuracy, totalCards, onStart, onAdd, onList, onRepeatAll, onRepeatWrong, onSmartAdd, onChangeLang, onManageMaterial }: any) => {
  let addBtnLabel = "+5 Kata Baru";
  let addBtnColor = "border-indigo-100 text-indigo-600 hover:bg-indigo-50";
  let canAdd = true;

  if (lastAccuracy !== null) {
    if (lastAccuracy >= 0.8) { addBtnLabel = "+5 Kata Baru"; addBtnColor = "border-green-200 text-green-600 hover:bg-green-50"; } 
    else if (lastAccuracy >= 0.5) { addBtnLabel = "+2 Kata Baru"; addBtnColor = "border-orange-200 text-orange-600 hover:bg-orange-50"; } 
    else { addBtnLabel = "Fokus Dulu (Nilai < 50%)"; addBtnColor = "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"; canAdd = false; }
  }

  if (currentLang === "Gabungan") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8 p-4 animate-fade-in relative">
        <div className="absolute top-0 right-0 p-4">
          <button onClick={onChangeLang} className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors"><Icon.Globe /> Mode Gabungan <span className="text-gray-400 text-xs ml-1">| Keluar</span></button>
        </div>
        <div className="text-center space-y-2 mt-8">
          <h1 className="text-4xl font-bold text-purple-600 flex items-center justify-center gap-3"><Icon.Shuffle /> Tantangan Polyglot</h1>
          <p className="text-gray-500">Latihan campuran dari semua bahasa aktif Anda.</p>
        </div>
        <div className="bg-purple-50 border-2 border-purple-100 p-6 rounded-2xl text-center max-w-md w-full">
          <p className="text-purple-800 font-medium mb-2">Siap menguji kemampuan otak berpindah bahasa?</p>
          <div className="text-sm text-gray-600">Hanya kata yang sudah pernah dipelajari (Aktif) yang akan muncul di sini. Anda tidak bisa menambah kata baru di mode ini.</div>
        </div>
        <div className="w-full max-w-md">
          <button onClick={onStart} className="w-full py-4 rounded-xl text-xl font-bold shadow-lg bg-purple-600 text-white hover:bg-purple-700 hover:scale-105 transition-all flex items-center justify-center gap-2">Mulai Tantangan <Icon.Clock /></button>
        </div>
      </div>
    );
  }

  if (totalCards === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 p-4 animate-fade-in">
         <div className="text-center space-y-2"><h1 className="text-3xl font-bold text-indigo-600 flex items-center justify-center gap-2"><Icon.Brain /> IngatKata</h1><p className="text-gray-500">Selamat datang di kursus {currentLang}</p></div>
         <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full text-center space-y-6">
            <div className="text-6xl">📦</div><h2 className="text-xl font-bold text-gray-800">Deck Kamu Masih Kosong</h2><p className="text-gray-500 text-sm">Pilih materi untuk memulai, atau buat kata-katamu sendiri.</p>
            <button onClick={onManageMaterial} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">Pilih Materi / Level</button>
            <div className="relative py-2"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Atau</span></div></div>
            <button onClick={onAdd} className="w-full py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50">Tambah Kata Sendiri (Custom)</button>
         </div>
         <button onClick={onChangeLang} className="text-sm text-gray-400 hover:text-gray-600 underline">Ganti Bahasa</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8 p-4 animate-fade-in relative">
      <div className="absolute top-0 right-0 p-4"><button onClick={onChangeLang} className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors"><Icon.Globe /> {currentLang} <span className="text-gray-400 text-xs ml-1">| Ganti</span></button></div>
      <div className="text-center space-y-2 mt-8"><h1 className="text-4xl font-bold text-indigo-600 flex items-center justify-center gap-3"><Icon.Brain /> IngatKata</h1><p className="text-gray-500">Belajar {currentLang}</p></div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
        <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 text-center"><div className="text-2xl font-bold text-orange-500">{dueCount}</div><div className="text-xs text-gray-500 font-medium">Siap Review</div></div>
        <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 text-center"><div className="text-2xl font-bold text-green-500">{learnedCount}</div><div className="text-xs text-gray-500 font-medium">Master</div></div>
         <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-center"><div className="text-2xl font-bold text-gray-500 flex justify-center items-center gap-1">{reserveCount}</div><div className="text-xs text-gray-400 font-medium">Antrian</div></div>
      </div>
      <div className="w-full max-w-md space-y-3">
        {dueCount > 0 ? (
          <button onClick={onStart} className="w-full py-4 rounded-xl text-xl font-bold shadow-lg bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center gap-2">Mulai Belajar <Icon.Clock /></button>
        ) : (
          <div className="space-y-3 text-center">
             <div className="p-3 bg-green-100 text-green-700 rounded-xl border border-green-200 text-sm mb-4">🎉 <strong>Target Tercapai!</strong> Tidak ada kartu yang perlu diulang saat ini.</div>
             <div className="grid grid-cols-2 gap-3">
               <button onClick={onRepeatAll} className="py-3 px-2 rounded-xl bg-white border-2 border-indigo-100 text-indigo-600 font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm"><Icon.Repeat /> Ulangi Semua</button>
               <button onClick={onRepeatWrong} className="py-3 px-2 rounded-xl bg-white border-2 border-red-100 text-red-500 font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm"><Icon.AlertCircle /> Ulangi Salah</button>
             </div>
             {reserveCount > 0 ? (
               <button onClick={canAdd ? onSmartAdd : undefined} disabled={!canAdd} className={`w-full py-3 px-4 rounded-xl bg-white border-2 font-bold transition-colors flex items-center justify-center gap-2 text-sm mt-2 ${addBtnColor}`}><Icon.Download /> {addBtnLabel}</button>
             ) : (
               <button disabled className="w-full py-3 px-4 rounded-xl bg-gray-100 text-gray-400 font-bold cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2">Gudang Kosong</button>
             )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <button onClick={onAdd} className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"><Icon.Plus /> Tambah</button>
        <button onClick={onManageMaterial} className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-orange-100 text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-colors"><Icon.Book /> Materi</button>
        <button onClick={onList} className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors"><Icon.Settings /> Atur</button>
      </div>
    </div>
  );
};

// --- STUDY VIEW ---
const StudyView = ({ queue, currentLang, currentIndex, onResult, onComplete }: any) => {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setInput(''); setFeedback('idle'); setShowAnswer(false); setTimeout(() => inputRef.current?.focus(), 100); }, [currentIndex, queue]);
  if (queue.length === 0) return null;
  const item = queue[currentIndex]; const { card, direction } = item;
  const questionText = direction === 'forward' ? card.front : card.back;
  const answerText = direction === 'forward' ? card.back : card.front;
  
  const langName = item.originLang || currentLang;
  const displayLang = langName === 'Gabungan' ? 'Bahasa Asing' : langName.split(' ')[0];

  const questionLabel = direction === 'forward' ? displayLang : 'Bahasa Indonesia';
  const answerLabel = direction === 'forward' ? 'Bahasa Indonesia' : displayLang;
  const placeholder = direction === 'forward' ? 'Ketik arti dalam Bhs Indonesia...' : `Ketik dalam Bahasa ${displayLang}...`;

  const progress = ((currentIndex) / queue.length) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); if (feedback !== 'idle') return;
    const isCorrect = checkAnswerSmart(input, answerText);
    const newStats = { correct: sessionStats.correct + (isCorrect ? 1 : 0), total: sessionStats.total + 1 };
    setSessionStats(newStats);
    if (isCorrect) { setFeedback('correct'); setTimeout(() => { processNext(item, true, newStats); }, 1000); } else { setFeedback('incorrect'); setShowAnswer(true); }
  };
  const handleContinue = () => { processNext(item, false, sessionStats); };
  const processNext = (currentItem: StudyItem, isCorrect: boolean, currentStats: {correct: number, total: number}) => {
    onResult(currentItem, isCorrect);
    if (currentIndex >= queue.length - 1) { onComplete(currentStats.correct, currentStats.total); }
  };

  return (
    <div className="max-w-xl mx-auto w-full min-h-screen flex flex-col p-4 animate-fade-in">
      <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div></div>
      <div className="flex justify-between text-sm text-gray-400 mb-8 font-medium"><span>Kartu {currentIndex + 1} dari {queue.length}</span><span>Level SRS: {card.box}</span></div>
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="text-center space-y-4"><span className="text-indigo-500 font-bold tracking-wider text-sm uppercase">{questionLabel}</span><h2 className="text-5xl font-bold text-gray-800">{questionText}</h2></div>
        <div className="w-full relative">
          {!showAnswer ? (
            <form onSubmit={handleSubmit} className="relative">
              <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} className={`w-full p-5 text-center text-2xl rounded-2xl border-2 outline-none transition-all shadow-sm ${feedback === 'idle' ? 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100' : ''} ${feedback === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : ''} ${feedback === 'incorrect' ? 'border-red-300 bg-red-50' : ''}`} autoFocus disabled={feedback === 'correct'} />
              <button type="submit" className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-gray-100 rounded-lg text-gray-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"><Icon.Check /></button>
            </form>
          ) : (
            <div className="w-full p-6 rounded-2xl bg-red-50 border-2 border-red-200 text-center space-y-4 animate-shake">
              <div><p className="text-red-500 font-medium mb-1">Jawaban Kamu:</p><p className="text-xl line-through text-red-400">{input}</p></div>
              <div className="py-2 border-t border-red-100"><p className="text-green-600 font-medium mb-1">Jawaban Benar ({answerLabel}):</p><p className="text-3xl font-bold text-gray-800">{answerText}</p></div>
              <button onClick={handleContinue} autoFocus className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">Lanjut</button>
            </div>
          )}
        </div>
        {feedback === 'correct' && <div className="text-green-600 font-bold text-xl flex items-center gap-2 animate-bounce"><Icon.Check /> Benar!</div>}
        {feedback === 'idle' && <button onClick={() => { setFeedback('incorrect'); setShowAnswer(true); }} className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors">Saya tidak tahu</button>}
      </div>
    </div>
  );
};

// --- ADD VIEW ---
const AddView = ({ onBack, onSave, onBulkSave, currentLang, onShowConfirm, onShowAlert }: any) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    if (lastSaved) { const timer = setTimeout(() => setLastSaved(null), 3000); return () => clearTimeout(timer); }
  }, [lastSaved]);

  const handleBack = () => {
    if ((front || back || bulkText) && !lastSaved) onShowConfirm("Konfirmasi", "Anda memiliki perubahan yang belum disimpan. Yakin ingin kembali?", onBack);
    else onBack();
  };

  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const doSave = () => { onSave(front, back); setLastSaved(`"${front}" berhasil disimpan!`); setFront(''); setBack(''); };
    if (front && back) doSave();
  };

  return (
    <div className="max-w-md mx-auto p-6 animate-fade-in">
       <button onClick={handleBack} className="mb-6 text-gray-500 hover:text-gray-800 flex items-center gap-2"><Icon.ArrowLeft /> Kembali</button>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Tambah Kata Manual</h2>
      <div className="flex mb-6 bg-gray-100 p-1 rounded-xl">
        <button onClick={() => setMode('single')} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${mode==='single'?'bg-white text-indigo-600 shadow-sm':'text-gray-500'}`}>Manual</button>
        <button onClick={() => setMode('bulk')} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${mode==='bulk'?'bg-white text-indigo-600 shadow-sm':'text-gray-500'}`}>Bulk</button>
      </div>
      {mode === 'single' ? (
        <form onSubmit={handleSaveSingle} className="space-y-4">
          <div><label className="text-sm text-gray-500 mb-1 block">{currentLang}</label><input className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" value={front} onChange={e=>setFront(e.target.value)} placeholder={`Contoh kata ${currentLang.split(' ')[0]} (Latin/Asli)`} autoFocus required /></div>
          <div><label className="text-sm text-gray-500 mb-1 block">Indonesia</label><input className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" value={back} onChange={e=>setBack(e.target.value)} placeholder="Arti" required /></div>
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-all active:scale-95">Simpan</button>
          {lastSaved && <div className="p-3 bg-green-100 text-green-700 rounded-xl text-center text-sm font-medium animate-fade-in flex items-center justify-center gap-2"><Icon.Check /> {lastSaved}</div>}
        </form>
      ) : (
        <form onSubmit={(e) => {e.preventDefault(); const c=onBulkSave(bulkText); if(c>0){onShowAlert('Sukses', `Import ${c} kata berhasil!`);setBulkText('');}else{onShowAlert('Gagal', 'Format salah');}}} className="space-y-4">
          <textarea className="w-full h-48 p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" value={bulkText} onChange={e=>setBulkText(e.target.value)} placeholder="apple <> apel" required />
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg">Import</button>
        </form>
      )}
    </div>
  );
};

// --- LIST VIEW (Updated: Selection Mode & Action Bar) ---
const ListView = ({ cards, onBack, onDelete, onBulkDelete, onBulkMove }: { cards: Card[], onBack: () => void, onDelete: (id: string) => void, onBulkDelete: (ids: string[]) => void, onBulkMove: (ids: string[], target: 'active'|'reserve') => void }) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const activeCards = cards.filter(c => c.status === 'active');
  const reserveCards = cards.filter(c => c.status === 'reserve');

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = (subset: Card[]) => {
    const subsetIds = subset.map(c => c.id);
    const allSelected = subsetIds.every(id => selectedIds.has(id));
    const newSet = new Set(selectedIds);
    if (allSelected) {
      subsetIds.forEach(id => newSet.delete(id));
    } else {
      subsetIds.forEach(id => newSet.add(id));
    }
    setSelectedIds(newSet);
  };

  const handleBulkAction = (action: 'delete' | 'to_active' | 'to_reserve') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (action === 'delete') {
      if (confirm(`Hapus ${ids.length} kata terpilih?`)) {
        onBulkDelete(ids);
        setSelectedIds(new Set());
        setIsSelectionMode(false);
      }
    } else if (action === 'to_active') {
      onBulkMove(ids, 'active');
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } else if (action === 'to_reserve') {
      onBulkMove(ids, 'reserve');
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 animate-fade-in pb-32">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 flex items-center gap-2"><Icon.ArrowLeft /> Kembali</button>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }} 
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${isSelectionMode ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
           >
             {isSelectionMode ? 'Batal Pilih' : 'Pilih'} <Icon.Edit />
           </button>
           <h2 className="text-xl font-bold text-gray-800">Daftar Kata</h2>
        </div>
      </div>

      <div className="space-y-8">
        {/* SECTION AKTIF */}
        <div>
          <div className="flex justify-between items-center mb-3">
             <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">AKTIF ({activeCards.length})</h3>
             {isSelectionMode && activeCards.length > 0 && (
               <button onClick={() => toggleSelectAll(activeCards)} className="text-xs font-bold text-indigo-500 hover:text-indigo-700">
                 {activeCards.every(c => selectedIds.has(c.id)) ? 'Batal Semua' : 'Pilih Semua'}
               </button>
             )}
          </div>
          <div className="space-y-2">
            {activeCards.map(c => (
              <div key={c.id} className={`bg-white p-3 rounded-xl border transition-all flex items-center gap-3 ${selectedIds.has(c.id) ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50' : 'border-indigo-100 shadow-sm'}`} onClick={() => isSelectionMode && toggleSelection(c.id)}>
                {isSelectionMode && (
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedIds.has(c.id) ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                    {selectedIds.has(c.id) && <Icon.Check className="text-white w-3 h-3" />}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-bold text-gray-800">{c.front}</div>
                  <div className="text-sm text-gray-500">{c.back}</div>
                  <div className="text-xs text-gray-400 mt-1">{c.source.replace('preset-', '')}</div>
                </div>
                {!isSelectionMode && <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="text-red-300 hover:text-red-500"><Icon.Trash2 /></button>}
              </div>
            ))}
            {activeCards.length === 0 && <p className="text-sm text-gray-400 italic">Tidak ada kata aktif.</p>}
          </div>
        </div>

        {/* SECTION ANTRIAN */}
        <div>
          <div className="flex justify-between items-center mb-3">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">ANTRIAN ({reserveCards.length})</h3>
             {isSelectionMode && reserveCards.length > 0 && (
               <button onClick={() => toggleSelectAll(reserveCards)} className="text-xs font-bold text-gray-500 hover:text-gray-700">
                 {reserveCards.every(c => selectedIds.has(c.id)) ? 'Batal Semua' : 'Pilih Semua'}
               </button>
             )}
          </div>
          <div className="space-y-2">
            {reserveCards.map(c => (
              <div key={c.id} className={`bg-gray-50 p-3 rounded-xl border transition-all flex items-center gap-3 ${selectedIds.has(c.id) ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50 opacity-100' : 'border-gray-200 opacity-75'}`} onClick={() => isSelectionMode && toggleSelection(c.id)}>
                 {isSelectionMode && (
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedIds.has(c.id) ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                    {selectedIds.has(c.id) && <Icon.Check className="text-white w-3 h-3" />}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-bold text-gray-600">{c.front}</div>
                  <div className="text-sm text-gray-400">{c.back}</div>
                </div>
                {!isSelectionMode && <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="text-gray-300 hover:text-gray-500"><Icon.Trash2 /></button>}
              </div>
            ))}
             {reserveCards.length === 0 && <p className="text-sm text-gray-400 italic">Antrian kosong.</p>}
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BAR */}
      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center animate-slide-up">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 flex gap-2 items-center">
             <div className="px-3 font-bold text-gray-500 text-sm">{selectedIds.size} Dipilih</div>
             <div className="h-6 w-px bg-gray-200 mx-1"></div>
             <button onClick={() => handleBulkAction('to_active')} className="p-3 text-green-600 hover:bg-green-50 rounded-xl flex flex-col items-center gap-1 min-w-[60px]">
               <Icon.MoveUp /> <span className="text-[10px] font-bold">Ke Aktif</span>
             </button>
             <button onClick={() => handleBulkAction('to_reserve')} className="p-3 text-orange-500 hover:bg-orange-50 rounded-xl flex flex-col items-center gap-1 min-w-[60px]">
               <Icon.MoveDown /> <span className="text-[10px] font-bold">Ke Antrian</span>
             </button>
             <button onClick={() => handleBulkAction('delete')} className="p-3 text-red-500 hover:bg-red-50 rounded-xl flex flex-col items-center gap-1 min-w-[60px]">
               <Icon.Trash2 /> <span className="text-[10px] font-bold">Hapus</span>
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- APP COMPONENT ---
export default function App() {
  const [currentLang, setCurrentLang] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [view, setView] = useState<'loading' | 'lang-select' | 'onboarding' | 'home' | 'study' | 'add' | 'list' | 'material'>('loading');
  const [studyQueue, setStudyQueue] = useState<StudyItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [lastSessionAccuracy, setLastSessionAccuracy] = useState<number | null>(null);
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: ()=>void, type: 'alert'|'confirm'}>({ isOpen: false, title: '', message: '', onConfirm: ()=>{}, type: 'alert' });

  const showAlert = (title: string, message: string) => { setModalConfig({ isOpen: true, title, message, onConfirm: () => setModalConfig(p => ({...p, isOpen: false})), type: 'alert' }); };
  const showConfirm = (title: string, message: string, onYes: () => void) => { setModalConfig({ isOpen: true, title, message, onConfirm: () => { onYes(); setModalConfig(p => ({...p, isOpen: false})); }, type: 'confirm' }); };

  useEffect(() => { const savedLangs = getSavedLanguages(); if (savedLangs.length > 0) setView('lang-select'); else setView('onboarding'); }, []);
  useEffect(() => { if (currentLang && currentLang !== "Gabungan") { const savedCards = localStorage.getItem(`ingatkata-deck-${currentLang}`); if (savedCards) setCards(JSON.parse(savedCards).map((c: any) => ({ ...c, status: c.status || 'active', source: c.source || 'legacy' }))); else setCards([]); } }, [currentLang]);
  useEffect(() => { if (currentLang && currentLang !== "Gabungan" && cards.length > 0) localStorage.setItem(`ingatkata-deck-${currentLang}`, JSON.stringify(cards)); }, [cards, currentLang]);

  const handleOnboardingComplete = (lang: string) => { localStorage.setItem(`ingatkata-deck-${lang}`, JSON.stringify([])); setCurrentLang(lang); setCards([]); setView('home'); };

  const activeCards = cards.filter(c => c.status === 'active');
  const reserveCards = cards.filter(c => c.status === 'reserve');
  const dueCardsCount = activeCards.filter(c => c.nextReview <= Date.now()).length;
  const learnedCardsCount = activeCards.filter(c => c.box >= 4).length;

  const createQueue = (cardList: Card[]) => cardList.map(card => ({ card, direction: Math.random() > 0.5 ? 'forward' as const : 'backward' as const }));
  const startSession = () => {
    const due = activeCards.filter(c => currentLang === "Gabungan" ? true : c.nextReview <= Date.now()).sort((a, b) => a.nextReview - b.nextReview);
    const cardsToStudy = currentLang === "Gabungan" ? shuffleArray(activeCards) : due;
    if (cardsToStudy.length === 0) { if (currentLang === "Gabungan") return showAlert("Info", "Belum ada kata aktif."); return; }
    setStudyQueue(createQueue(cardsToStudy).map(item => item)); setCurrentCardIndex(0); setView('study');
  };

  const handleStartMixedSession = () => {
    const langs = getSavedLanguages(); let allActiveCards: (Card & { originLang: string })[] = [];
    langs.forEach(lang => { const data = localStorage.getItem(`ingatkata-deck-${lang}`); if (data) allActiveCards = [...allActiveCards, ...JSON.parse(data).filter((c:Card) => c.status === 'active').map((c:Card) => ({ ...c, originLang: lang }))]; });
    if (allActiveCards.length === 0) { showAlert("Info", "Belum ada kata aktif."); return; }
    setCards(allActiveCards); setCurrentLang("Gabungan"); setView('home');
  };

  const handleRepeatAll = () => { if(activeCards.length===0) return showAlert("Info", "Deck kosong"); setStudyQueue(createQueue(shuffleArray(activeCards))); setCurrentCardIndex(0); setView('study'); };
  const handleRepeatWrong = () => { const wrong = activeCards.filter(c => c.box === 0); if(wrong.length===0) return showAlert("Info", "Tidak ada kartu salah"); setStudyQueue(createQueue(shuffleArray(wrong))); setCurrentCardIndex(0); setView('study'); };

  const handleCardResult = (item: StudyItem, isCorrect: boolean) => {
    if (currentLang === "Gabungan") { if (item.originLang) { const deckKey = `ingatkata-deck-${item.originLang}`; const stored = localStorage.getItem(deckKey); if (stored) { const deck = JSON.parse(stored); const updatedDeck = deck.map((c:Card) => c.id === item.card.id ? { ...c, box: isCorrect ? Math.min(c.box+1, 5) : 0, nextReview: isCorrect ? Date.now() + SRS_INTERVALS[Math.min(c.box+1, 5)] : Date.now() + ONE_MINUTE } : c); localStorage.setItem(deckKey, JSON.stringify(updatedDeck)); } } } 
    else { const updatedCards = cards.map(c => c.id === item.card.id ? { ...c, box: isCorrect ? Math.min(c.box+1, 5) : 0, nextReview: isCorrect ? Date.now() + SRS_INTERVALS[Math.min(c.box+1, 5)] : Date.now() + ONE_MINUTE } : c); setCards(updatedCards); }
    if (currentCardIndex < studyQueue.length - 1) setCurrentCardIndex(prev => prev + 1);
  };

  const handleSessionComplete = (correct: number, total: number) => { setLastSessionAccuracy(total > 0 ? correct / total : 0); showAlert("Sesi Selesai!", `Akurasi: ${Math.round((correct/total)*100)}%`); setView('home'); setStudyQueue([]); };
  const handleAddCard = (f: string, b: string) => setCards([...cards, { id: Date.now().toString(), front: f, back: b, box: 0, nextReview: Date.now(), lastReviewed: null, status: 'active', source: 'custom' }]);
  const handleDeleteCard = (id: string) => { showConfirm("Hapus Kartu", "Yakin hapus?", () => setCards(cards.filter(c => c.id !== id))); };
  
  // BULK ADD LOGIC (FIXED: 5 Active Only)
  const handleBulkAdd = (text: string) => {
    const lines = text.split('\n');
    let parsed: {f:string, b:string}[] = [];
    lines.forEach(l => { const p = l.split('<>'); if(p.length===2 && p[0].trim() && p[1].trim()) parsed.push({f: p[0].trim(), b: p[1].trim()}); });
    parsed = shuffleArray(parsed);
    const currentActiveCount = cards.filter(c => c.status === 'active').length;
    let slots = currentActiveCount < 5 ? 5 - currentActiveCount : 0;
    const newCards: Card[] = parsed.map(p => { const active = slots > 0; if(active) slots--; return { id: Date.now()+Math.random().toString(), front: p.f, back: p.b, box: 0, nextReview: Date.now(), lastReviewed: null, status: active?'active':'reserve', source: 'custom'}; });
    if(newCards.length>0) setCards([...cards, ...newCards]); return newCards.length;
  };

  const handleSmartAdd = () => { 
    let toAdd = (!lastSessionAccuracy || lastSessionAccuracy >= 0.8) ? 5 : (lastSessionAccuracy >= 0.5 ? 2 : 0); 
    if(toAdd === 0) return; 
    const reserves = reserveCards.slice(0, toAdd); 
    if(reserves.length===0) return showAlert("Info", "Gudang habis"); 
    const ids = new Set(reserves.map(c=>c.id)); 
    setCards(cards.map(c => ids.has(c.id) ? {...c, status: 'active', nextReview: Date.now()} : c)); 
    showAlert("Sukses", `+${reserves.length} kata baru aktif!`); 
  };

  const handleImportLevel = (level: string) => {
    if (!currentLang) return;
    const rawWords = WORD_DATABASE[currentLang][level];
    const shuffled = shuffleArray(rawWords);
    const currentActiveCount = cards.filter(c => c.status === 'active').length;
    let slots = currentActiveCount < 5 ? 5 - currentActiveCount : 0;
    const newCards: Card[] = shuffled.map((w, idx) => { const active = slots > 0; if(active) slots--; return { id: `preset-${level}-${Date.now()}-${idx}`, front: w.f, back: w.b, box: 0, nextReview: Date.now(), lastReviewed: null, status: active ? 'active' : 'reserve', source: `preset-${level}` }; });
    setCards([...cards, ...newCards]); setView('home');
  };

  // HANDLERS FOR BULK LIST ACTIONS
  const handleBulkDelete = (ids: string[]) => {
    const idSet = new Set(ids);
    setCards(cards.filter(c => !idSet.has(c.id)));
  };

  const handleBulkMove = (ids: string[], target: 'active' | 'reserve') => {
    const idSet = new Set(ids);
    setCards(cards.map(c => idSet.has(c.id) ? { ...c, status: target, nextReview: target === 'active' ? Date.now() : c.nextReview } : c));
  };

  if (view === 'loading') return <div className="min-h-screen flex items-center justify-center text-indigo-600">Memuat...</div>;
  if (view === 'lang-select') return <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-indigo-50 animate-fade-in"><div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-indigo-100"><div className="flex justify-center mb-4 text-indigo-600"><Icon.Brain /></div><h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Saya</h1><div className="space-y-4">{getSavedLanguages().map(lang => { const stats = getLanguageStats(lang); if (!stats) return null; return (<button key={lang} onClick={() => setCurrentLang(lang)} className="w-full bg-white border-2 border-gray-100 hover:border-indigo-500 hover:shadow-md p-4 rounded-xl transition-all text-left group relative overflow-hidden"><div className="flex justify-between items-center mb-2"><span className="font-bold text-lg text-gray-800">{lang}</span><div className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-lg"><Icon.Star /> {stats.mastered} Master</div></div><div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-2"><div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{width: `${(stats.totalDeck>0?(stats.mastered/stats.totalDeck)*100:0)}%`}}></div></div><div className="flex justify-between text-xs text-gray-400 font-medium"><span>Aktif: {stats.active}</span><span>Total: {stats.totalDeck}</span></div></button>); })}{getSavedLanguages().length > 1 && (<button onClick={handleStartMixedSession} className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-between group"><span className="flex items-center gap-2"><Icon.Shuffle /> Tantangan Polyglot</span><span className="group-hover:translate-x-1 transition-transform">Mulai →</span></button>)}<div className="border-t border-gray-100 my-4 pt-4"><button onClick={() => setView('onboarding')} className="w-full p-4 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-50 flex justify-center items-center gap-2"><Icon.Plus /> Pelajari Bahasa Baru</button></div></div></div></div>;
  if (view === 'onboarding') return <OnboardingView hasExistingDecks={getSavedLanguages().length > 0} onCancel={() => setView('lang-select')} onComplete={handleOnboardingComplete} />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-indigo-100">
      <Modal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} onConfirm={modalConfig.onConfirm} onCancel={() => setModalConfig(p => ({...p, isOpen: false}))} type={modalConfig.type} />
      {view === 'home' && currentLang && <HomeView currentLang={currentLang} dueCount={dueCardsCount} learnedCount={learnedCardsCount} reserveCount={reserveCards.length} lastAccuracy={lastSessionAccuracy} totalCards={cards.length} onStart={startSession} onAdd={()=>setView('add')} onList={()=>setView('list')} onRepeatAll={handleRepeatAll} onRepeatWrong={handleRepeatWrong} onSmartAdd={handleSmartAdd} onChangeLang={() => { setCurrentLang(null); setView('lang-select'); }} onManageMaterial={() => setView('material')} />}
      {view === 'add' && currentLang && <AddView currentLang={currentLang} onBack={()=>setView('home')} onSave={handleAddCard} onBulkSave={handleBulkAdd} onShowConfirm={showConfirm} onShowAlert={showAlert} />}
      {view === 'list' && <ListView cards={cards} onBack={()=>setView('home')} onDelete={handleDeleteCard} onBulkDelete={handleBulkDelete} onBulkMove={handleBulkMove} />}
      {view === 'study' && currentLang && <StudyView queue={studyQueue} currentLang={currentLang} currentIndex={currentCardIndex} onResult={handleCardResult} onComplete={handleSessionComplete} />}
      {view === 'material' && currentLang && <MaterialManager currentLang={currentLang} cards={cards} onImportLevel={handleImportLevel} onBack={() => setView('home')} onShowAlert={showAlert} />}
    </div>
  );
}