import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { QuizAnswer, QuizQuestion } from '../lib/quiz.ts';
import { speedPoints, XP_CORRECT } from '../lib/rewards.ts';
import { canSpeak, speak } from '../lib/speech.ts';
import { playSfx, sfxDuration, unlockSfx } from '../lib/sfx.ts';
import { withTransition } from '../lib/transition.ts';
import { displayLangName } from '../data/languages.ts';
import { isScriptSource } from '../data/words.ts';
import { Button, Page, Title, TopBar, Word } from '../components/ui.tsx';
import { IconVolume, IconX } from '../components/Icon.tsx';

type Props = {
  questions: QuizQuestion[];
  lang: string;
  seconds: number;
  autoSpeak: boolean;
  sfx: boolean;
  onAnswer: (answer: QuizAnswer) => void;
  onFinish: (answers: QuizAnswer[]) => void;
  onBack: () => void;
};

const CORRECT_PAUSE = 650;
const clock = () => performance.now();

// Jawaban benar berturut-turut di akhir daftar.
const trailingCorrect = (answers: QuizAnswer[]) => {
  let n = 0;
  for (let i = answers.length - 1; i >= 0 && answers[i].correct; i--) n++;
  return n;
};

// Nilai terbaru untuk dipakai di timer dan listener, tanpa membuat timer mulai ulang.
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; });
  return ref;
}

export const QuizView = ({ questions, lang, seconds, autoSpeak, sfx, onAnswer, onFinish, onBack }: Props) => {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const latest = useLatest({ answers, index, onFinish });

  if (!started) {
    const maxOptions = Math.max(...questions.map(x => x.options.length));
    return (
      <Page>
        <TopBar onBack={onBack} />
        <Title sub={`${questions.length} soal · ${seconds} detik per soal`}>Kuis kilat</Title>
        <ul className="list-disc pl-5 space-y-1 text-body text-ink">
          <li>Pilih arti yang benar sebelum waktunya habis.</li>
          <li>Tiap jawaban benar bernilai {XP_CORRECT} poin, ditambah sampai 5 poin kalau cepat.</li>
          <li>Kuis tidak mengubah jadwal ulang kartu. Kata yang salah bisa kamu latih sesudahnya.</li>
        </ul>
        <p className="mt-3 text-secondary text-muted">Di keyboard, tekan 1-{maxOptions} untuk memilih.</p>
        <Button className="mt-8" autoFocus onClick={() => { if (sfx) unlockSfx(); setStarted(true); }}>Mulai</Button>
      </Page>
    );
  }

  const answered = (a: QuizAnswer) => { setAnswers(prev => [...prev, a]); onAnswer(a); };
  const next = () => {
    const { answers: done, index: i, onFinish: finish } = latest.current;
    if (i + 1 >= questions.length) finish(done);
    else withTransition(() => setIndex(i + 1), 'card');
  };

  const combo = trailingCorrect(answers);
  const score = answers.reduce((n, a) => n + (a.correct ? XP_CORRECT + a.points : 0), 0);

  return (
    <QuizRound
      key={index} q={questions[index]} index={index} total={questions.length} lang={lang} seconds={seconds} autoSpeak={autoSpeak} sfx={sfx}
      score={score} combo={combo} onAnswer={answered} onNext={next}
      onQuit={() => (answers.length > 0 ? onFinish(answers) : onBack())}
    />
  );
};

type RoundProps = {
  q: QuizQuestion;
  index: number;
  total: number;
  lang: string;
  seconds: number;
  autoSpeak: boolean;
  sfx: boolean;
  score: number;
  combo: number;
  onAnswer: (a: QuizAnswer) => void;
  onNext: () => void;
  onQuit: () => void;
};

