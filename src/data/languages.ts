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

// Huruf hangul lepas (ㄱ, ㅏ) dan huruf Arab tanpa harakat sering tidak dibaca mesin
// suara. Ucapkan sebagai suku kata: konsonan + ㅏ (가), ㅇ + vokal (아), huruf + fathah (بَ).
const CHOSEONG = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const JUNGSEONG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const hangulSyllable = (cho: number, jung: number) => String.fromCharCode(0xac00 + (cho * 21 + jung) * 28);

function speakableLetter(letter: string, code: string): string | null {
  if (code === 'ko-KR') {
    const cho = CHOSEONG.indexOf(letter);
    if (cho >= 0) return hangulSyllable(cho, 0);
    const jung = JUNGSEONG.indexOf(letter);
    if (jung >= 0) return hangulSyllable(CHOSEONG.indexOf('ㅇ'), jung);
  }
  if (code === 'ar-SA' && /^[\u0621-\u064a]$/.test(letter)) {
    return (letter === 'ا' ? 'أ' : letter) + '\u064e';
  }
  return null;
}

export function speakableText(front: string, code: string): string {
  const letter = speakableLetter(front.trim(), code);
  if (letter) return letter;
  const inParens = front.match(/[(（]([^)）]+)[)）]/);
  if (inParens && NATIVE_SCRIPT_IN_PARENS.has(code)) return inParens[1].trim();
  return front.replace(/\s*[(（][^)）]*[)）]\s*/g, ' ').trim();
}

// Contoh kata dalam aksara aslinya, untuk penanda bahasa di layar pilih bahasa.
export function sampleWord(front: string, lang: string): string {
  const code = speechCodeFor(lang);
  return code ? speakableText(front, code) : front;
}

// "Pemula (A1)" -> "A1", "Pemula" -> "Pemula".
export const levelShortName = (level: string) => level.match(/\(([^)]+)\)/)?.[1] ?? level;
