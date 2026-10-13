import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { Card } from '../src/types.ts';
import { boxCounts, buildQueue, mergeCards } from '../src/lib/srs.ts';

// localStorage tiruan di memori supaya storage.ts bisa diuji di Node.
class MemoryStorage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  key(i: number) { return Array.from(this.data.keys())[i] ?? null; }
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, String(v)); }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
}
(globalThis as unknown as { localStorage: MemoryStorage }).localStorage = new MemoryStorage();

const storage = await import('../src/lib/storage.ts');

const card = (over: Partial<Card>): Card => ({
  id: 'x', front: 'Apple', back: 'Apel', box: 0, nextReview: 0, lastReviewed: null, status: 'active', source: 'custom', lapses: 0, ...over,
});

beforeEach(() => localStorage.clear());

test('mergeCards: progres yang terakhir diulang menang, kartu baru ditambahkan', () => {
  const local = [card({ id: 'a', box: 1, lastReviewed: 100 }), card({ id: 'b', front: 'Book', back: 'Buku' })];
  const incoming = [card({ id: 'a', box: 4, lastReviewed: 200 }), card({ id: 'c', front: 'Cat', back: 'Kucing' })];
  const merged = mergeCards(local, incoming);
  assert.deepEqual(merged.map(c => c.id), ['a', 'b', 'c']);
  assert.equal(merged[0].box, 4);
});

test('mergeCards: pasangan kata sama dengan id berbeda tidak jadi ganda', () => {
  const merged = mergeCards([card({ id: 'a', lastReviewed: 500, box: 3 })], [card({ id: 'z', front: 'apple', back: 'apel', lastReviewed: 100 })]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].box, 3);
});

test('buildQueue mengikuti pengaturan arah', () => {
  const cards = [card({ id: 'a' }), card({ id: 'b' })];
  assert.ok(buildQueue(cards, 'forward').every(i => i.direction === 'forward'));
  assert.ok(buildQueue(cards, 'backward').every(i => i.direction === 'backward'));
});

test('boxCounts menghitung kartu per kotak', () => {
  assert.deepEqual(boxCounts([0, 0, 2, 5, 9]), [2, 0, 1, 0, 0, 2]);
});

test('pengaturan: nilai rusak kembali ke bawaan', () => {
  localStorage.setItem('ingatkata-settings', JSON.stringify({ direction: 'aneh', autoSpeak: 'ya', lastBackupAt: 'kemarin' }));
  assert.deepEqual(storage.loadSettings(), storage.DEFAULT_SETTINGS);
});

test('keadaan FSRS kartu ikut tersimpan dan terpulihkan; nilai rusak dibuang', () => {
  const fsrs = { s: 12.5, d: 4.2, state: 2 as const, reps: 3, step: 0 };
  storage.saveDeck('Inggris 🇬🇧', [card({ id: 'a', box: 3, lastReviewed: 10, fsrs }), card({ id: 'b', front: 'Book', back: 'Buku', fsrs: { ...fsrs, d: 99 } })]);
  const parsed = storage.parseBackup(storage.exportBackup());
  const cards = parsed!.decks['Inggris 🇬🇧'];
  assert.deepEqual(cards.find(c => c.id === 'a')?.fsrs, fsrs);
  assert.equal(cards.find(c => c.id === 'b')?.fsrs, undefined);
});

test('cadangan lalu pulihkan "ganti semua" menyamakan isi perangkat', () => {
  storage.saveDeck('Inggris 🇬🇧', [card({ id: 'a', box: 2, lastReviewed: 10 })]);
  storage.saveMeta('Inggris 🇬🇧', { lastAccuracy: 0.9 });
  storage.saveSettings({ direction: 'backward', autoSpeak: false, retention: 0.95, lastBackupAt: 5 });
  const file = storage.exportBackup();

  localStorage.clear();
  storage.saveDeck('Jerman 🇩🇪', [card({ id: 'g', front: 'Hund', back: 'Anjing' })]);
  const parsed = storage.parseBackup(file);
  assert.ok(parsed);
  assert.equal(storage.restoreBackup(parsed, 'replace'), true);

  assert.deepEqual(storage.listDeckLangs(), ['Inggris 🇬🇧']);
  assert.equal(storage.loadDeck('Inggris 🇬🇧')[0].box, 2);
  assert.equal(storage.loadMeta('Inggris 🇬🇧').lastAccuracy, 0.9);
  const s = storage.loadSettings();
  assert.equal(s.direction, 'backward');
  assert.equal(s.autoSpeak, false);
  assert.equal(s.retention, 0.95);
});

test('pulihkan "gabungkan" mempertahankan deck lokal dan menyatukan kartu', () => {
  storage.saveDeck('Inggris 🇬🇧', [card({ id: 'a', box: 5, lastReviewed: 900 }), card({ id: 'd', front: 'Dog', back: 'Anjing' })]);
  const file = storage.exportBackup();
  localStorage.clear();
  storage.saveDeck('Inggris 🇬🇧', [card({ id: 'a', box: 1, lastReviewed: 100 }), card({ id: 'e', front: 'Egg', back: 'Telur' })]);
  storage.saveDeck('Jerman 🇩🇪', [card({ id: 'g', front: 'Hund', back: 'Anjing' })]);

  storage.restoreBackup(storage.parseBackup(file)!, 'merge');
  assert.deepEqual(storage.listDeckLangs(), ['Inggris 🇬🇧', 'Jerman 🇩🇪']);
  const en = storage.loadDeck('Inggris 🇬🇧');
  assert.deepEqual(en.map(c => c.id).sort(), ['a', 'd', 'e']);
  assert.equal(en.find(c => c.id === 'a')?.box, 5);
});

test('riwayat belajar ikut dicadangkan; gabungkan tidak menggandakan hitungan', () => {
  localStorage.setItem('ingatkata-log', JSON.stringify({ '2026-10-12': { r: 10, c: 9, ms: 1000 } }));
  storage.saveDeck('Inggris 🇬🇧', [card({ id: 'a' })]);
  const parsed = storage.parseBackup(storage.exportBackup())!;
  assert.equal(parsed.log['2026-10-12'].r, 10);
  storage.restoreBackup(parsed, 'merge');
  assert.equal(storage.loadLog()['2026-10-12'].r, 10);
  localStorage.setItem('ingatkata-log', JSON.stringify({ '2026-10-13': { r: 1, c: 1, ms: 0 } }));
  storage.restoreBackup(parsed, 'replace');
  assert.deepEqual(Object.keys(storage.loadLog()), ['2026-10-12']);
});

test('cadangan versi 1 (tanpa pengaturan) tetap bisa dipulihkan', () => {
  const v1 = JSON.stringify({ app: 'ingatkata', version: 1, decks: { 'Arab 🇸🇦': [{ id: 'q', front: 'Kitaab', back: 'Buku' }] }, meta: {} });
  const parsed = storage.parseBackup(v1);
  assert.equal(parsed?.settings, null);
  storage.restoreBackup(parsed!, 'merge');
  assert.equal(storage.loadDeck('Arab 🇸🇦').length, 1);
  assert.deepEqual(storage.loadSettings(), storage.DEFAULT_SETTINGS);
});
