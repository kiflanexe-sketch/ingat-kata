import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react';
import { speechCodeFor } from '../data/languages.ts';
import { IconArrowLeft, IconChevronRight } from './Icon.tsx';

type ButtonProps = ComponentProps<'button'> & { variant?: 'primary' | 'secondary' | 'danger' };

const BUTTON_STYLES = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'border-[1.5px] border-primary text-primary hover:bg-primary-soft',
  danger: 'bg-bad text-white hover:opacity-90',
};

export const Button = ({ variant = 'primary', className = '', ...props }: ButtonProps) => (
  <button
    className={`w-full min-h-12 px-4 py-3 rounded-control font-semibold text-body transition-colors duration-state disabled:opacity-40 disabled:cursor-not-allowed ${BUTTON_STYLES[variant]} ${className}`}
    {...props}
  />
);

export const TextButton = ({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={`min-h-11 px-1 text-secondary font-semibold text-primary hover:underline underline-offset-4 ${className}`} {...props} />
);

export const Page = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <main className={`mx-auto w-full max-w-content px-5 pb-16 ${className}`}>{children}</main>
);

// Baris atas: tombol kembali di kiri, aksi opsional di kanan.
export const TopBar = ({ backLabel, onBack, right }: { backLabel?: string; onBack?: () => void; right?: ReactNode }) => (
  <div className="flex items-center justify-between min-h-14 -mx-1">
    {onBack ? (
      <button onClick={onBack} className="flex items-center gap-1 min-h-11 px-1 text-secondary text-muted hover:text-ink">
        <IconArrowLeft size={18} /> {backLabel ?? 'Kembali'}
      </button>
    ) : <span />}
    {right}
  </div>
);

export const Title = ({ children, sub }: { children: ReactNode; sub?: ReactNode }) => (
  <div className="mt-2 mb-6">
    <h1 className="text-title text-ink">{children}</h1>
    {sub && <p className="mt-1 text-secondary text-muted">{sub}</p>}
  </div>
);

// Aksi sekunder sebagai daftar bergaris, bukan deret tombol.
export const LinkRow = ({ children, hint, onClick, tone = 'primary' }: { children: ReactNode; hint?: ReactNode; onClick: () => void; tone?: 'primary' | 'danger' }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between gap-4 min-h-12 py-3 border-t border-line text-left group">
    <span>
      <span className={`block font-semibold ${tone === 'danger' ? 'text-bad' : 'text-primary'} group-hover:underline underline-offset-4`}>{children}</span>
      {hint && <span className="block text-secondary text-muted">{hint}</span>}
    </span>
    <IconChevronRight size={18} className="text-subtle shrink-0" />
  </button>
);

const BOX_BG = ['bg-box-0', 'bg-box-1', 'bg-box-2', 'bg-box-3', 'bg-box-4', 'bg-box-5'];

export const BoxChip = ({ box }: { box: number }) => (
  <span className={`inline-block px-2.5 py-0.5 rounded-pill text-meta text-ink ${BOX_BG[box] ?? BOX_BG[0]}`}>Kotak {box}</span>
);

// Sebaran kartu aktif di kotak 0-5. Angka selalu tertulis, warna hanya pendukung.
export const BoxShelf = ({ counts }: { counts: number[] }) => {
  const max = Math.max(1, ...counts);
  return (
    <figure>
      <div className="grid grid-cols-6 gap-1 items-end h-16" aria-hidden="true">
        {counts.map((n, i) => (
          <span key={i} className={`rounded-t-[3px] border-t-2 border-black/15 ${BOX_BG[i]}`} style={{ height: `${Math.max(6, (n / max) * 100)}%` }} />
        ))}
      </div>
      <dl className="grid grid-cols-6 gap-1 mt-1 text-center">
        {counts.map((n, i) => (
          <div key={i}>
            <dt className="text-meta text-subtle">Kotak {i}</dt>
            <dd className="text-secondary text-ink tabular-nums">{n}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
};


// Kata asing dengan font kamus, atribut lang supaya aksara memakai font yang benar.
export const Word = ({ text, lang, size = 'auto', className = '' }: { text: string; lang?: string; size?: 'auto' | 'row'; className?: string }) => {
  const code = lang ? speechCodeFor(lang) : 'id';
  const length = [...text].length;
  const scale = size === 'row' ? 'text-answer' : length > 20 ? 'text-word-sm' : length > 12 ? 'text-word-md' : 'text-word';
  return <span lang={code} dir="auto" className={`font-word break-words ${scale} ${className}`}>{text}</span>;
};
