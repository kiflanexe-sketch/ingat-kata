import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayKey, mergeLogs, recordAnswer, recordPerfectQuiz, sanitizeLog, type StudyLog } from '../src/lib/stats.ts';
import {
  XP_CORRECT, XP_GOAL, XP_PERFECT_QUIZ, XP_WRONG, badgeStates, levelInfo, sessionReward, speedPoints, totalXp, xpForLevel,
} from '../src/lib/rewards.ts';

const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h).getTime();
const NOW = at(2026, 10, 13);

test('XP dihitung dari jawaban benar, salah, poin kuis, target, dan kuis sempurna', () => {
  const log: StudyLog = { '2026-10-12': { r: 5, c: 3, ms: 0, q: 7, g: 1, qp: 1 } };
  assert.equal(totalXp(log), 3 * XP_CORRECT + 2 * XP_WRONG + 7 + XP_GOAL + XP_PERFECT_QUIZ);
  assert.equal(totalXp({}), 0);
});

test('level naik dengan jarak yang makin lebar dan punya sebutan', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(xpForLevel), [0, 100, 300, 600, 1000]);
  assert.equal(levelInfo(0).level, 1);
  assert.equal(levelInfo(99).level, 1);
  assert.equal(levelInfo(100).level, 2);
  const l = levelInfo(650);
  assert.deepEqual([l.level, l.floor, l.next, l.title], [4, 600, 1000, 'Pemula']);
  assert.equal(levelInfo(xpForLevel(5)).title, 'Penjelajah');
  assert.equal(levelInfo(xpForLevel(50)).title, 'Maestro');
});

test('target harian ditandai sekali saat jumlah jawaban mencapainya', () => {
  let log: StudyLog = {};
  for (let i = 0; i < 2; i++) log = recordAnswer(log, NOW, true, 1000, { goal: 3 });
  assert.equal(log[dayKey(NOW)].g, undefined);
  log = recordAnswer(log, NOW, false, 1000, { goal: 3 });
  assert.equal(log[dayKey(NOW)].g, 1);
  log = recordAnswer(log, NOW, true, 1000, { goal: 3 });
  assert.equal(log[dayKey(NOW)].g, 1);
  assert.equal(totalXp(log), 3 * XP_CORRECT + XP_WRONG + XP_GOAL);
});

test('poin kecepatan kuis 0-5 sesuai sisa waktu', () => {
  assert.equal(speedPoints(8000, 8000), 5);
  assert.equal(speedPoints(4000, 8000), 3);
  assert.equal(speedPoints(1, 8000), 1);
  assert.equal(speedPoints(0, 8000), 0);
  assert.equal(speedPoints(-50, 8000), 0);
  let log = recordAnswer({}, NOW, true, 900, { points: 4 });
  log = recordAnswer(log, NOW, true, 900, { points: 2 });
  assert.equal(log[dayKey(NOW)].q, 6);
});

test('lencana dari hari beruntun, jumlah jawaban, kata hafal, target, dan kuis sempurna', () => {
  const log: StudyLog = {
    '2026-10-11': { r: 60, c: 50, ms: 0, g: 1 },
    '2026-10-12': { r: 30, c: 30, ms: 0, m: 12, a: 40, g: 1 },
    '2026-10-13': { r: 20, c: 20, ms: 0, qp: 1 },
  };
  const earned = badgeStates(log).filter(b => b.earned).map(b => b.id);
  assert.deepEqual(earned.sort(), ['answers-100', 'mastered-10', 'quiz-perfect', 'streak-3'].sort());
  const week = badgeStates(log).find(b => b.id === 'streak-7')!;
  assert.equal(week.progress, 3 / 7);
});

test('ringkasan hadiah sesi: XP, naik level, lencana baru, target tercapai', () => {
  let before: StudyLog = { '2026-10-12': { r: 8, c: 8, ms: 0 } };
  before = recordAnswer(before, NOW, true, 1000, { goal: 2 });
  let after = recordAnswer(before, NOW, true, 1000, { goal: 2 });
  after = recordPerfectQuiz(after, NOW);
  const r = sessionReward(before, after, NOW);
  assert.equal(r.xp, XP_CORRECT + XP_GOAL + XP_PERFECT_QUIZ);
  assert.deepEqual([r.before.level, r.after.level], [1, 2]);
  assert.equal(r.goalReached, true);
  assert.deepEqual(r.badges.map(b => b.id), ['quiz-perfect']);
  assert.equal(sessionReward(after, after, NOW).goalReached, false);
});

test('field hadiah ikut divalidasi dan digabung per hari', () => {
  const clean = sanitizeLog({ '2026-10-13': { r: 3, c: 2, ms: 10, q: 4.4, g: 1, qp: -1 }, '2026-10-12': { r: 1, c: 1, ms: 0, g: 'ya' } });
  assert.deepEqual(clean['2026-10-13'], { r: 3, c: 2, ms: 10, q: 4, g: 1 });
  assert.deepEqual(clean['2026-10-12'], { r: 1, c: 1, ms: 0 });
  const merged = mergeLogs({ '2026-10-13': { r: 3, c: 2, ms: 0, q: 4 } }, { '2026-10-13': { r: 1, c: 1, ms: 0, g: 1, qp: 2 } });
  assert.deepEqual(merged['2026-10-13'], { r: 3, c: 2, ms: 0, q: 4, g: 1, qp: 2 });
});

test('riwayat lama tidak dipangkas, supaya XP tidak berkurang', () => {
  const log = recordAnswer({ '2020-01-01': { r: 1, c: 1, ms: 0 } }, NOW, true, 0);
  assert.ok(log['2020-01-01']);
});
