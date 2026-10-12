import { Rating, State, createEmptyCard, fsrs, generatorParameters, type Card as FsrsCard, type FSRS } from 'ts-fsrs';
import type { Card, Grade, SessionMode, StudyItem } from '../types.ts';

export const ONE_MINUTE = 60 * 1000;
export const ONE_DAY = 24 * 60 * 60 * 1000;
export const MAX_BOX = 5;
// Kotak 4 ke atas = jarak ulang 21 hari atau lebih (setara kartu "mature" di Anki).
export const MASTERED_BOX = 4;
// Saat paket diimpor, kata langsung aktif sampai jumlah kata aktif mencapai angka ini.
export const ACTIVE_FILL_TARGET = 5;

// --- Penjadwalan FSRS ---
// Jadwal tiap kata dihitung FSRS (Free Spaced Repetition Scheduler) dari riwayat jawabannya:
// kata dijadwalkan ulang tepat saat peluang ingatnya turun ke target (bawaan 90%).

export const DEFAULT_RETENTION = 0.9;
export const RETENTION_CHOICES = [0.85, 0.9, 0.95];
const MAX_INTERVAL_DAYS = 365;

const schedulers = new Map<number, FSRS>();
function scheduler(retention: number): FSRS {
  let f = schedulers.get(retention);
  if (!f) {
    f = fsrs(generatorParameters({
      request_retention: retention,
      maximum_interval: MAX_INTERVAL_DAYS,
      enable_fuzz: true, // geser jadwal sedikit supaya kartu tidak menumpuk di hari yang sama
      enable_short_term: true,
      learning_steps: ['1m'], // salah atau kartu baru yang sulit: muncul lagi semenit kemudian
      relearning_steps: ['1m'],
    }));
    schedulers.set(retention, f);
  }
  return f;
}

// Kotak = rentang jarak ulang saat ini, untuk tampilan: <1, 1-3, 3-7, 7-21, 21-60, 60+ hari.
const BOX_THRESHOLD_DAYS = [1, 3, 7, 21, 60];
export const boxForInterval = (ms: number) => BOX_THRESHOLD_DAYS.filter(d => ms >= d * ONE_DAY - ONE_MINUTE).length;

// Jarak ulang kotak Leitner lama, untuk mengubah progres lama menjadi keadaan FSRS.
const LEGACY_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];

export function toFsrsCard(card: Card, now: number): FsrsCard {
  const due = new Date(card.nextReview);
  // Jam perangkat bisa mundur (diubah manual, atau cadangan dari perangkat lain yang jamnya
  // lebih maju). FSRS menolak ulangan sebelum ulangan terakhir, jadi waktunya dijepit.
  const last = card.lastReviewed !== null ? new Date(Math.min(card.lastReviewed, now)) : undefined;
  const elapsed = last ? Math.max(0, Math.floor((now - +last) / ONE_DAY)) : 0;
  const scheduled = last ? Math.max(0, Math.round((card.nextReview - +last) / ONE_DAY)) : 0;
  const f = card.fsrs;
  const valid = f && Number.isFinite(f.s) && f.s > 0 && Number.isFinite(f.d) && f.d >= 1 && f.d <= 10;
  if (valid) {
    return {
      due, last_review: last, stability: f.s, difficulty: f.d, state: f.state as State,
      reps: f.reps, lapses: card.lapses, learning_steps: f.step, elapsed_days: elapsed, scheduled_days: scheduled,
    };
  }
  if (!last) return { ...createEmptyCard(due), lapses: card.lapses };
  // Kartu dari versi Leitner: stabilitas ditebak dari jarak kotaknya, kesulitan dari jumlah salah.
  const box = Math.min(MAX_BOX, Math.max(0, card.box));
  return {
    due, last_review: last,
    stability: Math.max(0.5, LEGACY_INTERVAL_DAYS[box]),
    difficulty: Math.min(10, 5 + card.lapses * 0.5),
    state: box === 0 ? State.Relearning : State.Review,
    reps: Math.max(1, box), lapses: card.lapses, learning_steps: 0, elapsed_days: elapsed, scheduled_days: scheduled,
  };
}

const RATING: Record<Grade, Rating.Again | Rating.Hard | Rating.Good> = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good };

// Mode 'practice' (latihan) tidak mengubah jadwal bila benar; jawaban salah tetap dicatat.
export function applyReview(card: Card, grade: Grade, now: number, mode: SessionMode, retention = DEFAULT_RETENTION): Card {
  if (mode === 'practice' && grade !== 'again') return card;
  let next: FsrsCard;
  try {
    next = scheduler(retention).next(toFsrsCard(card, now), new Date(now), RATING[grade]).card;
    if (!Number.isFinite(+next.due) || !(next.stability > 0)) throw new Error('hasil FSRS tidak valid');
  } catch {
    // Data kartu tidak terbaca FSRS: jangan hentikan sesi. Salah tetap diulang sebentar lagi,
    // benar dijadwalkan besok, dan keadaan FSRS dimulai ulang pada ulangan berikutnya.
    const nextReview = now + (grade === 'again' ? ONE_MINUTE : ONE_DAY);
    return { ...card, box: boxForInterval(nextReview - now), nextReview, lastReviewed: now, lapses: card.lapses + (grade === 'again' ? 1 : 0), fsrs: undefined };
  }
  const nextReview = +next.due;
  return {
    ...card,
    box: boxForInterval(nextReview - now),
    nextReview,
    lastReviewed: now,
    lapses: card.lapses + (grade === 'again' ? 1 : 0),
    fsrs: { s: next.stability, d: next.difficulty, state: next.state as 0 | 1 | 2 | 3, reps: next.reps, step: next.learning_steps },
  };
}

