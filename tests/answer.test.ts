import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkAnswer, editDistance, normalize } from '../src/lib/answer.ts';

test('normalize: huruf kecil, tanpa diakritik dan tanda baca', () => {
  assert.equal(normalize('  Möglich! '), 'moglich');
  assert.equal(normalize('Die Maßnahme'), 'die massnahme');
  assert.equal(normalize('Baru-baru ini'), 'baru baru ini');
  assert.equal(normalize('食べる'), '食べる');
});

test('jawaban persis diterima', () => {
  assert.deepEqual(checkAnswer('apel', 'Apel'), { correct: true, quality: 'exact' });
  assert.equal(checkAnswer('', 'Apel').correct, false);
  assert.equal(checkAnswer('   ', 'Apel').correct, false);
});

test('arti ganda dengan garis miring, masing-masing diterima', () => {
  assert.equal(checkAnswer('perlu', 'Perlu/Penting').correct, true);
  assert.equal(checkAnswer('penting', 'Perlu/Penting').correct, true);
  assert.equal(checkAnswer('pacar', 'Dia (Pr)/Pacar').correct, true);
  assert.equal(checkAnswer('dia', 'Dia (Pr)/Pacar').correct, true);
});

test('keterangan dalam kurung bukan jawaban, aksara asli dalam kurung adalah jawaban', () => {
  assert.equal(checkAnswer('pr', 'Dia (Pr)/Pacar').correct, false);
  assert.equal(checkAnswer('watashi', 'Watashi (私)').correct, true);
  assert.equal(checkAnswer('私', 'Watashi (私)').correct, true);
});

test('awalan "to" boleh dihilangkan', () => {
  assert.equal(checkAnswer('eat', 'To eat').correct, true);
  assert.equal(checkAnswer('to eat', 'To eat').correct, true);
});

test('artikel Jerman yang hilang tetap benar dengan catatan', () => {
  const r = checkAnswer('haus', 'Das Haus');
  assert.equal(r.correct, true);
  assert.match(r.note ?? '', /artikel/);
});

test('salah ketik kecil pada kata panjang diterima dengan catatan', () => {
  const r = checkAnswer('lingkugan', 'Lingkungan');
  assert.equal(r.correct, true);
  assert.match(r.note ?? '', /Ejaan/);
  assert.equal(r.quality, 'close', 'salah ketik dinilai Hard');
  assert.equal(checkAnswer('aor', 'Air').correct, false, 'kata pendek harus persis');
  assert.equal(checkAnswer('pagi', 'Pergi').correct, false);
});

test('jawaban kartu lain dengan pertanyaan sama diterima', () => {
  const r = checkAnswer('vielleicht', 'Möglich', ['Vielleicht']);
  assert.equal(r.correct, true);
  assert.match(r.note ?? '', /Möglich/);
});

test('editDistance menghitung transposisi sebagai satu langkah', () => {
  assert.equal(editDistance('teman', 'temna'), 1);
  assert.equal(editDistance('abc', 'abc'), 0);
  assert.equal(editDistance('', 'abc'), 3);
});
