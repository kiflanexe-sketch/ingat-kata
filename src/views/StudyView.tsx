import { useEffect, useState } from 'react';
import type { AnswerRecord, SessionMode, StudyItem } from '../types.ts';
import { checkAnswer } from '../lib/answer.ts';
import { MAX_BOX, SRS_INTERVALS } from '../lib/srs.ts';
import { formatDueIn } from '../lib/format.ts';
import { canSpeak, speak } from '../lib/speech.ts';
import { displayLangName } from '../data/languages.ts';
import { BoxChip, Button, Word } from '../components/ui.tsx';
import { IconVolume, IconX } from '../components/Icon.tsx';

type Props = {
  item: StudyItem;
  index: number;
  total: number;
  mode: SessionMode;
  lang: string;
  alternatives: string[];
  autoSpeak: boolean;
  onGrade: (record: AnswerRecord) => void;
  onNext: () => void;
  onQuit: () => void;
};

type Phase = 'answering' | 'correct' | 'wrong';

// Akibat jawaban pada jadwal, ditulis supaya kotak Leitner terasa nyata.
function consequence(item: StudyItem, mode: SessionMode, correct: boolean): string {
  if (item.retry) return 'Pengulangan, tidak dinilai.';
  if (!correct) return item.card.box > 0 ? `Kembali ke kotak 0 dari kotak ${item.card.box}, muncul lagi sebentar lagi.` : 'Tetap di kotak 0, muncul lagi sebentar lagi.';
  if (mode === 'practice') return `Latihan: tetap di kotak ${item.card.box}.`;
  const box = Math.min(item.card.box + 1, MAX_BOX);
  return `Naik ke kotak ${box}, muncul lagi ${formatDueIn(SRS_INTERVALS[box])}.`;
}

// Dipasang ulang per kartu (key = index), jadi state lokal selalu mulai bersih.
export const StudyView = ({ item, index, total, mode, lang, alternatives, autoSpeak, onGrade, onNext, onQuit }: Props) => {
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('answering');
  const [note, setNote] = useState<string | undefined>();

  const { card, direction } = item;
  const cardLang = card.originLang ?? lang;
  const foreignName = displayLangName(cardLang);
  const forward = direction === 'forward';
  const questionText = forward ? card.front : card.back;
  const answerText = forward ? card.back : card.front;
  const answerLabel = forward ? 'bahasa Indonesia' : foreignName;
  const speakable = canSpeak(cardLang);

  // Jawaban benar lanjut otomatis; beri waktu lebih bila ada catatan untuk dibaca.
  useEffect(() => {
    if (phase !== 'correct') return;
    const timer = setTimeout(onNext, note ? 2800 : 1400);
    return () => clearTimeout(timer);
  }, [phase, note, onNext]);

  const grade = (correct: boolean, given: string, resultNote?: string) => {
    setPhase(correct ? 'correct' : 'wrong');
    setNote(resultNote);
    onGrade({ card, direction, correct, given });
    if (autoSpeak && speakable && (!forward || !correct)) speak(card.front, cardLang);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === 'correct') { onNext(); return; }
    if (phase !== 'answering' || !input.trim()) return;
    const result = checkAnswer(input, answerText, alternatives);
    grade(result.correct, input, result.note);
  };

  const speakButton = speakable ? (
    <button type="button" onClick={() => speak(card.front, cardLang)} className="inline-flex items-center gap-1.5 min-h-11 px-2 text-secondary font-semibold text-primary" aria-label={`Dengarkan pengucapan ${card.front}`}>
      <IconVolume size={18} /> Dengar
    </button>
  ) : null;

  return (
    <main className="mx-auto w-full max-w-content px-5 pb-10">
      <div className="flex items-center gap-3 min-h-14">
        <button onClick={onQuit} className="-ml-2 p-2 text-muted hover:text-ink" aria-label="Akhiri sesi"><IconX /></button>
        <div className="flex-1 h-1.5 bg-line rounded-pill overflow-hidden" role="progressbar" aria-label="Kemajuan sesi" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index}>
          <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${(index / total) * 100}%` }} />
        </div>
        <span className="text-secondary text-muted tabular-nums">{index + 1} / {total}</span>
      </div>
      {(mode === 'practice' || item.retry) && (
        <p className="text-meta text-subtle mb-2">{item.retry ? 'Mengulang kartu yang tadi salah' : 'Latihan: jawaban benar tidak menaikkan kotak'}</p>
      )}

      <div className="index-card rounded-card border border-line shadow-card px-5 pb-5 mt-2">
        <div className="flex items-center justify-between h-11 text-meta text-muted">
          <span>{forward ? `${foreignName} → Indonesia` : `Indonesia → ${foreignName}`}</span>
          <BoxChip box={card.box} />
        </div>
        {/* Tinggi baris 64px = dua garis kartu, jadi kata duduk di atas garis biru. */}
        <h1 className="pt-[18px] text-center text-ink">
          <Word text={questionText} lang={forward ? cardLang : undefined} className="!leading-[64px]" />
        </h1>
        <div className="flex justify-center items-center h-16">{forward && speakButton}</div>
      </div>

      {phase !== 'wrong' && (
        <form onSubmit={handleSubmit} className="mt-4">
          <label htmlFor="answer" className="sr-only">Jawaban dalam {answerLabel}</label>
          <input id="answer" type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={`Arti dalam ${answerLabel}`}
            autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} autoFocus readOnly={phase === 'correct'} enterKeyHint="done"
            lang={forward ? 'id' : undefined} dir="auto"
            className={`w-full min-h-14 px-4 text-answer rounded-control border-[1.5px] bg-card outline-none transition-colors duration-state placeholder:text-subtle ${phase === 'correct' ? 'border-ok bg-ok-soft text-ok' : 'border-control focus:border-primary'}`} />
          {phase === 'answering' && (
            <div className="mt-3 flex items-center gap-3">
              <Button type="submit" className="flex-1" disabled={!input.trim()}>Periksa</Button>
              <button type="button" onClick={() => grade(false, '')} className="min-h-12 px-3 text-secondary font-semibold text-muted hover:text-ink">Tidak tahu</button>
            </div>
          )}
        </form>
      )}

      {phase === 'correct' && (
        <div role="status" className="mt-3 rounded-control bg-ok-soft text-ok px-4 py-3">
          <p><strong>Benar.</strong> {consequence(item, mode, true)}</p>
          {note && <p className="mt-1 text-secondary">{note}</p>}
          {!forward && <div className="mt-1 -ml-2">{speakButton}</div>}
          <button onClick={onNext} className="mt-1 min-h-11 text-secondary font-semibold underline underline-offset-4">Lanjut</button>
        </div>
      )}

      {phase === 'wrong' && (
        <div role="alert" className="mt-4">
          <div className="rounded-control bg-bad-soft px-4 py-3">
            <p className="text-bad"><strong>{input.trim() ? 'Belum tepat.' : 'Tidak apa-apa.'}</strong> {consequence(item, mode, false)}</p>
            {input.trim() && <p className="mt-2 text-secondary text-muted">Jawabanmu: <s>{input.trim()}</s></p>}
            <p className="mt-2 text-secondary text-muted">Jawaban ({answerLabel}):</p>
            <div className="flex items-center flex-wrap gap-x-2">
              <Word text={answerText} lang={forward ? undefined : cardLang} size="row" className="text-ink font-semibold" />
              {!forward && speakButton}
            </div>
          </div>
          <Button className="mt-4" onClick={onNext} autoFocus>Lanjut</Button>
        </div>
      )}
    </main>
  );
};
