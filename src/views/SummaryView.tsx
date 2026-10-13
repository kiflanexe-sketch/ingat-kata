import type { AnswerRecord, SessionMode } from '../types.ts';
import { formatDueIn, percent } from '../lib/format.ts';
import type { SessionReward } from '../lib/rewards.ts';
import { Button, Page, Word } from '../components/ui.tsx';
import { RewardPanel } from '../components/Rewards.tsx';

type Props = {
  results: AnswerRecord[];
  mode: SessionMode;
  lang: string;
  nextDueIn: number | null;
  reward: SessionReward;
  quizCount: number; // soal kuis kilat yang bisa dibuat dari kata sesi ini (0 = tidak ada)
  onHome: () => void;
  onPracticeWrong: () => void;
  onQuiz: () => void;
};

export const SummaryView = ({ results, mode, lang, nextDueIn, reward, quizCount, onHome, onPracticeWrong, onQuiz }: Props) => {
  const correct = results.filter(r => r.correct).length;
  const wrong = results.filter(r => !r.correct);
  const accuracy = results.length > 0 ? correct / results.length : 0;

  return (
    <Page className="pt-10">
      <p className="text-secondary text-muted">{mode === 'practice' ? 'Latihan selesai' : 'Sesi selesai'}</p>
      <p className="mt-1 text-number tabular-nums text-ink">{percent(accuracy)}</p>
      <p className="mt-2 text-body text-ink">{correct} dari {results.length} kartu benar.</p>
      {mode === 'review' && nextDueIn !== null && <p className="text-secondary text-muted">Kartu berikutnya jatuh tempo {formatDueIn(nextDueIn)}.</p>}
      {mode === 'review' && (
        <p className="mt-3 text-secondary text-muted">
          {accuracy >= 0.8 ? 'Akurasi 80% ke atas: 5 kata baru bisa dibuka dari antrian.' : accuracy >= 0.5 ? 'Akurasi 50-80%: 2 kata baru bisa dibuka dari antrian.' : 'Akurasi di bawah 50%: kata baru ditahan dulu.'}
        </p>
      )}

      <RewardPanel reward={reward} />

      <section className="mt-10">
        {wrong.length > 0 ? (
          <>
            <h2 className="text-section text-ink mb-2">Perlu diulang ({wrong.length})</h2>
            <ul>
              {wrong.map((r, i) => (
                <li key={`${r.card.id}-${i}`} className="py-3 border-t border-line">
                  <Word text={r.card.front} lang={r.card.originLang ?? lang} size="row" className="text-ink" />
                  <span className="block text-secondary text-muted">{r.card.back}</span>
                  {r.given.trim() && <span className="block text-meta text-subtle">Jawabanmu: {r.given.trim()}</span>}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-body text-ok">Semua kartu dijawab benar.</p>
        )}
      </section>

      <div className="mt-8 space-y-2">
        <Button onClick={onHome} autoFocus>Selesai</Button>
        {quizCount > 0 && <Button variant="secondary" onClick={onQuiz}>Kuis kilat: {quizCount} kata tadi</Button>}
        {wrong.length > 0 && <Button variant="secondary" onClick={onPracticeWrong}>Latih {wrong.length} kata yang salah</Button>}
      </div>
      {quizCount > 0 && <p className="mt-2 text-meta text-subtle">Kuis kilat: pilihan ganda berwaktu untuk mengulas kata sesi ini. Tidak mengubah jadwal.</p>}
    </Page>
  );
};
