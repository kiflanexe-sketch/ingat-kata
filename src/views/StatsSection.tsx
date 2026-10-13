import { useState } from 'react';
import type { StudyLog } from '../lib/stats.ts';
import { bestStreak, currentStreak, formatDuration, lastDays, sumDays } from '../lib/stats.ts';
import { percent } from '../lib/format.ts';
import { ActivityHeatmap, DailyBars, ProgressLine } from '../components/charts.tsx';

type Props = { log: StudyLog; now: number };

const RANGES = [7, 30, 90] as const;
const HEATMAP_WEEKS = 16;

// Angka ringkas tanpa kartu pembungkus: label kecil di atas, nilai di bawah.
const Figure = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="min-w-0">
    <dt className="text-meta text-subtle">{label}</dt>
    <dd className="text-answer font-semibold text-ink">{value}</dd>
    {hint && <dd className="text-meta text-subtle">{hint}</dd>}
  </div>
);

export const StatsSection = ({ log, now }: Props) => {
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const hasActivity = Object.values(log).some(d => d.r > 0);
  const today = new Date(now);

  if (!hasActivity) {
    return (
      <section className="mt-12">
        <h2 className="text-section text-ink">Statistik belajar</h2>
        <p className="mt-1 text-secondary text-muted">
          Grafik konsistensi, jumlah ulangan, dan kata yang sudah hafal muncul di sini setelah kamu menjawab kartu pertama.
        </p>
      </section>
    );
  }

  const streak = currentStreak(log, now);
  const best = bestStreak(log);
  const studiedToday = lastDays(log, 1, now)[0].r > 0;
  const heatDays = lastDays(log, (HEATMAP_WEEKS - 1) * 7 + ((today.getDay() + 6) % 7) + 1, now);
  const points = lastDays(log, range, now);
  const totals = sumDays(points);
  const hasProgress = points.some(p => p.m !== undefined);

  return (
    <>
      <section className="mt-12" aria-labelledby="stats-consistency">
        <h2 id="stats-consistency" className="text-section text-ink">Konsistensi</h2>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="text-number text-ink">{streak}</span>
          <span className="text-answer text-ink">hari beruntun</span>
        </p>
        <p className="text-secondary text-muted mb-4">
          {streak === 0
            ? 'Jawab satu kartu hari ini untuk memulai rangkaian.'
            : studiedToday ? 'Hari ini sudah belajar.' : 'Belajar hari ini supaya rangkaian tidak putus.'}
          {best > streak && ` Terpanjang: ${best} hari.`}
        </p>
        <ActivityHeatmap points={heatDays} now={today} />
      </section>

      <section className="mt-12" aria-labelledby="stats-numbers">
        <div className="flex items-center justify-between gap-3">
          <h2 id="stats-numbers" className="text-section text-ink">Statistik</h2>
          <div className="flex p-0.5 rounded-control" style={{ backgroundColor: 'rgb(228 222 209 / 0.6)' }} role="radiogroup" aria-label="Rentang waktu">
            {RANGES.map(r => (
              <button key={r} role="radio" aria-checked={range === r} onClick={() => setRange(r)}
                className={`min-h-9 px-3 rounded-[6px] text-meta transition-colors duration-state ${range === r ? 'bg-card text-ink shadow-[0_1px_2px_rgb(36_38_43/0.12)]' : 'text-muted hover:text-ink'}`}>
                {r} hari
              </button>
            ))}
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
          <Figure label="Kartu dijawab" value={String(totals.r)} />
          <Figure label="Benar" value={totals.r ? percent(totals.c / totals.r) : '-'} />
          <Figure label="Waktu belajar" value={formatDuration(totals.ms)} />
          <Figure label="Hari aktif" value={`${totals.active} dari ${range}`} />
        </dl>
        <h3 className="mt-6 mb-1 text-secondary font-semibold text-ink">Kartu dijawab per hari</h3>
        <DailyBars key={`bars-${range}`} points={points} now={today} />
      </section>

      <section className="mt-12" aria-labelledby="stats-progress">
        <h2 id="stats-progress" className="text-section text-ink">Progres</h2>
        <p className="mt-1 mb-3 text-secondary text-muted">Kata hafal = jarak ulangnya sudah 21 hari atau lebih.</p>
        {hasProgress
          ? <ProgressLine key={`line-${range}`} points={points} now={today} />
          : <p className="text-secondary text-muted">Progres tercatat setiap kali sesi selesai.</p>}
      </section>

      <details className="mt-6 group">
        <summary className="min-h-11 flex items-center text-secondary font-semibold text-primary cursor-pointer">Lihat data harian ({range} hari)</summary>
        <div className="overflow-x-auto">
          <table className="w-full text-secondary tabular-nums">
            <thead>
              <tr className="text-left text-meta text-subtle">
                <th className="py-2 font-medium">Tanggal</th><th className="py-2 font-medium text-right">Dijawab</th>
                <th className="py-2 font-medium text-right">Benar</th><th className="py-2 font-medium text-right">Hafal</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map(p => (
                <tr key={p.key} className="border-t border-line">
                  <td className="py-1.5">{p.date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                  <td className="py-1.5 text-right">{p.r}</td>
                  <td className="py-1.5 text-right">{p.r ? percent(p.c / p.r) : '-'}</td>
                  <td className="py-1.5 text-right">{p.m ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
};
