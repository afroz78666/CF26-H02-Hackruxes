import React from 'react';
import { useSocket, ToastItem } from '../../context/SocketContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Zap } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useSocket();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onClose: () => void }> = ({ toast, onClose }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'EMERGENCY':
        return <Zap className="w-5 h-5 text-rose-400 animate-bounce shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'TRANSACTION':
        return <Zap className="w-5 h-5 text-cyan-400 shrink-0" />;
      case 'INFO':
      default:
        return <Info className="w-5 h-5 text-blue-400 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'SUCCESS':
        return 'border-emerald-500/40 shadow-emerald-950/40';
      case 'EMERGENCY':
        return 'border-rose-500/60 shadow-rose-950/60 animate-pulse';
      case 'WARNING':
        return 'border-amber-500/40 shadow-amber-950/40';
      case 'TRANSACTION':
        return 'border-cyan-500/40 shadow-cyan-950/40';
      default:
        return 'border-blue-500/40 shadow-blue-950/40';
    }
  };

  return (
    <div
      className={`pointer-events-auto bg-slate-900/95 backdrop-blur-md border ${getBorderColor()} rounded-xl p-4 shadow-xl flex items-start gap-3 transform transition-all duration-300 animate-in slide-in-from-right`}
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-100 truncate">{toast.title}</h4>
          <span className="text-[10px] font-mono text-slate-400 shrink-0">{toast.timestamp}</span>
        </div>
        <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">{toast.message}</p>
        {toast.technicalDetails && (
          <p className="text-[11px] font-mono text-cyan-400/90 mt-1.5 truncate bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
            {toast.technicalDetails}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800/60 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
