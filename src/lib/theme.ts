// Tema tampilan: Terang, Gelap, atau Ikut sistem. Warna ada di src/index.css (:root[data-theme='dark']).

export type ThemeSetting = 'system' | 'light' | 'dark';
export const THEMES: ThemeSetting[] = ['system', 'light', 'dark'];
export const DEFAULT_THEME: ThemeSetting = 'system';

// Warna bilah status browser/aplikasi. Sama dengan --paper; juga dipakai skrip di index.html.
const THEME_COLOR = { light: '#faf7f0', dark: '#16181c' };

const darkQuery = () => (typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: dark)') : undefined);

export const resolveTheme = (setting: ThemeSetting, systemDark: boolean): 'light' | 'dark' =>
  setting === 'system' ? (systemDark ? 'dark' : 'light') : setting;

export function applyTheme(setting: ThemeSetting) {
  if (typeof document === 'undefined') return;
  const theme = resolveTheme(setting, !!darkQuery()?.matches);
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}

// Pasang tema dan, untuk "Ikut sistem", ikuti perubahan mode perangkat selama aplikasi terbuka.
export function syncTheme(setting: ThemeSetting): () => void {
  applyTheme(setting);
  const query = darkQuery();
  if (setting !== 'system' || !query) return () => {};
  const onChange = () => applyTheme('system');
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
