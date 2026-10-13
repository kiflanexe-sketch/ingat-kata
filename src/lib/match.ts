// Mencocokkan kata: apakah dua kartu menyimpan kata asing yang sama (dan arti yang sama).
// Dipakai untuk mencegah kata ganda saat menambah kata sendiri, impor paket, dan tambah sekaligus.
import { normalize } from './answer.ts';

const ARABIC_MARKS = /[ً-ْٰ]/g; // harakat U+064B-U+0652 dan U+0670: tidak membedakan kata
const LEADING = /^(der|die|das|to|the|a|an)\s+/; // artikel Jerman, "to" kata kerja Inggris, artikel Inggris
const NON_LATIN = /[^\t\n\r -ɏḀ-ỿ]/; // selain latin: spasi-U+024F dan U+1E00-U+1EFF (pinyin, umlaut)

const clean = (s: string) => normalize(s).replace(ARABIC_MARKS, '').trim();

type Parts = { native: string | null; roman: Set<string> };

// "Taberu (食べる)" -> aksara asli 食べる, latin "taberu". "食べる" saja -> aksara asli. "Der Hund" -> "der hund", "hund".
function parts(front: string): Parts {
  const roman = new Set<string>();
  const addRoman = (s: string) => {
    const k = clean(s);
    if (!k) return;
    roman.add(k);
    roman.add(k.replace(LEADING, ''));
  };
  const m = front.match(/^(.*?)\s*\((.+)\)\s*$/);
  if (m && NON_LATIN.test(m[2]) && !NON_LATIN.test(m[1])) {
    addRoman(m[1]);
    return { native: clean(m[2]), roman };
  }
  if (NON_LATIN.test(front)) return { native: clean(front), roman };
  addRoman(front);
  addRoman(front.replace(/\(.*?\)/g, '')); // "Light (weight)" juga cocok dengan "light"
  return { native: null, roman };
}

// Kata asing yang sama. Bila keduanya punya aksara asli, hanya aksara yang dibandingkan
// (pinyin tanpa nada, mis. mai = 买/卖, bisa sama untuk kata yang berbeda).
export function sameForeign(a: string, b: string): boolean {
  const pa = parts(a);
  const pb = parts(b);
  if (pa.native && pb.native) return pa.native === pb.native;
  for (const k of pa.roman) if (pb.roman.has(k)) return true;
  return false;
}

// Arti dipisah "/", keterangan dalam kurung diabaikan: "Kuliah (ceramah)" -> "kuliah".
export const meaningKeys = (back: string): string[] =>
  back.split('/').flatMap(m => [clean(m), clean(m.replace(/\(.*?\)/g, ''))]).filter(Boolean);

export const sameMeaning = (a: string, b: string) => {
  const kb = new Set(meaningKeys(b));
  return meaningKeys(a).some(k => kb.has(k));
};

export const sameWord = (a: { front: string; back: string }, b: { front: string; back: string }) =>
  sameForeign(a.front, b.front) && sameMeaning(a.back, b.back);

// Pilih satu kandidat dengan kata asing yang sama. Arti dipakai untuk memilih bila kandidat
// berbeda kata (aksara asli berbeda); bila tetap tidak jelas, tidak ada yang dipilih.
export function pickMatch<T extends { front: string; back: string }>(front: string, back: string, candidates: T[]): T | null {
  const hits = candidates.filter(c => sameForeign(front, c.front));
  if (hits.length === 0) return null;
  const distinct = new Set(hits.map(h => parts(h.front).native ?? [...parts(h.front).roman][0]));
  if (distinct.size === 1) return hits.find(h => sameMeaning(back, h.back)) ?? hits[0];
  const byMeaning = hits.filter(h => sameMeaning(back, h.back));
  const narrowed = new Set(byMeaning.map(h => parts(h.front).native ?? [...parts(h.front).roman][0]));
  return narrowed.size === 1 ? byMeaning[0] : null;
}

// Indeks untuk pengecekan cepat banyak kata sekaligus (impor paket, tambah sekaligus).
export function wordIndex(words: { front: string; back: string }[]) {
  type Entry = { p: Parts; m: Set<string> };
  const byNative = new Map<string, Entry[]>();
  const byRoman = new Map<string, Entry[]>();
  const push = (map: Map<string, Entry[]>, k: string, e: Entry) => { const list = map.get(k); if (list) list.push(e); else map.set(k, [e]); };
  const add = (w: { front: string; back: string }) => {
    const e: Entry = { p: parts(w.front), m: new Set(meaningKeys(w.back)) };
    if (e.p.native) push(byNative, e.p.native, e);
    for (const k of e.p.roman) push(byRoman, k, e);
  };
  const has = (w: { front: string; back: string }) => {
    const p = parts(w.front);
    const meanings = meaningKeys(w.back);
    const candidates = new Set<Entry>(byNative.get(p.native ?? '') ?? []);
    for (const k of p.roman) for (const e of byRoman.get(k) ?? []) if (!(p.native && e.p.native)) candidates.add(e);
    for (const e of candidates) if (meanings.some(k => e.m.has(k))) return true;
    return false;
  };
  words.forEach(add);
  return { has, add };
}
