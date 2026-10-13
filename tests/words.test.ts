import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PACK_NOTES, SCRIPT_LEVELS, WORD_DATABASE } from '../src/data/words.ts';
import { pairKey } from '../src/lib/srs.ts';

const NATIVE_IN_PARENS = /\([^)]*[^\s -ɏ][^)]*\)/;
const NEEDS_NATIVE = new Set(['Jepang 🇯🇵', 'Korea 🇰🇷', 'Arab 🇸🇦', 'Mandarin 🇨🇳']);

for (const [lang, levels] of Object.entries(WORD_DATABASE)) {
  test(`${lang}: paket lengkap dan rapi`, () => {
    for (const [level, words] of Object.entries(levels)) {
      assert.ok(words.length >= 20, `${level} terlalu sedikit (${words.length})`);
      assert.ok(PACK_NOTES[lang]?.[level], `${level} belum punya keterangan`);
      for (const w of words) {
        assert.ok(w.f.trim() === w.f && w.b.trim() === w.b && w.f && w.b, `${level}: spasi/kosong pada ${w.f}`);
        if (SCRIPT_LEVELS.has(level)) {
          assert.ok([...w.f].length <= 2 && !/[a-z]/i.test(w.f), `${level}: ${w.f} bukan huruf tunggal`);
        } else if (NEEDS_NATIVE.has(lang)) {
          assert.match(w.f, NATIVE_IN_PARENS, `${level}: ${w.f} tanpa aksara asli dalam kurung`);
        }
      }
    }
  });

  test(`${lang}: tidak ada pasangan kata ganda antarpaket`, () => {
    const seen = new Map<string, string>();
    for (const [level, words] of Object.entries(levels)) {
      for (const w of words) {
        const key = pairKey(w.f, w.b);
        assert.ok(!seen.has(key), `"${w.f}" ada di ${seen.get(key)} dan ${level}`);
        seen.set(key, level);
      }
    }
  });
}

test('setiap bahasa bawaan punya keterangan untuk semua paket dan tidak lebih', () => {
  for (const lang of Object.keys(WORD_DATABASE)) {
    assert.deepEqual(Object.keys(PACK_NOTES[lang]).sort(), Object.keys(WORD_DATABASE[lang]).sort());
  }
});
