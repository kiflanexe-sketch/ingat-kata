// Efek suara kuis kilat, disintesis dengan Web Audio API: tanpa file audio, tetap jalan offline.
// Nada lembut (gelombang segitiga, naik-turun pelan) supaya tidak mengagetkan.

export type Sfx = 'correct' | 'wrong' | 'timeout' | 'perfect';

type Note = { f: number; at: number; len: number; gain?: number; type?: OscillatorType };

// Frekuensi dalam Hz, waktu dalam detik dari awal efek.
const SOUNDS: Record<Sfx, Note[]> = {
  // "ting-ting" naik: A5 lalu E6
  correct: [{ f: 880, at: 0, len: 0.12 }, { f: 1318.5, at: 0.09, len: 0.22 }],
  // turun pelan: E4 lalu B3
  wrong: [{ f: 329.6, at: 0, len: 0.16, gain: 0.9 }, { f: 246.9, at: 0.13, len: 0.3, gain: 0.9 }],
  // dua ketukan rendah
  timeout: [{ f: 220, at: 0, len: 0.1, gain: 0.8 }, { f: 220, at: 0.16, len: 0.18, gain: 0.8 }],
  // arpeggio C mayor lalu akor, dengan kilau di atas
  perfect: [
    { f: 523.25, at: 0, len: 0.16 }, { f: 659.25, at: 0.11, len: 0.16 }, { f: 783.99, at: 0.22, len: 0.16 },
    { f: 1046.5, at: 0.33, len: 0.7 }, { f: 659.25, at: 0.33, len: 0.7, gain: 0.5 }, { f: 783.99, at: 0.33, len: 0.7, gain: 0.5 },
    { f: 2093, at: 0.5, len: 0.25, gain: 0.25, type: 'sine' }, { f: 2637, at: 0.62, len: 0.3, gain: 0.25, type: 'sine' },
  ],
};

const VOLUME = 0.22;

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = typeof window !== 'undefined'
    ? window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    : undefined;
  if (!Ctor) return null;
  try { ctx = new Ctor(); } catch { ctx = null; }
  return ctx;
}

// Browser hanya mengizinkan suara setelah pengguna menyentuh layar; panggil dari tombol.
export function unlockSfx() {
  const c = context();
  if (c && c.state === 'suspended') void c.resume().catch(() => {});
}

export function playSfx(kind: Sfx) {
  const c = context();
  if (!c) return;
  if (c.state === 'suspended') void c.resume().catch(() => {});
  try {
    const t0 = c.currentTime + 0.01;
    for (const n of SOUNDS[kind]) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = n.type ?? 'triangle';
      osc.frequency.value = n.f;
      const peak = VOLUME * (n.gain ?? 1);
      const start = t0 + n.at;
      // Serangan cepat lalu meluruh, supaya tidak ada bunyi "klik".
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + n.len);
      osc.connect(gain).connect(c.destination);
      osc.start(start);
      osc.stop(start + n.len + 0.05);
    }
  } catch { /* audio tidak tersedia, abaikan */ }
}

// Lama efek (ms), dipakai untuk menunda pengucapan kata supaya tidak bertumpuk.
export const sfxDuration = (kind: Sfx) => Math.round(Math.max(...SOUNDS[kind].map(n => n.at + n.len)) * 1000);
