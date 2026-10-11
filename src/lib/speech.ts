import { speakableText, speechCodeFor } from '../data/languages.ts';

export const canSpeak = (lang: string | undefined) =>
  !!lang && !!speechCodeFor(lang) && typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(front: string, lang: string) {
  const code = speechCodeFor(lang);
  if (!code || !canSpeak(lang)) return;
  const utterance = new SpeechSynthesisUtterance(speakableText(front, code));
  utterance.lang = code;
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
