import { useEffect, useRef, useState } from 'react';
import type { ParsedBackup, RestoreMode, Settings } from '../lib/storage.ts';
import { RETENTION_CHOICES, type DirectionSetting } from '../lib/srs.ts';
import { DAILY_GOALS } from '../lib/rewards.ts';
import { QUIZ_SECONDS } from '../lib/quiz.ts';
import { displayLangName, sampleWord } from '../data/languages.ts';
import { SCRIPT_LEVELS, WORD_DATABASE } from '../data/words.ts';
import { speak, useVoices, voiceStatus } from '../lib/speech.ts';
import { formatAgo } from '../lib/format.ts';
import { isStandalone } from '../lib/install.ts';
import { InstallPrompt } from '../components/InstallPrompt.tsx';
import { Button, Page, Title, TopBar } from '../components/ui.tsx';

type Props = {
  settings: Settings;
  now: number;
  onChange: (next: Settings) => void;
  onBack: () => void;
  onDownload: () => void;
  onReadFile: (file: File) => Promise<ParsedBackup | null>;
  onRestore: (backup: ParsedBackup, mode: RestoreMode) => void;
};

const DIRECTIONS: { value: DirectionSetting; label: string; hint: string }[] = [
  { value: 'both', label: 'Bolak-balik', hint: 'Acak: kadang kata asing, kadang bahasa Indonesia.' },
  { value: 'forward', label: 'Bahasa asing → Indonesia', hint: 'Lebih mudah; melatih mengenali kata.' },
  { value: 'backward', label: 'Indonesia → bahasa asing', hint: 'Lebih sulit; melatih mengingat dan mengeja.' },
];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-10 first-of-type:mt-0">
    <h2 className="text-section text-ink mb-3">{title}</h2>
    {children}
  </section>
);

// Deret pilihan angka kecil (target, waktu) sebagai tombol radio sejajar.
const Choices = ({ name, label, value, options, unit, onChange }: { name: string; label: string; value: number; options: number[]; unit: string; onChange: (v: number) => void }) => (
  <fieldset>
    <legend className="sr-only">{label}</legend>
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <label key={o} className={`min-h-11 px-4 inline-flex items-center rounded-control border-[1.5px] cursor-pointer transition-colors duration-state has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${value === o ? 'border-primary bg-primary-soft text-primary font-semibold' : 'border-control text-ink hover:border-primary'}`}>
          <input type="radio" name={name} checked={value === o} onChange={() => onChange(o)} className="sr-only" />
          {o} {unit}
        </label>
      ))}
    </div>
  </fieldset>
);

