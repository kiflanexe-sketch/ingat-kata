/** @type {import('tailwindcss').Config} */
// Nilai warna ada di src/index.css (variabel CSS); di sini hanya pemetaan nama.
const v = name => `var(--${name})`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: v('paper'),
        card: v('card'),
        ink: v('ink'),
        muted: v('muted'),
        subtle: v('subtle'),
        line: v('line'),
        control: v('control'),
        primary: { DEFAULT: v('primary'), hover: v('primary-hover'), soft: v('primary-soft') },
        ok: { DEFAULT: v('ok'), soft: v('ok-soft') },
        bad: { DEFAULT: v('bad'), soft: v('bad-soft') },
        due: { DEFAULT: v('due'), soft: v('due-soft') },
        box: { 0: v('box-0'), 1: v('box-1'), 2: v('box-2'), 3: v('box-3'), 4: v('box-4'), 5: v('box-5') },
      },
      fontFamily: {
        sans: v('font-ui'),
        word: v('font-word'),
      },
      fontSize: {
        meta: ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
        secondary: ['0.875rem', { lineHeight: '1.25rem' }],
        body: ['1rem', { lineHeight: '1.5rem' }],
        answer: ['1.25rem', { lineHeight: '1.75rem' }],
        section: ['1rem', { lineHeight: '1.5rem', fontWeight: '650' }],
        title: ['1.5rem', { lineHeight: '2rem', fontWeight: '650' }],
        number: ['3rem', { lineHeight: '1', fontWeight: '650' }],
        'word-sm': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '500' }],
        'word-md': ['2.25rem', { lineHeight: '2.75rem', fontWeight: '500' }],
        word: ['2.75rem', { lineHeight: '3.25rem', fontWeight: '500' }],
      },
      borderRadius: {
        card: '4px',
        control: '8px',
        sheet: '16px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 0 var(--line), 0 6px 16px -10px rgb(36 38 43 / 0.25)',
        sheet: '0 -4px 24px -8px rgb(36 38 43 / 0.25)',
      },
      maxWidth: {
        content: '34rem',
      },
      transitionDuration: {
        state: '150ms',
      },
    },
  },
  plugins: [],
};
