// XP, level, dan lencana. Semuanya dihitung dari riwayat harian (lib/stats.ts), jadi tidak ada
// data tambahan yang perlu disimpan, ikut file cadangan, dan aman digabung antarperangkat.
import { bestStreak, dayKey, type StudyLog } from './stats.ts';

export const XP_CORRECT = 10;
export const XP_WRONG = 2; // usaha tetap dihargai, supaya salah tidak terasa sia-sia
export const XP_GOAL = 25; // bonus sekali sehari saat target harian tercapai
export const XP_PERFECT_QUIZ = 20;
export const PERFECT_QUIZ_MIN = 10; // kuis sempurna baru dihitung dari 10 soal
export const DAILY_GOALS = [10, 20, 30, 50];
export const DEFAULT_DAILY_GOAL = 20;

export function totalXp(log: StudyLog): number {
  let xp = 0;
  for (const d of Object.values(log)) {
    xp += d.c * XP_CORRECT + (d.r - d.c) * XP_WRONG + (d.q ?? 0) + (d.g ? XP_GOAL : 0) + (d.qp ?? 0) * XP_PERFECT_QUIZ;
  }
  return xp;
}

// XP minimum untuk mencapai level L: 0, 100, 300, 600, 1000, ... (tiap level butuh 100 XP lebih banyak).
export const xpForLevel = (level: number) => 50 * level * (level - 1);

const TITLES: [number, string][] = [[50, 'Maestro'], [35, 'Pakar'], [20, 'Penghafal'], [10, 'Penekun'], [5, 'Penjelajah'], [1, 'Pemula']];

export type LevelInfo = { level: number; title: string; xp: number; floor: number; next: number };

export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const title = TITLES.find(([min]) => level >= min)![1];
  return { level, title, xp, floor: xpForLevel(level), next: xpForLevel(level + 1) };
}

// Bonus kecepatan kuis: 0-5 poin sesuai sisa waktu.
export const speedPoints = (msLeft: number, limitMs: number) =>
  Math.max(0, Math.min(5, Math.ceil((5 * msLeft) / limitMs)));

// --- Lencana ---

export type BadgeKind = 'streak' | 'answers' | 'mastered' | 'goal' | 'quiz';

type Totals = { streak: number; answers: number; mastered: number; goals: number; perfect: number };

export type Badge = { id: string; kind: BadgeKind; title: string; desc: string; need: number; of: (t: Totals) => number };

const streak = (n: number, title: string): Badge =>
  ({ id: `streak-${n}`, kind: 'streak', title, desc: `Belajar ${n} hari berturut-turut.`, need: n, of: t => t.streak });
const answers = (n: number, title: string): Badge =>
  ({ id: `answers-${n}`, kind: 'answers', title, desc: `Menjawab ${n.toLocaleString('id-ID')} kartu.`, need: n, of: t => t.answers });
const mastered = (n: number, title: string): Badge =>
  ({ id: `mastered-${n}`, kind: 'mastered', title, desc: `${n} kata hafal sekaligus.`, need: n, of: t => t.mastered });
const goals = (n: number, title: string): Badge =>
  ({ id: `goal-${n}`, kind: 'goal', title, desc: `Mencapai target harian ${n} kali.`, need: n, of: t => t.goals });

export const BADGES: Badge[] = [
  streak(3, 'Tiga hari'), streak(7, 'Seminggu penuh'), streak(30, 'Sebulan tekun'), streak(100, 'Seratus hari'),
  answers(100, 'Seratus jawaban'), answers(1000, 'Seribu jawaban'), answers(5000, 'Lima ribu jawaban'),
  mastered(10, 'Sepuluh hafal'), mastered(50, 'Lima puluh hafal'), mastered(100, 'Seratus hafal'), mastered(500, 'Lima ratus hafal'),
  goals(7, 'Tepat target'), goals(30, 'Target sebulan'),
  { id: 'quiz-perfect', kind: 'quiz', title: 'Kuis sempurna', desc: `Semua benar di kuis kilat (minimal ${PERFECT_QUIZ_MIN} soal).`, need: 1, of: t => t.perfect },
  { id: 'quiz-perfect-10', kind: 'quiz', title: 'Kilat sejati', desc: '10 kuis kilat sempurna.', need: 10, of: t => t.perfect },
];

function totals(log: StudyLog): Totals {
  const days = Object.values(log);
  return {
    streak: bestStreak(log),
    answers: days.reduce((n, d) => n + d.r, 0),
    mastered: days.reduce((n, d) => Math.max(n, d.m ?? 0), 0),
    goals: days.reduce((n, d) => n + (d.g ? 1 : 0), 0),
    perfect: days.reduce((n, d) => n + (d.qp ?? 0), 0),
  };
}

export type BadgeState = Badge & { earned: boolean; value: number; progress: number };

export function badgeStates(log: StudyLog): BadgeState[] {
  const t = totals(log);
  return BADGES.map(b => ({ ...b, earned: b.of(t) >= b.need, value: b.of(t), progress: Math.min(1, b.of(t) / b.need) }));
}

export const earnedBadgeIds = (log: StudyLog) => new Set(badgeStates(log).filter(b => b.earned).map(b => b.id));

// Ringkasan hadiah sebuah sesi: dibandingkan riwayat sebelum dan sesudahnya.
export type SessionReward = { xp: number; before: LevelInfo; after: LevelInfo; badges: Badge[]; goalReached: boolean };

export function sessionReward(before: StudyLog, after: StudyLog, now: number): SessionReward {
  const had = earnedBadgeIds(before);
  const key = dayKey(now);
  const b = levelInfo(totalXp(before));
  const a = levelInfo(totalXp(after));
  return {
    xp: a.xp - b.xp,
    before: b,
    after: a,
    badges: badgeStates(after).filter(x => x.earned && !had.has(x.id)),
    goalReached: !before[key]?.g && !!after[key]?.g,
  };
}
