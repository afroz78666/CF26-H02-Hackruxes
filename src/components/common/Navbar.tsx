import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  Activity,
  UserCheck,
  Heart,
  Shield,
  RotateCcw,
  Bell,
  Wifi,
  WifiOff,
  Flame,
  User,
  Stethoscope,
  ChevronDown
} from 'lucide-react';

interface Props {
  onOpenNotifications: () => void;
  onOpenNewTxnModal?: () => void;
  onOpenSurgeryModal?: () => void;
}

export const Navbar: React.FC<Props> = ({ onOpenNotifications, onOpenNewTxnModal, onOpenSurgeryModal }) => {
  const { role, loginAs, activeDoctorId, setActiveDoctorId, activePatientId, setActivePatientId } = useAuth();
  const { connected, doctors, patients, resetSystemState, notifications, chaosFlags } = useSocket();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isChaosActive = chaosFlags.serviceUnavailable || chaosFlags.dbLockContention || chaosFlags.networkTimeoutMs > 0 || chaosFlags.forceNextTxnFail;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => loginAs('ADMIN')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-blue-600 p-[1px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-white tracking-tight">MediFlow</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  OCC & Saga
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans hidden sm:block">Clinical Resource & Distributed Orchestrator</p>
            </div>
          </div>

          {/* Role Navigation Buttons */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => loginAs('ADMIN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                role === 'ADMIN'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Operations Center</span>
            </button>

            <button
              onClick={() => loginAs('DOCTOR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                role === 'DOCTOR'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Portal</span>
            </button>

            <button
              onClick={() => loginAs('PATIENT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                role === 'PATIENT'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Patient Portal</span>
            </button>
          </nav>
        </div>

        {/* Right Actions & Status */}
        <div className="flex items-center gap-3">
          {/* Active Persona Dropdown depending on role */}
          {role === 'DOCTOR' && (
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
              <select
                value={activeDoctorId}
                onChange={(e) => setActiveDoctorId(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-slate-100">
                    {d.name} ({d.specialization.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>
          )}

          {role === 'PATIENT' && (
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={activePatientId}
                onChange={(e) => setActivePatientId(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                    {p.name} ({p.severity})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Chaos Indicator Badge */}
          {isChaosActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-mono animate-pulse">
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Failure Lab Active</span>
            </div>
          )}

          {/* WebSocket Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
              connected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{connected ? 'Cluster Live' : 'Reconnecting...'}</span>
          </div>

          {/* Seed Reset Button */}
          <button
            onClick={() => resetSystemState()}
            title="Reset system state to clean seed data"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-black text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
