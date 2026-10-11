import type { AnswerRecord, SessionMode } from '../types.ts';
import { formatDueIn, percent } from '../lib/format.ts';
import { IconAlertCircle, IconCheck } from '../components/Icon.tsx';

type Props = {
  results: AnswerRecord[];
  mode: SessionMode;
  nextDueIn: number | null;
  onHome: () => void;
  onPracticeWrong: () => void;
};

export const SummaryView = ({ results, mode, nextDueIn, onHome, onPracticeWrong }: Props) => {
  const correct = results.filter(r => r.correct).length;
  const wrong = results.filter(r => !r.correct);
  const accuracy = results.length > 0 ? correct / results.length : 0;

  return (
    <div className="max-w-md mx-auto p-6 min-h-screen flex flex-col justify-center animate-fade-in">
      <div className="text-center space-y-2 mb-8">
        <p className="text-sm font-bold text-indigo-500 uppercase tracking-wider">{mode === 'practice' ? 'Latihan selesai' : 'Sesi selesai'}</p>
        <h1 className="text-5xl font-bold text-gray-800">{percent(accuracy)}</h1>
        <p className="text-gray-500">{correct} benar dari {results.length} kartu</p>
        {mode === 'review' && nextDueIn !== null && <p className="text-sm text-gray-400">Ulangan berikutnya {formatDueIn(nextDueIn)}.</p>}
      </div>

      {wrong.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <h2 className="text-sm font-bold text-red-500 mb-3 flex items-center gap-2"><IconAlertCircle size={16} /> Perlu diulang ({wrong.length})</h2>
          <ul className="divide-y divide-gray-100">
            {wrong.map((r, i) => (
              <li key={`${r.card.id}-${i}`} className="py-2 flex justify-between gap-4 text-sm">
                <span className="font-bold text-gray-800">{r.card.front}</span>
                <span className="text-gray-500 text-right">{r.card.back}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="p-3 bg-green-100 text-green-700 rounded-xl border border-green-200 text-sm mb-6 flex items-center gap-2"><IconCheck size={18} /> Semua kartu dijawab benar.</div>
      )}

      <div className="space-y-3">
        {wrong.length > 0 && <button onClick={onPracticeWrong} className="w-full py-3 rounded-xl bg-white border-2 border-red-100 text-red-500 font-bold hover:bg-red-50 transition-colors">Latih {wrong.length} kata yang salah</button>}
        <button onClick={onHome} autoFocus className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">Kembali ke Beranda</button>
      </div>
    </div>
  );
};
