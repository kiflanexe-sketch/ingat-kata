import type { LangStats } from '../types.ts';
import { smartAddCount } from '../lib/srs.ts';
import { formatDueIn, percent } from '../lib/format.ts';
import { IconAlertCircle, IconBook, IconBrain, IconClock, IconDownload, IconGlobe, IconPlus, IconRepeat, IconSettings, IconShuffle } from '../components/Icon.tsx';

type Props = {
  stats: LangStats;
  relearnCount: number;
  nextDueIn: number | null;
  lastAccuracy: number | null;
  onStart: () => void;
  onAdd: () => void;
  onList: () => void;
  onRepeatAll: () => void;
  onRepeatWrong: () => void;
  onSmartAdd: () => void;
  onChangeLang: () => void;
  onManageMaterial: () => void;
};

export const HomeView = ({ stats, relearnCount, nextDueIn, lastAccuracy, onStart, onAdd, onList, onRepeatAll, onRepeatWrong, onSmartAdd, onChangeLang, onManageMaterial }: Props) => {
  const lang = stats.lang;
  const toAdd = smartAddCount(lastAccuracy);
  const addable = Math.min(toAdd, stats.reserve);
  let addBtnColor = 'border-indigo-100 text-indigo-600 hover:bg-indigo-50';
  if (lastAccuracy !== null) {
    if (lastAccuracy >= 0.8) addBtnColor = 'border-green-200 text-green-600 hover:bg-green-50';
    else if (lastAccuracy >= 0.5) addBtnColor = 'border-orange-200 text-orange-600 hover:bg-orange-50';
    else addBtnColor = 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50';
  }

  if (stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 p-4 animate-fade-in">
        <div className="text-center space-y-2"><h1 className="text-3xl font-bold text-indigo-600 flex items-center justify-center gap-2"><IconBrain size={40} /> IngatKata</h1><p className="text-gray-500">Selamat datang di kursus {lang}</p></div>
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full text-center space-y-6">
          <div className="text-6xl">📦</div><h2 className="text-xl font-bold text-gray-800">Deck Kamu Masih Kosong</h2><p className="text-gray-500 text-sm">Pilih materi untuk memulai, atau buat kata-katamu sendiri.</p>
          <button onClick={onManageMaterial} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">Pilih Materi / Level</button>
          <div className="relative py-2"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Atau</span></div></div>
          <button onClick={onAdd} className="w-full py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50">Tambah Kata Sendiri (Custom)</button>
        </div>
        <button onClick={onChangeLang} className="text-sm text-gray-400 hover:text-gray-600 underline">Ganti Bahasa</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8 p-4 animate-fade-in relative">
      <div className="absolute top-0 right-0 p-4"><button onClick={onChangeLang} className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors"><IconGlobe size={24} /> {lang} <span className="text-gray-400 text-xs ml-1">| Ganti</span></button></div>
      <div className="text-center space-y-2 mt-8"><h1 className="text-4xl font-bold text-indigo-600 flex items-center justify-center gap-3"><IconBrain size={40} /> IngatKata</h1><p className="text-gray-500">Belajar {lang}</p></div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
        <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 text-center"><div className="text-2xl font-bold text-orange-500">{stats.due}</div><div className="text-xs text-gray-500 font-medium">Siap Review</div></div>
        <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 text-center"><div className="text-2xl font-bold text-green-500">{stats.mastered}</div><div className="text-xs text-gray-500 font-medium">Master</div></div>
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-center"><div className="text-2xl font-bold text-gray-500 flex justify-center items-center gap-1">{stats.reserve}</div><div className="text-xs text-gray-400 font-medium">Antrian</div></div>
      </div>
      <div className="w-full max-w-md space-y-3">
        {stats.due > 0 ? (
          <button onClick={onStart} className="w-full py-4 rounded-xl text-xl font-bold shadow-lg bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center gap-2">Mulai Belajar <IconClock size={24} /></button>
        ) : (
          <div className="space-y-3 text-center">
            <div className="p-3 bg-green-100 text-green-700 rounded-xl border border-green-200 text-sm mb-4">
              🎉 <strong>Target Tercapai!</strong> Tidak ada kartu yang perlu diulang saat ini.
              {nextDueIn !== null && <span className="block mt-1">Kartu berikutnya jatuh tempo {formatDueIn(nextDueIn)}.</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={onRepeatAll} disabled={stats.active === 0} className="py-3 px-2 rounded-xl bg-white border-2 border-indigo-100 text-indigo-600 font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"><IconRepeat /> Ulangi Semua</button>
              <button onClick={onRepeatWrong} disabled={relearnCount === 0} className="py-3 px-2 rounded-xl bg-white border-2 border-red-100 text-red-500 font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"><IconAlertCircle /> Ulangi Salah ({relearnCount})</button>
            </div>
            {stats.reserve > 0 ? (
              <button onClick={onSmartAdd} disabled={addable === 0} className={`w-full py-3 px-4 rounded-xl bg-white border-2 font-bold transition-colors flex items-center justify-center gap-2 text-sm mt-2 ${addBtnColor}`}>
                <IconDownload /> {addable > 0 ? `+${addable} Kata Baru` : `Fokus Dulu (Nilai ${percent(lastAccuracy ?? 0)})`}
              </button>
            ) : (
              <button onClick={onManageMaterial} className="w-full py-3 px-4 rounded-xl bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 flex items-center justify-center gap-2 text-sm mt-2">Antrian kosong, ambil paket kata lagi</button>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <button onClick={onAdd} className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"><IconPlus /> Tambah</button>
        <button onClick={onManageMaterial} className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-orange-100 text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-colors"><IconBook /> Materi</button>
        <button onClick={onList} className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors"><IconSettings /> Atur</button>
      </div>
    </div>
  );
};

type PolyglotProps = { perLang: { lang: string; active: number }[]; onStart: () => void; onExit: () => void };

export const PolyglotHomeView = ({ perLang, onStart, onExit }: PolyglotProps) => {
  const total = perLang.reduce((n, l) => n + l.active, 0);
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8 p-4 animate-fade-in relative">
      <div className="absolute top-0 right-0 p-4">
        <button onClick={onExit} className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors"><IconGlobe size={24} /> Mode Gabungan <span className="text-gray-400 text-xs ml-1">| Keluar</span></button>
      </div>
      <div className="text-center space-y-2 mt-8">
        <h1 className="text-4xl font-bold text-purple-600 flex items-center justify-center gap-3"><IconShuffle size={24} /> Tantangan Polyglot</h1>
        <p className="text-gray-500">Latihan campuran dari semua bahasa aktif Anda.</p>
      </div>
      <div className="bg-purple-50 border-2 border-purple-100 p-6 rounded-2xl text-center max-w-md w-full">
        <p className="text-purple-800 font-medium mb-2">Siap menguji kemampuan otak berpindah bahasa?</p>
        <p className="text-sm text-gray-600">{total} kata aktif dari {perLang.map(l => `${l.lang} (${l.active})`).join(', ')}. Mode ini tidak menambah kata baru dan tidak menaikkan level kartu; jawaban salah tetap dijadwalkan ulang.</p>
      </div>
      <div className="w-full max-w-md">
        <button onClick={onStart} className="w-full py-4 rounded-xl text-xl font-bold shadow-lg bg-purple-600 text-white hover:bg-purple-700 hover:scale-105 transition-all flex items-center justify-center gap-2">Mulai Tantangan <IconClock size={24} /></button>
      </div>
    </div>
  );
};
