import { useState } from 'react';
import type { Card } from '../types.ts';
import type { SaveResult } from './AddView.tsx';
import { normalize } from '../lib/answer.ts';
import { formatDueIn } from '../lib/format.ts';
import { displayLangName } from '../data/languages.ts';
import { BoxChip, Page, TopBar, Word } from '../components/ui.tsx';
import { IconCheck, IconEdit, IconMoveDown, IconMoveUp, IconSearch, IconTrash2 } from '../components/Icon.tsx';
import { PosSelect } from '../components/PosSelect.tsx';
import { POS_LABEL, posOf, type PosCode } from '../lib/pos.ts';

type Props = {
  lang: string;
  cards: Card[];
  now: number;
  onBack: () => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[], done: () => void) => void;
  onBulkMove: (ids: string[], target: 'active' | 'reserve') => void;
  onEdit: (id: string, front: string, back: string, pos: PosCode | null) => SaveResult;
  onDeleteDeck: () => void;
  onAdd: () => void;
};

const sourceLabel = (source: string) =>
  source === 'custom' ? 'kata sendiri' : source === 'legacy' ? 'versi lama' : `paket ${source.replace('preset-', '')}`;

const scheduleLabel = (c: Card, now: number) =>
  c.nextReview <= now ? 'jatuh tempo' : formatDueIn(c.nextReview - now);

type RowProps = {
  card: Card;
  lang: string;
  now: number;
  selecting: boolean;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (front: string, back: string, pos: PosCode | null) => SaveResult;
};

const field = 'w-full min-h-11 px-3 rounded-control border-[1.5px] border-control bg-card outline-none focus:border-primary';

const CardRow = ({ card: c, lang, now, selecting, selected, onToggle, onDelete, onEdit }: RowProps) => {
  const [editing, setEditing] = useState(false);
  const [front, setFront] = useState(c.front);
  const [back, setBack] = useState(c.back);
  const [pos, setPos] = useState<PosCode | null>(() => posOf(c, lang));
  const [error, setError] = useState('');
  const isActive = c.status === 'active';

  if (editing) {
    const save = (e: React.FormEvent) => {
      e.preventDefault();
      if (!front.trim() || !back.trim()) { setError('Kata dan arti wajib diisi.'); return; }
      const r = onEdit(front, back, pos);
      if (!r.ok) { setError(r.reason); return; }
      setEditing(false);
    };
    return (
      <form onSubmit={save} className="py-3 border-t border-line space-y-2">
        <input aria-label="Kata" value={front} onChange={e => setFront(e.target.value)} className={`${field} font-word`} dir="auto" autoFocus />
        <input aria-label="Arti" value={back} onChange={e => setBack(e.target.value)} className={field} />
        <label className="flex items-center gap-3 text-secondary text-muted">
          <span className="shrink-0">Jenis kata</span>
          <PosSelect id={`pos-${c.id}`} value={pos} onChange={setPos} className={`${field} flex-1 text-body text-ink`} />
        </label>
        {error && <p className="text-secondary text-bad" role="alert">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => { setEditing(false); setFront(c.front); setBack(c.back); setPos(posOf(c, lang)); setError(''); }} className="min-h-11 px-4 text-secondary font-semibold text-muted hover:text-ink">Batal</button>
          <button type="submit" className="min-h-11 px-4 rounded-control bg-primary text-on-primary text-secondary font-semibold hover:bg-primary-hover">Simpan</button>
        </div>
      </form>
    );
  }

  const body = (
    <span className="flex-1 min-w-0">
      <Word text={c.front} lang={lang} size="row" className={isActive ? 'text-ink' : 'text-muted'} />
      <span className="block text-secondary text-muted break-words">{c.back}</span>
      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-subtle">
        {posOf(c, lang) && <span className="italic">{POS_LABEL[posOf(c, lang)!]}</span>}
        {isActive && <BoxChip box={c.box} />}
        {isActive && <span>{scheduleLabel(c, now)}</span>}
        <span>{sourceLabel(c.source)}</span>
      </span>
    </span>
  );

  if (selecting) {
    return (
      <button type="button" role="checkbox" aria-checked={selected} onClick={onToggle} className={`w-full text-left py-3 px-2 -mx-2 border-t border-line flex items-center gap-3 ${selected ? 'bg-primary-soft' : ''}`}>
        <span className={`w-5 h-5 rounded-[4px] border-[1.5px] flex items-center justify-center shrink-0 ${selected ? 'border-primary bg-primary' : 'border-control bg-card'}`}>
          {selected && <IconCheck size={14} className="text-on-primary" />}
        </span>
        {body}
      </button>
    );
  }

  return (
    <div className="py-3 border-t border-line flex items-start gap-1">
      {body}
      <button onClick={() => setEditing(true)} className="p-2.5 text-subtle hover:text-primary" aria-label={`Ubah ${c.front}`}><IconEdit /></button>
      <button onClick={onDelete} className="p-2.5 text-subtle hover:text-bad" aria-label={`Hapus ${c.front}`}><IconTrash2 /></button>
    </div>
  );
};

