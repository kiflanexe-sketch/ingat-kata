import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Card } from '../src/types.ts';
import {
  ACTIVE_FILL_TARGET, ONE_DAY, ONE_MINUTE, activateFromReserve, addWords, applyReview, boxForInterval, needsRelearn, nextDueAt, smartAddCount,
} from '../src/lib/srs.ts';

const NOW = 1_700_000_000_000;
const card = (over: Partial<Card> = {}): Card => ({
  id: 'c1', front: 'Apple', back: 'Apel', box: 0, nextReview: NOW, lastReviewed: null, status: 'active', source: 'custom', lapses: 0, ...over,
});
const interval = (c: Card) => c.nextReview - (c.lastReviewed ?? 0);

// Ulang kartu tepat saat jatuh tempo dengan nilai yang sama beberapa kali.
function reviewChain(c: Card, grade: 'again' | 'hard' | 'good', times: number): Card[] {
  const out: Card[] = [];
  let cur = c;
  let t = Math.max(NOW, c.nextReview);
  for (let i = 0; i < times; i++) {
    cur = applyReview(cur, grade, t, 'review');
    out.push(cur);
    t = cur.nextReview;
  }
  return out;
}

test('kotak menggambarkan jarak ulang', () => {
  assert.equal(boxForInterval(ONE_MINUTE), 0);
  assert.equal(boxForInterval(ONE_DAY), 1);
  assert.equal(boxForInterval(3 * ONE_DAY), 2);
  assert.equal(boxForInterval(10 * ONE_DAY), 3);
  assert.equal(boxForInterval(30 * ONE_DAY), 4);
  assert.equal(boxForInterval(200 * ONE_DAY), 5);
});

test('kata baru yang dijawab benar dijadwalkan beberapa hari lagi dan menyimpan keadaan FSRS', () => {
  const r = applyReview(card(), 'good', NOW, 'review');
  assert.ok(interval(r) >= ONE_DAY, 'minimal sehari');
  assert.ok(r.box >= 1);
  assert.equal(r.lastReviewed, NOW);
  assert.ok(r.fsrs && r.fsrs.s > 0 && r.fsrs.d >= 1 && r.fsrs.d <= 10);
});

test('jawaban benar berturut-turut membuat jarak ulang terus memanjang, sampai lebih dari sebulan', () => {
  const chain = reviewChain(card(), 'good', 5);
  for (let i = 1; i < chain.length; i++) assert.ok(interval(chain[i]) > interval(chain[i - 1]), `ulangan ke-${i + 1} harus lebih jauh`);
  assert.ok(interval(chain.at(-1)!) > 30 * ONE_DAY);
  assert.equal(chain.at(-1)!.box, 5);
});

test('Hard menghasilkan jarak lebih pendek dari Good', () => {
  const learned = reviewChain(card(), 'good', 2).at(-1)!;
  const hard = applyReview(learned, 'hard', learned.nextReview, 'review');
  const good = applyReview(learned, 'good', learned.nextReview, 'review');
  assert.ok(interval(hard) < interval(good));
});

test('lupa tidak mengulang dari nol: setelah belajar ulang jaraknya lebih jauh dari kata baru', () => {
  const mature = reviewChain(card(), 'good', 4).at(-1)!;
  const lapsed = applyReview(mature, 'again', mature.nextReview, 'review');
  assert.equal(lapsed.box, 0);
  assert.ok(interval(lapsed) <= 2 * ONE_MINUTE, 'muncul lagi sebentar lagi');
  assert.equal(lapsed.lapses, 1);
  assert.equal(needsRelearn(lapsed), true);
  assert.ok(lapsed.fsrs!.d > mature.fsrs!.d, 'kata jadi dianggap lebih sulit');
  const relearned = applyReview(lapsed, 'good', lapsed.nextReview, 'review');
  const fresh = applyReview(card(), 'good', NOW, 'review');
  assert.ok(interval(relearned) > interval(fresh));
});

