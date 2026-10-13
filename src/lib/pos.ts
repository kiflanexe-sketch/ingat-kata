// Jenis kata (part of speech). Kata dari paket membawa jenis kata di data paketnya; kata
// buatan sendiri bisa diberi jenis kata saat ditambah atau diedit.
import type { Card } from '../types.ts';
import { WORD_DATABASE } from '../data/words.ts';
import { normalize } from './answer.ts';
import { pickMatch } from './match.ts';

export type PosCode = 'n' | 'v' | 'adj' | 'adv' | 'conj' | 'pron' | 'prep' | 'num' | 'part' | 'expr';

export const POS_LABEL: Record<PosCode, string> = {
  n: 'kata benda',
  v: 'kata kerja',
  adj: 'kata sifat',
  adv: 'kata keterangan',
  conj: 'kata sambung',
  pron: 'kata ganti',
  prep: 'kata depan',
  num: 'kata bilangan',
  part: 'partikel',
  expr: 'ungkapan',
};

export const POS_CODES = Object.keys(POS_LABEL) as PosCode[];
export const isPos = (v: unknown): v is PosCode => typeof v === 'string' && v in POS_LABEL;

const levelOf = (source: string) => (source.startsWith('preset-') ? source.slice('preset-'.length) : null);

// Indeks paket per bahasa: level + kata asing, dan level + arti sebagai cadangan bila ejaan
// kata asing di paket diperbaiki setelah kartu diimpor.
let index: Map<string, PosCode> | null = null;
function presetIndex() {
  if (index) return index;
  index = new Map();
  const byBack = new Map<string, PosCode | null>();
  for (const [lang, packs] of Object.entries(WORD_DATABASE)) {
    for (const [level, words] of Object.entries(packs)) {
      for (const w of words) {
        if (!w.p) continue;
        index.set(`${lang}\u0000${level}\u0000f\u0000${normalize(w.f)}`, w.p);
        const bk = `${lang}\u0000${level}\u0000b\u0000${normalize(w.b)}`;
        byBack.set(bk, byBack.has(bk) && byBack.get(bk) !== w.p ? null : w.p); // arti ganda dengan jenis beda: tidak dipakai
      }
    }
  }
  for (const [k, p] of byBack) if (p) index.set(k, p);
  return index;
}

// Jenis kata sebuah kartu: milik kartu sendiri (kata sendiri), atau dari paket asalnya.
export function posOf(card: Card, lang: string): PosCode | null {
  if (card.pos) return card.pos;
  const level = levelOf(card.source);
  if (!level) return null;
  const deckLang = card.originLang ?? lang;
  const idx = presetIndex();
  return idx.get(`${deckLang}\u0000${level}\u0000f\u0000${normalize(card.front)}`)
    ?? idx.get(`${deckLang}\u0000${level}\u0000b\u0000${normalize(card.back)}`)
    ?? null;
}

export type PresetMatch = { level: string; front: string; back: string; pos?: PosCode };

// Cari kata di semua paket bahasa ini (sudah diimpor atau belum). Paket huruf ikut dicari.
export function findPreset(lang: string, front: string, back: string): PresetMatch | null {
  const candidates: PresetMatch[] = [];
  for (const [level, words] of Object.entries(WORD_DATABASE[lang] ?? {})) {
    for (const w of words) candidates.push({ level, front: w.f, back: w.b, pos: w.p });
  }
  return pickMatch(front, back, candidates);
}
