// Kode BCP-47 untuk Web Speech API, per kunci bahasa di WORD_DATABASE.
// Bahasa buatan pengguna tidak punya kode, jadi tombol dengar tidak muncul.
const SPEECH_CODES: Record<string, string> = {
  'Inggris 🇬🇧': 'en-GB',
  'Jepang 🇯🇵': 'ja-JP',
  'Korea 🇰🇷': 'ko-KR',
  'Jerman 🇩🇪': 'de-DE',
  'Arab 🇸🇦': 'ar-SA',
};

// Bahasa yang kartunya ditulis "Romanisasi (aksara asli)": yang diucapkan aksara aslinya.
const NATIVE_SCRIPT_IN_PARENS = new Set(['ja-JP', 'ko-KR', 'ar-SA']);

export const MIXED_DECK = 'Gabungan';

export function speechCodeFor(lang: string): string | undefined {
  return SPEECH_CODES[lang];
}

export function displayLangName(lang: string): string {
  return lang.replace(/[\u{1F1E6}-\u{1F1FF}]|\p{Extended_Pictographic}/gu, '').trim() || lang;
}

export function speakableText(front: string, code: string): string {
  const inParens = front.match(/[(（]([^)）]+)[)）]/);
  if (inParens && NATIVE_SCRIPT_IN_PARENS.has(code)) return inParens[1].trim();
  return front.replace(/\s*[(（][^)）]*[)）]\s*/g, ' ').trim();
}
