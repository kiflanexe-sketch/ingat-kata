import { useEffect, useState } from 'react';
import type { AnswerRecord, Card, SessionMode, StudyItem } from './types.ts';
import { WORD_DATABASE, isScriptSource } from './data/words.ts';
import { MIXED_DECK } from './data/languages.ts';
import { normalize } from './lib/answer.ts';
import {
  activateFromReserve, addWords, applyReview, buildQueue, hasPair, isDue, needsRelearn, nextDueAt, shuffleArray, smartAddCount,
} from './lib/srs.ts';
import {
  deckExists, deckStats, deleteDeck, exportBackup, listDeckLangs, loadDeck, loadLog, loadMeta, loadSettings, saveLog, parseBackup, requestPersistentStorage,
  restoreBackup, saveDeck, saveMeta, saveSettings, type ParsedBackup, type RestoreMode, type Settings,
} from './lib/storage.ts';
import { ONE_DAY } from './lib/srs.ts';
import { formatAgo } from './lib/format.ts';
import { recordAnswer, recordPerfectQuiz, recordSnapshot, type StudyLog } from './lib/stats.ts';
import { PERFECT_QUIZ_MIN, sessionReward, type SessionReward } from './lib/rewards.ts';
import { buildQuiz, type QuizAnswer, type QuizQuestion } from './lib/quiz.ts';
import { withTransition, type TransitionKind } from './lib/transition.ts';
import { Modal, type ModalConfig } from './components/Modal.tsx';
import { DeckListView } from './views/DeckListView.tsx';
import { OnboardingView } from './views/OnboardingView.tsx';
import { HomeView, PolyglotHomeView } from './views/HomeView.tsx';
import { StudyView } from './views/StudyView.tsx';
import { SummaryView } from './views/SummaryView.tsx';
import { AddView, type SaveResult } from './views/AddView.tsx';
import { ListView } from './views/ListView.tsx';
import { MaterialView } from './views/MaterialView.tsx';
import { SettingsView } from './views/SettingsView.tsx';
import { QuizView } from './views/QuizView.tsx';
import { QuizSummaryView } from './views/QuizSummaryView.tsx';

type View = 'decks' | 'onboarding' | 'settings' | 'home' | 'study' | 'summary' | 'add' | 'list' | 'material' | 'quiz' | 'quizSummary';
type Deck = { lang: string; cards: Card[]; lastAccuracy: number | null };
type Session = { mode: SessionMode; queue: StudyItem[]; index: number; results: AnswerRecord[]; startLog: StudyLog };
type Summary = { mode: SessionMode; results: AnswerRecord[]; reward: SessionReward };
// `cards` = kata yang dikuis, disimpan untuk "Main lagi".
type Quiz = { cards: Card[]; questions: QuizQuestion[]; startLog: StudyLog; run: number };
type QuizResult = { answers: QuizAnswer[]; total: number; reward: SessionReward };

// Di mode Gabungan id kartu hanya unik per bahasa.
const sameCard = (a: Card, b: Card) => a.id === b.id && a.originLang === b.originLang;

// Kedalaman layar menentukan arah geser: lebih dalam = maju (dari kanan), lebih dangkal = kembali.
const VIEW_DEPTH: Record<string, number> = { onboarding: 0, decks: 0, settings: 1, home: 1, material: 2, list: 2, add: 2, summary: 3, study: 3, quiz: 3, quizSummary: 3 };

const BACKUP_REMINDER_AFTER = 7 * ONE_DAY;

const backupFileName = () => `ingatkata-cadangan-${new Date().toISOString().slice(0, 10)}.json`;


// Catat jumlah kata hafal dan aktif hari ini, untuk grafik progres di halaman depan.
const snapshotProgress = () => {
  let mastered = 0;
  let active = 0;
  for (const lang of listDeckLangs()) {
    const s = deckStats(lang, loadDeck(lang), Date.now());
    mastered += s.mastered;
    active += s.active;
  }
  if (active > 0) saveLog(recordSnapshot(loadLog(), Date.now(), mastered, active));
};

