// Kata yang ditambah sendiri dicek dulu terhadap paket bahasa ini, baik yang sudah diimpor ke
// deck (aktif atau antrian) maupun yang belum. Kata yang sudah ada di paket tidak dipakai versi
// ketikan pengguna:
// - sudah ada di deck dari paket -> dilewati;
// - ada di paket yang belum diimpor -> kata versi paket yang ditambahkan (dengan jenis kata dan
//   aksara aslinya), jadi tidak berganda bila paketnya diimpor nanti;
// - tidak ada di paket -> kata ketikan pengguna ditambahkan.
import type { Card } from '../types.ts';
import { findPreset, type PosCode } from './pos.ts';
import { pickMatch, wordIndex } from './match.ts';

export type ManualWord = { front: string; back: string; pos?: PosCode };

export type ManualPlan = {
  custom: ManualWord[];
  preset: { level: string; front: string; back: string; typed: string }[];
  inDeck: { typed: string; card: Card }[];
  duplicate: string[]; // kata sendiri yang sudah ada di deck
};

export function planManualWords(lang: string, deck: Card[], words: ManualWord[]): ManualPlan {
  const plan: ManualPlan = { custom: [], preset: [], inDeck: [], duplicate: [] };
  const fromPacks = deck.filter(c => c.source.startsWith('preset-'));
  const index = wordIndex(deck);
  for (const w of words) {
    const front = w.front.trim();
    const back = w.back.trim();
    const deckHit = pickMatch(front, back, fromPacks);
    if (deckHit) { plan.inDeck.push({ typed: front, card: deckHit }); continue; }
    const preset = findPreset(lang, front, back);
    if (preset) {
      const item = { front: preset.front, back: preset.back };
      if (index.has(item) || plan.preset.some(p => p.front === preset.front && p.back === preset.back)) { plan.duplicate.push(front); continue; }
      plan.preset.push({ level: preset.level, front: preset.front, back: preset.back, typed: front });
      index.add(item);
      continue;
    }
    if (index.has({ front, back })) { plan.duplicate.push(front); continue; }
    index.add({ front, back });
    plan.custom.push({ front, back, ...(w.pos ? { pos: w.pos } : {}) });
  }
  return plan;
}
