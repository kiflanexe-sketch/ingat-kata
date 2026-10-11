import { useState } from 'react';
import type { Card } from '../types.ts';
import type { SaveResult } from './AddView.tsx';
import { MAX_BOX } from '../lib/srs.ts';
import { normalize } from '../lib/answer.ts';
import { formatDueIn } from '../lib/format.ts';
import { IconArrowLeft, IconCheck, IconEdit, IconMoveDown, IconMoveUp, IconSearch, IconTrash2 } from '../components/Icon.tsx';

type Props = {
  lang: string;
  cards: Card[];
  now: number;
  onBack: () => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[], done: () => void) => void;
  onBulkMove: (ids: string[], target: 'active' | 'reserve') => void;
  onEdit: (id: string, front: string, back: string) => SaveResult;
  onDeleteDeck: () => void;
};

const sourceLabel = (source: string) =>
  source === 'custom' ? 'Kata sendiri' : source === 'legacy' ? 'Lama' : source.replace('preset-', '');

const scheduleLabel = (c: Card, now: number) => {
  if (c.status === 'reserve') return 'Belum dipelajari';
  if (c.nextReview <= now) return 'Siap diulang';
  return `Ulang ${formatDueIn(c.nextReview - now)}`;
};

type RowProps = {
  card: Card;
  now: number;
  selecting: boolean;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (front: string, back: string) => SaveResult;
};

