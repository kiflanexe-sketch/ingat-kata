import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_ANSWER_MS, bestStreak, currentStreak, dayKey, formatDuration, lastDays, mergeLogs, recordAnswer, recordSnapshot, sanitizeLog, sumDays,
  type StudyLog,
} from '../src/lib/stats.ts';

const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h).getTime();
const NOW = at(2026, 10, 13);

test('dayKey memakai tanggal lokal', () => {
  assert.equal(dayKey(at(2026, 1, 5, 23)), '2026-01-05');
  assert.equal(dayKey(at(2026, 1, 6, 0)), '2026-01-06');
});

test('recordAnswer menjumlah per hari dan membatasi waktu per jawaban', () => {
  let log: StudyLog = {};
  log = recordAnswer(log, NOW, true, 4000);
  log = recordAnswer(log, NOW, false, 10 * 60 * 1000); // ditinggal 10 menit
  assert.deepEqual(log['2026-10-13'], { r: 2, c: 1, ms: 4000 + MAX_ANSWER_MS });
});

test('recordSnapshot menyimpan hafal/aktif tanpa menghapus hitungan jawaban', () => {
  const log = recordSnapshot(recordAnswer({}, NOW, true, 1000), NOW, 7, 40);
  assert.deepEqual(log['2026-10-13'], { r: 1, c: 1, ms: 1000, m: 7, a: 40 });
});

test('rangkaian hari: hari ini yang belum belajar tidak memutus rangkaian', () => {
  const log: StudyLog = {
    '2026-10-10': { r: 3, c: 3, ms: 0 }, '2026-10-11': { r: 5, c: 4, ms: 0 }, '2026-10-12': { r: 1, c: 1, ms: 0 },
  };
  assert.equal(currentStreak(log, NOW), 3);
  assert.equal(currentStreak({ ...log, '2026-10-13': { r: 2, c: 2, ms: 0 } }, NOW), 4);
  assert.equal(currentStreak({ '2026-10-10': { r: 1, c: 1, ms: 0 } }, NOW), 0, 'kemarin tidak belajar: putus');
});

test('rangkaian terpanjang melewati pergantian bulan', () => {
  const log: StudyLog = {
    '2026-08-30': { r: 1, c: 1, ms: 0 }, '2026-08-31': { r: 1, c: 1, ms: 0 }, '2026-09-01': { r: 1, c: 1, ms: 0 },
    '2026-09-05': { r: 1, c: 1, ms: 0 }, '2026-09-06': { r: 0, c: 0, ms: 0 },
  };
  assert.equal(bestStreak(log), 3);
});

test('lastDays mengisi hari kosong dan meneruskan jumlah hafal terakhir', () => {
  const log: StudyLog = {
    '2026-09-01': { r: 2, c: 2, ms: 0, m: 3, a: 10 },
    '2026-10-12': { r: 4, c: 3, ms: 60000, m: 5, a: 12 },
  };
  const days = lastDays(log, 3, NOW);
  assert.deepEqual(days.map(d => d.key), ['2026-10-11', '2026-10-12', '2026-10-13']);
  assert.deepEqual(days.map(d => [d.r, d.m, d.a]), [[0, 3, 10], [4, 5, 12], [0, 5, 12]]);
  assert.deepEqual(sumDays(days), { r: 4, c: 3, ms: 60000, active: 1 });
});

test('mergeLogs mengambil nilai terbesar per hari supaya pulihkan ulang tidak menggandakan', () => {
  const a: StudyLog = { '2026-10-12': { r: 10, c: 8, ms: 5000 } };
  const b: StudyLog = { '2026-10-12': { r: 10, c: 8, ms: 5000, m: 4, a: 20 }, '2026-10-13': { r: 1, c: 1, ms: 0 } };
  const merged = mergeLogs(a, b);
  assert.deepEqual(merged['2026-10-12'], { r: 10, c: 8, ms: 5000, m: 4, a: 20 });
  assert.equal(merged['2026-10-13'].r, 1);
});

test('sanitizeLog membuang kunci dan nilai rusak', () => {
  const log = sanitizeLog({ 'bukan-tanggal': { r: 1 }, '2026-10-01': { r: 5, c: 9, ms: -3, m: 'x' }, '2026-10-02': null });
  assert.deepEqual(log, { '2026-10-01': { r: 5, c: 5, ms: 0 } });
});

test('formatDuration', () => {
  assert.equal(formatDuration(0), '0 menit');
  assert.equal(formatDuration(25 * 60000), '25 menit');
  assert.equal(formatDuration(125 * 60000), '2 jam 5 menit');
});
