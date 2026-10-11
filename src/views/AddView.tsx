import { useEffect, useState } from 'react';
import { parseBulk } from '../lib/bulk.ts';
import { displayLangName } from '../data/languages.ts';
import { IconArrowLeft, IconCheck } from '../components/Icon.tsx';

export type SaveResult = { ok: true } | { ok: false; reason: string };
export type BulkResult = { added: number; active: number; skipped: number; invalidLines: number[] };

type Props = {
  lang: string;
  onBack: () => void;
  onSave: (front: string, back: string) => SaveResult;
  onBulkSave: (pairs: { front: string; back: string }[]) => Omit<BulkResult, 'invalidLines'>;
  onConfirmLeave: (onLeave: () => void) => void;
};

export const AddView = ({ lang, onBack, onSave, onBulkSave, onConfirmLeave }: Props) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const name = displayLangName(lang);
  const preview = mode === 'bulk' && bulkText.trim() ? parseBulk(bulkText) : null;

  useEffect(() => {
    if (message?.tone !== 'ok') return;
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const handleBack = () => {
    if (front.trim() || back.trim() || bulkText.trim()) onConfirmLeave(onBack);
    else onBack();
  };

  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    const result = onSave(front, back);
    if (!result.ok) { setMessage({ tone: 'error', text: result.reason }); return; }
    setMessage({ tone: 'ok', text: `"${front.trim()}" berhasil disimpan!` });
    setFront('');
    setBack('');
  };

  const handleBulk = (e: React.FormEvent) => {
    e.preventDefault();
    const { pairs, invalidLines } = parseBulk(bulkText);
    if (pairs.length === 0) {
      setMessage({ tone: 'error', text: 'Tidak ada baris yang terbaca. Pakai format "kata <> arti", satu pasangan per baris.' });
      return;
    }
    const r = onBulkSave(pairs);
    const parts = [`${r.added} kata ditambahkan (${r.active} langsung aktif, sisanya ke antrian).`];
    if (r.skipped > 0) parts.push(`${r.skipped} dilewati karena sudah ada.`);
    if (invalidLines.length > 0) parts.push(`Baris tidak terbaca: ${invalidLines.slice(0, 8).join(', ')}${invalidLines.length > 8 ? ', ...' : ''}.`);
    setMessage({ tone: r.added > 0 ? 'ok' : 'error', text: parts.join(' ') });
    if (r.added > 0 && invalidLines.length === 0) setBulkText('');
  };

  const switchMode = (m: 'single' | 'bulk') => { setMode(m); setMessage(null); };

  return (
    <div className="max-w-md mx-auto p-6 animate-fade-in">
      <button onClick={handleBack} className="mb-6 text-gray-500 hover:text-gray-800 flex items-center gap-2"><IconArrowLeft /> Kembali</button>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Tambah Kata Manual</h2>
      <div className="flex mb-6 bg-gray-100 p-1 rounded-xl" role="tablist">
        <button role="tab" aria-selected={mode === 'single'} onClick={() => switchMode('single')} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${mode === 'single' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>Manual</button>
        <button role="tab" aria-selected={mode === 'bulk'} onClick={() => switchMode('bulk')} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${mode === 'bulk' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>Bulk</button>
      </div>
      {mode === 'single' ? (
        <form onSubmit={handleSaveSingle} className="space-y-4">
          <div><label htmlFor="add-front" className="text-sm text-gray-500 mb-1 block">{lang}</label><input id="add-front" className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" value={front} onChange={e => setFront(e.target.value)} placeholder={`Contoh kata ${name} (Latin/Asli)`} autoFocus required /></div>
          <div><label htmlFor="add-back" className="text-sm text-gray-500 mb-1 block">Indonesia</label><input id="add-back" className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" value={back} onChange={e => setBack(e.target.value)} placeholder="Arti (pisahkan beberapa arti dengan /)" required /></div>
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-all active:scale-95">Simpan</button>
        </form>
      ) : (
        <form onSubmit={handleBulk} className="space-y-4">
          <label htmlFor="add-bulk" className="text-sm text-gray-500 block">Satu pasangan per baris. Pemisah: <code>&lt;&gt;</code>, tab (salin dari spreadsheet), <code>=</code>, atau <code>-</code> berspasi.</label>
          <textarea id="add-bulk" className="w-full h-48 p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={'apple <> apel\nto run <> berlari'} required />
          {preview && <p className="text-xs text-gray-500">{preview.pairs.length} pasangan terbaca{preview.invalidLines.length > 0 && `, ${preview.invalidLines.length} baris tidak terbaca`}.</p>}
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg">Import</button>
        </form>
      )}
      {message && (
        <div role={message.tone === 'error' ? 'alert' : 'status'} className={`mt-4 p-3 rounded-xl text-center text-sm font-medium animate-fade-in flex items-center justify-center gap-2 ${message.tone === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.tone === 'ok' && <IconCheck size={18} />} {message.text}
        </div>
      )}
    </div>
  );
};
