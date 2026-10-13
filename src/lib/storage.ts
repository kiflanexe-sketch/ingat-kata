import type { Card, FsrsState, LangStats } from '../types.ts';
import { mergeLogs, sanitizeLog, type StudyLog } from './stats.ts';
import { DAILY_GOALS, DEFAULT_DAILY_GOAL } from './rewards.ts';
import { DEFAULT_QUIZ_SECONDS, QUIZ_SECONDS } from './quiz.ts';
import { DEFAULT_RETENTION, MAX_BOX, RETENTION_CHOICES, isDue, isMastered, mergeCards, nextDueAt, type DirectionSetting } from './srs.ts';

const DECK_PREFIX = 'ingatkata-deck-';
const META_PREFIX = 'ingatkata-meta-';

export type DeckMeta = { lastAccuracy: number | null };

const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

// Keadaan FSRS dari penyimpanan atau file cadangan; dibuang bila tidak masuk akal.
function migrateFsrs(raw: unknown): FsrsState | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const f = raw as Record<string, unknown>;
  const s = num(f.s, -1);
  const d = num(f.d, -1);
  const state = num(f.state, -1);
  if (s <= 0 || d < 1 || d > 10 || ![0, 1, 2, 3].includes(state)) return undefined;
  return { s, d, state: state as FsrsState['state'], reps: Math.max(0, Math.round(num(f.reps, 0))), step: Math.max(0, Math.round(num(f.step, 0))) };
}

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
    ...(migrateFsrs(c.fsrs) ? { fsrs: migrateFsrs(c.fsrs) } : {}),
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

// --- Riwayat belajar ---

const LOG_KEY = 'ingatkata-log';

export function loadLog(): StudyLog {
  try { return sanitizeLog(JSON.parse(localStorage.getItem(LOG_KEY) || '{}')); } catch { return {}; }
}

export function saveLog(log: StudyLog) {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch { /* abaikan */ }
}

// --- Pengaturan ---

const SETTINGS_KEY = 'ingatkata-settings';

export type Settings = {
  direction: DirectionSetting; // arah pertanyaan
  autoSpeak: boolean; // ucapkan kata asing otomatis setelah menjawab
  retention: number; // target peluang ingat FSRS (0,85 / 0,9 / 0,95)
  dailyGoal: number; // target kartu dijawab per hari
  quizSeconds: number; // waktu per soal kuis kilat
  quizSfx: boolean; // efek suara benar/salah/perayaan di kuis kilat
  lastBackupAt: number | null;
};

export const DEFAULT_SETTINGS: Settings = {
  direction: 'both', autoSpeak: true, retention: DEFAULT_RETENTION, dailyGoal: DEFAULT_DAILY_GOAL, quizSeconds: DEFAULT_QUIZ_SECONDS, quizSfx: true, lastBackupAt: null,
};

function sanitizeSettings(raw: unknown): Omit<Settings, 'lastBackupAt'> {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    direction: r.direction === 'forward' || r.direction === 'backward' ? r.direction : 'both',
    autoSpeak: typeof r.autoSpeak === 'boolean' ? r.autoSpeak : DEFAULT_SETTINGS.autoSpeak,
    retention: typeof r.retention === 'number' && RETENTION_CHOICES.includes(r.retention) ? r.retention : DEFAULT_RETENTION,
    dailyGoal: typeof r.dailyGoal === 'number' && DAILY_GOALS.includes(r.dailyGoal) ? r.dailyGoal : DEFAULT_DAILY_GOAL,
    quizSeconds: typeof r.quizSeconds === 'number' && QUIZ_SECONDS.includes(r.quizSeconds) ? r.quizSeconds : DEFAULT_QUIZ_SECONDS,
    quizSfx: typeof r.quizSfx === 'boolean' ? r.quizSfx : DEFAULT_SETTINGS.quizSfx,
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
  log: StudyLog;
};

export function exportBackup(): string {
  const decks: Record<string, Card[]> = {};
  const meta: Record<string, DeckMeta> = {};
  for (const lang of listDeckLangs()) {
    decks[lang] = loadDeck(lang);
    meta[lang] = loadMeta(lang);
  }
  const settings = sanitizeSettings(loadSettings());
  const backup: BackupFile = { app: 'ingatkata', version: 2, exportedAt: new Date().toISOString(), decks, meta, settings, log: loadLog() };
  return JSON.stringify(backup);
}

export type ParsedBackup = {
  decks: Record<string, Card[]>;
  meta: Record<string, DeckMeta>;
  settings: Omit<Settings, 'lastBackupAt'> | null; // null untuk cadangan versi 1
  log: StudyLog;
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
      log: sanitizeLog(data.log),
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
  saveLog(mode === 'merge' ? mergeLogs(loadLog(), backup.log) : backup.log);
  return ok;
}
