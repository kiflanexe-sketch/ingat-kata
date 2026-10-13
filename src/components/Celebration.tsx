import type { CSSProperties } from 'react';

// Konfeti kertas untuk kuis sempurna. Posisi dan warna dari deret golden ratio (bukan acak),
// jadi render tetap murni tetapi sebarannya terlihat alami. Disembunyikan bila gerak dikurangi.
const COLORS = ['#2e4a78', '#d9756f', '#8fb3de', '#e6b85c', '#7fb08a', '#cfdcee'];
const PIECES = 70;
const frac = (x: number) => x - Math.floor(x);

export const Confetti = () => (
  <div className="confetti" aria-hidden="true">
    {Array.from({ length: PIECES }, (_, i) => {
      const a = frac(i * 0.618034);
      const b = frac(i * 0.414214 + 0.3);
      const c = frac(i * 0.732051 + 0.6);
      const style = {
        left: `${a * 100}%`,
        background: COLORS[i % COLORS.length],
        width: `${6 + b * 5}px`,
        height: `${9 + c * 6}px`,
        borderRadius: i % 3 === 0 ? '50%' : '2px',
        '--delay': `${b * 0.9}s`,
        '--dur': `${2.2 + c * 1.4}s`,
        '--drift': `${(c - 0.5) * 160}px`,
        '--spin': `${(b > 0.5 ? 1 : -1) * (360 + a * 540)}deg`,
      } as CSSProperties;
      return <i key={i} style={style} />;
    })}
  </div>
);

// Medali "Sempurna" yang muncul memantul di atas hasil kuis.
export const PerfectMedal = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true" focusable="false" className="celebrate-pop shrink-0">
    <path d="M24 4h10l-6 22h-10z" fill="#d9756f" />
    <path d="M48 4h-10l6 22h10z" fill="#2e4a78" />
    <circle cx="36" cy="44" r="24" fill="#e6b85c" stroke="#7d5410" strokeWidth="2" />
    <circle cx="36" cy="44" r="17" fill="none" stroke="#fffefa" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="3 3" />
    <polygon points="36,31 39.8,39.2 48.6,40 41.9,45.9 43.9,54.6 36,50 28.1,54.6 30.1,45.9 23.4,40 32.2,39.2" fill="#fffefa" />
  </svg>
);