// Satu soal. Dipasang ulang per soal (key = index), jadi jam dan pilihan selalu mulai bersih.
const QuizRound = ({ q, index, total, lang, seconds, autoSpeak, sfx, score, combo, onAnswer, onNext, onQuit }: RoundProps) => {
  const [result, setResult] = useState<{ chosen: number | null; answer: QuizAnswer } | null>(null);
  const [left, setLeft] = useState(seconds);
  const startedAt = useRef(0);
  const limit = seconds * 1000;
  const cardLang = q.card.originLang ?? lang;
  const forward = q.direction === 'forward';
  const speakable = canSpeak(cardLang);

  const choose = (option: number | null) => {
    if (result) return;
    const ms = Math.min(limit, clock() - startedAt.current);
    const correct = option === q.answer;
    const answer: QuizAnswer = { card: q.card, direction: q.direction, correct, ms, points: correct ? speedPoints(limit - ms, limit) : 0, timedOut: option === null };
    setResult({ chosen: option, answer });
    onAnswer(answer);
    const effect = correct ? 'correct' : option === null ? 'timeout' : 'wrong';
    if (sfx) playSfx(effect);
    // Kata diucapkan setelah bunyi salah selesai, supaya keduanya tidak bertumpuk.
    if (!correct && autoSpeak && speakable) {
      const say = () => void speak(q.card.front, cardLang);
      if (sfx) setTimeout(say, sfxDuration(effect) + 80); else say();
    }
  };
  const latest = useLatest({ choose, onNext, result });

  // Jam soal: mulai saat soal tampil; habis = dianggap salah.
  useEffect(() => {
    startedAt.current = clock();
    const tick = setInterval(() => setLeft(Math.max(0, Math.ceil((limit - (clock() - startedAt.current)) / 1000))), 200);
    const timeout = setTimeout(() => latest.current.choose(null), limit);
    return () => { clearInterval(tick); clearTimeout(timeout); };
  }, [limit, latest]);

  // Benar lanjut sendiri; salah menunggu pengguna membaca jawabannya.
  const correct = result?.answer.correct;
  useEffect(() => {
    if (!correct) return;
    const t = setTimeout(() => latest.current.onNext(), CORRECT_PAUSE);
    return () => clearTimeout(t);
  }, [correct, latest]);

  // Keyboard: angka memilih, Enter lanjut setelah jawaban salah.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { choose: pick, onNext: go, result: r } = latest.current;
      if (!r && /^[1-9]$/.test(e.key) && Number(e.key) <= q.options.length) pick(Number(e.key) - 1);
      else if (r && !r.answer.correct && e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); go(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, latest]);

  const label = isScriptSource(q.card.source)
    ? `Huruf ${displayLangName(cardLang)} → cara baca`
    : forward ? `${displayLangName(cardLang)} → Indonesia` : `Indonesia → ${displayLangName(cardLang)}`;
  const urgent = !result && left <= Math.min(3, Math.ceil(seconds / 3));

  const optionClass = (i: number) => {
    const base = 'w-full min-h-14 px-4 py-3 rounded-control border-[1.5px] text-left flex items-center gap-3 transition-colors duration-state';
    if (!result) return `${base} border-control bg-card text-ink enabled:hover:border-primary enabled:hover:bg-primary-soft`;
    if (i === q.answer) return `${base} border-ok bg-ok-soft text-ok font-semibold`;
    if (i === result.chosen) return `${base} nudge border-bad bg-bad-soft text-bad`;
    return `${base} border-line bg-card text-muted`;
  };

  return (
    <main className="mx-auto w-full max-w-content px-5 pb-10">
      <div className="flex items-center gap-3 min-h-14">
        <button onClick={onQuit} className="-ml-2 p-2 text-muted hover:text-ink" aria-label="Akhiri kuis"><IconX /></button>
        <div className="vt-study-progress flex-1 h-1.5 bg-line rounded-pill overflow-hidden" role="progressbar" aria-label="Kemajuan kuis" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index}>
          <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${(index / total) * 100}%` }} />
        </div>
        <span className="text-secondary text-muted tabular-nums">{index + 1} / {total}</span>
      </div>

      <div className="flex items-center justify-between min-h-8">
        <p className="relative text-secondary text-ink tabular-nums">
          Skor <strong>{score}</strong>
          {result?.answer.correct && <span className="points-pop absolute left-full ml-2 whitespace-nowrap text-ok font-semibold" aria-hidden="true">+{XP_CORRECT + result.answer.points}</span>}
        </p>
        {combo >= 3 && <p className="text-meta px-2.5 py-0.5 rounded-pill bg-due-soft text-due">Beruntun {combo}</p>}
      </div>

      <div className="vt-study-card index-card rounded-card border border-line shadow-card px-5 pb-5 mt-2">
        <div className="flex items-center justify-between h-11 text-meta text-muted">
          <span>{label}</span>
          {!result && <span className={`tabular-nums ${urgent ? 'text-bad font-semibold' : ''}`}>{left} dtk</span>}
        </div>
        <h1 className="pt-[18px] pb-4 text-center text-ink">
          <Word text={forward ? q.card.front : q.card.back} lang={forward ? cardLang : undefined} className="!leading-[64px]" />
        </h1>
        <div className="h-1.5 rounded-pill bg-line overflow-hidden" role="timer" aria-label={`Sisa waktu ${left} detik`}>
          <div className={`quiz-timer h-full ${urgent ? 'bg-bad' : 'bg-primary'}`} data-paused={result ? '' : undefined}
            style={{ '--quiz-time': `${seconds}s` } as CSSProperties} />
        </div>
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="Pilihan jawaban">
        {q.options.map((o, i) => (
          <li key={i}>
            <button onClick={() => choose(i)} disabled={!!result} className={optionClass(i)} aria-keyshortcuts={String(i + 1)}>
              <span className="shrink-0 w-6 h-6 rounded-pill border border-current text-meta grid place-items-center opacity-70" aria-hidden="true">{i + 1}</span>
              {forward ? <span className="text-body">{o}</span> : <Word text={o} lang={cardLang} size="row" />}
            </button>
          </li>
        ))}
      </ol>

      <div aria-live="polite">
        {result?.answer.correct && <p className="sr-only">Benar.</p>}
        {result && !result.answer.correct && (
          <div className="enter-rise mt-4">
            <p className="text-bad"><strong>{result.answer.timedOut ? 'Waktu habis.' : 'Belum tepat.'}</strong> Jawabannya: {q.options[q.answer]}</p>
            {speakable && (
              <button onClick={() => void speak(q.card.front, cardLang)} className="mt-1 -ml-2 inline-flex items-center gap-1.5 min-h-11 px-2 text-secondary font-semibold text-primary" aria-label={`Dengarkan pengucapan ${q.card.front}`}>
                <IconVolume size={18} /> Dengar
              </button>
            )}
            <Button className="mt-3" autoFocus onClick={onNext}>{index + 1 >= total ? 'Lihat hasil' : 'Lanjut'}</Button>
          </div>
        )}
      </div>
    </main>
  );
};
