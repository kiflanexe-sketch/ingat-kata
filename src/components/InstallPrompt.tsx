import { useState } from 'react';
import { isIOS, isSafariMac, isStandalone, useInstallPrompt } from '../lib/install.ts';

const isTouchDevice = () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;

// Langkah pemasangan bila browser tidak memberi dialog pemasangan langsung.
function manualSteps(): string[] {
  if (isIOS()) return ['Buka halaman ini di Safari.', 'Ketuk tombol Bagikan (kotak dengan panah ke atas).', 'Pilih "Tambah ke Layar Utama", lalu "Tambah".'];
  if (isSafariMac()) return ['Di Safari, buka menu File.', 'Pilih "Tambahkan ke Dock".'];
  return [
    'Buka menu browser (⋮ di Chrome, ≡ di browser lain).',
    'Pilih "Instal aplikasi" atau "Tambahkan ke layar utama".',
    'Kalau IngatKata sudah terpasang, buka saja dari layar utama.',
  ];
}

// Ajakan memasang aplikasi di halaman depan. Selalu tampil sampai IngatKata dibuka sebagai
// aplikasi terpasang, karena tampilannya lebih lega (tanpa bilah alamat) dan jalan offline.
// Di desktop yang browsernya tidak bisa memasang PWA, ajakan tidak ditampilkan.
export const InstallPrompt = () => {
  const { canInstall, justInstalled, install } = useInstallPrompt();
  const [showSteps, setShowSteps] = useState(false);

  if (isStandalone()) return null;
  if (!canInstall && !justInstalled && !isIOS() && !isSafariMac() && !isTouchDevice()) return null;

  const onInstall = () => {
    if (canInstall) void install();
    else setShowSteps(v => !v);
  };

  return (
    <section aria-labelledby="install-title" className="my-6 py-4 border-y border-line flex gap-4 items-start">
      <img src="./icon-192.png" alt="" width={48} height={48} className="rounded-[11px] shrink-0" />
      <div className="flex-1 min-w-0">
        <h2 id="install-title" className="text-section text-ink">{justInstalled ? 'IngatKata sudah terpasang' : 'Pasang IngatKata sebagai aplikasi'}</h2>
        {justInstalled ? (
          <p className="text-secondary text-muted">Buka dari layar utama supaya tampil penuh tanpa bilah browser.</p>
        ) : (
          <>
            <p className="text-secondary text-muted">Tampil penuh tanpa bilah alamat browser, dibuka langsung dari layar utama, dan tetap jalan tanpa internet.</p>
            <button onClick={onInstall} aria-expanded={canInstall ? undefined : showSteps} aria-controls={canInstall ? undefined : 'install-steps'}
              className="mt-3 min-h-11 px-5 rounded-control bg-primary text-white text-secondary font-semibold hover:bg-primary-hover">
              Pasang
            </button>
            {!canInstall && showSteps && (
              <ol id="install-steps" className="enter-rise mt-3 list-decimal pl-5 space-y-1 text-secondary text-ink">
                {manualSteps().map(s => <li key={s}>{s}</li>)}
              </ol>
            )}
          </>
        )}
      </div>
    </section>
  );
};
