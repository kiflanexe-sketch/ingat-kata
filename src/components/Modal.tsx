import { useEffect, useRef } from 'react';

export type ModalConfig = {
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  confirmLabel?: string;
  danger?: boolean;
  onConfirm?: () => void;
};

type Props = { config: ModalConfig | null; onClose: () => void };

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
  const label = config.confirmLabel ?? (config.type === 'alert' ? 'Mengerti' : 'Ya, Lanjutkan');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div role={config.type === 'alert' ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-message" className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 id="modal-title" className="text-lg font-bold text-gray-800 mb-2">{config.title}</h3>
        <p id="modal-message" className="text-gray-600 mb-6 whitespace-pre-line">{config.message}</p>
        <div className="flex gap-3 justify-end">
          {config.type === 'confirm' && (
            <button onClick={onClose} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors">Batal</button>
          )}
          <button ref={confirmRef} onClick={confirm} className={`px-4 py-2 text-white font-bold rounded-lg transition-colors ${config.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {label}
          </button>
        </div>
      </div>
    </div>
  );
};
