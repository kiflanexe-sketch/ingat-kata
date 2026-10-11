import { useState } from 'react';
import { WORD_DATABASE } from '../data/words.ts';
import { IconArrowLeft, IconGlobe } from '../components/Icon.tsx';

type Props = {
  existingLangs: string[];
  onPick: (lang: string) => void;
  onCancel?: () => void;
};

export const OnboardingView = ({ existingLangs, onPick, onCancel }: Props) => {
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');
  const languages = Object.keys(WORD_DATABASE);

  const submitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customName.trim().replace(/\s+/g, ' ');
    if (!name) return;
    if (name.length > 30) { setError('Nama bahasa maksimal 30 karakter.'); return; }
    const clash = [...languages, ...existingLangs].find(l => l.toLowerCase() === name.toLowerCase());
    if (clash) { onPick(clash); return; }
    onPick(name);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-indigo-50 animate-fade-in relative">
      {onCancel && <button onClick={onCancel} className="absolute top-6 left-6 text-gray-500 hover:text-gray-800 flex items-center gap-2 font-medium"><IconArrowLeft /> Batal</button>}
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-indigo-100">
        <div className="flex justify-center mb-6 text-indigo-600"><IconGlobe size={24} /></div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mulai Petualangan Baru</h1>
        <p className="text-gray-500 mb-8">Bahasa apa yang ingin kamu pelajari?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {languages.map(lang => {
            const started = existingLangs.includes(lang);
            return (
              <button key={lang} onClick={() => onPick(lang)} className="p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all font-bold text-lg text-gray-700 flex items-center justify-between group">
                <span>{lang}</span>
                <span className="text-sm font-semibold text-indigo-500 group-hover:translate-x-1 transition-transform">{started ? 'Lanjutkan →' : '→'}</span>
              </button>
            );
          })}
        </div>
        <form onSubmit={submitCustom} className="mt-8 text-left">
          <label htmlFor="custom-lang" className="text-sm font-semibold text-gray-600 block mb-2">Bahasa lain (isi kata sendiri)</label>
          <div className="flex gap-2">
            <input id="custom-lang" value={customName} onChange={e => { setCustomName(e.target.value); setError(''); }} placeholder="Mis. Mandarin, Sunda, Prancis" className="flex-1 min-w-0 p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
            <button type="submit" disabled={!customName.trim()} className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed">Buat</button>
          </div>
          {error && <p className="text-sm text-red-600 mt-2" role="alert">{error}</p>}
        </form>
      </div>
    </div>
  );
};
