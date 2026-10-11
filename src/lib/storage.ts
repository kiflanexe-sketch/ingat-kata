import type { Card, LangStats } from '../types.ts';
import { MAX_BOX, isDue, isMastered } from './srs.ts';

const DECK_PREFIX = 'ingatkata-deck-';
const META_PREFIX = 'ingatkata-meta-';

export type DeckMeta = { lastAccuracy: number | null };

const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

// Normalisasi kartu dari versi lama atau file cadangan. Mengembalikan null bila tidak layak.
export function migrateCard(raw: unknown, index: number): Card | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  if (typeof c.front !== 'string' || typeof c.back !== 'string' || !c.front.trim() || !c.back.trim()) return null;
  return {
    id: typeof c.id === 'string' && c.id ? c.id : `import-${Date.now()}-${index}`,
    front: c.front,
    back: c.back,
    box: Math.min(MAX_BOX, Math.max(0, Math.round(num(c.box, 0)))),
    nextReview: num(c.nextReview, Date.now()),
    lastReviewed: typeof c.lastReviewed === 'number' ? c.lastReviewed : null,
    status: c.status === 'reserve' ? 'reserve' : 'active',
    source: typeof c.source === 'string' && c.source ? c.source : 'legacy',
    lapses: Math.max(0, Math.round(num(c.lapses, 0))),
  };
}

const migrateDeck = (raw: unknown): Card[] =>
  Array.isArray(raw) ? raw.map(migrateCard).filter((c): c is Card => c !== null) : [];

export function listDeckLangs(): string[] {
  const langs: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DECK_PREFIX)) langs.push(key.slice(DECK_PREFIX.length));
    }
  } catch { /* penyimpanan tidak tersedia */ }
  return langs.sort((a, b) => a.localeCompare(b, 'id'));
}

export const deckExists = (lang: string) => listDeckLangs().includes(lang);

export function loadDeck(lang: string): Card[] {
  try {
    const data = localStorage.getItem(DECK_PREFIX + lang);
    return data ? migrateDeck(JSON.parse(data)) : [];
  } catch {
    return [];
  }
}

export function saveDeck(lang: string, cards: Card[]): boolean {
  try {
    const clean = cards.map(c => {
      const copy = { ...c };
      delete copy.originLang;
      return copy;
    });
    localStorage.setItem(DECK_PREFIX + lang, JSON.stringify(clean));
    return true;
  } catch {
    return false;
  }
}

export function deleteDeck(lang: string) {
  try {
    localStorage.removeItem(DECK_PREFIX + lang);
    localStorage.removeItem(META_PREFIX + lang);
  } catch { /* abaikan */ }
}

export function loadMeta(lang: string): DeckMeta {
  try {
    const parsed = JSON.parse(localStorage.getItem(META_PREFIX + lang) || '{}');
    return { lastAccuracy: typeof parsed.lastAccuracy === 'number' ? parsed.lastAccuracy : null };
  } catch {
    return { lastAccuracy: null };
  }
}

export function saveMeta(lang: string, meta: DeckMeta) {
  try { localStorage.setItem(META_PREFIX + lang, JSON.stringify(meta)); } catch { /* abaikan */ }
}

export function deckStats(lang: string, cards: Card[], now: number): LangStats {
  return {
    lang,
    total: cards.length,
    mastered: cards.filter(isMastered).length,
    active: cards.filter(c => c.status === 'active').length,
    reserve: cards.filter(c => c.status === 'reserve').length,
    due: cards.filter(c => isDue(c, now)).length,
  };
}

// --- Cadangan ---

type Backup = {
  app: 'ingatkata';
  version: 1;
  exportedAt: string;
  decks: Record<string, Card[]>;
  meta: Record<string, DeckMeta>;
};

export function exportBackup(): string {
  const decks: Record<string, Card[]> = {};
  const meta: Record<string, DeckMeta> = {};
  for (const lang of listDeckLangs()) {
    decks[lang] = loadDeck(lang);
    meta[lang] = loadMeta(lang);
  }
  const backup: Backup = { app: 'ingatkata', version: 1, exportedAt: new Date().toISOString(), decks, meta };
  return JSON.stringify(backup, null, 2);
}

export type ParsedBackup = { decks: Record<string, Card[]>; meta: Record<string, DeckMeta> };

export function parseBackup(text: string): ParsedBackup | null {
  try {
    const data = JSON.parse(text);
    if (!data || data.app !== 'ingatkata' || typeof data.decks !== 'object' || data.decks === null) return null;
    const decks: Record<string, Card[]> = {};
    const meta: Record<string, DeckMeta> = {};
    for (const [lang, raw] of Object.entries(data.decks as Record<string, unknown>)) {
      if (!lang.trim() || !Array.isArray(raw)) continue;
      decks[lang] = migrateDeck(raw);
      const m = data.meta?.[lang];
      meta[lang] = { lastAccuracy: typeof m?.lastAccuracy === 'number' ? m.lastAccuracy : null };
    }
    return Object.keys(decks).length > 0 ? { decks, meta } : null;
  } catch {
    return null;
  }
}

export function restoreBackup(backup: ParsedBackup): boolean {
  let ok = true;
  for (const [lang, cards] of Object.entries(backup.decks)) {
    ok = saveDeck(lang, cards) && ok;
    saveMeta(lang, backup.meta[lang] ?? { lastAccuracy: null });
  }
  return ok;
}
