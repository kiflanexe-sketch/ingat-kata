import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import type { DayPoint } from '../lib/stats.ts';
import { percent } from '../lib/format.ts';

// Grafik SVG kecil tanpa library. Aturan: satu hue tinta untuk besaran, garis tipis, sumbu
// rambut, nilai tidak pernah hanya lewat warna: setiap grafik punya baris keterangan yang
// mengikuti sentuhan/hover/panah keyboard, dan tabel data di bawahnya.

const INK = 'var(--primary)';
const INK_HOVER = 'var(--primary-hover)';
const MUTED_LINE = 'var(--control)';
const GRID = 'var(--line)';
// Gradasi satu hue untuk kalender aktivitas (sudah lolos validator ordinal terhadap kertas).
const HEAT = ['var(--line)', '#93acd8', '#6886bf', '#43629b', '#283f69'];

const fmtDay = (d: Date, now: Date) => {
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay ? 'Hari ini' : d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
};
const fmtShort = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

// Pilihan titik data yang sama untuk sentuhan, hover, dan tombol panah.
function useSelection(count: number) {
  const [selected, setSelected] = useState(count - 1);
  const index = Math.min(Math.max(selected, 0), count - 1);
  const onKeyDown = (e: KeyboardEvent, step = 1, rowStep = 0) => {
    const moves: Record<string, number> = { ArrowLeft: -step, ArrowRight: step, ArrowUp: -rowStep, ArrowDown: rowStep, Home: -count, End: count };
    const delta = moves[e.key];
    if (delta === undefined || delta === 0) return;
    e.preventDefault();
    setSelected(Math.min(count - 1, Math.max(0, index + delta)));
  };
  const onPointer = (e: PointerEvent<SVGElement>) => {
    const i = (e.target as Element).getAttribute?.('data-i');
    if (i !== null && i !== undefined) setSelected(Number(i));
  };
  return { index, setSelected, onKeyDown, onPointer };
}

// Lebar wadah sebenarnya, supaya grafik digambar 1:1 dan teks sumbu tidak ikut membesar.
function useWidth(fallback: number) {
  const ref = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

const Readout = ({ children }: { children: ReactNode }) => (
  <p className="mt-2 min-h-6 text-secondary text-ink" aria-live="polite">{children}</p>
);

const dayLine = (p: DayPoint, now: Date) =>
  p.r === 0
    ? <><strong>{fmtDay(p.date, now)}</strong>: belum belajar</>
    : <><strong>{fmtDay(p.date, now)}</strong>: {p.r} kartu, {percent(p.c / p.r)} benar</>;

// --- Kalender aktivitas (konsistensi) ---

const heatLevel = (r: number) => (r === 0 ? 0 : r < 10 ? 1 : r < 25 ? 2 : r < 50 ? 3 : 4);
const WEEKDAYS = ['Sen', '', 'Rab', '', 'Jum', '', 'Min'];

export const ActivityHeatmap = ({ points, now }: { points: DayPoint[]; now: Date }) => {
  // Kolom = minggu (Senin di atas), kolom terakhir berisi hari ini.
  const firstWeekday = (points[0].date.getDay() + 6) % 7;
  const cells = points.map((p, i) => ({ p, col: Math.floor((i + firstWeekday) / 7), row: (i + firstWeekday) % 7 }));
  const cols = cells[cells.length - 1].col + 1;
  const size = 15;
  const gap = 3;
  const left = 26;
  const width = left + cols * (size + gap);
  const height = 7 * (size + gap) + 14;
  const { index, onKeyDown, onPointer } = useSelection(points.length);
  const active = points.filter(p => p.r > 0).length;

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[420px] h-auto touch-manipulation focus-visible:outline-2" tabIndex={0}
        role="img" aria-label={`Kalender aktivitas ${points.length} hari terakhir: belajar di ${active} hari. Gunakan tombol panah untuk melihat tiap hari.`}
        onKeyDown={e => onKeyDown(e, 7, 1)} onPointerMove={onPointer} onPointerDown={onPointer}>
        {WEEKDAYS.map((d, r) => d && (
          <text key={d} x={0} y={r * (size + gap) + size - 3} fontSize="10" fill="var(--subtle)">{d}</text>
        ))}
        {cells.map(({ p, col, row }, i) => (
          <rect key={p.key} data-i={i} x={left + col * (size + gap)} y={row * (size + gap)} width={size} height={size} rx={3}
            fill={HEAT[heatLevel(p.r)]} stroke={i === index ? 'var(--ink)' : 'none'} strokeWidth={i === index ? 1.5 : 0} />
        ))}
        {cells.filter(({ p }) => p.date.getDate() <= 7 && (p.date.getDay() + 6) % 7 === 0).map(({ p, col }) => (
          <text key={`m-${p.key}`} x={left + col * (size + gap)} y={height - 2} fontSize="10" fill="var(--subtle)">
            {p.date.toLocaleDateString('id-ID', { month: 'short' })}
          </text>
        ))}
      </svg>
      <div className="mt-1 flex items-center gap-1 text-meta text-subtle" aria-hidden="true">
        <span className="mr-1">Sedikit</span>
        {HEAT.map(c => <span key={c} className="inline-block w-3 h-3 rounded-[3px]" style={{ background: c }} />)}
        <span className="ml-1">Banyak</span>
      </div>
      <Readout>{dayLine(points[index], now)}</Readout>
    </figure>
  );
};

