import { useEffect, useState } from 'react';
import type { AnswerRecord, Card, SessionMode, StudyItem } from './types.ts';
import { WORD_DATABASE } from './data/words.ts';
import { MIXED_DECK } from './data/languages.ts';
import { normalize } from './lib/answer.ts';
import {
  activateFromReserve, addWords, applyReview, buildQueue, hasPair, isDue, needsRelearn, nextDueAt, shuffleArray, smartAddCount,
} from './lib/srs.ts';
import {
  deckExists, deckStats, deleteDeck, exportBackup, listDeckLangs, loadDeck, loadMeta, parseBackup, restoreBackup, saveDeck, saveMeta,
} from './lib/storage.ts';
import { Modal, type ModalConfig } from './components/Modal.tsx';
import { DeckListView } from './views/DeckListView.tsx';
import { OnboardingView } from './views/OnboardingView.tsx';
import { HomeView, PolyglotHomeView } from './views/HomeView.tsx';
import { StudyView } from './views/StudyView.tsx';
import { SummaryView } from './views/SummaryView.tsx';
import { AddView, type SaveResult } from './views/AddView.tsx';
import { ListView } from './views/ListView.tsx';
import { MaterialView } from './views/MaterialView.tsx';

type View = 'decks' | 'onboarding' | 'home' | 'study' | 'summary' | 'add' | 'list' | 'material';
type Deck = { lang: string; cards: Card[]; lastAccuracy: number | null };
type Session = { mode: SessionMode; queue: StudyItem[]; index: number; results: AnswerRecord[] };
type Summary = { mode: SessionMode; results: AnswerRecord[] };

// Di mode Gabungan id kartu hanya unik per bahasa.
const sameCard = (a: Card, b: Card) => a.id === b.id && a.originLang === b.originLang;

