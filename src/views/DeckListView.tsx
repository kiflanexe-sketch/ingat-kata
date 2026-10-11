import { useRef } from 'react';
import type { LangStats } from '../types.ts';
import { IconBrain, IconDownload, IconPlus, IconShuffle, IconStar, IconUpload } from '../components/Icon.tsx';

type Props = {
  stats: LangStats[];
  onOpen: (lang: string) => void;
  onPolyglot: () => void;
  onNewLanguage: () => void;
  onBackup: () => void;
  onRestore: (file: File) => void;
};

export const DeckListView = ({ stats, onOpen, onPolyglot, onNewLanguage, onBackup, onRestore }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const studiedLangs = stats.filter(s => s.active > 0).length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-indigo-50 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-indigo-100">
        <div className="flex justify-center mb-4 text-indigo-600"><IconBrain size={40} /></div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Saya</h1>
        <div className="space-y-4">
          {stats.map(s => (
            <button key={s.lang} onClick={() => onOpen(s.lang)} className="w-full bg-white border-2 border-gray-100 hover:border-indigo-500 hover:shadow-md p-4 rounded-xl transition-all text-left group relative overflow-hidden">
              <div className="flex justify-between items-center mb-2 gap-2">
                <span className="font-bold text-lg text-gray-800 truncate">{s.lang}</span>
                <div className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-lg shrink-0"><IconStar /> {s.mastered} Master</div>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-2">
                <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${s.total > 0 ? (s.mastered / s.total) * 100 : 0}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 font-medium">
                <span>{s.due > 0 ? <span className="text-orange-600 font-bold">{s.due} siap diulang</span> : `Aktif: ${s.active}`}</span>
                <span>Total: {s.total}</span>
              </div>
            </button>
          ))}
          {studiedLangs > 1 && (
            <button onClick={onPolyglot} className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-between group">
              <span className="flex items-center gap-2"><IconShuffle /> Tantangan Polyglot</span>
              <span className="group-hover:translate-x-1 transition-transform">Mulai →</span>
            </button>
          )}
          <div className="border-t border-gray-100 my-4 pt-4">
            <button onClick={onNewLanguage} className="w-full p-4 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-50 flex justify-center items-center gap-2"><IconPlus /> Pelajari Bahasa Baru</button>
          </div>
          <div className="flex justify-center gap-4 text-sm">
            <button onClick={onBackup} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 font-medium"><IconDownload size={16} /> Cadangkan data</button>
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 font-medium"><IconUpload size={16} /> Pulihkan</button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" aria-label="Pilih file cadangan" onChange={e => { const f = e.target.files?.[0]; if (f) onRestore(f); e.target.value = ''; }} />
          </div>
        </div>
      </div>
    </div>
  );
};