export const ListView = ({ lang, cards, now, onBack, onDelete, onBulkDelete, onBulkMove, onEdit, onDeleteDeck, onAdd }: Props) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [showReserve, setShowReserve] = useState(false);
  const name = displayLangName(lang);

  const q = normalize(query);
  const matches = (c: Card) => !q || normalize(c.front).includes(q) || normalize(c.back).includes(q);
  const activeCards = cards.filter(c => c.status === 'active' && matches(c));
  const reserveCards = cards.filter(c => c.status === 'reserve' && matches(c));
  const reserveOpen = showReserve || !!q || isSelectionMode;

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

  const rows = (list: Card[]) => list.map(c => (
    <CardRow key={c.id} card={c} lang={lang} now={now} selecting={isSelectionMode} selected={selectedIds.has(c.id)} onToggle={() => toggleSelection(c.id)} onDelete={() => onDelete(c.id)} onEdit={(f, b, p) => onEdit(c.id, f, b, p)} />
  ));

  const selectAll = (list: Card[]) => isSelectionMode && list.length > 0 && (
    <button onClick={() => toggleSelectAll(list)} className="min-h-11 text-secondary font-semibold text-primary">
      {list.every(c => selectedIds.has(c.id)) ? 'Batal pilih semua' : 'Pilih semua'}
    </button>
  );

  return (
    <Page className="pb-32">
      <TopBar onBack={onBack} backLabel={name} right={cards.length > 0 && (
        <button onClick={() => (isSelectionMode ? exitSelection() : setIsSelectionMode(true))} className="min-h-11 px-1 text-secondary font-semibold text-primary hover:underline underline-offset-4">
          {isSelectionMode ? 'Selesai memilih' : 'Pilih beberapa'}
        </button>
      )} />
      <h1 className="text-title text-ink mt-2 mb-4">Daftar kata</h1>

      {cards.length === 0 ? (
        <p className="text-body text-muted">Deck ini belum berisi kata. <button onClick={onAdd} className="font-semibold text-primary underline underline-offset-4">Tambah kata</button> atau ambil paket kata dari beranda.</p>
      ) : (
        <div className="relative mb-6">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari kata atau arti" aria-label="Cari kata atau arti"
            className="w-full min-h-12 pl-10 pr-3 rounded-control border-[1.5px] border-control bg-card outline-none focus:border-primary placeholder:text-subtle" />
        </div>
      )}

      {cards.length > 0 && (
        <>
          <section>
            <div className="flex justify-between items-center">
              <h2 className="text-section text-ink">Aktif <span className="text-muted font-normal">{activeCards.length}</span></h2>
              {selectAll(activeCards)}
            </div>
            <div className="mt-1">{rows(activeCards)}</div>
            {activeCards.length === 0 && <p className="py-3 border-t border-line text-secondary text-muted">{q ? 'Tidak ada yang cocok.' : 'Belum ada kata aktif. Buka kata baru dari beranda.'}</p>}
          </section>

          <section className="mt-10">
            <div className="flex justify-between items-center">
              <h2 className="text-section text-ink">Antrian <span className="text-muted font-normal">{reserveCards.length}</span></h2>
              {reserveOpen ? selectAll(reserveCards) : reserveCards.length > 0 && (
                <button onClick={() => setShowReserve(true)} className="min-h-11 text-secondary font-semibold text-primary">Tampilkan</button>
              )}
            </div>
            <p className="text-secondary text-muted">Belum dipelajari, dibuka bertahap dari beranda.</p>
            {reserveOpen && <div className="mt-1">{rows(reserveCards)}</div>}
            {reserveOpen && reserveCards.length === 0 && <p className="py-3 border-t border-line text-secondary text-muted">{q ? 'Tidak ada yang cocok.' : 'Antrian kosong.'}</p>}
          </section>
        </>
      )}

      <div className="mt-16 pt-4 border-t border-line">
        <button onClick={onDeleteDeck} className="min-h-11 text-secondary font-semibold text-bad hover:underline underline-offset-4">Hapus deck {name}</button>
        <p className="text-meta text-subtle">Semua kata dan progresnya ikut terhapus.</p>
      </div>

      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 bg-card border-t border-line shadow-sheet pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto max-w-content px-3 flex items-center gap-1">
            <span className="flex-1 px-2 text-secondary font-semibold text-ink">{selectedIds.size} dipilih</span>
            <button onClick={() => handleBulkAction('to_active')} className="min-h-14 px-3 flex flex-col items-center justify-center text-meta text-ink hover:bg-primary-soft rounded-control"><IconMoveUp /> Aktifkan</button>
            <button onClick={() => handleBulkAction('to_reserve')} className="min-h-14 px-3 flex flex-col items-center justify-center text-meta text-ink hover:bg-primary-soft rounded-control"><IconMoveDown /> Ke antrian</button>
            <button onClick={() => handleBulkAction('delete')} className="min-h-14 px-3 flex flex-col items-center justify-center text-meta text-bad hover:bg-bad-soft rounded-control"><IconTrash2 /> Hapus</button>
          </div>
        </div>
      )}
    </Page>
  );
};