export const SettingsView = ({ settings, now, onChange, onBack, onDownload, onReadFile, onRestore }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ParsedBackup | null>(null);
  const [fileError, setFileError] = useState('');
  const [mode, setMode] = useState<RestoreMode>('merge');
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const standalone = isStandalone();
  useVoices();
  const voiceLangs = Object.keys(WORD_DATABASE);
  const missingVoices = voiceLangs.filter(l => voiceStatus(l) === 'missing');
  const sample = (lang: string) => {
    const levels = Object.keys(WORD_DATABASE[lang]);
    const vocab = levels.find(l => !SCRIPT_LEVELS.has(l)) ?? levels[0];
    return WORD_DATABASE[lang][vocab][0].f;
  };

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, []);

  const pickFile = async (file: File) => {
    setFileError('');
    const parsed = await onReadFile(file);
    if (!parsed) { setPending(null); setFileError('File ini bukan cadangan IngatKata. Pilih file .json dari "Simpan file cadangan".'); return; }
    setMode('merge');
    setPending(parsed);
  };

  const lastBackup = settings.lastBackupAt ? `Terakhir dicadangkan ${formatAgo(settings.lastBackupAt, now)}.` : 'Belum pernah dicadangkan.';

  return (
    <Page>
      <TopBar onBack={onBack} backLabel="Bahasamu" />
      <Title>Pengaturan & data</Title>

      <Section title="Arah pertanyaan">
        <fieldset>
          <legend className="sr-only">Arah pertanyaan</legend>
          {DIRECTIONS.map(d => (
            <label key={d.value} className="flex items-start gap-3 py-3 border-t border-line cursor-pointer">
              <input type="radio" name="direction" value={d.value} checked={settings.direction === d.value} onChange={() => onChange({ ...settings, direction: d.value })} className="mt-1 w-5 h-5 accent-primary" />
              <span><span className="block text-ink">{d.label}</span><span className="block text-secondary text-muted">{d.hint}</span></span>
            </label>
          ))}
        </fieldset>
      </Section>

      <Section title="Target ingatan">
        <p className="text-secondary text-muted mb-1">
          Jadwal ulang dihitung FSRS supaya peluangmu masih ingat sebuah kata saat diulang sekitar angka ini. Makin tinggi, makin sering ulangan.
        </p>
        <fieldset>
          <legend className="sr-only">Target ingatan</legend>
          {RETENTION_CHOICES.map(r => (
            <label key={r} className="flex items-start gap-3 py-3 border-t border-line cursor-pointer">
              <input type="radio" name="retention" checked={settings.retention === r} onChange={() => onChange({ ...settings, retention: r })} className="mt-1 w-5 h-5 accent-primary" />
              <span>
                <span className="block text-ink">{Math.round(r * 100)}%{r === 0.9 && ' (disarankan)'}</span>
                <span className="block text-secondary text-muted">
                  {r < 0.9 ? 'Ulangan paling sedikit; cocok kalau waktumu terbatas.' : r > 0.9 ? 'Ulangan paling banyak; untuk persiapan ujian yang sudah dekat.' : 'Seimbang antara jumlah ulangan dan ingatan.'}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className="mt-2 text-meta text-subtle">Berlaku untuk jawaban berikutnya; jadwal yang sudah ada tidak dihitung ulang.</p>
      </Section>

      <Section title="Target harian">
        <p className="text-secondary text-muted mb-3">Jumlah kartu yang ingin kamu jawab tiap hari. Mencapainya memberi bonus XP dan dihitung untuk lencana.</p>
        <Choices name="daily-goal" label="Target harian" value={settings.dailyGoal} options={DAILY_GOALS} unit="kartu" onChange={v => onChange({ ...settings, dailyGoal: v })} />
      </Section>

      <Section title="Kuis kilat">
        <p className="text-secondary text-muted mb-3">Waktu menjawab tiap soal pilihan ganda. Pilih yang lebih lama untuk anak-anak atau aksara yang baru dipelajari.</p>
        <Choices name="quiz-seconds" label="Waktu per soal" value={settings.quizSeconds} options={QUIZ_SECONDS} unit="detik" onChange={v => onChange({ ...settings, quizSeconds: v })} />
        <label className="mt-3 flex items-start gap-3 py-3 border-t border-line cursor-pointer">
          <input type="checkbox" checked={settings.quizSfx} onChange={e => onChange({ ...settings, quizSfx: e.target.checked })} className="mt-1 w-5 h-5 accent-primary" />
          <span>
            <span className="block text-ink">Efek suara</span>
            <span className="block text-secondary text-muted">Bunyi untuk jawaban benar, salah, waktu habis, dan perayaan saat semua benar.</span>
          </span>
        </label>
      </Section>

      <Section title="Suara">
        <label className="flex items-start gap-3 py-3 border-t border-line cursor-pointer">
          <input type="checkbox" checked={settings.autoSpeak} onChange={e => onChange({ ...settings, autoSpeak: e.target.checked })} className="mt-1 w-5 h-5 accent-primary" />
          <span>
            <span className="block text-ink">Ucapkan kata asing setelah menjawab</span>
            <span className="block text-secondary text-muted">Diputar setelah setiap jawaban. Tombol Dengar tetap tersedia.</span>
          </span>
        </label>

        <p className="mt-4 text-secondary text-muted">Suara berasal dari perangkat ini, jadi perlu terpasang per bahasa.</p>
        <ul className="mt-2">
          {voiceLangs.map(lang => {
            const status = voiceStatus(lang);
            return (
              <li key={lang} className="flex items-center justify-between gap-3 py-2 border-t border-line">
                <span>
                  <span className="block text-ink">{displayLangName(lang)}</span>
                  <span className={`block text-meta ${status === 'missing' ? 'text-bad' : 'text-subtle'}`}>
                    {status === 'available' ? 'Suara tersedia' : status === 'missing' ? 'Suara belum terpasang' : 'Belum diketahui; coba putar'}
                  </span>
                </span>
                <button onClick={() => void speak(sample(lang), lang)} className="min-h-11 px-3 text-secondary font-semibold text-primary" aria-label={`Coba suara ${displayLangName(lang)}: ${sampleWord(sample(lang), lang)}`}>
                  Coba
                </button>
              </li>
            );
          })}
        </ul>
        {missingVoices.length > 0 && (
          <div className="mt-3 text-secondary text-ink space-y-1">
            <p>Cara memasang suara {missingVoices.map(displayLangName).join(', ')}:</p>
            <p><strong>Android:</strong> Setelan → Sistem → Bahasa & masukan → Output text-to-speech → ikon roda gigi di Mesin Google → Instal data suara → pilih bahasanya.</p>
            <p><strong>iPhone/iPad:</strong> Pengaturan → Aksesibilitas → Konten Lisan → Suara → pilih bahasa lalu unduh suaranya.</p>
            <p><strong>Windows:</strong> Setelan → Waktu & bahasa → Bahasa & wilayah → tambah bahasa dengan fitur "Teks ke ucapan".</p>
            <p className="text-muted">Setelah terpasang, tutup lalu buka lagi IngatKata.</p>
          </div>
        )}
      </Section>

      <Section title="Cadangan">
        <p className="text-body text-ink">
          Semua kata dan progresmu hanya tersimpan di browser perangkat ini. Simpan file cadangan untuk pindah perangkat atau berjaga-jaga kalau data browser terhapus.
        </p>
        <p className="mt-2 text-secondary text-muted">{lastBackup} File berisi semua bahasa, kotak tiap kartu, dan pengaturan ini.</p>
        <div className="mt-4 space-y-2">
          <Button onClick={onDownload}>Simpan file cadangan</Button>
        </div>

        <div className="mt-8">
          <h3 className="font-semibold text-ink">Pulihkan dari file</h3>
          <p className="text-secondary text-muted mb-3">Di perangkat baru, buka IngatKata lalu pilih file cadangan.</p>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Pilih file cadangan" onChange={e => { const f = e.target.files?.[0]; if (f) void pickFile(f); e.target.value = ''; }} />
          {!pending && <Button variant="secondary" onClick={() => fileRef.current?.click()}>Pilih file cadangan</Button>}
          {fileError && <p role="alert" className="mt-3 rounded-control bg-bad-soft text-bad px-4 py-3 text-secondary">{fileError}</p>}

          {pending && (
            <div className="rounded-control border-[1.5px] border-control bg-card p-4">
              <p className="text-ink font-semibold">Isi file</p>
              <ul className="mt-1 text-secondary text-muted">
                {Object.entries(pending.decks).map(([lang, cards]) => <li key={lang}>{displayLangName(lang)}: {cards.length} kata</li>)}
              </ul>
              {pending.exportedAt && <p className="mt-1 text-meta text-subtle">Dibuat {new Date(pending.exportedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
              <fieldset className="mt-4">
                <legend className="text-secondary font-semibold text-ink mb-1">Cara memulihkan</legend>
                <label className="flex items-start gap-3 py-2 cursor-pointer">
                  <input type="radio" name="restore-mode" checked={mode === 'merge'} onChange={() => setMode('merge')} className="mt-1 w-5 h-5 accent-primary" />
                  <span><span className="block text-ink">Gabungkan</span><span className="block text-secondary text-muted">Kata di perangkat ini tetap ada. Untuk kata yang sama, progres yang terakhir diulang yang dipakai.</span></span>
                </label>
                <label className="flex items-start gap-3 py-2 cursor-pointer">
                  <input type="radio" name="restore-mode" checked={mode === 'replace'} onChange={() => setMode('replace')} className="mt-1 w-5 h-5 accent-primary" />
                  <span><span className="block text-ink">Ganti semua</span><span className="block text-secondary text-muted">Data di perangkat ini dihapus dan disamakan persis dengan file.</span></span>
                </label>
              </fieldset>
              <div className="mt-4 flex flex-col-reverse sm:flex-row gap-2">
                <Button variant="secondary" onClick={() => setPending(null)}>Batal</Button>
                <Button variant={mode === 'replace' ? 'danger' : 'primary'} onClick={() => { onRestore(pending, mode); setPending(null); }}>
                  {mode === 'replace' ? 'Ganti dengan isi file' : 'Gabungkan'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section title="Aplikasi">
        {standalone
          ? <p className="text-body text-ink">IngatKata sudah terpasang di perangkat ini dan bisa dibuka tanpa internet.</p>
          : <InstallPrompt />}
        {persisted !== null && (
          <p className="mt-3 text-secondary text-muted">
            {persisted ? 'Penyimpanan permanen aktif: browser tidak akan menghapus datamu saat ruang penyimpanan menipis.' : 'Browser belum memberi izin penyimpanan permanen; tetap simpan file cadangan secara berkala.'}
          </p>
        )}
      </Section>
    </Page>
  );
};
