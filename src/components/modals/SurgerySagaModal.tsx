import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { X, Play, ShieldAlert, Sparkles, Workflow, Layers } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SurgerySagaModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { patients, doctors, resources, executeSaga } = useSocket();

  const orRooms = resources.filter((r) => r.type === 'OPERATION_ROOM');
  const equipment = resources.filter((r) => r.type === 'EQUIPMENT');
  const surgeons = doctors.filter((d) => d.specialization.toLowerCase().includes('surgery') || d.specialization.toLowerCase().includes('cardio') || d.specialization.toLowerCase().includes('neuro'));

  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [orId, setOrId] = useState(orRooms[0]?.id || 'OR-SUITE-01');
  const [doctorId, setDoctorId] = useState(surgeons[0]?.id || doctors[0]?.id || '');
  const [equipmentId, setEquipmentId] = useState(equipment[0]?.id || 'EQ-VENT-01');
  const [failAtStep, setFailAtStep] = useState<number | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !orId || !doctorId || !equipmentId) return;

    setIsRunning(true);
    try {
      await executeSaga({
        patientId,
        orId,
        doctorId,
        equipmentId,
        failAtStep: failAtStep ? Number(failAtStep) : undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Emergency Surgery Saga Orchestrator</h3>
              <p className="text-xs text-slate-400">Multi-resource distributed saga with automated compensations</p>
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
          {/* Patient */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Surgical Candidate</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.severity}) — {p.diagnosis}
                </option>
              ))}
            </select>
          </div>

          {/* OR Suite & Surgeon */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Operating Theatre</label>
              <select
                value={orId}
                onChange={(e) => setOrId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {orRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Lead Surgeon</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {surgeons.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ICU Equipment */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Support Life-Support Device</label>
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.status})
                </option>
              ))}
            </select>
          </div>

          {/* Chaos / Compensation injection option */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-purple-900/40">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-purple-300">Chaos Injection / Compensation Demo</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
              Inject a simulated failure mid-workflow to watch the distributed Saga automatically trigger backward compensation rollbacks!
            </p>
            <select
              value={failAtStep || ''}
              onChange={(e) => setFailAtStep(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="">No Failure (Execute full successful 4-step Saga)</option>
              <option value="2">Fail at Step 2: Surgeon Schedule Conflict</option>
              <option value="3">Fail at Step 3: ICU Step-Down Bed Unavailable</option>
              <option value="4">Fail at Step 4: Medical Device Calibration Error</option>
            </select>
          </div>

          {/* Workflow Steps Preview */}
          <div className="text-[11px] font-mono text-slate-400 space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-300 font-semibold mb-1">Saga Choreography Pipeline:</div>
            <div>1. Lock Operating Theatre Suite &rarr; [Compensate: Release OR]</div>
            <div>2. Lock Surgeon Schedule &rarr; [Compensate: Free Doctor]</div>
            <div>3. Reserve ICU Step-Down Bed &rarr; [Compensate: De-allocate Bed]</div>
            <div>4. Prep & Calibrate Life Support &rarr; [Compensate: Power Down]</div>
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
              disabled={isRunning}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-purple-900/30 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Orchestrating Saga...' : 'Dispatch Saga Workflow'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