export const isDue = (card: Card, now: number) => card.status === 'active' && card.nextReview <= now;
export const isMastered = (card: Card) => card.status === 'active' && card.box >= MASTERED_BOX;
// Pernah diulang dan jawaban terakhirnya salah (salah selalu menjadwalkan ulang di kotak 0).
export const needsRelearn = (card: Card) => card.status === 'active' && card.lastReviewed !== null && card.box === 0;

// Jumlah kata baru yang boleh dibuka dari antrian, berdasarkan akurasi sesi terakhir.
export function smartAddCount(lastAccuracy: number | null): number {
  if (lastAccuracy === null || lastAccuracy >= 0.8) return 5;
  if (lastAccuracy >= 0.5) return 2;
  return 0;
}

export function activateFromReserve(cards: Card[], count: number, now: number): { cards: Card[]; added: number } {
  const ids = new Set(cards.filter(c => c.status === 'reserve').slice(0, count).map(c => c.id));
  return {
    cards: cards.map(c => (ids.has(c.id) ? { ...c, status: 'active', nextReview: now } : c)),
    added: ids.size,
  };
}

export function nextDueAt(cards: Card[], now: number): number | null {
  let next: number | null = null;
  for (const c of cards) {
    if (c.status !== 'active' || c.nextReview <= now) continue;
    if (next === null || c.nextReview < next) next = c.nextReview;
  }
  return next;
}

export const pairKey = (front: string, back: string) => `${front.trim().toLowerCase()}\u0000${back.trim().toLowerCase()}`;

export function hasPair(cards: Card[], front: string, back: string): boolean {
  const key = pairKey(front, back);
  return cards.some(c => pairKey(c.front, c.back) === key);
}

// Tambah kata ke deck: pasangan yang sudah ada dilewati, sebagian langsung aktif
// sampai ACTIVE_FILL_TARGET, sisanya masuk antrian sesuai urutan.
export function addWords(
  cards: Card[],
  words: { front: string; back: string }[],
  opts: { source: string; now: number; idPrefix: string; allActive?: boolean },
): { cards: Card[]; added: Card[]; skipped: number } {
  const seen = new Set(cards.map(c => pairKey(c.front, c.back)));
  let slots = Math.max(0, ACTIVE_FILL_TARGET - cards.filter(c => c.status === 'active').length);
  const added: Card[] = [];
  let skipped = 0;
  words.forEach((w, i) => {
    const key = pairKey(w.front, w.back);
    if (seen.has(key)) { skipped++; return; }
    seen.add(key);
    const active = opts.allActive || slots > 0;
    if (active && !opts.allActive) slots--;
    added.push({
      id: `${opts.idPrefix}-${opts.now}-${i}`,
      front: w.front.trim(),
      back: w.back.trim(),
      box: 0,
      nextReview: opts.now,
      lastReviewed: null,
      status: active ? 'active' : 'reserve',
      source: opts.source,
      lapses: 0,
    });
  });
  return { cards: [...cards, ...added], added, skipped };
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export type DirectionSetting = 'both' | 'forward' | 'backward';

export const buildQueue = (cards: Card[], setting: DirectionSetting = 'both'): StudyItem[] =>
  cards.map(card => ({ card, direction: setting === 'both' ? (Math.random() > 0.5 ? 'forward' : 'backward') : setting }));

// Gabungkan deck dari dua perangkat: untuk id yang sama, menang yang terakhir diulang;
// pasangan kata yang sama dengan id berbeda juga disatukan dengan aturan yang sama.
export function mergeCards(local: Card[], incoming: Card[]): Card[] {
  const newer = (a: Card, b: Card) => {
    const sa = a.lastReviewed ?? -Infinity;
    const sb = b.lastReviewed ?? -Infinity;
    if (sa !== sb) return sa > sb;
    return a.status === 'active' && b.status === 'reserve';
  };
  const byId = new Map(local.map(c => [c.id, c]));
  for (const c of incoming) {
    const existing = byId.get(c.id);
    if (!existing || newer(c, existing)) byId.set(c.id, c);
  }
  const byPair = new Map<string, Card>();
  for (const c of byId.values()) {
    const key = pairKey(c.front, c.back);
    const existing = byPair.get(key);
    if (!existing || newer(c, existing)) byPair.set(key, c);
  }
  return Array.from(byPair.values());
}

// Jumlah kartu per kotak 0..MAX_BOX.
export function boxCounts(boxes: number[]): number[] {
  const counts = Array<number>(MAX_BOX + 1).fill(0);
  boxes.forEach(b => { counts[Math.min(MAX_BOX, Math.max(0, b))]++; });
  return counts;
}