export default function App() {
  const [view, setView] = useState<View>(() => (listDeckLangs().length > 0 ? 'decks' : 'onboarding'));
  const [deck, setDeck] = useState<Deck | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Jumlah kartu jatuh tempo ikut bergerak walau layar dibiarkan terbuka.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

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
      showAlert('Gagal menyimpan', 'Penyimpanan browser penuh atau diblokir. Perubahan terakhir mungkin hilang saat halaman ditutup. Cadangkan datamu dari Dashboard.');
    }
  };
  const updateCards = (fn: (cards: Card[]) => Card[]) => { if (deck) commit({ ...deck, cards: fn(deck.cards) }); };

  const goToDecks = () => {
    setDeck(null);
    setNow(Date.now());
    setView(listDeckLangs().length > 0 ? 'decks' : 'onboarding');
  };

  const openDeck = (lang: string) => {
    setDeck({ lang, cards: loadDeck(lang), lastAccuracy: loadMeta(lang).lastAccuracy });
    setNow(Date.now());
    setView('home');
  };

  // Memilih bahasa yang sudah punya deck membuka deck itu, tidak menimpanya.
  const pickLanguage = (lang: string) => {
    if (!deckExists(lang) && !saveDeck(lang, [])) {
      showAlert('Gagal membuat deck', 'Penyimpanan browser tidak bisa dipakai. Coba matikan mode privat atau kosongkan ruang penyimpanan.');
      return;
    }
    openDeck(lang);
  };

  const startPolyglot = () => {
    const cards = listDeckLangs().flatMap(lang =>
      loadDeck(lang).filter(c => c.status === 'active').map(c => ({ ...c, originLang: lang })),
    );
    if (cards.length === 0) return showAlert('Belum ada kata aktif', 'Mulai belajar di salah satu bahasa dulu.');
    setDeck({ lang: MIXED_DECK, cards, lastAccuracy: null });
    setView('home');
  };

  // --- Sesi belajar ---

  const startSession = (mode: SessionMode, cards: Card[]) => {
    if (cards.length === 0) return;
    setSession({ mode, queue: buildQueue(cards), index: 0, results: [] });
    setView('study');
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

  const gradeCurrent = (record: AnswerRecord) => {
    if (!session || !deck) return;
    const item = session.queue[session.index];
    if (item.retry) return; // ulangan di akhir sesi tidak dinilai dua kali
    const t = Date.now();
    const update = (c: Card) => applyReview(c, record.correct, t, session.mode);
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
  };

  const finishSession = (s: Session) => {
    setSession(null);
    setNow(Date.now());
    if (s.results.length === 0) { setView('home'); return; }
    // Hanya sesi review terjadwal yang menentukan jatah kata baru.
    if (deck && s.mode === 'review' && deck.lang !== MIXED_DECK) {
      commit({ ...deck, lastAccuracy: s.results.filter(r => r.correct).length / s.results.length });
    }
    setSummary({ mode: s.mode, results: s.results });
    setView('summary');
  };

  const nextCard = () => {
    if (!session) return;
    if (session.index + 1 >= session.queue.length) finishSession(session);
    else setSession({ ...session, index: session.index + 1 });
  };

  const practiceWrongFromSummary = () => {
    if (!summary || !deck) return;
    const wrong = summary.results.filter(r => !r.correct).map(r => r.card);
    startSession('practice', shuffleArray(deck.cards.filter(c => wrong.some(w => sameCard(w, c)))));
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
    setView('home');
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

  const backup = () => {
    const blob = new Blob([exportBackup()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ingatkata-cadangan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restore = async (file: File) => {
    const parsed = parseBackup(await file.text());
    if (!parsed) return showAlert('File tidak dikenali', 'Pilih file cadangan .json yang dibuat dari tombol "Cadangkan data".');
    const langs = Object.keys(parsed.decks);
    const replaced = langs.filter(deckExists);
    const message = [
      `File berisi ${langs.length} bahasa: ${langs.join(', ')}.`,
      replaced.length > 0 ? `Deck ${replaced.join(', ')} di perangkat ini akan diganti isi cadangan.` : '',
    ].filter(Boolean).join('\n');
    showConfirm('Pulihkan cadangan', message, () => {
      const ok = restoreBackup(parsed);
      setNow(Date.now());
      setView('decks');
      if (!ok) showAlert('Sebagian gagal', 'Penyimpanan browser penuh. Beberapa deck mungkin tidak terpulihkan.');
    }, { confirmLabel: 'Pulihkan' });
  };

  // --- Render ---

  const modalEl = <Modal config={modal} onClose={() => setModal(null)} />;

  if (view === 'onboarding' || view === 'decks' || !deck) {
    const langs = listDeckLangs();
    return (
      <>
        {modalEl}
        {view === 'onboarding' || langs.length === 0 ? (
          <OnboardingView existingLangs={langs} onPick={pickLanguage} onCancel={langs.length > 0 ? () => setView('decks') : undefined} />
        ) : (
          <DeckListView stats={langs.map(l => deckStats(l, loadDeck(l), now))} onOpen={openDeck} onPolyglot={startPolyglot} onNewLanguage={() => setView('onboarding')} onBackup={backup} onRestore={restore} />
        )}
      </>
    );
  }

  const stats = deckStats(deck.lang, deck.cards, now);
  const due = nextDueAt(deck.cards, now);
  const nextDueIn = due === null ? null : due - now;
  const studyItem = session?.queue[session.index];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-indigo-100">
      {modalEl}
      {view === 'home' && deck.lang === MIXED_DECK && (
        <PolyglotHomeView
          perLang={listDeckLangs().map(lang => ({ lang, active: deck.cards.filter(c => c.originLang === lang).length })).filter(l => l.active > 0)}
          onStart={() => startSession('practice', shuffleArray(deck.cards))}
          onExit={goToDecks}
        />
      )}
      {view === 'home' && deck.lang !== MIXED_DECK && (
        <HomeView
          stats={stats} relearnCount={deck.cards.filter(needsRelearn).length} nextDueIn={nextDueIn} lastAccuracy={deck.lastAccuracy}
          onStart={startReview} onAdd={() => setView('add')} onList={() => setView('list')} onRepeatAll={practiceAll} onRepeatWrong={practiceWrong}
          onSmartAdd={smartAdd} onChangeLang={goToDecks} onManageMaterial={() => setView('material')}
        />
      )}
      {view === 'study' && session && studyItem && (
        <StudyView
          key={session.index} item={studyItem} index={session.index} total={session.queue.length} mode={session.mode} lang={deck.lang}
          alternatives={alternativesFor(studyItem)} onGrade={gradeCurrent} onNext={nextCard} onQuit={() => finishSession(session)}
        />
      )}
      {view === 'summary' && summary && (
        <SummaryView results={summary.results} mode={summary.mode} nextDueIn={deck.lang === MIXED_DECK ? null : nextDueIn} onHome={() => setView('home')} onPracticeWrong={practiceWrongFromSummary} />
      )}
      {view === 'add' && (
        <AddView lang={deck.lang} onBack={() => setView('home')} onSave={addCard} onBulkSave={bulkAdd}
          onConfirmLeave={leave => showConfirm('Belum disimpan', 'Ada isian yang belum disimpan. Yakin ingin kembali?', leave, { confirmLabel: 'Kembali' })} />
      )}
      {view === 'list' && (
        <ListView lang={deck.lang} cards={deck.cards} now={now} onBack={() => setView('home')} onDelete={deleteCard} onBulkDelete={bulkDelete} onBulkMove={bulkMove} onEdit={editCard} onDeleteDeck={removeDeck} />
      )}
      {view === 'material' && (
        <MaterialView lang={deck.lang} cards={deck.cards} onImportLevel={importLevel} onBack={() => setView('home')} onAddCustom={() => setView('add')} />
      )}
    </div>
  );
}

