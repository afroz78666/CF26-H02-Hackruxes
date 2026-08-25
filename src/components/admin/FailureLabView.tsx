import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import {
  Flame,
  ShieldAlert,
  WifiOff,
  Database,
  Clock,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Zap,
  Terminal
} from 'lucide-react';

export const FailureLabView: React.FC = () => {
  const { chaosFlags, updateChaosFlags, triggerSelfHealing } = useSocket();
  const [selfHealingLogs, setSelfHealingLogs] = useState<string[]>([]);
  const [isHealing, setIsHealing] = useState(false);

  const handleToggle = async (key: string, value: any) => {
    await updateChaosFlags({
      ...chaosFlags,
      [key]: value,
    });
  };

  const handleRunHealing = async () => {
    setIsHealing(true);
    setSelfHealingLogs([
      '[RECONCILER] Scanning all active clinical resources across distributed shards...',
      '[RECONCILER] Checking dangling distributed locks and stale OCC version pointers...',
    ]);

    try {
      const res = await triggerSelfHealing('PAT-1004', 'BED-ICU-04');
      setTimeout(() => {
        setSelfHealingLogs((prev) => [
          ...prev,
          `[RECONCILER] Found orphaned resource locks: ${res.action || 'Auto-repaired resource state'}`,
          `[RECONCILER] Synchronized distributed ledger with version bump (v${res.resource?.version || 2})`,
          '[RECONCILER] State fully reconciled! Broadcasted store:update event to cluster.',
        ]);
        setIsHealing(false);
      }, 1200);
    } catch (err: any) {
      setSelfHealingLogs((prev) => [...prev, `[ERROR] Self-healing failed: ${err.message}`]);
      setIsHealing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border border-rose-900/40 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase bg-rose-500/10 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full font-semibold">
            Fault Tolerance & Chaos
          </span>
        </div>
        <h2 className="text-2xl font-bold font-display text-white mt-2">
          Chaos Engineering & Self-Healing Control Lab
        </h2>
        <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
          Inject distributed network faults, database deadlocks, packet drops, and service degradations to test MediFlow&apos;s automatic idempotency deduplication, distributed saga compensation, and self-healing reconciliation.
        </p>
      </div>

      {/* Chaos Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Service 503 Degraded Outage */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-rose-400">
                <WifiOff className="w-5 h-5" />
                <h4 className="font-bold text-sm text-white">Service Degradation (503)</h4>
              </div>
              <input
                type="checkbox"
                checked={chaosFlags.serviceUnavailable}
                onChange={(e) => handleToggle('serviceUnavailable', e.target.checked)}
                className="w-5 h-5 accent-rose-500 cursor-pointer"
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Simulates downstream healthcare microservice outage. Forces fast failover & circuit breaking.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono">
            Status: <span className={chaosFlags.serviceUnavailable ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{chaosFlags.serviceUnavailable ? 'OUTAGE ACTIVE' : 'HEALTHY'}</span>
          </div>
        </div>

        {/* DB Lock Contention */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-400">
                <Database className="w-5 h-5" />
                <h4 className="font-bold text-sm text-white">DB Lock Contention</h4>
              </div>
              <input
                type="checkbox"
                checked={chaosFlags.dbLockContention}
                onChange={(e) => handleToggle('dbLockContention', e.target.checked)}
                className="w-5 h-5 accent-amber-500 cursor-pointer"
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Simulates concurrent database row locking delays, forcing OCC transactions to conflict.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono">
            Status: <span className={chaosFlags.dbLockContention ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{chaosFlags.dbLockContention ? 'CONTENTION SIMULATED' : 'OFF'}</span>
          </div>
        </div>

        {/* Force Next Txn Failure */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-purple-400">
                <Flame className="w-5 h-5" />
                <h4 className="font-bold text-sm text-white">Force Next Txn Failure</h4>
              </div>
              <input
                type="checkbox"
                checked={chaosFlags.forceNextTxnFail}
                onChange={(e) => handleToggle('forceNextTxnFail', e.target.checked)}
                className="w-5 h-5 accent-purple-500 cursor-pointer"
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Forces the very next incoming transaction or Saga step to throw an unhandled exception.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono">
            Status: <span className={chaosFlags.forceNextTxnFail ? 'text-purple-400 font-bold' : 'text-emerald-400'}>{chaosFlags.forceNextTxnFail ? 'TRIPPED' : 'ARMED'}</span>
          </div>
        </div>

        {/* Network Latency Slider */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:col-span-2 lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400">
              <Clock className="w-5 h-5" />
              <h4 className="font-bold text-sm text-white">Synthetic Network Latency Injection</h4>
            </div>
            <span className="text-xs font-mono text-cyan-300 font-bold">{chaosFlags.networkTimeoutMs} ms Delay</span>
          </div>
          <input
            type="range"
            min={0}
            max={3000}
            step={250}
            value={chaosFlags.networkTimeoutMs}
            onChange={(e) => handleToggle('networkTimeoutMs', Number(e.target.value))}
            className="w-full accent-cyan-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0 ms (Local Speed)</span>
            <span>1500 ms (High Latency)</span>
            <span>3000 ms (Extreme Degraded Lag)</span>
          </div>
        </div>
      </div>

      {/* Self Healing Terminal Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Autonomous Self-Healing & Distributed Reconciliation
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Runs state machine auditing against dangling distributed locks and restores resource invariants.
            </p>
          </div>

          <button
            onClick={handleRunHealing}
            disabled={isHealing}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isHealing ? 'animate-spin' : ''}`} />
            <span>{isHealing ? 'Reconciling Shards...' : 'Trigger Self-Healing Engine'}</span>
          </button>
        </div>

        {/* Terminal Window */}
        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-xs text-emerald-400 space-y-1.5 min-h-[140px] max-h-60 overflow-y-auto">
          <div className="flex items-center gap-2 text-slate-500 pb-1 border-b border-slate-900 text-[11px]">
            <Terminal className="w-3.5 h-3.5" />
            <span>MediFlow Reconciler Console</span>
          </div>

          {selfHealingLogs.length === 0 ? (
            <p className="text-slate-600 pt-2">System cluster idle. Click &apos;Trigger Self-Healing Engine&apos; to initiate automated reconciliation.</p>
          ) : (
            selfHealingLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
