import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backupReminder } from '../src/lib/reminder.ts';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 9, 13, 10).getTime();

test('tidak mengingatkan deck yang masih kecil', () => {
  assert.equal(backupReminder(null, 9, NOW, 7), null);
});

test('mengingatkan bila belum pernah dicadangkan', () => {
  assert.equal(backupReminder(null, 25, NOW, 7), '25 katamu belum pernah dicadangkan.');
});

test('mengikuti jarak pengingat yang dipilih', () => {
  const fourDaysAgo = NOW - 4 * DAY;
  assert.equal(backupReminder(fourDaysAgo, 50, NOW, 7), null);
  assert.equal(backupReminder(fourDaysAgo, 50, NOW, 3), 'Cadangan terakhir 4 hari lalu.');
  assert.equal(backupReminder(NOW - 7 * DAY, 50, NOW, 7), null, 'tepat 7 hari belum lewat');
  assert.equal(backupReminder(NOW - 8 * DAY, 50, NOW, 7), 'Cadangan terakhir 8 hari lalu.');
  assert.equal(backupReminder(NOW - 15 * DAY, 50, NOW, 14), 'Cadangan terakhir 15 hari lalu.');
});
