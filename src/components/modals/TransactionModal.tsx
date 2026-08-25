import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { Transaction, TransactionStep } from '../../types';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Zap,
  Lock,
  GitCommit,
  Share2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export const TransactionModal: React.FC = () => {
  const { activeModalTxn, setActiveModalTxn } = useSocket();

  if (!activeModalTxn) return null;

  const txn = activeModalTxn;
  const isSuccess = txn.status === 'SUCCESS';
  const isFailed = txn.status === 'FAILED' || txn.status === 'CONFLICTED';
  const isProcessing = txn.status === 'PROCESSING' || txn.status === 'PENDING';
  const isCompensated = txn.status === 'COMPENSATED' || txn.status === 'COMPENSATING';

  const getStepIcon = (step: TransactionStep) => {
    switch (step.status) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'IN_PROGRESS':
        return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />;
      case 'FAILED':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case 'PENDING':
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-slate-600" />;
    }
  };

  const getStepHeaderIcon = (index: number) => {
    switch (index) {
      case 1:
        return <ShieldCheck className="w-4 h-4 text-indigo-400" />;
      case 2:
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 3:
        return <Lock className="w-4 h-4 text-amber-400" />;
      case 4:
        return <GitCommit className="w-4 h-4 text-emerald-400" />;
      case 5:
        return <Share2 className="w-4 h-4 text-purple-400" />;
      default:
        return <Zap className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={() => setActiveModalTxn(null)}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isSuccess
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isFailed
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              }`}
            >
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-white">Distributed Transaction Lifecycle</h3>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${
                    isSuccess
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : isFailed
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse'
                  }`}
                >
                  {txn.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">TXN ID: {txn.id}</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModalTxn(null)}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] uppercase font-mono text-slate-500">Patient</span>
              <p className="text-xs font-semibold text-slate-200 mt-0.5 truncate">{txn.patientName}</p>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] uppercase font-mono text-slate-500">Resource</span>
              <p className="text-xs font-semibold text-cyan-400 mt-0.5 truncate">{txn.resourceName || txn.resourceId || 'N/A'}</p>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] uppercase font-mono text-slate-500">Priority Level</span>
              <p className="text-xs font-semibold text-amber-400 mt-0.5">{txn.priority}</p>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] uppercase font-mono text-slate-500">OCC Version</span>
              <p className="text-xs font-mono font-semibold text-slate-200 mt-0.5">
                v{txn.expectedVersion ?? 1} &rarr; v{txn.actualVersion ?? (txn.expectedVersion ?? 1) + 1}
              </p>
            </div>
          </div>

          {/* Conflict Alert if Failed */}
          {txn.conflictReason && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-sm text-rose-300">Concurrency Conflict / Rejection</h5>
                <p className="text-xs mt-1 text-rose-300/90 leading-relaxed">{txn.conflictReason}</p>
                {txn.errorMessage && (
                  <p className="text-[11px] font-mono text-rose-400 mt-2 bg-rose-950/50 p-2 rounded border border-rose-900/50">
                    {txn.errorMessage}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 5-Step OCC Pipeline */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider flex items-center justify-between">
              <span>Optimistic Concurrency Execution Stages</span>
              <span className="text-cyan-400">{txn.steps.filter((s) => s.status === 'SUCCESS').length} / {txn.steps.length} Completed</span>
            </h4>

            <div className="space-y-2.5">
              {txn.steps.map((step, idx) => (
                <div
                  key={step.stepIndex}
                  className={`p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                    step.status === 'SUCCESS'
                      ? 'bg-slate-950/40 border-emerald-500/30 text-slate-200'
                      : step.status === 'IN_PROGRESS'
                      ? 'bg-cyan-950/20 border-cyan-500/50 shadow-md shadow-cyan-950/20 text-white'
                      : step.status === 'FAILED'
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                      : 'bg-slate-950/20 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div className="pt-0.5">{getStepIcon(step)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getStepHeaderIcon(step.stepIndex)}
                      <span className="font-medium text-xs text-slate-200">
                        Stage {step.stepIndex}: {step.name}
                      </span>
                    </div>
                    {step.details && (
                      <p className="text-xs text-slate-400 mt-1 font-sans leading-relaxed">{step.details}</p>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase shrink-0 ${
                      step.status === 'SUCCESS'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : step.status === 'IN_PROGRESS'
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse'
                        : step.status === 'FAILED'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-slate-800/40 text-slate-500 border-slate-800'
                    }`}
                  >
                    {step.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Details / Idempotency */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Idempotency Key:</span>
              <span className="text-cyan-400 truncate max-w-[280px]">{txn.idempotencyKey}</span>
            </div>
            <div className="flex justify-between">
              <span>Timestamp:</span>
              <span>{new Date(txn.createdAt).toLocaleTimeString()}</span>
            </div>
            {txn.completedAt && (
              <div className="flex justify-between">
                <span>Completed At:</span>
                <span>{new Date(txn.completedAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            onClick={() => setActiveModalTxn(null)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
