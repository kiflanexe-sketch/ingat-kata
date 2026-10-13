import { POS_CODES, POS_LABEL, isPos, type PosCode } from '../lib/pos.ts';

// Pilihan jenis kata untuk kata sendiri. Kosong = tidak ditentukan.
export const PosSelect = ({ id, value, onChange, className = '' }: { id: string; value: PosCode | null; onChange: (v: PosCode | null) => void; className?: string }) => (
  <select id={id} value={value ?? ''} onChange={e => onChange(isPos(e.target.value) ? e.target.value : null)} className={className}>
    <option value="">Tidak ditentukan</option>
    {POS_CODES.map(p => <option key={p} value={p}>{POS_LABEL[p][0].toUpperCase() + POS_LABEL[p].slice(1)}</option>)}
  </select>
);

// Label jenis kata di kartu: kecil, miring, seperti keterangan di kamus.
export const PosLabel = ({ pos, className = '' }: { pos: PosCode | null; className?: string }) =>
  pos ? <span className={`font-word italic text-secondary text-muted ${className}`}>{POS_LABEL[pos]}</span> : null;
