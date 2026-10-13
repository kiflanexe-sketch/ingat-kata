import { useEffect, useState } from 'react';
import { parseBulk } from '../lib/bulk.ts';
import { displayLangName, speechCodeFor } from '../data/languages.ts';
import { WORD_DATABASE } from '../data/words.ts';
import { Button, Page, Title, TopBar } from '../components/ui.tsx';
import { withTransition } from '../lib/transition.ts';
import { PosSelect } from '../components/PosSelect.tsx';
import type { PosCode } from '../lib/pos.ts';

// note: keterangan bila kata tidak disimpan persis seperti yang diketik (mis. diambil dari paket).
export type SaveResult = { ok: true; note?: string } | { ok: false; reason: string };
export type BulkResult = { added: number; active: number; fromPacks: number; inDeck: number; skipped: number; invalidLines: number[] };

type Props = {
  lang: string;
  onBack: () => void;
  onSave: (front: string, back: string, pos: PosCode | null) => SaveResult;
  onBulkSave: (pairs: { front: string; back: string }[]) => Omit<BulkResult, 'invalidLines'>;
  onConfirmLeave: (onLeave: () => void) => void;
};

export const AddView = ({ lang, onBack, onSave, onBulkSave, onConfirmLeave }: Props) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [pos, setPos] = useState<PosCode | null>(null);
  const [bulkText, setBulkText] = useState('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const name = displayLangName(lang);
  const presetLevels = Object.values(WORD_DATABASE[lang] ?? {});
  const example = presetLevels[0]?.[1];
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
    const result = onSave(front, back, pos);
    if (!result.ok) { setMessage({ tone: 'error', text: result.reason }); return; }
    setMessage({ tone: 'ok', text: result.note ?? `"${front.trim()}" tersimpan dan langsung aktif.` });
    setFront('');
    setBack('');
    setPos(null);
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
    if (r.fromPacks > 0) parts.push(`${r.fromPacks} di antaranya sudah ada di paket ${name}, jadi versi paket yang dipakai.`);
    if (r.inDeck > 0) parts.push(`${r.inDeck} dilewati karena sudah ada di deck dari paket.`);
    if (r.skipped > 0) parts.push(`${r.skipped} dilewati karena sudah ada.`);
    if (invalidLines.length > 0) parts.push(`Baris tidak terbaca: ${invalidLines.slice(0, 8).join(', ')}${invalidLines.length > 8 ? ', ...' : ''}.`);
    setMessage({ tone: r.added > 0 ? 'ok' : 'error', text: parts.join(' ') });
    if (r.added > 0 && invalidLines.length === 0) setBulkText('');
  };

  const switchMode = (m: 'single' | 'bulk') => withTransition(() => { setMode(m); setMessage(null); }, 'fade');
  const field = 'w-full min-h-12 px-3 rounded-control border-[1.5px] border-control bg-card text-body placeholder:text-subtle focus:border-primary outline-none';
  const tab = (m: 'single' | 'bulk', label: string) => (
    <button role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}
      className={`flex-1 min-h-11 rounded-control text-secondary font-semibold transition-colors duration-state ${mode === m ? 'vt-seg-active bg-card text-ink shadow-[0_1px_2px_rgb(36_38_43/0.12)]' : 'text-muted hover:text-ink'}`}>{label}</button>
  );

  return (
    <Page>
      <TopBar onBack={handleBack} backLabel={name} />
      <Title>Tambah kata</Title>
      <div className="flex p-1 mb-6 rounded-control" style={{ backgroundColor: 'var(--segment)' }} role="tablist" aria-label="Cara menambah">
        {tab('single', 'Satu kata')}
        {tab('bulk', 'Sekaligus')}
      </div>
      {mode === 'single' ? (
        <form onSubmit={handleSaveSingle} className="space-y-4">
          <div>
            <label htmlFor="add-front" className="block text-secondary font-semibold text-ink mb-1">Kata dalam bahasa {name}</label>
            <input id="add-front" lang={speechCodeFor(lang)?.slice(0, 2)} dir="auto" className={`${field} font-word text-answer`} value={front} onChange={e => setFront(e.target.value)} placeholder={example ? `Mis. ${example.f}` : 'Kata asing'} autoFocus required autoCapitalize="off" />
          </div>
          <div>
            <label htmlFor="add-back" className="block text-secondary font-semibold text-ink mb-1">Arti dalam bahasa Indonesia</label>
            <input id="add-back" lang="id" className={field} value={back} onChange={e => setBack(e.target.value)} placeholder={example ? `Mis. ${example.b}` : 'Arti'} required />
            <p className="mt-1 text-meta text-subtle">Beberapa arti dipisah garis miring, mis. Perlu/Penting.</p>
          </div>
          <div>
            <label htmlFor="add-pos" className="block text-secondary font-semibold text-ink mb-1">Jenis kata <span className="font-normal text-muted">(opsional)</span></label>
            <PosSelect id="add-pos" value={pos} onChange={setPos} className={field} />
          </div>
          {presetLevels.length > 0 && (
            <p className="text-meta text-subtle">Kata yang sudah ada di paket {name} memakai versi paketnya, lengkap dengan jenis kata.</p>
          )}
          <Button type="submit">Simpan</Button>
        </form>
      ) : (
        <form onSubmit={handleBulk} className="space-y-3">
          <label htmlFor="add-bulk" className="block text-secondary text-muted">
            Satu pasangan per baris. Pemisah: <code className="text-ink">&lt;&gt;</code>, tab (salinan spreadsheet), <code className="text-ink">=</code>, atau <code className="text-ink">-</code> berspasi. Kata baru masuk antrian.
          </label>
          <textarea id="add-bulk" className={`${field} h-48 py-2 font-mono text-secondary`} value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={'apple <> apel\nto run <> berlari'} required />
          {preview && <p className="text-meta text-subtle">{preview.pairs.length} pasangan terbaca{preview.invalidLines.length > 0 && `, ${preview.invalidLines.length} baris tidak terbaca`}.</p>}
          <Button type="submit">Tambahkan semua</Button>
        </form>
      )}
      {message && (
        <p role={message.tone === 'error' ? 'alert' : 'status'} className={`mt-4 rounded-control px-4 py-3 text-secondary ${message.tone === 'ok' ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad'}`}>
          {message.text}
        </p>
      )}
    </Page>
  );
};