// --- Kartu dijawab per hari ---

export const DailyBars = ({ points, now }: { points: DayPoint[]; now: Date }) => {
  const { ref, width } = useWidth(340);
  const plotH = 120;
  const top = 14;
  const max = Math.max(5, ...points.map(p => p.r));
  const niceMax = max <= 10 ? Math.ceil(max / 5) * 5 : max <= 50 ? Math.ceil(max / 10) * 10 : Math.ceil(max / 50) * 50;
  const slot = width / points.length;
  const barW = Math.max(2, Math.min(24, slot - 2));
  const { index, onKeyDown, onPointer } = useSelection(points.length);
  const y = (v: number) => top + plotH - (v / niceMax) * plotH;
  const total = points.reduce((n, p) => n + p.r, 0);

  return (
    <figure ref={ref}>
      <svg viewBox={`0 0 ${width} ${top + plotH + 18}`} className="w-full h-auto touch-manipulation" tabIndex={0}
        role="img" aria-label={`Kartu dijawab per hari, ${points.length} hari terakhir, total ${total}. Gunakan tombol panah untuk melihat tiap hari.`}
        onKeyDown={e => onKeyDown(e)} onPointerMove={onPointer} onPointerDown={onPointer}>
        <line x1={0} x2={width} y1={y(0)} y2={y(0)} stroke={GRID} strokeWidth={1} />
        <line x1={0} x2={width} y1={y(niceMax)} y2={y(niceMax)} stroke={GRID} strokeWidth={1} />
        <text x={0} y={y(niceMax) - 4} fontSize="10" fill="var(--subtle)">{niceMax}</text>
        {points.map((p, i) => {
          const h = (p.r / niceMax) * plotH;
          const x = i * slot + (slot - barW) / 2;
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={p.key}>
              {/* Area sentuh setinggi plot, lebih lebar dari batangnya. */}
              <rect data-i={i} x={i * slot} y={top} width={slot} height={plotH} fill="transparent" />
              {p.r > 0 && (
                <path data-i={i} fill={i === index ? INK_HOVER : INK} opacity={i === index ? 1 : 0.85}
                  d={`M${x},${y(0)} v${-(h - r)} q0,${-r} ${r},${-r} h${barW - 2 * r} q${r},0 ${r},${r} v${h - r} z`} />
              )}
            </g>
          );
        })}
        {index >= 0 && <line x1={index * slot + slot / 2} x2={index * slot + slot / 2} y1={top} y2={y(0)} stroke="var(--ink)" strokeOpacity={0.25} strokeWidth={1} pointerEvents="none" />}
        <text x={0} y={top + plotH + 14} fontSize="10" fill="var(--subtle)">{fmtShort(points[0].date)}</text>
        <text x={width} y={top + plotH + 14} fontSize="10" fill="var(--subtle)" textAnchor="end">hari ini</text>
      </svg>
      <Readout>{dayLine(points[index], now)}</Readout>
    </figure>
  );
};

// --- Progres: kata hafal dan aktif ---

