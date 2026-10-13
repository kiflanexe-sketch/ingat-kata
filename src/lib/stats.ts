// Riwayat belajar harian untuk grafik di halaman depan. Disimpan ringkas per tanggal lokal.

export type DayLog = {
  r: number; // kartu dijawab (tanpa ulangan di akhir sesi)
  c: number; // dijawab benar
  ms: number; // waktu menjawab, dibatasi per kartu
  m?: number; // jumlah kata hafal di semua bahasa, dicatat saat sesi selesai
  a?: number; // jumlah kata aktif di semua bahasa
  q?: number; // poin kecepatan dari kuis kilat
  g?: number; // 1 bila target harian tercapai hari itu
  qp?: number; // jumlah kuis kilat yang dijawab benar semua
};

export type StudyLog = Record<string, DayLog>;

export type DayPoint = DayLog & { key: string; date: Date };

export const MAX_ANSWER_MS = 60 * 1000; // jawaban yang ditinggal lama tidak dihitung sebagai waktu belajar

const pad = (n: number) => String(n).padStart(2, '0');

// Kunci tanggal menurut zona waktu perangkat, supaya "hari ini" sama dengan kalender pengguna.
export const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Tanggal n hari sebelum `ts` (aman terhadap pergantian jam musim panas).
const daysBefore = (ts: number, n: number) => {
  const d = startOfDay(ts);
  d.setDate(d.getDate() - n);
  return d;
};

// Riwayat tidak dipangkas: XP dan lencana dihitung dari seluruh riwayat, dan satu hari hanya
// sekitar 50 byte (10 tahun kurang dari 200 KB).
// `goal` = target harian kartu; hari yang mencapainya ditandai sekali (lihat lib/rewards.ts).
export function recordAnswer(log: StudyLog, now: number, correct: boolean, ms: number, opts: { goal?: number; points?: number } = {}): StudyLog {
  const key = dayKey(now);
  const day = log[key] ?? { r: 0, c: 0, ms: 0 };
  const spent = Math.min(MAX_ANSWER_MS, Math.max(0, Math.round(ms)));
  const next: DayLog = { ...day, r: day.r + 1, c: day.c + (correct ? 1 : 0), ms: day.ms + spent };
  if (opts.points) next.q = (day.q ?? 0) + Math.max(0, Math.round(opts.points));
  if (opts.goal && next.r >= opts.goal) next.g = 1;
  return { ...log, [key]: next };
}

export function recordPerfectQuiz(log: StudyLog, now: number): StudyLog {
  const key = dayKey(now);
  const day = log[key] ?? { r: 0, c: 0, ms: 0 };
  return { ...log, [key]: { ...day, qp: (day.qp ?? 0) + 1 } };
}

export function recordSnapshot(log: StudyLog, now: number, mastered: number, active: number): StudyLog {
  const key = dayKey(now);
  const day = log[key] ?? { r: 0, c: 0, ms: 0 };
  return { ...log, [key]: { ...day, m: mastered, a: active } };
}

// Hari beruntun dengan minimal satu jawaban. Hari ini yang belum belajar tidak memutus rangkaian.
export function currentStreak(log: StudyLog, now: number): number {
  let n = 0;
  let i = (log[dayKey(now)]?.r ?? 0) > 0 ? 0 : 1;
  while ((log[dayKey(+daysBefore(now, i))]?.r ?? 0) > 0) { n++; i++; }
  return n;
}

export function bestStreak(log: StudyLog): number {
  const days = Object.keys(log).filter(k => log[k].r > 0).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of days) {
    const [y, m, d] = k.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const next = prev ? new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1) : null;
    run = next && +next === +date ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}

// `days` hari terakhir sampai hari ini, urut lama ke baru. Jumlah hafal/aktif diteruskan dari
// catatan terakhir sebelumnya, karena tidak berubah di hari tanpa sesi.
export function lastDays(log: StudyLog, days: number, now: number): DayPoint[] {
  const earliest = dayKey(+daysBefore(now, days - 1));
  const before = Object.keys(log).filter(k => k < earliest && log[k].m !== undefined).sort().at(-1);
  let m = before ? log[before].m : undefined;
  let a = before ? log[before].a : undefined;
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = daysBefore(now, i);
    const key = dayKey(+date);
    const day = log[key];
    if (day?.m !== undefined) { m = day.m; a = day.a; }
    out.push({ key, date, r: day?.r ?? 0, c: day?.c ?? 0, ms: day?.ms ?? 0, m, a });
  }
  return out;
}

export const sumDays = (points: DayPoint[]) =>
  points.reduce((t, p) => ({ r: t.r + p.r, c: t.c + p.c, ms: t.ms + p.ms, active: t.active + (p.r > 0 ? 1 : 0) }), { r: 0, c: 0, ms: 0, active: 0 });

// Gabungkan riwayat dari dua perangkat: per tanggal ambil nilai terbesar, supaya cadangan yang
// dipulihkan ulang ke perangkat yang sama tidak menggandakan angka.
export function mergeLogs(a: StudyLog, b: StudyLog): StudyLog {
  const out: StudyLog = { ...a };
  for (const [k, d] of Object.entries(b)) {
    const e = out[k];
    if (!e) { out[k] = d; continue; }
    const day: DayLog = {
      r: Math.max(e.r, d.r), c: Math.max(e.c, d.c), ms: Math.max(e.ms, d.ms),
      ...(e.m !== undefined || d.m !== undefined ? { m: Math.max(e.m ?? 0, d.m ?? 0), a: Math.max(e.a ?? 0, d.a ?? 0) } : {}),
    };
    for (const f of ['q', 'g', 'qp'] as const) {
      if (e[f] !== undefined || d[f] !== undefined) day[f] = Math.max(e[f] ?? 0, d[f] ?? 0);
    }
    out[k] = day;
  }
  return out;
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined);

export function sanitizeLog(raw: unknown): StudyLog {
  if (!raw || typeof raw !== 'object') return {};
  const out: StudyLog = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !v || typeof v !== 'object') continue;
    const d = v as Record<string, unknown>;
    const r = num(d.r) ?? 0;
    const c = Math.min(r, num(d.c) ?? 0);
    const day: DayLog = { r, c, ms: num(d.ms) ?? 0 };
    if (num(d.m) !== undefined) { day.m = num(d.m); day.a = num(d.a) ?? 0; }
    if (num(d.q) !== undefined) day.q = Math.round(num(d.q)!);
    if (d.g === 1) day.g = 1;
    if (num(d.qp) !== undefined) day.qp = Math.round(num(d.qp)!);
    out[k] = day;
  }
  return out;
}

export const formatDuration = (ms: number) => {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} jam ${m} menit` : `${h} jam`;
};

