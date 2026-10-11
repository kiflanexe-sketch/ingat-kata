import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBulk } from '../src/lib/bulk.ts';

test('mengenali pemisah <>, tab, = dan - berspasi', () => {
  const r = parseBulk('apple <> apel\nbook\tbuku\ncat = kucing\ndog - anjing');
  assert.deepEqual(r.pairs.map(p => p.front), ['apple', 'book', 'cat', 'dog']);
  assert.deepEqual(r.invalidLines, []);
});

test('tanda hubung tanpa spasi tidak dianggap pemisah', () => {
  const r = parseBulk('recently <> baru-baru ini\nbaru-baru');
  assert.deepEqual(r.pairs, [{ front: 'recently', back: 'baru-baru ini' }]);
  assert.deepEqual(r.invalidLines, [2]);
});

test('baris kosong dan komentar dilewati, baris rusak dilaporkan', () => {
  const r = parseBulk('# daftar\n\napple <>\n<> apel\nwater <> air\r\n');
  assert.equal(r.pairs.length, 1);
  assert.deepEqual(r.invalidLines, [3, 4]);
});
