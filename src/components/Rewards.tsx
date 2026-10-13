import type { CSSProperties } from 'react';
import type { BadgeKind, BadgeState, LevelInfo, SessionReward } from '../lib/rewards.ts';
import { XP_GOAL, XP_PERFECT_QUIZ } from '../lib/rewards.ts';

const pct = (info: LevelInfo) => Math.round(((info.xp - info.floor) / (info.next - info.floor)) * 100);

// Bilah XP menuju level berikutnya. `from` = posisi awal yang dianimasikan (lihat .fill-grow di index.css).
export const LevelBar = ({ info, from }: { info: LevelInfo; from?: number }) => {
  const to = pct(info);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-ink"><span className="text-section">Level {info.level}</span> <span className="text-secondary text-muted">· {info.title}</span></p>
        <p className="text-secondary text-muted tabular-nums">{info.xp.toLocaleString('id-ID')} XP</p>
      </div>
      <div className="mt-2 h-2 rounded-pill bg-line overflow-hidden" role="progressbar" aria-label={`XP menuju level ${info.level + 1}`}
        aria-valuemin={info.floor} aria-valuemax={info.next} aria-valuenow={info.xp}>
        <div className="fill-grow h-full rounded-pill bg-primary" style={{ width: `${to}%`, '--from': `${from ?? to}%` } as CSSProperties} />
      </div>
      <p className="mt-1 text-meta text-subtle tabular-nums">{(info.next - info.xp).toLocaleString('id-ID')} XP lagi ke level {info.level + 1}</p>
    </div>
  );
};

export const DailyGoal = ({ done, goal }: { done: number; goal: number }) => {
  const reached = done >= goal;
  return (
    <div className="flex items-center gap-3">
      <p className={`text-secondary ${reached ? 'text-ok font-semibold' : 'text-ink'}`}>
        {reached ? `Target hari ini tercapai: ${done} kartu.` : `Target hari ini: ${done} dari ${goal} kartu`}
      </p>
      <div className="flex-1 h-1.5 rounded-pill bg-line overflow-hidden" role="progressbar" aria-label="Target harian" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(done, goal)}>
        <div className={`h-full rounded-pill ${reached ? 'bg-ok' : 'bg-primary'}`} style={{ width: `${Math.min(100, (done / goal) * 100)}%` }} />
      </div>
    </div>
  );
};

// Gambar lencana: lingkaran pastel sesuai jenis, simbol bergaris tinta. Yang belum didapat kosong dan putus-putus.
const GLYPH: Record<BadgeKind, React.ReactNode> = {
  streak: <path d="M12 3.5c.8 2.7 4.5 4.6 4.5 9a4.5 4.5 0 0 1-9 0c0-2 .9-3.3 2-4.3.1 1.8 1 2.8 2 2.8-.5-2.6-.4-5 .5-7.5Z" />,
  answers: <polyline points="6.5 12.5 10.5 16.5 17.5 8" />,
  mastered: <polygon points="12 4 14.3 9 19.6 9.5 15.6 13 16.8 18.3 12 15.5 7.2 18.3 8.4 13 4.4 9.5 9.7 9" />,
  goal: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="3" /></>,
  quiz: <polygon points="13 3.5 6 13.5 11.5 13.5 10.5 20.5 18 10 12.5 10 13 3.5" />,
};

const KIND_BG: Record<BadgeKind, string> = { streak: 'var(--box-1)', answers: 'var(--box-3)', mastered: 'var(--box-5)', goal: 'var(--box-2)', quiz: 'var(--box-4)' };

export const BadgeMedal = ({ kind, earned, size = 44 }: { kind: BadgeKind; earned: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="shrink-0">
    <circle cx="12" cy="12" r="11.25" fill={earned ? KIND_BG[kind] : 'var(--paper)'} stroke={earned ? 'var(--edge)' : 'var(--control)'}
      strokeWidth="1" strokeDasharray={earned ? undefined : '2 2'} />
    <g fill="none" stroke={earned ? 'var(--ink)' : 'var(--control)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{GLYPH[kind]}</g>
  </svg>
);

const BadgeList = ({ badges }: { badges: BadgeState[] }) => (
  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
    {badges.map(b => (
      <li key={b.id} className="flex items-center gap-3 py-3 border-t border-line">
        <BadgeMedal kind={b.kind} earned={b.earned} />
        <span className="min-w-0">
          <span className={`block font-semibold ${b.earned ? 'text-ink' : 'text-muted'}`}>{b.title}</span>
          <span className="block text-meta text-subtle">
            {b.desc}{!b.earned && b.value > 0 && ` Sudah ${b.value.toLocaleString('id-ID')} dari ${b.need.toLocaleString('id-ID')}.`}
          </span>
        </span>
        <span className="sr-only">{b.earned ? 'Sudah didapat' : 'Belum didapat'}</span>
      </li>
    ))}
  </ul>
);

// Lencana yang sudah didapat dan tiga yang paling dekat; sisanya bisa dibuka.
export const BadgeGrid = ({ badges }: { badges: BadgeState[] }) => {
  const earned = badges.filter(b => b.earned);
  const next = badges.filter(b => !b.earned).sort((a, b) => b.progress - a.progress).slice(0, 3);
  const shown = new Set([...earned, ...next].map(b => b.id));
  const rest = badges.filter(b => !shown.has(b.id));
  return (
    <>
      {earned.length > 0 && <BadgeList badges={earned} />}
      {next.length > 0 && (
        <>
          <h3 className="mt-4 mb-1 text-secondary font-semibold text-ink">Berikutnya</h3>
          <BadgeList badges={next} />
        </>
      )}
      {rest.length > 0 && (
        <details className="mt-2">
          <summary className="min-h-11 flex items-center text-secondary font-semibold text-primary cursor-pointer">Lihat semua lencana ({rest.length} lagi)</summary>
          <BadgeList badges={rest} />
        </details>
      )}
    </>
  );
};

// Hadiah di akhir sesi atau kuis: XP yang didapat, naik level, target harian, lencana baru.
export const RewardPanel = ({ reward, perfectQuiz = false }: { reward: SessionReward; perfectQuiz?: boolean }) => {
  const { xp, before, after, badges, goalReached } = reward;
  const levelUp = after.level > before.level;
  return (
    <section className="mt-8 pt-6 border-t border-line" aria-labelledby="reward-title">
      <h2 id="reward-title" className="sr-only">Hadiah</h2>
      <p className="enter-rise text-title text-primary tabular-nums">+{xp} XP</p>
      {levelUp && (
        <p className="enter-rise mt-1 font-semibold text-ok">
          Naik ke level {after.level}{after.title !== before.title ? `, sekarang ${after.title}` : ''}!
        </p>
      )}
      <div className="mt-3"><LevelBar info={after} from={levelUp ? 0 : pct(before)} /></div>
      {(goalReached || perfectQuiz) && (
        <ul className="mt-3 text-secondary text-ink space-y-1">
          {goalReached && <li>Target harian tercapai, bonus +{XP_GOAL} XP.</li>}
          {perfectQuiz && <li>Kuis sempurna, bonus +{XP_PERFECT_QUIZ} XP.</li>}
        </ul>
      )}
      {badges.length > 0 && (
        <div className="mt-5">
          <h3 className="text-secondary font-semibold text-ink">Lencana baru</h3>
          <ul>
            {badges.map(b => (
              <li key={b.id} className="enter-rise flex items-center gap-3 py-2">
                <BadgeMedal kind={b.kind} earned />
                <span><span className="block font-semibold text-ink">{b.title}</span><span className="block text-meta text-subtle">{b.desc}</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
