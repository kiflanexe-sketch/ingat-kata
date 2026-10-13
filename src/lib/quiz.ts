// Kuis kilat: pilihan ganda berwaktu dari kata yang sudah dipelajari. Pengecoh diambil dari
// deck bahasa yang sama, diutamakan dari paket yang sama supaya tidak terlalu mudah ditebak.
import type { Card, Direction } from '../types.ts';
import { normalize } from './answer.ts';
import type { DirectionSetting } from './srs.ts';
import { isScriptSource } from '../data/words.ts';

export type QuizQuestion = { card: Card; direction: Direction; options: string[]; answer: number };

export type QuizAnswer = { card: Card; direction: Direction; correct: boolean; ms: number; points: number; timedOut: boolean };

export const QUIZ_MAX = 20;
export const QUIZ_SECONDS = [5, 8, 12];
export const DEFAULT_QUIZ_SECONDS = 8;
const OPTIONS = 4;

const shuffle = <T>(arr: T[], rand: () => number): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const sameCard = (a: Card, b: Card) => a.id === b.id && a.originLang === b.originLang;

export function buildQuiz(cards: Card[], pool: Card[], setting: DirectionSetting, rand: () => number = Math.random, max = QUIZ_MAX): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  for (const card of shuffle(cards, rand)) {
    if (out.length >= max) break;
    const script = isScriptSource(card.source);
    // Huruf selalu ditanya huruf -> cara baca, seperti di sesi biasa.
    const direction: Direction = script ? 'forward' : setting === 'both' ? (rand() < 0.5 ? 'forward' : 'backward') : setting;
    const ask = (c: Card) => normalize(direction === 'forward' ? c.front : c.back);
    const reply = (c: Card) => (direction === 'forward' ? c.back : c.front);
    const question = ask(card);
    const peers = pool.filter(c => !sameCard(c, card) && c.originLang === card.originLang && isScriptSource(c.source) === script);
    // Jawaban kartu lain dengan pertanyaan yang sama juga benar, jadi tidak boleh jadi pengecoh.
    const taken = new Set([normalize(reply(card)), ...peers.filter(c => ask(c) === question).map(c => normalize(reply(c)))]);
    const ordered = [...shuffle(peers.filter(c => c.source === card.source), rand), ...shuffle(peers.filter(c => c.source !== card.source), rand)];
    const distractors: string[] = [];
    for (const c of ordered) {
      if (distractors.length >= OPTIONS - 1) break;
      const key = normalize(reply(c));
      if (taken.has(key) || ask(c) === question) continue;
      taken.add(key);
      distractors.push(reply(c));
    }
    if (distractors.length === 0) continue;
    const options = shuffle([reply(card), ...distractors], rand);
    out.push({ card, direction, options, answer: options.indexOf(reply(card)) });
  }
  return out;
}
