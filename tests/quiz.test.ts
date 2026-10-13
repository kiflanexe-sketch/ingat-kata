import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Card } from '../src/types.ts';
import { buildQuiz } from '../src/lib/quiz.ts';
import { normalize } from '../src/lib/answer.ts';

const card = (id: string, front: string, back: string, over: Partial<Card> = {}): Card => ({
  id, front, back, box: 0, nextReview: 0, lastReviewed: null, status: 'active', source: 'preset-A1', lapses: 0, ...over,
});

// Acak yang bisa diulang supaya uji tidak bergantung keberuntungan.
const seeded = (seed = 1) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

const deck = [
  card('1', 'Dog', 'Anjing'), card('2', 'Cat', 'Kucing'), card('3', 'Bird', 'Burung'),
  card('4', 'Fish', 'Ikan'), card('5', 'Horse', 'Kuda'), card('6', 'Cow', 'Sapi'),
];

test('tiap soal punya 4 pilihan unik dengan satu jawaban benar', () => {
  const quiz = buildQuiz(deck, deck, 'forward', seeded());
  assert.equal(quiz.length, 6);
  for (const q of quiz) {
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options.map(normalize)).size, 4);
    assert.equal(q.options[q.answer], q.card.back);
  }
});

test('arah mundur menanyakan bahasa Indonesia dengan pilihan bahasa asing', () => {
  for (const q of buildQuiz(deck, deck, 'backward', seeded(7))) {
    assert.equal(q.direction, 'backward');
    assert.equal(q.options[q.answer], q.card.front);
  }
});

test('sinonim (pertanyaan sama, jawaban lain) tidak dijadikan pengecoh', () => {
  const pool = [...deck, card('7', 'Hound', 'Anjing'), card('8', 'Dog', 'Asu')];
  for (let s = 1; s < 30; s++) {
    const q = buildQuiz([deck[0]], pool, 'forward', seeded(s))[0];
    assert.ok(!q.options.includes('Asu'), 'jawaban lain untuk "Dog" juga benar');
    assert.equal(q.options.filter(o => normalize(o) === 'anjing').length, 1);
  }
});

test('pengecoh dari bahasa yang sama di latihan gabungan, dan huruf hanya dengan huruf', () => {
  const mixed = [
    ...deck.map(c => ({ ...c, originLang: 'Inggris' })),
    card('j1', 'Neko (猫)', 'Kucing', { originLang: 'Jepang' }), card('j2', 'Inu (犬)', 'Anjing', { originLang: 'Jepang' }),
    card('h1', 'あ', 'a', { originLang: 'Jepang', source: 'preset-Huruf (Hiragana)' }),
    card('h2', 'い', 'i', { originLang: 'Jepang', source: 'preset-Huruf (Hiragana)' }),
    card('h3', 'う', 'u', { originLang: 'Jepang', source: 'preset-Huruf (Hiragana)' }),
  ];
  const quiz = buildQuiz(mixed, mixed, 'backward', seeded(3));
  const neko = quiz.find(q => q.card.id === 'j1')!;
  assert.deepEqual(neko.options.slice().sort(), ['Inu (犬)', 'Neko (猫)']);
  const a = quiz.find(q => q.card.id === 'h1')!;
  assert.equal(a.direction, 'forward', 'huruf selalu ditanya huruf ke cara baca');
  assert.deepEqual(a.options.slice().sort(), ['a', 'i', 'u']);
});

test('kartu tanpa pengecoh dilewati dan jumlah soal dibatasi', () => {
  assert.equal(buildQuiz([deck[0]], [deck[0]], 'forward', seeded()).length, 0);
  const many = Array.from({ length: 40 }, (_, i) => card(`m${i}`, `W${i}`, `K${i}`));
  assert.equal(buildQuiz(many, many, 'forward', seeded()).length, 20);
});
