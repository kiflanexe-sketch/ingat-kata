import type { Card } from '../types.ts';
import { PACK_NOTES, SCRIPT_LEVELS, WORD_DATABASE } from '../data/words.ts';
import { displayLangName } from '../data/languages.ts';
import { ACTIVE_FILL_TARGET } from '../lib/srs.ts';
import { wordIndex } from '../lib/match.ts';
import { Button, Page, Title, TopBar, Word } from '../components/ui.tsx';

type Props = {
  lang: string;
  cards: Card[];
  onImportLevel: (level: string) => void;
  onBack: () => void;
  onAddCustom: () => void;
};

export const MaterialView = ({ lang, cards, onImportLevel, onBack, onAddCustom }: Props) => {
  const levels = WORD_DATABASE[lang] ?? {};
  const levelNames = Object.keys(levels);
  const name = displayLangName(lang);

  if (levelNames.length === 0) {
    return (
      <Page>
        <TopBar onBack={onBack} backLabel={name} />
        <Title sub={`Belum ada paket kata bawaan untuk ${name}. Masukkan kosakata sendiri, satu per satu atau sekaligus dari daftar.`}>Paket kata</Title>
        <Button onClick={onAddCustom}>Tambah kata sendiri</Button>
      </Page>
    );
  }

  // Aturan yang sama dengan impor paket, jadi angka "belum ada di deck" cocok dengan yang ditambahkan.
  const inDeck = wordIndex(cards);

  return (
    <Page>
      <TopBar onBack={onBack} backLabel={name} />
      <Title sub={`Urut dari yang termudah. Kata dari paket masuk antrian dan dibuka bertahap. Bila kata aktifmu kurang dari ${ACTIVE_FILL_TARGET}, sebagian langsung aktif.`}>Paket kata {name}</Title>
      <ul>
        {levelNames.map(level => {
          const words = levels[level];
          const missing = words.filter(w => !inDeck.has({ front: w.f, back: w.b })).length;
          return (
            <li key={level} className="py-4 border-t border-line flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-section text-ink">{level}</h2>
                {PACK_NOTES[lang]?.[level] && <p className="text-secondary text-ink">{PACK_NOTES[lang][level]}</p>}
                <p className="text-secondary text-muted">
                  {words.length} {SCRIPT_LEVELS.has(level) ? 'huruf' : 'kata'}{missing > 0 && missing < words.length && `, ${missing} belum ada di deck`}
                </p>
                <p className="mt-1 text-muted truncate">
                  {words.slice(0, 3).map((w, i) => (
                    <span key={w.f}>{i > 0 && ', '}<Word text={w.f} lang={lang} size="row" className="!text-body" /></span>
                  ))}
                  , ...
                </p>
              </div>
              {missing === 0
                ? <span className="shrink-0 min-h-11 flex items-center text-secondary font-semibold text-ok">Sudah di deck</span>
                : <button onClick={() => onImportLevel(level)} className="shrink-0 min-h-11 px-4 rounded-control border-[1.5px] border-primary text-primary font-semibold hover:bg-primary-soft">Tambah{missing < words.length ? ` ${missing}` : ''}</button>}
            </li>
          );
        })}
      </ul>
    </Page>
  );
};
