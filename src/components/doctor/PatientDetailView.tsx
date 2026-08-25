import React, { useState } from 'react';
import { Patient } from '../../types';
import { useSocket } from '../../context/SocketContext';
import { VitalsChart } from './VitalsChart';
import {
  User,
  Bed,
  Workflow,
  AlertOctagon,
  FileText,
  Pill,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface Props {
  patient: Patient;
  onOpenNewTxnModal: (patientId: string, resourceId?: string) => void;
  onOpenSurgeryModal: () => void;
}

export const PatientDetailView: React.FC<Props> = ({
  patient,
  onOpenNewTxnModal,
  onOpenSurgeryModal,
}) => {
  const { resources, executeTransaction } = useSocket();
  const [isAdvancingJourney, setIsAdvancingJourney] = useState(false);

  const availableIcuBeds = resources.filter((r) => r.type === 'BED_ICU' && r.status === 'AVAILABLE');
  const assignedBed = resources.find((r) => r.id === patient.assignedBedId);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  const handleAdvanceJourney = async (stepId: string) => {
    setIsAdvancingJourney(true);
    try {
      await fetch(`/api/patients/${patient.id}/journey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId,
          status: 'COMPLETED',
          details: `Completed clinical check by Dr. on duty at ${new Date().toLocaleTimeString()}`,
        }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdvancingJourney(false);
    }
  };

  const handleQuickIcuAllocation = async () => {
    if (availableIcuBeds.length === 0) {
      onOpenNewTxnModal(patient.id);
      return;
    }
    const targetBed = availableIcuBeds[0];
    await executeTransaction({
      type: 'ALLOCATE_RESOURCE',
      patientId: patient.id,
      resourceId: targetBed.id,
      priority: patient.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      expectedVersion: targetBed.version,
    });
  };

  return (
    <div className="space-y-6">
      {/* Patient Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-xl font-bold font-display shadow-lg shadow-cyan-950/40 shrink-0">
              {patient.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-white font-display">{patient.name}</h2>
                <span className={`text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${getSeverityBadge(patient.severity)}`}>
                  {patient.severity}
                </span>
                <span className="text-xs font-mono text-slate-400">ID: {patient.id}</span>
              </div>

              <div className="flex items-center gap-3 mt-2 text-xs text-slate-300 flex-wrap">
                <span>Age: <strong className="text-white">{patient.age}</strong></span>
                <span className="text-slate-600">•</span>
                <span>Gender: <strong className="text-white">{patient.gender}</strong></span>
                <span className="text-slate-600">•</span>
                <span>Dept: <strong className="text-cyan-400">{patient.department}</strong></span>
                <span className="text-slate-600">•</span>
                <span>Assigned Bed: <strong className="text-emerald-400">{assignedBed?.name || patient.roomNumber || 'Awaiting Allocation'}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Action Hub */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleQuickIcuAllocation}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-950/40 transition"
            >
              <Bed className="w-4 h-4" />
              <span>{patient.assignedBedId ? 'Reassign Bed' : 'Fast ICU Allocate'}</span>
            </button>

            <button
              onClick={onOpenSurgeryModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold transition"
            >
              <Workflow className="w-4 h-4" />
              <span>Saga Surgery Suite</span>
            </button>

            <button
              onClick={() => onOpenNewTxnModal(patient.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Custom Txn</span>
            </button>
          </div>
        </div>

        {/* Diagnosis & Allergies pill line */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">Primary Diagnosis:</span>
            <span className="text-slate-200 font-medium bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              {patient.diagnosis}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">Allergies:</span>
            {patient.allergies.length === 0 ? (
              <span className="text-slate-500">NKDA (None)</span>
            ) : (
              patient.allergies.map((alg) => (
                <span key={alg} className="text-rose-300 bg-rose-950/40 border border-rose-800/50 px-2 py-0.5 rounded text-[11px] font-mono">
                  {alg}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Vitals & Journey */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Vitals Wave + Meds/Reports */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Vitals Telemetry */}
          <VitalsChart vitals={patient.vitals} />

          {/* Medications & Lab Reports Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Medications */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-semibold text-xs text-slate-200">Active Prescriptions</h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{patient.medications.length} Scheduled</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {patient.medications.map((med) => (
                  <div key={med.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{med.name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        med.status === 'ADMINISTERED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {med.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>{med.dosage} • {med.frequency}</span>
                      <span>Next: {med.nextDose}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lab Reports */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-semibold text-xs text-slate-200">Clinical Diagnostics & Labs</h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{patient.reports.length} Reports</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {patient.reports.map((rep) => (
                  <div key={rep.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 truncate">{rep.title}</span>
                      {rep.criticalFlag && (
                        <span className="text-[10px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded">
                          FLAG
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{rep.summary}</p>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                      <span>{rep.date}</span>
                      <span className="text-emerald-400">{rep.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Treatment Care Journey Stepper */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="font-semibold text-sm text-slate-100">Care Journey Workflow</h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Status: {patient.treatmentStatus}</span>
          </div>

          <div className="space-y-3">
            {patient.journey.map((step, idx) => {
              const isCompleted = step.status === 'COMPLETED';
              const isInProgress = step.status === 'IN_PROGRESS';

              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isCompleted
                      ? 'bg-slate-950/40 border-emerald-500/30 text-slate-200'
                      : isInProgress
                      ? 'bg-purple-950/20 border-purple-500/50 text-white shadow-md shadow-purple-950/20'
                      : 'bg-slate-950/20 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="pt-0.5">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : isInProgress ? (
                          <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-600 mt-0.5 shrink-0" />
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-200 block">{step.friendlyLabel}</span>
                        {step.details && (
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{step.details}</p>
                        )}
                      </div>
                    </div>

                    {isInProgress && (
                      <button
                        onClick={() => handleAdvanceJourney(step.id)}
                        disabled={isAdvancingJourney}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-semibold flex items-center gap-1 shrink-0 transition"
                      >
                        <span>Mark Done</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
