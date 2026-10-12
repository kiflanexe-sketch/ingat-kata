import { flushSync } from 'react-dom';

// Jenis transisi, dibaca CSS lewat <html data-nav="..."> (lihat src/index.css).
export type TransitionKind = 'forward' | 'back' | 'fade' | 'card';

let current = 0;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Jalankan perubahan state di dalam View Transition bila browser mendukung.
// Tanpa dukungan (atau saat pengguna minta gerak dikurangi) perubahan langsung terjadi.
export function withTransition(update: () => void, kind: TransitionKind) {
  if (typeof document === 'undefined' || !('startViewTransition' in document) || prefersReducedMotion()) {
    update();
    return;
  }
  const id = ++current;
  const root = document.documentElement;
  root.dataset.nav = kind;
  const transition = document.startViewTransition(() => flushSync(update));
  transition.finished.finally(() => {
    if (id === current) delete root.dataset.nav;
  });
}
