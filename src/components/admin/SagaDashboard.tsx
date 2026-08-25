import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { SagaWorkflow } from '../../types';
import {
  Workflow,
  CheckCircle2,
  AlertOctagon,
  RotateCcw,
  ArrowRight,
  Plus,
  Layers,
  Sparkles,
  Zap,
  ShieldAlert
} from 'lucide-react';

interface Props {
  onOpenSurgeryModal: () => void;
}

export const SagaDashboard: React.FC<Props> = ({ onOpenSurgeryModal }) => {
  const { sagas } = useSocket();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-900/40 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase bg-purple-500/10 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-semibold">
              Distributed Saga Engine
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-white mt-2">
            Multi-Resource Emergency Surgery Choreography
          </h2>
          <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
            Orchestrates atomic bookings across distributed microservices (OR Suite, Surgeon Schedule, ICU Step-Down, Life Support). If any step fails, backward compensation actions execute automatically to restore system consistency.
          </p>
        </div>

        <button
          onClick={onOpenSurgeryModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-xl shadow-purple-950/50 hover:scale-105 active:scale-95 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Launch New Surgery Saga</span>
        </button>
      </div>

      {/* Sagas List */}
      <div className="space-y-4">
        {sagas.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <Workflow className="w-12 h-12 mx-auto stroke-1 mb-3 text-slate-600" />
            <h4 className="text-base font-semibold text-slate-300">No Saga Workflows Dispatched Yet</h4>
            <p className="text-xs mt-1">Click &apos;Launch New Surgery Saga&apos; above to orchestrate a distributed surgery booking.</p>
          </div>
        ) : (
          sagas.map((saga) => <SagaCard key={saga.id} saga={saga} />)
        )}
      </div>
    </div>
  );
};

const SagaCard: React.FC<{ saga: SagaWorkflow }> = ({ saga }) => {
  const isSuccess = saga.status === 'SUCCESS';
  const isCompensated = saga.status === 'COMPENSATED' || saga.status === 'COMPENSATING';
  const isFailed = saga.status === 'FAILED';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-base text-white">{saga.name}</h3>
            <span
              className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold border ${
                isSuccess
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : isCompensated
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}
            >
              {saga.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Patient: <strong className="text-cyan-300">{saga.patientName}</strong> • Dispatched: {new Date(saga.createdAt).toLocaleTimeString()}
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          SAGA ID: <span className="text-slate-300">{saga.id}</span>
        </div>
      </div>

      {/* Error / Compensation Alert */}
      {saga.errorMessage && (
        <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-200 flex items-start gap-2.5 text-xs">
          <RotateCcw className="w-4 h-4 text-purple-400 shrink-0 mt-0.5 animate-spin-slow" />
          <div>
            <span className="font-semibold text-purple-300">Automated Compensation Rollback Triggered</span>
            <p className="text-[11px] text-purple-300/90 mt-0.5">{saga.errorMessage}</p>
          </div>
        </div>
      )}

      {/* Steps Flowchart */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {saga.steps.map((step, idx) => {
          const isDone = step.status === 'SUCCESS';
          const isProcessing = step.status === 'PROCESSING';
          const isCompStep = step.status === 'COMPENSATED' || step.status === 'COMPENSATING';
          const isStepFailed = step.status === 'FAILED';

          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isDone
                  ? 'bg-slate-950/60 border-emerald-500/30 text-slate-200'
                  : isCompStep
                  ? 'bg-purple-950/30 border-purple-500/50 text-purple-200 shadow-lg shadow-purple-950/30'
                  : isStepFailed
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                  : 'bg-slate-950/30 border-slate-800/60 text-slate-500'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-bold">
                    Step {idx + 1}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isProcessing ? (
                    <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                  ) : isCompStep ? (
                    <RotateCcw className="w-4 h-4 text-purple-400 animate-spin-slow" />
                  ) : isStepFailed ? (
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                  )}
                </div>

                <h4 className="font-semibold text-xs text-white">{step.name}</h4>
                <p className="text-[10px] font-mono text-slate-400 mt-1">{step.service}</p>
                {step.details && <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">{step.details}</p>}
              </div>

              {/* Compensation Action Sub-label */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono flex items-center justify-between">
                <span className="text-slate-500">Rollback Action:</span>
                <span className={isCompStep ? 'text-purple-300 font-bold' : 'text-slate-400'}>
                  {step.compensationName}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
