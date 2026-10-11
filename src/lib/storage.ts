import type { Card, LangStats } from '../types.ts';
import { MAX_BOX, isDue, isMastered, mergeCards, nextDueAt, type DirectionSetting } from './srs.ts';

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
    nextDue: nextDueAt(cards, now),
    boxes: cards.filter(c => c.status === 'active').map(c => c.box),
  };
}

// --- Pengaturan ---

const SETTINGS_KEY = 'ingatkata-settings';

export type Settings = {
  direction: DirectionSetting; // arah pertanyaan
  autoSpeak: boolean; // ucapkan kata asing otomatis setelah menjawab
  lastBackupAt: number | null;
};

export const DEFAULT_SETTINGS: Settings = { direction: 'both', autoSpeak: true, lastBackupAt: null };

function sanitizeSettings(raw: unknown): Omit<Settings, 'lastBackupAt'> {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    direction: r.direction === 'forward' || r.direction === 'backward' ? r.direction : 'both',
    autoSpeak: typeof r.autoSpeak === 'boolean' ? r.autoSpeak : DEFAULT_SETTINGS.autoSpeak,
  };
}

export function loadSettings(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return { ...sanitizeSettings(raw), lastBackupAt: typeof raw.lastBackupAt === 'number' ? raw.lastBackupAt : null };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* abaikan */ }
}

// Minta browser tidak menghapus data saat ruang penyimpanan menipis.
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    return (await navigator.storage.persisted()) || (await navigator.storage.persist());
  } catch {
    return false;
  }
}

// --- Cadangan ---

type BackupFile = {
  app: 'ingatkata';
  version: 2;
  exportedAt: string;
  decks: Record<string, Card[]>;
  meta: Record<string, DeckMeta>;
  settings: Omit<Settings, 'lastBackupAt'>;
};

export function exportBackup(): string {
  const decks: Record<string, Card[]> = {};
  const meta: Record<string, DeckMeta> = {};
  for (const lang of listDeckLangs()) {
    decks[lang] = loadDeck(lang);
    meta[lang] = loadMeta(lang);
  }
  const { direction, autoSpeak } = loadSettings();
  const settings = { direction, autoSpeak };
  const backup: BackupFile = { app: 'ingatkata', version: 2, exportedAt: new Date().toISOString(), decks, meta, settings };
  return JSON.stringify(backup);
}

export type ParsedBackup = {
  decks: Record<string, Card[]>;
  meta: Record<string, DeckMeta>;
  settings: Omit<Settings, 'lastBackupAt'> | null; // null untuk cadangan versi 1
  exportedAt: string | null;
};

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
    if (Object.keys(decks).length === 0) return null;
    return {
      decks,
      meta,
      settings: data.settings ? sanitizeSettings(data.settings) : null,
      exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : null,
    };
  } catch {
    return null;
  }
}

export type RestoreMode = 'merge' | 'replace';

// 'merge': deck digabung kartu per kartu (yang terakhir diulang menang).
// 'replace': isi perangkat ini disamakan persis dengan cadangan.
export function restoreBackup(backup: ParsedBackup, mode: RestoreMode): boolean {
  let ok = true;
  if (mode === 'replace') {
    for (const lang of listDeckLangs()) if (!(lang in backup.decks)) deleteDeck(lang);
  }
  for (const [lang, cards] of Object.entries(backup.decks)) {
    const incomingMeta = backup.meta[lang] ?? { lastAccuracy: null };
    if (mode === 'merge' && deckExists(lang)) {
      ok = saveDeck(lang, mergeCards(loadDeck(lang), cards)) && ok;
      const local = loadMeta(lang);
      saveMeta(lang, { lastAccuracy: local.lastAccuracy ?? incomingMeta.lastAccuracy });
    } else {
      ok = saveDeck(lang, cards) && ok;
      saveMeta(lang, incomingMeta);
    }
  }
  if (backup.settings) saveSettings({ ...loadSettings(), ...backup.settings });
  return ok;
}
