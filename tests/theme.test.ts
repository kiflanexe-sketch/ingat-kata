import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme } from '../src/lib/theme.ts';

test('pilihan tema: terang dan gelap tetap, ikut sistem mengikuti perangkat', () => {
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
});
