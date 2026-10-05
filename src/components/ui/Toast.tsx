import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'border-green-500/30 bg-green-500/10 text-green-400',
  error: 'border-red-500/30 bg-red-500/10 text-red-400',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
};

export function ToastContainer() {
  const { toasts, removeToast } = useApp();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map(toast => {
        const Icon = icons[toast.type];
        return (
          <div key={toast.id} className={`flex items-start gap-3 border rounded-lg p-3 backdrop-blur-sm ${colors[toast.type]}`}
            style={{ background: 'rgba(255,255,255,0.97)', borderColor: 'var(--border)' }}>
            <Icon size={16} className="mt-0.5 shrink-0" />
            <span className="text-sm text-zinc-200 flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
