import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORD_DATABASE } from '../src/data/words.ts';
import { speakableText, speechCodeFor } from '../src/data/languages.ts';

// Teks yang dikirim ke mesin suara harus berupa aksara bahasa itu, bukan romanisasi:
// suara Jepang tidak bisa membaca "Taberu" dengan benar, tetapi bisa membaca "食べる".
const SCRIPT: Record<string, RegExp> = {
  'ja-JP': /^[぀-ヿ一-鿿々ー\s]+$/,
  'ko-KR': /^[가-힣\s]+$/,
  'ar-SA': /^[؀-ۿ\s]+$/,
  'en-GB': /^[A-Za-z' -]+$/,
  'de-DE': /^[A-Za-zÄÖÜäöüß' -]+$/,
};

test('setiap kata bawaan punya teks suara dalam aksara bahasanya', () => {
  for (const [lang, levels] of Object.entries(WORD_DATABASE)) {
    const code = speechCodeFor(lang);
    assert.ok(code, `${lang} tanpa kode suara`);
    for (const [level, words] of Object.entries(levels)) {
      for (const w of words) {
        const text = speakableText(w.f, code);
        assert.match(text, SCRIPT[code], `${lang} / ${level}: "${w.f}" diucapkan sebagai "${text}"`);
      }
    }
  }
});

test('huruf hangul dan Arab lepas diucapkan sebagai suku kata', () => {
  assert.equal(speakableText('ㄱ', 'ko-KR'), '가');
  assert.equal(speakableText('ㅎ', 'ko-KR'), '하');
  assert.equal(speakableText('ㅏ', 'ko-KR'), '아');
  assert.equal(speakableText('ㅡ', 'ko-KR'), '으');
  assert.equal(speakableText('ب', 'ar-SA'), 'بَ');
  assert.equal(speakableText('ا', 'ar-SA'), 'أَ');
  assert.equal(speakableText('あ', 'ja-JP'), 'あ');
});

test('kata dengan romanisasi diucapkan dari aksara aslinya', () => {
  assert.equal(speakableText('Zairyuu kaado (在留カード)', 'ja-JP'), '在留カード');
  assert.equal(speakableText('Oegugin deungnokjeung (외국인등록증)', 'ko-KR'), '외국인등록증');
  assert.equal(speakableText('To eat', 'en-GB'), 'To eat');
});
