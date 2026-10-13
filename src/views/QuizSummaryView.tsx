import { useEffect, useRef } from 'react';
import type { QuizAnswer } from '../lib/quiz.ts';
import type { SessionReward } from '../lib/rewards.ts';
import { PERFECT_QUIZ_MIN, XP_CORRECT } from '../lib/rewards.ts';
import { Button, Page, Word } from '../components/ui.tsx';
import { RewardPanel } from '../components/Rewards.tsx';
import { Confetti, PerfectMedal } from '../components/Celebration.tsx';
import { playSfx } from '../lib/sfx.ts';

type Props = {
  answers: QuizAnswer[];
  total: number;
  lang: string;
  reward: SessionReward;
  sfx: boolean;
  onAgain: () => void;
  onPracticeWrong: () => void;
  onDone: () => void;
};

const bestRun = (answers: QuizAnswer[]) => {
  let best = 0;
  let run = 0;
  for (const a of answers) { run = a.correct ? run + 1 : 0; best = Math.max(best, run); }
  return best;
};

export const QuizSummaryView = ({ answers, total, lang, reward, sfx, onAgain, onPracticeWrong, onDone }: Props) => {
  const correct = answers.filter(a => a.correct);
  const wrong = answers.filter(a => !a.correct);
  const score = correct.reduce((n, a) => n + XP_CORRECT + a.points, 0);
  const avg = answers.length ? answers.reduce((n, a) => n + a.ms, 0) / answers.length / 1000 : 0;
  const perfect = answers.length === total && wrong.length === 0;

  // Fanfare sekali saja (StrictMode menjalankan efek dua kali di mode pengembangan).
  const played = useRef(false);
  useEffect(() => {
    if (!perfect || !sfx || played.current) return;
    played.current = true;
    playSfx('perfect');
  }, [perfect, sfx]);

  return (
    <Page className="pt-10">
      {perfect && (
        <>
          <Confetti />
          <div className="flex items-center gap-4 mb-6">
            <PerfectMedal />
            <div>
              <p className="celebrate-pop text-title text-ink">Sempurna!</p>
              <p className="text-secondary text-muted">Semua {total} soal dijawab benar.</p>
            </div>
          </div>
        </>
      )}
      <p className="text-secondary text-muted">{answers.length < total ? `Kuis kilat dihentikan di soal ${answers.length} dari ${total}` : 'Kuis kilat selesai'}</p>
      <p className="mt-1 flex items-baseline gap-2"><span className="text-number tabular-nums text-ink">{score}</span><span className="text-answer text-ink">poin</span></p>
      <p className="mt-2 text-body text-ink">{correct.length} dari {answers.length} benar.</p>
      <p className="text-secondary text-muted">
        Beruntun terbaik {bestRun(answers)} · rata-rata {avg.toLocaleString('id-ID', { maximumFractionDigits: 1 })} detik per soal
      </p>
      {perfect && total < PERFECT_QUIZ_MIN && (
        <p className="mt-2 text-secondary text-muted">Lencana Kuis sempurna dihitung dari kuis {PERFECT_QUIZ_MIN} soal ke atas.</p>
      )}

      <RewardPanel reward={reward} perfectQuiz={perfect && total >= PERFECT_QUIZ_MIN} />

      {wrong.length > 0 && (
        <section className="mt-10">
          <h2 className="text-section text-ink mb-2">Perlu diulang ({wrong.length})</h2>
          <ul>
            {wrong.map((a, i) => (
              <li key={`${a.card.id}-${i}`} className="py-3 border-t border-line">
                <Word text={a.card.front} lang={a.card.originLang ?? lang} size="row" className="text-ink" />
                <span className="block text-secondary text-muted">{a.card.back}</span>
                {a.timedOut && <span className="block text-meta text-subtle">Waktu habis</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 space-y-2">
        <Button onClick={onAgain} autoFocus>Main lagi</Button>
        {wrong.length > 0 && <Button variant="secondary" onClick={onPracticeWrong}>Latih {wrong.length} kata yang salah dengan mengetik</Button>}
        <Button variant="secondary" onClick={onDone}>Selesai</Button>
      </div>
    </Page>
  );
};