export default function App() {
  const [view, setView] = useState<View>(() => (listDeckLangs().length > 0 ? 'decks' : 'onboarding'));
  const [deck, setDeck] = useState<Deck | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [settings, setSettings] = useState<Settings>(loadSettings);

  // Jumlah kartu jatuh tempo ikut bergerak walau layar dibiarkan terbuka.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Data hanya ada di browser; minta agar tidak dihapus otomatis saat ruang menipis.
  useEffect(() => {
    if (listDeckLangs().length > 0) void requestPersistentStorage();
    snapshotProgress();
  }, []);

  const navigate = (next: View, update?: () => void) => {
    const from = VIEW_DEPTH[view];
    const to = VIEW_DEPTH[next];
    const kind: TransitionKind = to > from ? 'forward' : to < from ? 'back' : 'fade';
    withTransition(() => { update?.(); setView(next); }, kind);
  };

  const updateSettings = (next: Settings) => { setSettings(next); saveSettings(next); };

  const showAlert = (title: string, message: string) => setModal({ type: 'alert', title, message });
  const showConfirm = (title: string, message: string, onConfirm: () => void, opts: Partial<ModalConfig> = {}) =>
    setModal({ type: 'confirm', title, message, onConfirm, ...opts });

  // Semua perubahan deck lewat sini supaya state dan localStorage selalu sama.
  const commit = (next: Deck) => {
    setDeck(next);
    setNow(Date.now()); // kartu baru dijadwalkan "sekarang", jadi hitungan jatuh tempo harus ikut maju
    if (next.lang === MIXED_DECK) return;
    saveMeta(next.lang, { lastAccuracy: next.lastAccuracy });
    if (!saveDeck(next.lang, next.cards)) {
      showAlert('Gagal menyimpan', 'Penyimpanan browser penuh atau diblokir. Perubahan terakhir mungkin hilang saat halaman ditutup. Simpan file cadangan dari Pengaturan & data.');
    }
  };
  const updateCards = (fn: (cards: Card[]) => Card[]) => { if (deck) commit({ ...deck, cards: fn(deck.cards) }); };

  const goToDecks = () => {
    navigate(listDeckLangs().length > 0 ? 'decks' : 'onboarding', () => {
      setDeck(null);
      setNow(Date.now());
    });
  };

  const openDeck = (lang: string) => {
    setDeck({ lang, cards: loadDeck(lang), lastAccuracy: loadMeta(lang).lastAccuracy });
    setNow(Date.now());
    navigate('home');
  };

  // Memilih bahasa yang sudah punya deck membuka deck itu, tidak menimpanya.
  const pickLanguage = (lang: string) => {
    if (!deckExists(lang) && !saveDeck(lang, [])) {
      showAlert('Gagal membuat deck', 'Penyimpanan browser tidak bisa dipakai. Coba matikan mode privat atau kosongkan ruang penyimpanan.');
      return;
    }
    void requestPersistentStorage();
    openDeck(lang);
  };

  const startPolyglot = () => {
    const cards = listDeckLangs().flatMap(lang =>
      loadDeck(lang).filter(c => c.status === 'active').map(c => ({ ...c, originLang: lang })),
    );
    if (cards.length === 0) return showAlert('Belum ada kata aktif', 'Mulai belajar di salah satu bahasa dulu.');
    setDeck({ lang: MIXED_DECK, cards, lastAccuracy: null });
    navigate('home');
  };

  // --- Sesi belajar ---

  const startSession = (mode: SessionMode, cards: Card[]) => {
    if (cards.length === 0) return;
    // Kartu huruf selalu huruf -> cara baca; kebalikannya butuh keyboard aksara asing.
    const queue = buildQueue(cards, settings.direction).map(i => (isScriptSource(i.card.source) ? { ...i, direction: 'forward' as const } : i));
    setSession({ mode, queue, index: 0, results: [], startLog: loadLog() });
    navigate('study');
  };

  const activeCards = deck?.cards.filter(c => c.status === 'active') ?? [];
  const startReview = () => startSession('review', activeCards.filter(c => isDue(c, Date.now())).sort((a, b) => a.nextReview - b.nextReview));
  const practiceAll = () => startSession('practice', shuffleArray(activeCards));
  const practiceWrong = () => startSession('practice', shuffleArray(activeCards.filter(needsRelearn)));

  const alternativesFor = (item: StudyItem): string[] => {
    if (!deck) return [];
    const ask = (c: Card) => normalize(item.direction === 'forward' ? c.front : c.back);
    const question = ask(item.card);
    return deck.cards
      .filter(c => !sameCard(c, item.card) && c.originLang === item.card.originLang && ask(c) === question)
      .map(c => (item.direction === 'forward' ? c.back : c.front));
  };

  // Mengembalikan kartu sesudah dinilai, supaya layar belajar bisa menyebut jadwal barunya.
  const gradeCurrent = (record: AnswerRecord): Card | null => {
    if (!session || !deck) return null;
    const item = session.queue[session.index];
    if (item.retry) return null; // ulangan di akhir sesi tidak dinilai dua kali
    const t = Date.now();
    const update = (c: Card) => applyReview(c, record.grade, t, session.mode, settings.retention);
    const updated = update(item.card);
    if (deck.lang === MIXED_DECK && item.card.originLang) {
      const origin = item.card.originLang;
      saveDeck(origin, loadDeck(origin).map(c => (c.id === item.card.id ? update(c) : c)));
    }
    commit({ ...deck, cards: deck.cards.map(c => (sameCard(c, item.card) ? update(c) : c)) });
    setSession({
      ...session,
      results: [...session.results, record],
      queue: record.correct ? session.queue : [...session.queue, { card: item.card, direction: item.direction, retry: true }],
    });
    saveLog(recordAnswer(loadLog(), t, record.correct, record.ms, { goal: settings.dailyGoal }));
    return updated;
  };

  const finishSession = (s: Session) => {
    if (s.results.length === 0) {
      navigate('home', () => { setSession(null); setNow(Date.now()); });
      return;
    }
    navigate('summary', () => {
      setSession(null);
      setNow(Date.now());
      // Hanya sesi review terjadwal yang menentukan jatah kata baru.
      if (deck && s.mode === 'review' && deck.lang !== MIXED_DECK) {
        commit({ ...deck, lastAccuracy: s.results.filter(r => r.correct).length / s.results.length });
      }
      setSummary({ mode: s.mode, results: s.results, reward: sessionReward(s.startLog, loadLog(), Date.now()) });
      snapshotProgress();
    });
  };

  const nextCard = () => {
    if (!session) return;
    if (session.index + 1 >= session.queue.length) finishSession(session);
    else withTransition(() => setSession({ ...session, index: session.index + 1 }), 'card');
  };

  const practiceWrongFromSummary = () => {
    if (!summary || !deck) return;
    startSession('practice', shuffleArray(currentCards(summary.results.filter(r => !r.correct).map(r => r.card))));
  };

  // --- Kuis kilat ---

  // Kartu terbaru dari deck untuk kata-kata ini (progres bisa berubah selama sesi).
  const currentCards = (cards: Card[]) => (deck ? deck.cards.filter(c => cards.some(w => sameCard(w, c))) : []);

  const quizFor = (cards: Card[]) => (deck ? buildQuiz(cards, deck.cards, settings.direction) : []);

  const startQuiz = (cards: Card[]) => {
    const questions = quizFor(cards);
    if (questions.length === 0) {
      return showAlert('Kata belum cukup', 'Kuis kilat butuh paling sedikit dua kata dengan arti berbeda di bahasa yang sama.');
    }
    navigate('quiz', () => setQuiz({ cards, questions, startLog: loadLog(), run: (quiz?.run ?? 0) + 1 }));
  };

  const recordQuizAnswer = (a: QuizAnswer) => {
    saveLog(recordAnswer(loadLog(), Date.now(), a.correct, a.ms, { goal: settings.dailyGoal, points: a.points }));
  };

  const finishQuiz = (answers: QuizAnswer[]) => {
    if (!quiz) return;
    const total = quiz.questions.length;
    if (answers.length === total && total >= PERFECT_QUIZ_MIN && answers.every(a => a.correct)) {
      saveLog(recordPerfectQuiz(loadLog(), Date.now()));
    }
    navigate('quizSummary', () => setQuizResult({ answers, total, reward: sessionReward(quiz.startLog, loadLog(), Date.now()) }));
  };

  const practiceWrongFromQuiz = () => {
    if (!quizResult) return;
    startSession('practice', shuffleArray(currentCards(quizResult.answers.filter(a => !a.correct).map(a => a.card))));
  };

  // --- Mengelola kata ---

  const smartAdd = () => {
    if (!deck) return;
    const count = smartAddCount(deck.lastAccuracy);
    if (count === 0) return;
    const r = activateFromReserve(deck.cards, count, Date.now());
    if (r.added === 0) return showAlert('Antrian kosong', 'Ambil paket kata baru dari menu Materi.');
    commit({ ...deck, cards: r.cards });
    showAlert('Kata baru aktif', `${r.added} kata dari antrian siap dipelajari.`);
  };

  const importLevel = (level: string) => {
    if (!deck) return;
    const words = shuffleArray(WORD_DATABASE[deck.lang]?.[level] ?? []).map(w => ({ front: w.f, back: w.b }));
    const r = addWords(deck.cards, words, { source: `preset-${level}`, now: Date.now(), idPrefix: `preset-${level}` });
    commit({ ...deck, cards: r.cards });
    const active = r.added.filter(c => c.status === 'active').length;
    const lines = [`${r.added.length} kata ditambahkan: ${active} langsung aktif, ${r.added.length - active} masuk antrian.`];
    if (r.skipped > 0) lines.push(`${r.skipped} kata dilewati karena sudah ada di deck.`);
    showAlert(`Paket ${level}`, lines.join('\n'));
    navigate('home');
  };

  const addCard = (front: string, back: string): SaveResult => {
    if (!deck) return { ok: false, reason: 'Deck tidak terbuka.' };
    if (hasPair(deck.cards, front, back)) return { ok: false, reason: 'Kata dengan arti yang sama sudah ada di deck.' };
    const r = addWords(deck.cards, [{ front, back }], { source: 'custom', now: Date.now(), idPrefix: 'custom', allActive: true });
    commit({ ...deck, cards: r.cards });
    return { ok: true };
  };

  const bulkAdd = (pairs: { front: string; back: string }[]) => {
    if (!deck) return { added: 0, active: 0, skipped: 0 };
    const r = addWords(deck.cards, shuffleArray(pairs), { source: 'custom', now: Date.now(), idPrefix: 'custom' });
    if (r.added.length > 0) commit({ ...deck, cards: r.cards });
    return { added: r.added.length, active: r.added.filter(c => c.status === 'active').length, skipped: r.skipped };
  };

  const editCard = (id: string, front: string, back: string): SaveResult => {
    if (!deck) return { ok: false, reason: 'Deck tidak terbuka.' };
    if (hasPair(deck.cards.filter(c => c.id !== id), front, back)) return { ok: false, reason: 'Kata dengan arti yang sama sudah ada di deck.' };
    updateCards(cards => cards.map(c => (c.id === id ? { ...c, front: front.trim(), back: back.trim() } : c)));
    return { ok: true };
  };

  const deleteCard = (id: string) => {
    const card = deck?.cards.find(c => c.id === id);
    if (!card) return;
    showConfirm('Hapus kartu', `Hapus "${card.front}" beserta progresnya?`, () => updateCards(cards => cards.filter(c => c.id !== id)), { danger: true, confirmLabel: 'Hapus' });
  };

  const bulkDelete = (ids: string[], done: () => void) => {
    const set = new Set(ids);
    showConfirm('Hapus kata terpilih', `Hapus ${ids.length} kata beserta progresnya?`, () => { updateCards(cards => cards.filter(c => !set.has(c.id))); done(); }, { danger: true, confirmLabel: 'Hapus' });
  };

  const bulkMove = (ids: string[], target: 'active' | 'reserve') => {
    const set = new Set(ids);
    const t = Date.now();
    updateCards(cards => cards.map(c => (set.has(c.id) ? { ...c, status: target, nextReview: target === 'active' ? t : c.nextReview } : c)));
  };

  const removeDeck = () => {
    if (!deck) return;
    const lang = deck.lang;
    showConfirm('Hapus deck', `Hapus deck ${lang} beserta ${deck.cards.length} kata dan semua progresnya? Ini tidak bisa dibatalkan.`, () => { deleteDeck(lang); goToDecks(); }, { danger: true, confirmLabel: 'Hapus deck' });
  };

  // --- Cadangan ---

  const markBackedUp = () => updateSettings({ ...settings, lastBackupAt: Date.now() });

  const downloadBackup = () => {
    const url = URL.createObjectURL(new Blob([exportBackup()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFileName();
    a.click();
    URL.revokeObjectURL(url);
    markBackedUp();
  };

  const readBackupFile = async (file: File) => parseBackup(await file.text());

  const restore = (backup: ParsedBackup, mode: RestoreMode) => {
    const ok = restoreBackup(backup, mode);
    setSettings(loadSettings());
    setNow(Date.now());
    void requestPersistentStorage();
    const langs = Object.keys(backup.decks).length;
    if (ok) showAlert('Cadangan dipulihkan', `${langs} bahasa ${mode === 'merge' ? 'digabungkan dengan' : 'menggantikan'} data di perangkat ini.`);
    else showAlert('Sebagian gagal', 'Penyimpanan browser penuh. Beberapa deck mungkin tidak terpulihkan.');
    navigate('decks');
  };

  // --- Render ---

  const modalEl = <Modal config={modal} onClose={() => setModal(null)} />;

  if (view === 'settings') {
    return (
      <>
        {modalEl}
        <SettingsView settings={settings} now={now} onChange={updateSettings} onBack={goToDecks}
          onDownload={downloadBackup} onReadFile={readBackupFile} onRestore={restore} />
      </>
    );
  }

  if (view === 'onboarding' || view === 'decks' || !deck) {
    const langs = listDeckLangs();
    const stats = langs.map(l => deckStats(l, loadDeck(l), now));
    const totalCards = stats.reduce((n, s) => n + s.total, 0);
    const stale = settings.lastBackupAt === null || now - settings.lastBackupAt > BACKUP_REMINDER_AFTER;
    const reminder = totalCards >= 10 && stale
      ? (settings.lastBackupAt === null ? `${totalCards} katamu belum pernah dicadangkan.` : `Cadangan terakhir ${formatAgo(settings.lastBackupAt, now)}.`)
      : null;
    return (
      <>
        {modalEl}
        {view === 'onboarding' || langs.length === 0 ? (
          <OnboardingView existingLangs={langs} onPick={pickLanguage} onCancel={langs.length > 0 ? () => navigate('decks') : undefined} onSettings={() => navigate('settings')} />
        ) : (
          <DeckListView stats={stats} now={now} log={loadLog()} dailyGoal={settings.dailyGoal} backupReminder={reminder} onOpen={openDeck} onPolyglot={startPolyglot} onNewLanguage={() => navigate('onboarding')} onSettings={() => navigate('settings')} />
        )}
      </>
    );
  }

  const stats = deckStats(deck.lang, deck.cards, now);
  const due = nextDueAt(deck.cards, now);
  const nextDueIn = due === null ? null : due - now;
  const studyItem = session?.queue[session.index];
  // Kuis dari kata sesi ini: hanya kata yang punya pengecoh di bahasanya yang bisa jadi soal.
  const summaryCards = view === 'summary' && summary ? currentCards(summary.results.map(r => r.card)) : [];
  const summaryQuizCount = summaryCards.length > 1 ? quizFor(summaryCards).length : 0;

  return (
    <div className="min-h-screen">
      {modalEl}
      {view === 'home' && deck.lang === MIXED_DECK && (
        <PolyglotHomeView
          perLang={listDeckLangs().map(lang => ({ lang, active: deck.cards.filter(c => c.originLang === lang).length })).filter(l => l.active > 0)}
          onStart={() => startSession('practice', shuffleArray(deck.cards))}
          onQuiz={() => startQuiz(deck.cards)}
          onExit={goToDecks}
        />
      )}
      {view === 'home' && deck.lang !== MIXED_DECK && (
        <HomeView
          stats={stats} now={now} relearnCount={deck.cards.filter(needsRelearn).length} lastAccuracy={deck.lastAccuracy} hasPresets={!!WORD_DATABASE[deck.lang]}
          onStart={startReview} onAdd={() => navigate('add')} onList={() => navigate('list')} onRepeatAll={practiceAll} onRepeatWrong={practiceWrong} onQuiz={() => startQuiz(activeCards)}
          onSmartAdd={smartAdd} onChangeLang={goToDecks} onManageMaterial={() => navigate('material')}
        />
      )}
      {view === 'study' && session && studyItem && (
        <StudyView
          key={session.index} item={studyItem} index={session.index} total={session.queue.length} mode={session.mode} lang={deck.lang}
          alternatives={alternativesFor(studyItem)} autoSpeak={settings.autoSpeak} onGrade={gradeCurrent} onNext={nextCard} onQuit={() => finishSession(session)}
        />
      )}
      {view === 'summary' && summary && (
        <SummaryView results={summary.results} mode={summary.mode} lang={deck.lang} nextDueIn={deck.lang === MIXED_DECK ? null : nextDueIn} reward={summary.reward}
          quizCount={summaryQuizCount} onHome={() => navigate('home')} onPracticeWrong={practiceWrongFromSummary} onQuiz={() => startQuiz(summaryCards)} />
      )}
      {view === 'quiz' && quiz && (
        <QuizView key={quiz.run} questions={quiz.questions} lang={deck.lang} seconds={settings.quizSeconds} autoSpeak={settings.autoSpeak} sfx={settings.quizSfx}
          onAnswer={recordQuizAnswer} onFinish={finishQuiz} onBack={() => navigate('home')} />
      )}
      {view === 'quizSummary' && quiz && quizResult && (
        <QuizSummaryView answers={quizResult.answers} total={quizResult.total} lang={deck.lang} reward={quizResult.reward} sfx={settings.quizSfx}
          onAgain={() => startQuiz(currentCards(quiz.cards))} onPracticeWrong={practiceWrongFromQuiz} onDone={() => navigate('home')} />
      )}
      {view === 'add' && (
        <AddView lang={deck.lang} onBack={() => navigate('home')} onSave={addCard} onBulkSave={bulkAdd}
          onConfirmLeave={leave => showConfirm('Belum disimpan', 'Ada isian yang belum disimpan. Yakin ingin kembali?', leave, { confirmLabel: 'Kembali' })} />
      )}
      {view === 'list' && (
        <ListView lang={deck.lang} cards={deck.cards} now={now} onBack={() => navigate('home')} onDelete={deleteCard} onBulkDelete={bulkDelete} onBulkMove={bulkMove} onEdit={editCard} onDeleteDeck={removeDeck} onAdd={() => navigate('add')} />
      )}
      {view === 'material' && (
        <MaterialView lang={deck.lang} cards={deck.cards} onImportLevel={importLevel} onBack={() => navigate('home')} onAddCustom={() => navigate('add')} />
      )}
    </div>
  );
}

