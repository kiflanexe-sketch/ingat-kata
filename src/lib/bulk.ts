export type BulkParseResult = {
  pairs: { front: string; back: string }[];
  invalidLines: number[]; // nomor baris (mulai 1) yang tidak bisa dibaca
};

// Pemisah yang dikenali, dicoba berurutan per baris. Tab dari salinan spreadsheet,
// " = " dan " - " (dengan spasi) supaya "Baru-baru ini" tidak ikut terbelah.
const SEPARATORS = ['<>', '\t', ' = ', ' - '];

export function parseBulk(text: string): BulkParseResult {
  const pairs: BulkParseResult['pairs'] = [];
  const invalidLines: number[] = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim() || line.trim().startsWith('#')) return;
    const sep = SEPARATORS.find(s => line.includes(s));
    if (!sep) { invalidLines.push(i + 1); return; }
    const at = line.indexOf(sep);
    const front = line.slice(0, at).trim();
    const back = line.slice(at + sep.length).trim();
    if (!front || !back) { invalidLines.push(i + 1); return; }
    pairs.push({ front, back });
  });
  return { pairs, invalidLines };
}
