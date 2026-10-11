import { useEffect, useRef, useState } from 'react';
import type { ParsedBackup, RestoreMode, Settings } from '../lib/storage.ts';
import type { DirectionSetting } from '../lib/srs.ts';
import { displayLangName } from '../data/languages.ts';
import { formatAgo } from '../lib/format.ts';
import { isIOS, isStandalone, useInstallPrompt } from '../lib/install.ts';
import { Button, Page, Title, TopBar } from '../components/ui.tsx';

type Props = {
  settings: Settings;
  now: number;
  canShareBackup: boolean;
  onChange: (next: Settings) => void;
  onBack: () => void;
  onDownload: () => void;
  onShare: () => void;
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

export const SettingsView = ({ settings, now, canShareBackup, onChange, onBack, onDownload, onShare, onReadFile, onRestore }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ParsedBackup | null>(null);
  const [fileError, setFileError] = useState('');
  const [mode, setMode] = useState<RestoreMode>('merge');
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const { canInstall, install } = useInstallPrompt();
  const standalone = isStandalone();

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

      <Section title="Suara">
        <label className="flex items-start gap-3 py-3 border-t border-line cursor-pointer">
          <input type="checkbox" checked={settings.autoSpeak} onChange={e => onChange({ ...settings, autoSpeak: e.target.checked })} className="mt-1 w-5 h-5 accent-primary" />
          <span>
            <span className="block text-ink">Ucapkan kata asing setelah menjawab</span>
            <span className="block text-secondary text-muted">Memakai suara bawaan perangkat. Tombol Dengar tetap tersedia.</span>
          </span>
        </label>
      </Section>

      <Section title="Cadangan">
        <p className="text-body text-ink">
          Semua kata dan progresmu hanya tersimpan di browser perangkat ini. Simpan file cadangan untuk pindah perangkat atau berjaga-jaga kalau data browser terhapus.
        </p>
        <p className="mt-2 text-secondary text-muted">{lastBackup} File berisi semua bahasa, kotak tiap kartu, dan pengaturan ini.</p>
        <div className="mt-4 space-y-2">
          <Button onClick={onDownload}>Simpan file cadangan</Button>
          {canShareBackup && <Button variant="secondary" onClick={onShare}>Kirim cadangan (WhatsApp, Drive, email)</Button>}
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
        {standalone ? (
          <p className="text-body text-ink">IngatKata sudah terpasang di perangkat ini dan bisa dibuka tanpa internet.</p>
        ) : canInstall ? (
          <>
            <p className="text-body text-ink mb-4">Pasang IngatKata ke layar utama supaya bisa dibuka seperti aplikasi, juga tanpa internet.</p>
            <Button variant="secondary" onClick={() => void install()}>Pasang aplikasi</Button>
          </>
        ) : isIOS() ? (
          <p className="text-body text-ink">Di Safari, ketuk tombol <strong>Bagikan</strong> lalu <strong>Tambah ke Layar Utama</strong>. Setelah terpasang, IngatKata bisa dibuka tanpa internet dan datanya tidak dihapus otomatis oleh Safari.</p>
        ) : (
          <p className="text-body text-ink">Buka menu browser lalu pilih <strong>Instal aplikasi</strong> atau <strong>Tambahkan ke layar utama</strong>.</p>
        )}
        {persisted !== null && (
          <p className="mt-3 text-secondary text-muted">
            {persisted ? 'Penyimpanan permanen aktif: browser tidak akan menghapus datamu saat ruang penyimpanan menipis.' : 'Browser belum memberi izin penyimpanan permanen; tetap simpan file cadangan secara berkala.'}
          </p>
        )}
      </Section>
    </Page>
  );
};
