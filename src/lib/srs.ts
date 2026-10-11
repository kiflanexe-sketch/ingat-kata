import type { Card, SessionMode, StudyItem } from '../types.ts';

export const ONE_MINUTE = 60 * 1000;
export const ONE_DAY = 24 * 60 * 60 * 1000;
// Jeda ulang per kotak Leitner. Kotak 0 = baru atau baru saja salah.
export const SRS_INTERVALS = [0, ONE_DAY, 3 * ONE_DAY, 7 * ONE_DAY, 14 * ONE_DAY, 30 * ONE_DAY];
export const MAX_BOX = SRS_INTERVALS.length - 1;
export const MASTERED_BOX = 4;
export const RELEARN_DELAY = ONE_MINUTE;
// Saat paket diimpor, kata langsung aktif sampai jumlah kata aktif mencapai angka ini.
export const ACTIVE_FILL_TARGET = 5;

export const isDue = (card: Card, now: number) => card.status === 'active' && card.nextReview <= now;
export const isMastered = (card: Card) => card.status === 'active' && card.box >= MASTERED_BOX;
// Pernah diulang dan jawaban terakhirnya salah (jawaban benar selalu menaikkan ke kotak >= 1).
export const needsRelearn = (card: Card) => card.status === 'active' && card.lastReviewed !== null && card.box === 0;

export function applyReview(card: Card, correct: boolean, now: number, mode: SessionMode): Card {
  if (!correct) {
    const relearnAt = now + RELEARN_DELAY;
    return {
      ...card,
      box: 0,
      nextReview: mode === 'review' ? relearnAt : Math.min(card.nextReview, relearnAt),
      lastReviewed: now,
      lapses: card.lapses + 1,
    };
  }
  if (mode === 'practice') return card;
  const box = Math.min(card.box + 1, MAX_BOX);
  return { ...card, box, nextReview: now + SRS_INTERVALS[box], lastReviewed: now };
}

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
