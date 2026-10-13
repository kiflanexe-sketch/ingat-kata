// Pengingat cadangan dengan tombol simpan langsung. Setelah disimpan, berganti jadi konfirmasi
// beserta saran menyimpan salinan di luar perangkat.
export const BackupNudge = ({ reminder, savedFile, onBackup, className = '' }: { reminder: string | null; savedFile: string | null; onBackup: () => void; className?: string }) => {
  if (savedFile) {
    return (
      <p role="status" className={`enter-rise rounded-control bg-ok-soft text-ok px-4 py-3 text-secondary ${className}`}>
        <strong>Cadangan disimpan</strong> sebagai {savedFile} di folder unduhan. Simpan juga salinannya di luar perangkat (misalnya Google Drive atau email) supaya aman bila perangkat hilang.
      </p>
    );
  }
  if (!reminder) return null;
  return (
    <div className={`rounded-control bg-due-soft px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}>
      <p className="flex-1 min-w-[12rem] text-secondary text-due">{reminder} Simpan file cadangan supaya progresmu aman.</p>
      <button onClick={onBackup} className="min-h-11 px-4 rounded-control bg-primary text-on-primary text-secondary font-semibold hover:bg-primary-hover">
        Simpan cadangan
      </button>
    </div>
  );
};
