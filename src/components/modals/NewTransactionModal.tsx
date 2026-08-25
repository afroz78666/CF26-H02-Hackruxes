import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { TransactionType, PriorityLevel } from '../../types';
import { X, Send, Bed, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultPatientId?: string;
  defaultResourceId?: string;
}

export const NewTransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultPatientId,
  defaultResourceId,
}) => {
  const { patients, resources, doctors, executeTransaction } = useSocket();
  const { role, activeDoctorId } = useAuth();

  const [patientId, setPatientId] = useState(defaultPatientId || patients[0]?.id || '');
  const [resourceId, setResourceId] = useState(defaultResourceId || resources[0]?.id || '');
  const [type, setType] = useState<TransactionType>('ALLOCATE_RESOURCE');
  const [priority, setPriority] = useState<PriorityLevel>('HIGH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const targetResource = resources.find((r) => r.id === resourceId);
  const targetPatient = patients.find((p) => p.id === patientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !resourceId) return;

    setIsSubmitting(true);
    try {
      await executeTransaction({
        type,
        patientId,
        resourceId,
        doctorId: role === 'DOCTOR' ? activeDoctorId : undefined,
        priority,
        expectedVersion: targetResource?.version,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Execute Resource Transaction</h3>
              <p className="text-xs text-slate-400">Atomic optimistic concurrency allocation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient Selection */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Target Patient</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.severity}) — {p.diagnosis}
                </option>
              ))}
            </select>
          </div>

          {/* Resource Selection */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Target Resource</label>
            <select
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} [{r.type}] — Status: {r.status} (v{r.version})
                </option>
              ))}
            </select>
          </div>

          {/* Resource Status Preview */}
          {targetResource && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs space-y-1">
              <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                <span>Current Status:</span>
                <span className={targetResource.status === 'AVAILABLE' ? 'text-emerald-400' : 'text-amber-400'}>
                  {targetResource.status}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                <span>Optimistic Version:</span>
                <span className="text-cyan-400">v{targetResource.version}</span>
              </div>
              {targetResource.assignedPatientName && (
                <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                  <span>Currently Assigned To:</span>
                  <span className="text-slate-300">{targetResource.assignedPatientName}</span>
                </div>
              )}
            </div>
          )}

          {/* Transaction Type & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Action Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALLOCATE_RESOURCE">Allocate Resource</option>
                <option value="RESERVE_RESOURCE">Reserve Resource</option>
                <option value="TRANSFER_PATIENT">Transfer Patient</option>
                <option value="EMERGENCY_ESCALATION">Emergency Escalation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="CRITICAL">Critical (Preemptive)</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="NORMAL">Normal Priority</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Transacting...' : 'Commit Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
