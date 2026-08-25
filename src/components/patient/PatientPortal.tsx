import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  Heart,
  Activity,
  CheckCircle2,
  Calendar,
  Pill,
  FileText,
  BellRing,
  PhoneCall,
  User,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  Info,
  Clock
} from 'lucide-react';

export const PatientPortal: React.FC = () => {
  const { activePatientId, setActivePatientId } = useAuth();
  const { patients, doctors, resources } = useSocket();

  const patient = patients.find((p) => p.id === activePatientId) || patients[0];
  const doctor = doctors.find((d) => d.id === patient?.assignedDoctorId);
  const assignedBed = resources.find((r) => r.id === patient?.assignedBedId);

  const [assistanceSent, setAssistanceSent] = useState(false);

  if (!patient) return null;

  const handleCallNurse = () => {
    setAssistanceSent(true);
    setTimeout(() => setAssistanceSent(false), 5000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Patient Welcome Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider bg-teal-500/10 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full font-semibold">
                Patient Care Sanctuary
              </span>
              <span className="text-xs font-mono text-slate-400">ID: {patient.id}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
              Welcome, {patient.name}
            </h1>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              Here is your real-time clinical care summary, upcoming medications, diagnostic reports, and current stage of recovery.
            </p>
          </div>

          {/* Quick Assistance Button */}
          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleCallNurse}
              disabled={assistanceSent}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all ${
                assistanceSent
                  ? 'bg-emerald-600 text-white shadow-emerald-950/50'
                  : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-950/50 hover:scale-105 active:scale-95'
              }`}
            >
              <BellRing className={`w-5 h-5 ${assistanceSent ? '' : 'animate-bounce'}`} />
              <span>{assistanceSent ? 'Care Team Notified!' : 'Call Nurse / Assistance'}</span>
            </button>
          </div>
        </div>

        {/* Doctor & Room Pill Strip */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block font-mono text-[10px]">Lead Physician</span>
              <span className="text-white font-semibold">{doctor?.name || patient.assignedDoctorName}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block font-mono text-[10px]">Room & Bed Unit</span>
              <span className="text-cyan-300 font-semibold">{assignedBed?.name || patient.roomNumber || 'Room 304 (Ward)'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block font-mono text-[10px]">Current Status</span>
              <span className="text-purple-300 font-semibold">{patient.treatmentStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vitals Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <Heart className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400">Heart Rate</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-white">{patient.vitals.heartRate}</span>
              <span className="text-xs text-slate-400">bpm</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">● Normal rhythm</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400">SpO2 Oxygen</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-cyan-300">{patient.vitals.oxygenLevel}</span>
              <span className="text-xs text-slate-400">%</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">● Optimal saturation</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400">Blood Pressure</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-amber-300">{patient.vitals.bloodPressure}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">● Stable</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400">Body Temp</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-emerald-300">{patient.vitals.temperature}</span>
              <span className="text-xs text-slate-400">°C</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">● Afebrile</span>
          </div>
        </div>
      </div>

      {/* Treatment Care Journey Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            Your Treatment Journey & Next Steps
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track each clinical milestone from triage through recovery and discharge planning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {patient.journey.map((step, idx) => {
            const isDone = step.status === 'COMPLETED';
            const isCurrent = step.status === 'IN_PROGRESS';

            return (
              <div
                key={step.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isDone
                    ? 'bg-slate-950/40 border-teal-500/40 text-slate-200 shadow-md shadow-teal-950/20'
                    : isCurrent
                    ? 'bg-teal-950/30 border-teal-400 shadow-xl shadow-teal-950/40 ring-1 ring-teal-400/40 text-white'
                    : 'bg-slate-950/20 border-slate-800/60 text-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      Step 0{idx + 1}
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-400" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-100">{step.friendlyLabel}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {step.details || (isDone ? 'Completed successfully by clinical staff.' : 'Pending upcoming clinical evaluation.')}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className={isCurrent ? 'text-teal-300 font-semibold' : 'text-slate-500'}>
                    {isDone ? 'Finished' : isCurrent ? 'Active Now' : 'Upcoming'}
                  </span>
                  {step.timestamp && <span className="text-slate-500">{step.timestamp}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Medications & Lab Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Medication Reminders */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold text-base text-white">Daily Medication Plan</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{patient.medications.length} Prescribed</span>
          </div>

          <div className="space-y-3">
            {patient.medications.map((med) => (
              <div key={med.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-white">{med.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{med.dosage} • {med.frequency}</p>
                  <p className="text-[11px] text-teal-300 font-mono mt-1">Next scheduled dose: {med.nextDose}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold border ${
                      med.status === 'ADMINISTERED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    }`}
                  >
                    {med.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostics & Lab Summaries */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base text-white">Diagnostic & Lab Summaries</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{patient.reports.length} Reports</span>
          </div>

          <div className="space-y-3">
            {patient.reports.map((rep) => (
              <div key={rep.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-white">{rep.title}</h4>
                  <span className="text-[10px] font-mono text-slate-400">{rep.date}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{rep.summary}</p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-teal-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Physician Reviewed & Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