const CardRow = ({ card: c, now, selecting, selected, onToggle, onDelete, onEdit }: RowProps) => {
  const [editing, setEditing] = useState(false);
  const [front, setFront] = useState(c.front);
  const [back, setBack] = useState(c.back);
  const [error, setError] = useState('');
  const isActive = c.status === 'active';
  const base = isActive ? 'bg-white border-indigo-100 shadow-sm' : 'bg-gray-50 border-gray-200';

  if (editing) {
    const save = (e: React.FormEvent) => {
      e.preventDefault();
      if (!front.trim() || !back.trim()) { setError('Kata dan arti wajib diisi.'); return; }
      const r = onEdit(front, back);
      if (!r.ok) { setError(r.reason); return; }
      setEditing(false);
    };
    return (
      <form onSubmit={save} className="bg-white p-3 rounded-xl border border-indigo-300 space-y-2">
        <input aria-label="Kata" value={front} onChange={e => setFront(e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" autoFocus />
        <input aria-label="Arti" value={back} onChange={e => setBack(e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
        {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => { setEditing(false); setFront(c.front); setBack(c.back); setError(''); }} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
          <button type="submit" className="px-3 py-1.5 text-sm bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Simpan</button>
        </div>
      </form>
    );
  }

  const body = (
    <div className="flex-1 min-w-0">
      <div className={`font-bold break-words ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>{c.front}</div>
      <div className={`text-sm break-words ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>{c.back}</div>
      <div className="text-xs text-gray-400 mt-1">
        {sourceLabel(c.source)}{isActive && ` · Kotak ${c.box}/${MAX_BOX}`} · {scheduleLabel(c, now)}
      </div>
    </div>
  );

  if (selecting) {
    return (
      <button type="button" aria-pressed={selected} onClick={onToggle} className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${selected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50' : base}`}>
        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
          {selected && <IconCheck size={12} className="text-white" />}
        </span>
        {body}
      </button>
    );
  }

  return (
    <div className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${base}`}>
      {body}
      <button onClick={() => setEditing(true)} className="p-1 text-gray-300 hover:text-indigo-500" aria-label={`Ubah ${c.front}`}><IconEdit /></button>
      <button onClick={onDelete} className="p-1 text-red-300 hover:text-red-500" aria-label={`Hapus ${c.front}`}><IconTrash2 /></button>
    </div>
  );
};

export const ListView = ({ lang, cards, now, onBack, onDelete, onBulkDelete, onBulkMove, onEdit, onDeleteDeck }: Props) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  const q = normalize(query);
  const matches = (c: Card) => !q || normalize(c.front).includes(q) || normalize(c.back).includes(q);
  const activeCards = cards.filter(c => c.status === 'active' && matches(c));
  const reserveCards = cards.filter(c => c.status === 'reserve' && matches(c));

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = (subset: Card[]) => {
    const allSelected = subset.every(c => selectedIds.has(c.id));
    const next = new Set(selectedIds);
    subset.forEach(c => (allSelected ? next.delete(c.id) : next.add(c.id)));
    setSelectedIds(next);
  };

  const exitSelection = () => { setSelectedIds(new Set()); setIsSelectionMode(false); };

  const handleBulkAction = (action: 'delete' | 'to_active' | 'to_reserve') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (action === 'delete') onBulkDelete(ids, exitSelection);
    else { onBulkMove(ids, action === 'to_active' ? 'active' : 'reserve'); exitSelection(); }
  };

  const section = (title: string, list: Card[], accent: string, empty: string) => (
    <section>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-sm font-bold uppercase tracking-wider ${accent}`}>{title} ({list.length})</h3>
        {isSelectionMode && list.length > 0 && (
          <button onClick={() => toggleSelectAll(list)} className="text-xs font-bold text-indigo-500 hover:text-indigo-700">
            {list.every(c => selectedIds.has(c.id)) ? 'Batal Semua' : 'Pilih Semua'}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {list.map(c => (
          <CardRow key={c.id} card={c} now={now} selecting={isSelectionMode} selected={selectedIds.has(c.id)} onToggle={() => toggleSelection(c.id)} onDelete={() => onDelete(c.id)} onEdit={(f, b) => onEdit(c.id, f, b)} />
        ))}
        {list.length === 0 && <p className="text-sm text-gray-400 italic">{q ? 'Tidak ada yang cocok.' : empty}</p>}
      </div>
    </section>
  );

  return (
    <div className="max-w-2xl mx-auto p-4 animate-fade-in pb-32">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 flex items-center gap-2"><IconArrowLeft /> Kembali</button>
        <div className="flex items-center gap-3">
          <button onClick={() => (isSelectionMode ? exitSelection() : setIsSelectionMode(true))} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${isSelectionMode ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {isSelectionMode ? 'Batal Pilih' : 'Pilih'} <IconEdit />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Daftar Kata</h2>
        </div>
      </div>

      {cards.length > 0 && (
        <div className="relative mb-6">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari kata atau arti" aria-label="Cari kata atau arti" className="w-full p-3 pl-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
      )}

      <div className="space-y-8">
        {section('Aktif', activeCards, 'text-indigo-600', 'Tidak ada kata aktif.')}
        {section('Antrian', reserveCards, 'text-gray-500', 'Antrian kosong.')}
      </div>

      <div className="mt-12 pt-6 border-t border-gray-200 text-center">
        <button onClick={onDeleteDeck} className="text-sm text-red-500 hover:text-red-700 font-semibold">Hapus seluruh deck {lang}</button>
      </div>

      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center animate-slide-up">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 flex gap-2 items-center">
            <div className="px-3 font-bold text-gray-500 text-sm">{selectedIds.size} Dipilih</div>
            <div className="h-6 w-px bg-gray-200 mx-1"></div>
            <button onClick={() => handleBulkAction('to_active')} className="p-3 text-green-600 hover:bg-green-50 rounded-xl flex flex-col items-center gap-1 min-w-[60px]"><IconMoveUp /> <span className="text-[10px] font-bold">Ke Aktif</span></button>
            <button onClick={() => handleBulkAction('to_reserve')} className="p-3 text-orange-500 hover:bg-orange-50 rounded-xl flex flex-col items-center gap-1 min-w-[60px]"><IconMoveDown /> <span className="text-[10px] font-bold">Ke Antrian</span></button>
            <button onClick={() => handleBulkAction('delete')} className="p-3 text-red-500 hover:bg-red-50 rounded-xl flex flex-col items-center gap-1 min-w-[60px]"><IconTrash2 /> <span className="text-[10px] font-bold">Hapus</span></button>
          </div>
        </div>
      )}
    </div>
  );
};
