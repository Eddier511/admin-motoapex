import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ open, title, message, confirmLabel = 'Confirmar', danger = false, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-red-500/10' : 'bg-orange-500/10'}`}>
            <AlertTriangle size={20} className={danger ? 'text-red-400' : 'text-orange-400'} />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 mb-1">{title}</h3>
            <p className="text-sm text-zinc-400">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-black'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

export function Drawer({ open, title, onClose, children, width = 'max-w-xl' }: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className={`w-full ${width} h-full flex flex-col border-l overflow-y-auto`}
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold text-zinc-100">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
