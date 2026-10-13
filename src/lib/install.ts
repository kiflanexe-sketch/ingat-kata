import { useSyncExternalStore } from 'react';

// Event `beforeinstallprompt` (Chrome/Edge/Samsung Internet di Android dan desktop).
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

let deferred: InstallPromptEvent | null = null;
let installed = false; // dipasang dari halaman ini (event appinstalled)
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    notify();
  });
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

// iOS/iPadOS tidak punya prompt pasang; pengguna harus lewat menu Bagikan di Safari.
// Safari di Mac (macOS 14+) bisa memasang lewat menu File, tanpa event pemasangan.
export const isSafariMac = () =>
  typeof navigator !== 'undefined' && /Macintosh/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) &&
  !/Chrome|Chromium|Edg|Firefox/.test(navigator.userAgent) && navigator.maxTouchPoints <= 1;

export const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export function useInstallPrompt() {
  const event = useSyncExternalStore(subscribe, () => deferred, () => null);
  const justInstalled = useSyncExternalStore(subscribe, () => installed, () => false);
  const install = async () => {
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    deferred = null;
    notify();
  };
  return { canInstall: event !== null, justInstalled, install };
}
