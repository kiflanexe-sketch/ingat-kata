import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Card } from '../src/types.ts';
import { planManualWords } from '../src/lib/manual.ts';
import { pickMatch, sameForeign, sameWord } from '../src/lib/match.ts';
import { findPreset, posOf } from '../src/lib/pos.ts';
import { addWords } from '../src/lib/srs.ts';

const EN = 'Inggris 🇬🇧';
const JP = 'Jepang 🇯🇵';
const ZH = 'Mandarin 🇨🇳';
const card = (front: string, back: string, source = 'custom', over: Partial<Card> = {}): Card => ({
  id: front, front, back, box: 0, nextReview: 0, lastReviewed: null, status: 'active', source, lapses: 0, ...over,
});

test('kata asing yang sama: huruf besar, "to", artikel, aksara asli', () => {
  assert.ok(sameForeign('dog', 'Dog'));
  assert.ok(sameForeign('eat', 'To eat'));
  assert.ok(sameForeign('Hund', 'Der Hund'));
  assert.ok(sameForeign('食べる', 'Taberu (食べる)'));
  assert.ok(sameForeign('taberu', 'Taberu (食べる)'));
  assert.ok(sameForeign('xuexi', 'Xuéxí (学习)'));
  assert.ok(sameForeign('Matar (مطار)', 'Mataar (مطار)'), 'ejaan latin diperbaiki, aksara sama');
  assert.ok(!sameForeign('Mǎi (买)', 'Mài (卖)'), 'pinyin tanpa nada sama, hanzi beda');
});

test('arti dibandingkan per pilihan, keterangan dalam kurung diabaikan', () => {
  assert.ok(sameWord({ front: 'Haaku (把握)', back: 'Memahami' }, { front: 'Haaku (把握)', back: 'Pemahaman/Memahami' }));
  assert.ok(sameWord({ front: 'Die Vorlesung', back: 'Kuliah' }, { front: 'Die Vorlesung', back: 'Kuliah (ceramah)' }));
  assert.ok(!sameWord({ front: 'Salam (سلام)', back: 'Halo' }, { front: 'Salam (سلام)', back: 'Perdamaian' }));
});

test('kandidat ambigu: arti yang menentukan, kalau tetap ambigu tidak dipilih', () => {
  const c = [{ front: 'Mǎi (买)', back: 'Membeli' }, { front: 'Mài (卖)', back: 'Menjual' }];
  assert.equal(pickMatch('mai', 'membeli', c)?.front, 'Mǎi (买)');
  assert.equal(pickMatch('mai', 'berdagang', c), null);
});

test('mencari kata di semua paket bahasa itu', () => {
  const dog = findPreset(EN, 'dog', 'anjing');
  assert.deepEqual([dog?.level, dog?.front, dog?.pos], ['Pemula (A1)', 'Dog', 'n']);
  assert.equal(findPreset(EN, 'To eat', 'Makan')?.pos, 'v');
  assert.equal(findPreset(EN, 'Zyzzyva', 'Kumbang'), null);
  assert.equal(findPreset(JP, '食べる', 'makan')?.front, 'Taberu (食べる)');
});

test('kata sudah di deck dari paket: dilewati, aktif maupun antrian', () => {
  const deck = [card('Dog', 'Anjing', 'preset-Pemula (A1)'), card('Cat', 'Kucing', 'preset-Pemula (A1)', { status: 'reserve' })];
  const plan = planManualWords(EN, deck, [{ front: 'dog', back: 'anjing' }, { front: 'cat', back: 'kucing peliharaan' }]);
  assert.deepEqual(plan.inDeck.map(x => [x.typed, x.card.status]), [['dog', 'active'], ['cat', 'reserve']]);
  assert.equal(plan.custom.length + plan.preset.length, 0);
});

test('kata ada di paket yang belum diimpor: versi paket yang dipakai', () => {
  const plan = planManualWords(EN, [], [{ front: 'environment', back: 'lingkungan hidup' }]);
  assert.deepEqual(plan.preset, [{ level: 'Menengah (B1)', front: 'Environment', back: 'Lingkungan', typed: 'environment' }]);
  assert.equal(plan.custom.length, 0);
});

test('kata tidak ada di paket: kata ketikan dipakai, dengan jenis kata pilihan pengguna', () => {
  const plan = planManualWords(EN, [], [{ front: 'Zyzzyva', back: 'Kumbang', pos: 'n' }]);
  assert.deepEqual(plan.custom, [{ front: 'Zyzzyva', back: 'Kumbang', pos: 'n' }]);
});

test('kata sendiri yang sama dan ganda dalam satu kiriman dilewati', () => {
  const plan = planManualWords(EN, [card('Zyzzyva', 'Kumbang')], [
    { front: 'zyzzyva', back: 'kumbang' }, { front: 'Gloop', back: 'Lendir' }, { front: 'gloop', back: 'lendir' },
    { front: 'environment', back: 'lingkungan' }, { front: 'Environment', back: 'Lingkungan' },
  ]);
  assert.deepEqual(plan.duplicate, ['zyzzyva', 'gloop', 'Environment']);
  assert.equal(plan.custom.length, 1);
  assert.equal(plan.preset.length, 1);
});

test('impor paket melewati kata yang sudah ditambah dari paket itu, dan ejaan lama', () => {
  const r = addWords([card('Matar (مطار)', 'Bandara', 'preset-Menengah')], [{ front: 'Mataar (مطار)', back: 'Bandara' }, { front: 'Safar (سفر)', back: 'Perjalanan' }], { source: 'preset-Menengah', now: 1, idPrefix: 'x' });
  assert.equal(r.skipped, 1);
  assert.equal(r.added.length, 1);
});

test('jenis kata kartu: dari kartu sendiri, atau dari paket asal', () => {
  assert.equal(posOf(card('Dog', 'Anjing', 'preset-Pemula (A1)'), EN), 'n');
  assert.equal(posOf(card('To eat', 'Makan', 'preset-Pemula (A1)'), EN), 'v');
  assert.equal(posOf(card('Zyzzyva', 'Kumbang', 'custom', { pos: 'n' }), EN), 'n');
  assert.equal(posOf(card('Zyzzyva', 'Kumbang'), EN), null);
  // Kartu lama dengan ejaan sebelum diperbaiki tetap menemukan jenis katanya lewat arti.
  assert.equal(posOf(card('Hattensuru (発展する)', 'Berkembang', 'preset-Menengah (N3)'), JP), 'v');
  assert.equal(posOf(card('Nǐ hǎo (你好)', 'Halo', 'preset-Pemula (HSK 1)', { originLang: ZH }), 'Gabungan'), 'expr');
});
