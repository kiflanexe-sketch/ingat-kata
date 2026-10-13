import type { LangStats } from '../types.ts';
import { displayLangName } from '../data/languages.ts';
import { formatDueIn } from '../lib/format.ts';
import { LinkRow, Page, Title, TopBar } from '../components/ui.tsx';
import { IconChevronRight } from '../components/Icon.tsx';
import { InstallPrompt } from '../components/InstallPrompt.tsx';
import { StatsSection } from './StatsSection.tsx';
import { dayKey, type StudyLog } from '../lib/stats.ts';
import { XP_CORRECT, XP_GOAL, XP_WRONG, badgeStates, levelInfo, totalXp } from '../lib/rewards.ts';
import { BadgeGrid, DailyGoal, LevelBar } from '../components/Rewards.tsx';

type Props = {
  stats: LangStats[];
  now: number;
  log: StudyLog;
  dailyGoal: number;
  backupReminder: string | null;
  onOpen: (lang: string) => void;
  onPolyglot: () => void;
  onNewLanguage: () => void;
  onSettings: () => void;
};

const deckMeta = (s: LangStats) => {
  if (s.total === 0) return 'Belum ada kata';
  const parts = [`${s.active} aktif`];
  if (s.mastered > 0) parts.push(`${s.mastered} hafal`);
  if (s.reserve > 0) parts.push(`${s.reserve} di antrian`);
  return parts.join(' · ');
};

export const DeckListView = ({ stats, now, log, dailyGoal, backupReminder, onOpen, onPolyglot, onNewLanguage, onSettings }: Props) => {
  const studied = stats.filter(s => s.active > 0);
  const totalActive = studied.reduce((n, s) => n + s.active, 0);
  const totalDue = stats.reduce((n, s) => n + s.due, 0);
  const badges = badgeStates(log);
  const earned = badges.filter(b => b.earned).length;

  return (
    <Page>
      <TopBar right={<button onClick={onSettings} className="min-h-11 px-1 text-secondary font-semibold text-primary hover:underline underline-offset-4">Pengaturan & data</button>} />
      <Title sub={totalDue > 0 ? `${totalDue} kartu jatuh tempo hari ini.` : 'Tidak ada kartu jatuh tempo saat ini.'}>Bahasamu</Title>
      <section aria-label="Level dan target harian" className="mb-6 space-y-3">
        <LevelBar info={levelInfo(totalXp(log))} />
        <DailyGoal done={log[dayKey(now)]?.r ?? 0} goal={dailyGoal} />
      </section>
      <InstallPrompt />

      <ul>
        {stats.map(s => (
          <li key={s.lang}>
            <button onClick={() => onOpen(s.lang)} className="w-full flex items-center gap-3 min-h-16 py-3 border-t border-line text-left group">
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-ink truncate group-hover:underline underline-offset-4">{displayLangName(s.lang)}</span>
                <span className="block text-secondary text-muted">{deckMeta(s)}</span>
              </span>
              {s.due > 0 ? (
                <span className="shrink-0 px-2.5 py-0.5 rounded-pill bg-due-soft text-due text-meta">{s.due} jatuh tempo</span>
              ) : s.nextDue !== null ? (
                <span className="shrink-0 text-secondary text-muted">{formatDueIn(s.nextDue - now)}</span>
              ) : null}
              <IconChevronRight size={18} className="text-subtle shrink-0" />
            </button>
          </li>
        ))}
      </ul>
      <LinkRow onClick={onNewLanguage}>Tambah bahasa</LinkRow>

      {studied.length > 1 && (
        <section className="mt-12">
          <h2 className="text-section text-ink">Campur semua bahasa</h2>
          <p className="text-secondary text-muted mt-1 mb-4">
            {totalActive} kata aktif dari {studied.map(s => displayLangName(s.lang)).join(', ')}, diacak dalam satu sesi latihan.
          </p>
          <button onClick={onPolyglot} className="w-full min-h-12 rounded-control border-[1.5px] border-primary text-primary font-semibold hover:bg-primary-soft transition-colors duration-state">Mulai latihan campuran</button>
        </section>
      )}

      <StatsSection log={log} now={now} />

      <section className="mt-12" aria-labelledby="badges-title">
        <h2 id="badges-title" className="text-section text-ink">Lencana</h2>
        <p className="mt-1 mb-3 text-secondary text-muted">{earned} dari {badges.length} didapat. XP datang dari tiap jawaban (benar {XP_CORRECT}, salah {XP_WRONG}), bonus kecepatan kuis kilat, dan target harian (+{XP_GOAL}).</p>
        <BadgeGrid badges={badges} />
      </section>

      {backupReminder && (
        <p className="mt-12 text-secondary text-muted">
          {backupReminder}{' '}
          <button onClick={onSettings} className="font-semibold text-primary hover:underline underline-offset-4">Cadangkan</button>
        </p>
      )}
    </Page>
  );
};