test('target ingatan lebih tinggi membuat jarak ulang lebih pendek', () => {
  const learned = reviewChain(card(), 'good', 2).at(-1)!;
  const t = learned.nextReview;
  const at85 = applyReview(learned, 'good', t, 'review', 0.85);
  const at95 = applyReview(learned, 'good', t, 'review', 0.95);
  assert.ok(interval(at95) < interval(at85));
});

test('progres Leitner lama diubah ke FSRS tanpa mulai dari nol', () => {
  const legacy = card({ box: 3, lastReviewed: NOW - 7 * ONE_DAY, nextReview: NOW });
  const r = applyReview(legacy, 'good', NOW, 'review');
  assert.ok(interval(r) > 7 * ONE_DAY, 'kata kotak 3 yang benar lagi melompat lebih jauh dari 7 hari');
});

test('latihan: benar tidak mengubah jadwal, salah tetap dicatat', () => {
  const c = reviewChain(card(), 'good', 3).at(-1)!;
  const early = c.lastReviewed! + ONE_DAY; // latihan sebelum jatuh tempo
  assert.deepEqual(applyReview(c, 'good', early, 'practice'), c);
  assert.deepEqual(applyReview(c, 'hard', early, 'practice'), c);
  const wrong = applyReview(c, 'again', early, 'practice');
  assert.equal(wrong.box, 0);
  assert.equal(wrong.lapses, c.lapses + 1);
});

test('jam perangkat mundur tidak membuat penilaian gagal', () => {
  const c = reviewChain(card(), 'good', 2).at(-1)!;
  const past = c.lastReviewed! - 10 * ONE_DAY;
  for (const g of ['again', 'hard', 'good'] as const) {
    const r = applyReview(c, g, past, 'review');
    assert.ok(r.nextReview > past && Number.isFinite(r.nextReview), g);
  }
});

test('data FSRS rusak tidak menghentikan sesi', () => {
  const broken = card({ lastReviewed: NOW - ONE_DAY, box: 2, fsrs: { s: Number.NaN, d: 5, state: 2, reps: 1, step: 0 } });
  const r = applyReview(broken, 'good', NOW, 'review');
  assert.ok(r.nextReview > NOW);
});

test('kartu baru belum dihitung "salah"', () => {
  assert.equal(needsRelearn(card()), false);
});

test('jatah kata baru: akurasi 0 tidak menambah kata', () => {
  assert.equal(smartAddCount(null), 5);
  assert.equal(smartAddCount(0.9), 5);
  assert.equal(smartAddCount(0.6), 2);
  assert.equal(smartAddCount(0), 0);
});

test('addWords mengisi slot aktif lalu antrian, dan melewati duplikat', () => {
  const existing = [card({ id: 'a' })];
  const words = Array.from({ length: 8 }, (_, i) => ({ front: `w${i}`, back: `b${i}` }));
  words.push({ front: 'apple', back: 'apel' }); // duplikat, beda kapital
  const r = addWords(existing, words, { source: 'preset-X', now: NOW, idPrefix: 'p' });
  assert.equal(r.skipped, 1);
  assert.equal(r.added.length, 8);
  assert.equal(r.added.filter(c => c.status === 'active').length, ACTIVE_FILL_TARGET - 1);
  assert.equal(new Set(r.cards.map(c => c.id)).size, r.cards.length);
});

test('activateFromReserve mengambil sesuai jumlah dan urutan', () => {
  const cards = [card({ id: 'a' }), card({ id: 'r1', status: 'reserve' }), card({ id: 'r2', status: 'reserve' })];
  const r = activateFromReserve(cards, 1, NOW);
  assert.equal(r.added, 1);
  assert.equal(r.cards.find(c => c.id === 'r1')?.status, 'active');
  assert.equal(r.cards.find(c => c.id === 'r2')?.status, 'reserve');
});

test('nextDueAt mengabaikan kartu antrian dan yang sudah jatuh tempo', () => {
  const cards = [
    card({ id: 'due', nextReview: NOW - 1 }),
    card({ id: 'later', nextReview: NOW + 5000 }),
    card({ id: 'soon-reserve', status: 'reserve', nextReview: NOW + 10 }),
  ];
  assert.equal(nextDueAt(cards, NOW), NOW + 5000);
  assert.equal(nextDueAt([], NOW), null);
});
