import { useEffect, useRef } from 'react';
import { Button } from './ui.tsx';

export type ModalConfig = {
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  confirmLabel?: string;
  danger?: boolean;
  onConfirm?: () => void;
};

type Props = { config: ModalConfig | null; onClose: () => void };

// Sheet dari bawah di HP, dialog di tengah pada layar lebar.
export const Modal = ({ config, onClose }: Props) => {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!config) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [config, onClose]);

  if (!config) return null;
  const confirm = () => { onClose(); config.onConfirm?.(); };
  const label = config.confirmLabel ?? (config.type === 'alert' ? 'Oke' : 'Lanjutkan');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style={{ backgroundColor: 'rgb(36 38 43 / 0.4)' }} onClick={onClose}>
      <div
        role={config.type === 'alert' ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-message"
        className="w-full sm:max-w-sm bg-card rounded-t-sheet sm:rounded-sheet shadow-sheet px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-section text-ink mb-2">{config.title}</h2>
        <p id="modal-message" className="text-body text-muted mb-6 whitespace-pre-line">{config.message}</p>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          {config.type === 'confirm' && <Button variant="secondary" onClick={onClose}>Batal</Button>}
          <Button ref={confirmRef} variant={config.danger ? 'danger' : 'primary'} onClick={confirm}>{label}</Button>
        </div>
      </div>
    </div>
  );
};