export const ProgressLine = ({ points, now }: { points: DayPoint[]; now: Date }) => {
  const { ref, width } = useWidth(340);
  const plotH = 120;
  const top = 10;
  const right = 34;
  const plotW = width - right;
  const max = Math.max(5, ...points.map(p => p.a ?? 0));
  const niceMax = max <= 10 ? Math.ceil(max / 5) * 5 : max <= 100 ? Math.ceil(max / 20) * 20 : Math.ceil(max / 100) * 100;
  const x = (i: number) => (points.length === 1 ? plotW : (i / (points.length - 1)) * plotW);
  const y = (v: number) => top + plotH - (v / niceMax) * plotH;
  const { index, onKeyDown, onPointer } = useSelection(points.length);
  const path = (key: 'm' | 'a') => points
    .map((p, i) => (p[key] === undefined ? null : `${x(i)},${y(p[key]!)}`))
    .reduce<string[]>((segs, pt, i) => {
      if (pt === null) return segs;
      const prevDefined = i > 0 && points[i - 1][key] !== undefined;
      segs.push(`${prevDefined ? 'L' : 'M'}${pt}`);
      return segs;
    }, []).join(' ');
  const last = points[points.length - 1];
  const sel = points[index];

  return (
    <figure ref={ref}>
      <div className="flex gap-4 text-meta text-muted mb-1">
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 rounded-full" style={{ background: INK }} />Hafal</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 rounded-full" style={{ background: MUTED_LINE }} />Aktif</span>
      </div>
      <svg viewBox={`0 0 ${width} ${top + plotH + 18}`} className="w-full h-auto touch-manipulation" tabIndex={0}
        role="img" aria-label={`Kata hafal dan kata aktif selama ${points.length} hari terakhir. Sekarang ${last.m ?? 0} hafal dari ${last.a ?? 0} aktif. Gunakan tombol panah untuk melihat tiap hari.`}
        onKeyDown={e => onKeyDown(e)} onPointerMove={onPointer} onPointerDown={onPointer}>
        <line x1={0} x2={plotW} y1={y(0)} y2={y(0)} stroke={GRID} strokeWidth={1} />
        <line x1={0} x2={plotW} y1={y(niceMax)} y2={y(niceMax)} stroke={GRID} strokeWidth={1} />
        <text x={0} y={y(niceMax) - 3} fontSize="10" fill="var(--subtle)">{niceMax}</text>
        <path d={path('a')} fill="none" stroke={MUTED_LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <path d={path('m')} fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* Garis bantu di hari terpilih, titik bercincin warna kertas. */}
        <line x1={x(index)} x2={x(index)} y1={top} y2={y(0)} stroke="var(--ink)" strokeOpacity={0.25} strokeWidth={1} />
        {sel.a !== undefined && <circle cx={x(index)} cy={y(sel.a)} r={4} fill={MUTED_LINE} stroke="var(--paper)" strokeWidth={2} />}
        {sel.m !== undefined && <circle cx={x(index)} cy={y(sel.m)} r={4} fill={INK} stroke="var(--paper)" strokeWidth={2} />}
        {last.a !== undefined && <text x={plotW + 6} y={y(last.a) + 4} fontSize="11" fill="var(--muted)">{last.a}</text>}
        {last.m !== undefined && Math.abs(y(last.m) - y(last.a ?? -999)) > 12 && <text x={plotW + 6} y={y(last.m) + 4} fontSize="11" fill="var(--ink)">{last.m}</text>}
        {points.map((p, i) => (
          <rect key={p.key} data-i={i} x={x(i) - plotW / points.length / 2} y={top} width={plotW / points.length} height={plotH} fill="transparent" />
        ))}
        <text x={0} y={top + plotH + 14} fontSize="10" fill="var(--subtle)">{fmtShort(points[0].date)}</text>
        <text x={plotW} y={top + plotH + 14} fontSize="10" fill="var(--subtle)" textAnchor="end">hari ini</text>
      </svg>
      <Readout>
        <strong>{fmtDay(sel.date, now)}</strong>: {sel.m === undefined ? 'belum tercatat' : `${sel.m} hafal dari ${sel.a ?? 0} kata aktif`}
      </Readout>
    </figure>
  );
};
