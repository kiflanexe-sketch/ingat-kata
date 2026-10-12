import { useSyncExternalStore } from 'react';
import { speakableText, speechCodeFor } from '../data/languages.ts';

// Pengucapan lewat Web Speech API. Suara disediakan perangkat (Google TTS di Android,
// Siri voices di iOS, suara sistem di desktop), jadi ketersediaannya berbeda per perangkat.

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

let voices: SpeechSynthesisVoice[] = [];
const listeners = new Set<() => void>();

function refreshVoices() {
  const s = synth();
  if (!s) return;
  voices = s.getVoices();
  listeners.forEach(l => l());
}

if (synth()) {
  refreshVoices();
  // Chrome dan Android memuat daftar suara secara asinkron.
  synth()!.addEventListener?.('voiceschanged', refreshVoices);
}

const normLang = (lang: string) => lang.replace('_', '-').toLowerCase();

// Suara paling cocok: kode persis (ja-JP) dulu, lalu bahasa yang sama (ja-*);
// suara lokal didahulukan karena tetap jalan tanpa internet.
export function voiceFor(code: string): SpeechSynthesisVoice | undefined {
  const exact = normLang(code);
  const base = exact.slice(0, 2);
  const rank = (v: SpeechSynthesisVoice) => (normLang(v.lang) === exact ? 0 : 2) + (v.localService ? 0 : 1);
  return voices.filter(v => normLang(v.lang).slice(0, 2) === base).sort((a, b) => rank(a) - rank(b))[0];
}

export const canSpeak = (lang: string | undefined) => !!lang && !!speechCodeFor(lang) && !!synth();

export type VoiceStatus = 'available' | 'missing' | 'unknown';

// 'unknown' bila browser belum (atau tidak pernah) memberi daftar suara, mis. sebagian iOS.
export function voiceStatus(lang: string): VoiceStatus {
  const code = speechCodeFor(lang);
  if (!code || !synth()) return 'missing';
  if (voices.length === 0) return 'unknown';
  return voiceFor(code) ? 'available' : 'missing';
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

// Berlangganan daftar suara perangkat; komponen dirender ulang saat daftar selesai dimuat.
export const useVoices = () => useSyncExternalStore(subscribe, () => voices, () => voices);

// Ikut diperbarui saat daftar suara perangkat selesai dimuat.
export function useVoiceStatus(lang: string | undefined): VoiceStatus {
  useVoices();
  return lang ? voiceStatus(lang) : 'missing';
}

// Referensi ke ucapan yang sedang berjalan. Tanpa ini Chrome bisa membuang objeknya
// sebelum selesai, sehingga suara terpotong dan onend tidak pernah terpanggil.
let current: SpeechSynthesisUtterance | null = null;
const MAX_WAIT = 4000;

// Ucapkan kata asing. Promise selesai saat suara selesai, gagal, atau paling lama 4 detik,
// supaya layar belajar bisa menunggu suara sebelum pindah kartu.
export function speak(front: string, lang: string): Promise<void> {
  const s = synth();
  const code = speechCodeFor(lang);
  if (!s || !code) return Promise.resolve();

  const utterance = new SpeechSynthesisUtterance(speakableText(front, code));
  utterance.lang = code;
  utterance.rate = 0.9;
  const voice = voiceFor(code);
  if (voice) utterance.voice = voice;

  return new Promise(resolve => {
    const timer = setTimeout(() => finish(), MAX_WAIT);
    const finish = () => {
      clearTimeout(timer);
      if (current === utterance) current = null;
      resolve();
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    const busy = s.speaking || s.pending;
    s.cancel();
    current = utterance;
    // Chrome kadang membuang ucapan yang dipanggil tepat setelah cancel(); beri jeda
    // sebentar hanya bila memang ada suara yang dihentikan.
    if (busy) setTimeout(() => s.speak(utterance), 60);
    else s.speak(utterance);
  });
}
