import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Card } from '../src/types.ts';
import {
  ACTIVE_FILL_TARGET, ONE_DAY, RELEARN_DELAY, SRS_INTERVALS, activateFromReserve, addWords, applyReview, needsRelearn, nextDueAt, smartAddCount,
} from '../src/lib/srs.ts';

const NOW = 1_700_000_000_000;
const card = (over: Partial<Card> = {}): Card => ({
  id: 'c1', front: 'Apple', back: 'Apel', box: 0, nextReview: NOW, lastReviewed: null, status: 'active', source: 'custom', lapses: 0, ...over,
});

test('review benar menaikkan kotak dan menjadwalkan sesuai interval', () => {
  const r = applyReview(card({ box: 2 }), true, NOW, 'review');
  assert.equal(r.box, 3);
  assert.equal(r.nextReview, NOW + SRS_INTERVALS[3]);
  assert.equal(r.lastReviewed, NOW);
});

test('kotak tidak melewati batas atas', () => {
  assert.equal(applyReview(card({ box: 5 }), true, NOW, 'review').box, 5);
});

test('review salah mengembalikan ke kotak 0 dan menambah lapses', () => {
  const r = applyReview(card({ box: 4, nextReview: NOW + 10 * ONE_DAY }), false, NOW, 'review');
  assert.equal(r.box, 0);
  assert.equal(r.nextReview, NOW + RELEARN_DELAY);
  assert.equal(r.lapses, 1);
  assert.equal(needsRelearn(r), true);
});

test('latihan: benar tidak mengubah jadwal, salah tetap menurunkan kotak', () => {
  const c = card({ box: 3, nextReview: NOW + 5 * ONE_DAY, lastReviewed: NOW - ONE_DAY });
  assert.deepEqual(applyReview(c, true, NOW, 'practice'), c);
  const wrong = applyReview(c, false, NOW, 'practice');
  assert.equal(wrong.box, 0);
  assert.equal(wrong.nextReview, NOW + RELEARN_DELAY);
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
