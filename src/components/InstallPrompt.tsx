import { useState } from 'react';
import { isIOS, isStandalone, useInstallPrompt } from '../lib/install.ts';

const DISMISS_KEY = 'ingatkata-install-dismissed';
const DISMISS_FOR = 30 * 24 * 60 * 60 * 1000;

function wasDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_FOR;
  } catch {
    return false;
  }
}

const isTouchDevice = () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;

// Ajakan memasang aplikasi di halaman depan. Tidak tampil bila sudah terpasang, bila ditutup
// dalam 30 hari terakhir, atau di desktop yang browsernya tidak bisa memasang PWA.
export const InstallPrompt = () => {
  const { canInstall, install } = useInstallPrompt();
  const [hidden, setHidden] = useState(wasDismissed);
  const ios = isIOS();

  if (hidden || isStandalone() || (!canInstall && !ios && !isTouchDevice())) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* abaikan */ }
    setHidden(true);
  };

  return (
    <section aria-labelledby="install-title" className="my-6 py-4 border-y border-line flex gap-4 items-start">
      <img src="./icon-192.png" alt="" width={44} height={44} className="rounded-[10px] shrink-0" />
      <div className="flex-1 min-w-0">
        <h2 id="install-title" className="text-section text-ink">Pasang IngatKata di HP</h2>
        <p className="text-secondary text-muted">
          {canInstall
            ? 'Buka langsung dari layar utama seperti aplikasi biasa, tetap jalan tanpa internet.'
            : ios
              ? 'Di Safari, ketuk tombol Bagikan lalu pilih "Tambah ke Layar Utama". Data juga lebih aman dari pembersihan otomatis Safari.'
              : 'Buka menu browser (⋮) lalu pilih "Instal aplikasi" atau "Tambahkan ke layar utama". Setelah itu bisa dibuka tanpa internet.'}
        </p>
        <div className="mt-2 flex items-center gap-4">
          {canInstall && (
            <button onClick={() => void install()} className="min-h-11 px-4 rounded-control bg-primary text-white text-secondary font-semibold hover:bg-primary-hover">Pasang</button>
          )}
          <button onClick={dismiss} className="min-h-11 text-secondary font-semibold text-muted hover:text-ink">Nanti saja</button>
        </div>
      </div>
    </section>
  );
};
