export type CardStatus = 'active' | 'reserve';

export type Card = {
  id: string;
  front: string; // bahasa asing
  back: string; // bahasa Indonesia
  box: number; // kotak Leitner 0-5
  nextReview: number;
  lastReviewed: number | null;
  status: CardStatus; // 'reserve' = antrian, belum dipelajari
  source: string; // 'custom', 'legacy', atau 'preset-<level>'
  lapses: number; // berapa kali pernah salah
  originLang?: string; // hanya di mode Gabungan
};

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
  given: string;
};

export type LangStats = {
  lang: string;
  total: number;
  mastered: number;
  active: number;
  reserve: number;
  due: number;
};
