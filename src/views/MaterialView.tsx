import type { Card } from '../types.ts';
import { WORD_DATABASE } from '../data/words.ts';
import { hasPair } from '../lib/srs.ts';
import { IconArrowLeft, IconCheck } from '../components/Icon.tsx';

type Props = {
  lang: string;
  cards: Card[];
  onImportLevel: (level: string) => void;
  onBack: () => void;
  onAddCustom: () => void;
};

export const MaterialView = ({ lang, cards, onImportLevel, onBack, onAddCustom }: Props) => {
  const levels = WORD_DATABASE[lang] ?? {};
  const levelNames = Object.keys(levels);

  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="mb-6 text-gray-500 hover:text-gray-800 flex items-center gap-2 font-medium"><IconArrowLeft /> Kembali ke Dashboard</button>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Kelola Materi Belajar</h1>
        <p className="text-gray-500 mb-8">Tambahkan paket kata ke dalam deck {lang} kamu.</p>
        <div className="space-y-4">
          {levelNames.map(level => {
            const words = levels[level];
            const missing = words.filter(w => !hasPair(cards, w.f, w.b)).length;
            return (
              <div key={level} className="bg-white p-5 rounded-xl border-2 border-gray-100 flex justify-between items-center gap-4">
                <div><h3 className="text-xl font-bold text-gray-800">{level}</h3><p className="text-sm text-gray-500">{words.length} Kata{missing > 0 && missing < words.length && ` · ${missing} belum ada di deck`}</p></div>
                {missing === 0
                  ? <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold text-sm flex items-center gap-2 shrink-0"><IconCheck /> Sudah Ditambah</span>
                  : <button onClick={() => onImportLevel(level)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 shrink-0">+ Tambahkan{missing < words.length ? ` ${missing}` : ''}</button>}
              </div>
            );
          })}
          {levelNames.length === 0 && (
            <div className="bg-white p-5 rounded-xl border-2 border-gray-100 text-gray-600">
              <p className="mb-3">Belum ada paket kata bawaan untuk {lang}. Masukkan kosakata sendiri, satu per satu atau sekaligus dari daftar.</p>
              <button onClick={onAddCustom} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Tambah kata sendiri</button>
            </div>
          )}
          {levelNames.length > 0 && <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-sm">💡 <strong>Tip:</strong> Kamu bisa menambahkan beberapa level sekaligus. Kata-kata akan masuk ke "Antrian" (Reserve) dan muncul secara bertahap saat kamu belajar.</div>}
        </div>
      </div>
    </div>
  );
};
