export type CheckResult = { correct: boolean; note?: string };

const GERMAN_ARTICLE = /^(der|die|das) /;
const NON_LATIN = /[^\s\u0020-\u024f]/;

// Huruf kecil, tanpa diakritik Latin (ä -> a, é -> e), ß -> ss, tanpa tanda baca,
// tanda hubung dianggap spasi. Aksara non-Latin (kana, hangul, Arab) tidak diubah.
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .replace(/ß/g, 'ss')
    .replace(/[-‐–_]/g, ' ')
    .replace(/[.,!?¿¡"“”'’`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

type Variant = { text: string; withoutArticle: boolean };

// Semua bentuk jawaban yang diterima untuk satu kunci jawaban.
// "Perlu/Penting" -> perlu, penting. "Watashi (私)" -> watashi, 私. "To eat" -> eat.
export function answerVariants(answer: string): Variant[] {
  const raw = new Set<string>([answer]);
  answer.split(/[/;,]/).forEach(p => raw.add(p));
  for (const part of Array.from(raw)) {
    raw.add(part.replace(/[(（][^)）]*[)）]/g, ' '));
    // Isi kurung hanya diterima bila aksara asli ("私"), bukan keterangan seperti "(Pr)".
    for (const m of part.matchAll(/[(（]([^)）]+)[)）]/g)) if (NON_LATIN.test(m[1])) raw.add(m[1]);
  }
  const out = new Map<string, Variant>();
  for (const r of raw) {
    const text = normalize(r);
    if (!text) continue;
    out.set(text, { text, withoutArticle: false });
    if (text.startsWith('to ')) out.set(text.slice(3), { text: text.slice(3), withoutArticle: false });
    if (GERMAN_ARTICLE.test(text)) {
      const bare = text.replace(GERMAN_ARTICLE, '');
      if (!out.has(bare)) out.set(bare, { text: bare, withoutArticle: true });
    }
  }
  return Array.from(out.values());
}

// Jarak Damerau-Levenshtein (versi optimal string alignment).
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

const typoAllowance = (length: number) => (length >= 9 ? 2 : length >= 5 ? 1 : 0);

// `alternatives` = jawaban kartu lain dengan pertanyaan yang sama
// (mis. "Mungkin" -> Vielleicht dan Möglich), juga dianggap benar.
export function checkAnswer(input: string, answer: string, alternatives: string[] = []): CheckResult {
  const given = normalize(input);
  if (!given) return { correct: false };
  const variants = answerVariants(answer);

  const exact = variants.find(v => v.text === given);
  if (exact && !exact.withoutArticle) return { correct: true };
  if (exact) return { correct: true, note: `Benar. Ingat artikelnya: ${answer}` };

  for (const alt of alternatives) {
    if (answerVariants(alt).some(v => v.text === given)) {
      return { correct: true, note: `Benar juga. Yang dimaksud kartu ini: ${answer}` };
    }
  }

  const close = variants.some(v => given.length >= 3 && editDistance(given, v.text) <= typoAllowance(v.text.length));
  if (close) return { correct: true, note: `Hampir tepat. Ejaan yang benar: ${answer}` };

  return { correct: false };
}
