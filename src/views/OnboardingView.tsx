import { useState } from 'react';
import { SCRIPT_LEVELS, WORD_DATABASE } from '../data/words.ts';
import { displayLangName, levelShortName, sampleWord } from '../data/languages.ts';
import { Page, TopBar, Title, Word } from '../components/ui.tsx';
import { IconChevronRight } from '../components/Icon.tsx';

type Props = {
  existingLangs: string[];
  onPick: (lang: string) => void;
  onCancel?: () => void;
  onSettings: () => void;
};

export const OnboardingView = ({ existingLangs, onPick, onCancel, onSettings }: Props) => {
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');
  const languages = Object.keys(WORD_DATABASE);

  const submitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customName.trim().replace(/\s+/g, ' ');
    if (!name) return;
    if (name.length > 30) { setError('Nama bahasa maksimal 30 karakter.'); return; }
    const clash = [...languages, ...existingLangs].find(l => displayLangName(l).toLowerCase() === name.toLowerCase());
    onPick(clash ?? name);
  };

  return (
    <Page>
      <TopBar onBack={onCancel} backLabel="Bahasamu" />
      <Title sub="Kata ditanyakan bolak-balik dari bahasa Indonesia. Yang kamu jawab benar muncul makin jarang: besok, 3 hari, seminggu, dua minggu, lalu sebulan.">
        Pilih bahasa
      </Title>

      <ul>
        {languages.map(lang => {
          const levels = Object.keys(WORD_DATABASE[lang]);
          const firstVocab = levels.find(l => !SCRIPT_LEVELS.has(l)) ?? levels[0];
          const first = WORD_DATABASE[lang][firstVocab][0];
          const started = existingLangs.includes(lang);
          return (
            <li key={lang}>
              <button onClick={() => onPick(lang)} className="w-full flex items-center gap-4 min-h-16 py-3 border-t border-line text-left group">
                <span className="flex-1">
                  <span className="block font-semibold text-ink group-hover:underline underline-offset-4">{displayLangName(lang)}</span>
                  <span className="block text-secondary text-muted">{levels.map(levelShortName).join(' · ')}{started && ' · sudah dimulai'}</span>
                </span>
                <Word text={sampleWord(first.f, lang)} lang={lang} size="row" className="text-muted" />
                <IconChevronRight size={18} className="text-subtle" />
              </button>
            </li>
          );
        })}
      </ul>

      <form onSubmit={submitCustom} className="mt-10">
        <label htmlFor="custom-lang" className="block text-section text-ink">Bahasa lain</label>
        <p className="text-secondary text-muted mb-3">Belum ada paket kata bawaan; kosakatanya kamu isi sendiri.</p>
        <div className="flex gap-2">
          <input id="custom-lang" value={customName} onChange={e => { setCustomName(e.target.value); setError(''); }} placeholder="Mis. Mandarin, Sunda, Prancis"
            className="flex-1 min-w-0 min-h-12 px-3 rounded-control border-[1.5px] border-control bg-card text-body placeholder:text-subtle focus:border-primary outline-none" />
          <button type="submit" disabled={!customName.trim()} className="min-h-12 px-5 rounded-control bg-primary text-white font-semibold hover:bg-primary-hover disabled:opacity-40">Buat</button>
        </div>
        {error && <p className="text-secondary text-bad mt-2" role="alert">{error}</p>}
      </form>

      {existingLangs.length === 0 && (
        <p className="mt-10 text-secondary text-muted">
          Pindah dari perangkat lain?{' '}
          <button onClick={onSettings} className="font-semibold text-primary underline underline-offset-4">Pulihkan dari file cadangan</button>
        </p>
      )}
    </Page>
  );
};
