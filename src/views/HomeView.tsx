import type { ReactNode } from 'react';
import type { LangStats } from '../types.ts';
import { boxCounts, smartAddCount } from '../lib/srs.ts';
import { formatDueIn, percent } from '../lib/format.ts';
import { displayLangName } from '../data/languages.ts';
import { BoxShelf, Button, LinkRow, Page, Title, TopBar } from '../components/ui.tsx';

type Props = {
  stats: LangStats;
  now: number;
  relearnCount: number;
  lastAccuracy: number | null;
  hasPresets: boolean;
  onStart: () => void;
  onAdd: () => void;
  onList: () => void;
  onRepeatAll: () => void;
  onRepeatWrong: () => void;
  onSmartAdd: () => void;
  onChangeLang: () => void;
  onManageMaterial: () => void;
};

type Action = { label: string; hint?: string; run: () => void };

export const HomeView = ({ stats, now, relearnCount, lastAccuracy, hasPresets, onStart, onAdd, onList, onRepeatAll, onRepeatWrong, onSmartAdd, onChangeLang, onManageMaterial }: Props) => {
  const name = displayLangName(stats.lang);
  const header = <TopBar onBack={onChangeLang} backLabel="Bahasamu" right={stats.total > 0 && <button onClick={onList} className="min-h-11 px-1 text-secondary font-semibold text-primary hover:underline underline-offset-4">Daftar kata</button>} />;

  if (stats.total === 0) {
    return (
      <Page>
        {header}
        <Title sub={hasPresets ? 'Mulai dengan paket kata sesuai levelmu, atau masukkan kosakata sendiri.' : 'Masukkan kosakata yang ingin kamu hafal, satu per satu atau sekaligus dari daftar.'}>{name}</Title>
        <Button onClick={hasPresets ? onManageMaterial : onAdd}>{hasPresets ? 'Pilih paket kata' : 'Tambah kata'}</Button>
        {hasPresets && <div className="mt-6"><LinkRow onClick={onAdd}>Tambah kata sendiri</LinkRow></div>}
      </Page>
    );
  }

  const addable = Math.min(smartAddCount(lastAccuracy), stats.reserve);
  const accuracyNote = lastAccuracy !== null ? `Akurasi review terakhirmu ${percent(lastAccuracy)}.` : null;

  // Satu aksi utama, dipilih dari keadaan deck dan aturan jatah kata baru.
  let focus: ReactNode;
  let primary: Action;
  const secondary: Action[] = [];

  if (stats.due > 0) {
    focus = (
      <>
        <p className="text-secondary text-muted">Jatuh tempo sekarang</p>
        <p className="mt-1 flex items-baseline gap-2"><span className="text-number tabular-nums text-ink">{stats.due}</span><span className="text-answer text-ink">kartu</span></p>
        {accuracyNote && <p className="mt-2 text-secondary text-muted">{accuracyNote}</p>}
      </>
    );
    primary = { label: 'Mulai mengulang', run: onStart };
  } else {
    const next = stats.nextDue !== null ? `Kartu berikutnya jatuh tempo ${formatDueIn(stats.nextDue - now)}.` : null;
    let reason: string;
    if (stats.reserve > 0 && addable > 0) {
      primary = { label: `Buka ${addable} kata baru`, run: onSmartAdd };
      reason = lastAccuracy === null
        ? `Ada ${stats.reserve} kata di antrian. Kata baru dibuka bertahap supaya tetap terkejar.`
        : `${accuracyNote} Dengan akurasi ${lastAccuracy >= 0.8 ? 'di atas 80%' : 'di antara 50% dan 80%'}, kamu dapat ${smartAddCount(lastAccuracy)} kata baru.`;
    } else if (stats.reserve > 0) {
      primary = relearnCount > 0 ? { label: `Latih ${relearnCount} kata yang salah`, run: onRepeatWrong } : { label: 'Latih semua kata aktif', run: onRepeatAll };
      reason = `${accuracyNote} Kata baru ditahan dulu sampai akurasi review mencapai 50%.`;
    } else {
      primary = hasPresets ? { label: 'Tambah paket kata', run: onManageMaterial } : { label: 'Tambah kata', run: onAdd };
      reason = 'Antrian kata baru sudah habis.';
    }
    focus = (
      <>
        <p className="text-section text-ink">Tidak ada kartu jatuh tempo</p>
        {next && <p className="mt-1 text-secondary text-muted">{next}</p>}
        <p className="mt-3 text-body text-ink">{reason}</p>
      </>
    );
  }

  if (relearnCount > 0) secondary.push({ label: `Latih kata yang salah (${relearnCount})`, run: onRepeatWrong });
  if (stats.active > 0) secondary.push({ label: 'Latih semua kata aktif', hint: 'Latihan tidak menaikkan kotak.', run: onRepeatAll });
  secondary.push({ label: 'Tambah kata', run: onAdd });
  if (hasPresets) secondary.push({ label: 'Paket kata', run: onManageMaterial });
  const rest = secondary.filter(a => a.run !== primary?.run);

  return (
    <Page>
      {header}
      <Title>{name}</Title>

      <section aria-label="Hari ini">
        {focus}
        <Button className="mt-5" onClick={primary.run}>{primary.label}</Button>
      </section>

      {stats.active > 0 && (
        <section className="mt-12">
          <h2 className="text-section text-ink mb-3">Kotak kartu</h2>
          <BoxShelf counts={boxCounts(stats.boxes)} />
          <p className="mt-3 text-secondary text-muted">
            {stats.mastered} hafal · {stats.reserve} di antrian. Kotak menunjukkan jarak ulang tiap kata, dari kurang dari sehari (kotak 0) sampai dua bulan lebih (kotak 5). Jaraknya dihitung dari riwayat jawabanmu: kata yang kamu kuasai makin jarang muncul, yang sering lupa makin sering.
          </p>
        </section>
      )}

      <nav className="mt-12" aria-label="Aksi lain">
        {rest.map(a => <LinkRow key={a.label} onClick={a.run} hint={a.hint}>{a.label}</LinkRow>)}
      </nav>
    </Page>
  );
};

type PolyglotProps = { perLang: { lang: string; active: number }[]; onStart: () => void; onExit: () => void };

export const PolyglotHomeView = ({ perLang, onStart, onExit }: PolyglotProps) => {
  const total = perLang.reduce((n, l) => n + l.active, 0);
  return (
    <Page>
      <TopBar onBack={onExit} backLabel="Bahasamu" />
      <Title sub="Semua kata aktif diacak dalam satu sesi. Ini latihan: jawaban benar tidak menaikkan kotak, jawaban salah tetap kembali ke kotak 0.">Campur semua bahasa</Title>
      <ul className="mb-6">
        {perLang.map(l => (
          <li key={l.lang} className="flex justify-between py-3 border-t border-line">
            <span className="text-ink">{displayLangName(l.lang)}</span>
            <span className="text-muted tabular-nums">{l.active} kata</span>
          </li>
        ))}
        <li className="flex justify-between py-3 border-t border-line font-semibold">
          <span>Total</span><span className="tabular-nums">{total} kata</span>
        </li>
      </ul>
      <Button onClick={onStart}>Mulai latihan campuran</Button>
    </Page>
  );
};
