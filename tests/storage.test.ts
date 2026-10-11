import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrateCard, parseBackup } from '../src/lib/storage.ts';

test('migrateCard melengkapi field lama dan menolak kartu rusak', () => {
  const c = migrateCard({ id: 'x', front: 'Apple', back: 'Apel', box: 9, nextReview: 5 }, 0);
  assert.equal(c?.status, 'active');
  assert.equal(c?.source, 'legacy');
  assert.equal(c?.box, 5);
  assert.equal(c?.lapses, 0);
  assert.equal(migrateCard({ front: '', back: 'x' }, 0), null);
  assert.equal(migrateCard('bukan kartu', 0), null);
});

test('parseBackup hanya menerima file IngatKata', () => {
  assert.equal(parseBackup('{"decks":{}}'), null);
  assert.equal(parseBackup('bukan json'), null);
  const ok = parseBackup(JSON.stringify({
    app: 'ingatkata', version: 1, decks: { 'Inggris 🇬🇧': [{ id: 'a', front: 'Apple', back: 'Apel' }, { front: 1 }] }, meta: {},
  }));
  assert.equal(ok?.decks['Inggris 🇬🇧'].length, 1);
  assert.equal(ok?.meta['Inggris 🇬🇧'].lastAccuracy, null);
});
