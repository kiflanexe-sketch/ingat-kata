export type CardStatus = 'active' | 'reserve';

export type Card = {
  id: string;
  front: string; // bahasa asing
  back: string; // bahasa Indonesia
  box: number; // kotak 0-5: rentang jarak ulang saat ini (lihat boxForInterval di lib/srs.ts)
  nextReview: number;
  lastReviewed: number | null;
  status: CardStatus; // 'reserve' = antrian, belum dipelajari
  source: string; // 'custom', 'legacy', atau 'preset-<level>'
  lapses: number; // berapa kali pernah salah
  fsrs?: FsrsState; // keadaan ingatan FSRS; kosong untuk kartu baru atau data versi Leitner
  originLang?: string; // hanya di mode Gabungan
};

// Model ingatan FSRS per kartu, disimpan ringkas.
export type FsrsState = {
  s: number; // stabilitas: jarak (hari) saat peluang ingat turun ke 90%
  d: number; // kesulitan 1-10
  state: 0 | 1 | 2 | 3; // 0 baru, 1 belajar, 2 review, 3 belajar ulang
  reps: number;
  step: number; // langkah belajar (ulang) saat ini
};

// Nilai jawaban untuk FSRS, diturunkan otomatis dari jawaban yang diketik.
export type Grade = 'again' | 'hard' | 'good';

export type Direction = 'forward' | 'backward';

export type StudyItem = {
  card: Card;
  direction: Direction;
  retry?: boolean; // pengulangan kartu yang salah di akhir sesi, tidak dinilai
};

// 'review' mengikuti jadwal SRS; 'practice' (ulangi semua/salah, polyglot)
// tidak menaikkan kotak supaya jarak ulangan tetap jujur.
export type SessionMode = 'review' | 'practice';

export type AnswerRecord = {
  card: Card;
  direction: Direction;
  correct: boolean;
  grade: Grade;
  given: string;
};

export type LangStats = {
  lang: string;
  total: number;
  mastered: number;
  active: number;
  reserve: number;
  due: number;
  nextDue: number | null;
  boxes: number[]; // kotak tiap kartu aktif
};
