import { useEffect, useState } from 'react';
import type { AnswerRecord, SessionMode, StudyItem } from '../types.ts';
import { checkAnswer } from '../lib/answer.ts';
import { MAX_BOX } from '../lib/srs.ts';
import { canSpeak, speak } from '../lib/speech.ts';
import { displayLangName } from '../data/languages.ts';
import { IconCheck, IconVolume, IconX } from '../components/Icon.tsx';

type Props = {
  item: StudyItem;
  index: number;
  total: number;
  mode: SessionMode;
  lang: string;
  alternatives: string[];
  onGrade: (record: AnswerRecord) => void;
  onNext: () => void;
  onQuit: () => void;
};

type Phase = 'answering' | 'correct' | 'wrong';

// Dipasang ulang per kartu (key = index), jadi state lokal selalu mulai bersih.
export const StudyView = ({ item, index, total, mode, lang, alternatives, onGrade, onNext, onQuit }: Props) => {
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('answering');
  const [note, setNote] = useState<string | undefined>();

  const { card, direction } = item;
  const cardLang = card.originLang ?? lang;
  const foreignName = displayLangName(cardLang);
  const questionText = direction === 'forward' ? card.front : card.back;
  const answerText = direction === 'forward' ? card.back : card.front;
  const questionLabel = direction === 'forward' ? foreignName : 'Bahasa Indonesia';
  const answerLabel = direction === 'forward' ? 'Bahasa Indonesia' : foreignName;
  const placeholder = direction === 'forward' ? 'Ketik arti dalam Bhs Indonesia...' : `Ketik dalam bahasa ${foreignName}...`;
  const speakable = canSpeak(cardLang);
  const progress = (index / total) * 100;

  // Jawaban benar lanjut otomatis; beri waktu lebih bila ada catatan untuk dibaca.
  useEffect(() => {
    if (phase !== 'correct') return;
    const timer = setTimeout(onNext, note ? 2500 : 900);
    return () => clearTimeout(timer);
  }, [phase, note, onNext]);

  const grade = (correct: boolean, given: string, resultNote?: string) => {
    setPhase(correct ? 'correct' : 'wrong');
    setNote(resultNote);
    onGrade({ card, direction, correct, given });
    if (speakable && (direction === 'backward' || !correct)) speak(card.front, cardLang);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === 'correct') { onNext(); return; }
    if (phase !== 'answering' || !input.trim()) return;
    const result = checkAnswer(input, answerText, alternatives);
    grade(result.correct, input, result.note);
  };

  const speakButton = speakable ? (
    <button type="button" onClick={() => speak(card.front, cardLang)} className="p-2 rounded-full text-indigo-500 hover:bg-indigo-50" aria-label={`Dengarkan pengucapan ${card.front}`}><IconVolume /></button>
  ) : null;

  return (
    <div className="max-w-xl mx-auto w-full min-h-screen flex flex-col p-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onQuit} className="p-1 text-gray-400 hover:text-gray-700" aria-label="Akhiri sesi"><IconX /></button>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index}><div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div></div>
      </div>
      <div className="flex justify-between text-sm text-gray-400 mb-8 font-medium">
        <span>{item.retry ? 'Ulangan kartu yang salah' : `Kartu ${index + 1} dari ${total}`}{mode === 'practice' && ' · Latihan'}</span>
        <span>Kotak {card.box}/{MAX_BOX}</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="text-center space-y-4">
          <span className="text-indigo-500 font-bold tracking-wider text-sm uppercase">{questionLabel}</span>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-5xl font-bold text-gray-800 break-words">{questionText}</h2>
            {direction === 'forward' && speakButton}
          </div>
        </div>
        <div className="w-full relative">
          {phase !== 'wrong' ? (
            <form onSubmit={handleSubmit} className="relative">
              <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder} aria-label={`Jawaban dalam ${answerLabel}`} autoComplete="off" autoCapitalize="off" spellCheck={false}
                className={`w-full p-5 pr-16 text-center text-2xl rounded-2xl border-2 outline-none transition-all shadow-sm ${phase === 'answering' ? 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100' : 'border-green-500 bg-green-50 text-green-700'}`}
                autoFocus readOnly={phase === 'correct'} />
              <button type="submit" className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-gray-100 rounded-lg text-gray-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors" aria-label="Periksa jawaban"><IconCheck size={24} /></button>
            </form>
          ) : (
            <div className="w-full p-6 rounded-2xl bg-red-50 border-2 border-red-200 text-center space-y-4 animate-shake">
              <div><p className="text-red-500 font-medium mb-1">Jawaban Kamu:</p><p className="text-xl line-through text-red-400">{input.trim() || '(tidak dijawab)'}</p></div>
              <div className="py-2 border-t border-red-100">
                <p className="text-green-600 font-medium mb-1">Jawaban Benar ({answerLabel}):</p>
                <div className="flex items-center justify-center gap-2"><p className="text-3xl font-bold text-gray-800">{answerText}</p>{direction === 'backward' && speakButton}</div>
              </div>
              <button onClick={onNext} autoFocus className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">Lanjut</button>
            </div>
          )}
        </div>
        {phase === 'correct' && (
          <div className="text-center space-y-2" role="status">
            <div className="text-green-600 font-bold text-xl flex items-center justify-center gap-2 animate-bounce"><IconCheck size={24} /> Benar!</div>
            {note && <p className="text-sm text-gray-600">{note}</p>}
            {direction === 'backward' && <div className="flex justify-center">{speakButton}</div>}
          </div>
        )}
        {phase === 'answering' && <button onClick={() => grade(false, '')} className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors">Saya tidak tahu</button>}
      </div>
    </div>
  );
};
