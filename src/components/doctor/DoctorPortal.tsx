import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { PatientDetailView } from './PatientDetailView';
import {
  Stethoscope,
  Users,
  AlertTriangle,
  Star,
  Activity,
  Phone,
  Mail,
  Search,
  Filter,
  PlusCircle,
  Bed,
  Workflow
} from 'lucide-react';

interface Props {
  onOpenNewTxnModal: (patientId: string, resourceId?: string) => void;
  onOpenSurgeryModal: () => void;
}

export const DoctorPortal: React.FC<Props> = ({ onOpenNewTxnModal, onOpenSurgeryModal }) => {
  const { activeDoctorId } = useAuth();
  const { doctors, patients, resources } = useSocket();

  const currentDoctor = doctors.find((d) => d.id === activeDoctorId) || doctors[0];
  const doctorPatients = patients.filter((p) => p.assignedDoctorId === currentDoctor?.id || p.severity === 'CRITICAL');

  const [selectedPatientId, setSelectedPatientId] = useState<string>(doctorPatients[0]?.id || patients[0]?.id || '');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPatients = patients.filter((p) => {
    const matchesDoc = p.assignedDoctorId === currentDoctor?.id || p.severity === 'CRITICAL';
    const matchesSev = filterSeverity === 'ALL' || p.severity === filterSeverity;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDoc && matchesSev && matchesSearch;
  });

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || filteredPatients[0] || patients[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Doctor Summary Header Banner */}
      {currentDoctor && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-blue-500/20 shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                  <Stethoscope className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold font-display text-white">{currentDoctor.name}</h1>
                  <span className="text-xs font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold">
                    {currentDoctor.availability}
                  </span>
                </div>
                <p className="text-xs text-indigo-300 font-medium mt-0.5">
                  {currentDoctor.specialization} • Department of {currentDoctor.department}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> {currentDoctor.email}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-500" /> {currentDoctor.phone}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Assigned Patients</span>
                <span className="text-lg font-bold font-mono text-cyan-400">{doctorPatients.length}</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Critical Triage</span>
                <span className="text-lg font-bold font-mono text-rose-400">
                  {doctorPatients.filter((p) => p.severity === 'CRITICAL').length}
                </span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Clinical Rating</span>
                <span className="text-lg font-bold font-mono text-amber-400 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400" /> {currentDoctor.rating}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Split View: Patient Roster (Left) and Detailed Clinical Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Patient List Selector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-sm text-slate-100">Patient Roster</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">{filteredPatients.length} Patients</span>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name or diagnosis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'STABLE'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
                      filterSeverity === sev
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient Cards List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredPatients.map((p) => {
                const isSelected = selectedPatient?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/30 ring-1 ring-cyan-500/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white">{p.name}</span>
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                              p.severity === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-300'
                                : p.severity === 'HIGH'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {p.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{p.diagnosis}</p>
                      </div>

                      <span className="text-[10px] font-mono text-cyan-400 shrink-0">
                        {p.vitals.heartRate} BPM
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/60">
                      <span>Room: {p.roomNumber || 'Triage'}</span>
                      <span className="text-slate-400">{p.treatmentStatus}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Selected Patient Deep Clinical Sheet */}
        <div className="lg:col-span-8">
          {selectedPatient ? (
            <PatientDetailView
              patient={selectedPatient}
              onOpenNewTxnModal={(patId, resId) => onOpenNewTxnModal(patId, resId)}
              onOpenSurgeryModal={onOpenSurgeryModal}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto stroke-1 mb-3 text-slate-600" />
              <h4 className="text-base font-semibold text-slate-300">No Patient Selected</h4>
              <p className="text-xs mt-1">Select a patient from the roster to view live clinical telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
