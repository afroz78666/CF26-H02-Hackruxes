import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { ConcurrencyRunResult } from '../../types';
import confetti from 'canvas-confetti';
import {
  Swords,
  Play,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  Timer
} from 'lucide-react';

export const ConcurrencySimulatorView: React.FC = () => {
  const { resources, runConcurrencySim } = useSocket();

  const icuBeds = resources.filter((r) => r.type === 'BED_ICU' || r.type === 'OPERATION_ROOM');
  const [resourceId, setResourceId] = useState<string>(icuBeds[0]?.id || 'BED-ICU-01');
  const [requestCount, setRequestCount] = useState<number>(4);
  const [strategy, setStrategy] = useState<'OCC_VERSION_CHECK' | 'PRIORITY_FIRST' | 'FIRST_COME_FIRST_SERVED'>('OCC_VERSION_CHECK');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ConcurrencyRunResult | null>(null);

  const targetResource = resources.find((r) => r.id === resourceId);

  const handleSimulate = async () => {
    setIsRunning(true);
    try {
      const res = await runConcurrencySim({
        resourceId,
        requestCount,
        deterministicStrategy: strategy,
      });
      setResult(res);

      // Trigger confetti on successful race resolution
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#06b6d4', '#3b82f6', '#10b981'],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-900/40 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full font-semibold">
            High-Contention Lab
          </span>
        </div>
        <h2 className="text-2xl font-bold font-display text-white mt-2">
          Real-Time Concurrency Race Simulator
        </h2>
        <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
          Simulate up to 8 simultaneous clinical requests competing for the exact same scarce resource (e.g. ICU Bed or OR Suite). Test how Optimistic Concurrency Control (OCC) and Priority Preemption prevent double-booking and maintain strict data integrity.
        </p>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Target Resource */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <label className="text-xs font-mono uppercase text-slate-400 block font-semibold">1. Contended Resource</label>
          <select
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {icuBeds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} [{r.type}] (v{r.version} • {r.status})
              </option>
            ))}
          </select>
          {targetResource && (
            <div className="text-[11px] font-mono text-slate-400 pt-1">
              Current OCC Version: <strong className="text-cyan-400">v{targetResource.version}</strong>
            </div>
          )}
        </div>

        {/* Competitor Request Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase text-slate-400 font-semibold">2. Concurrent Threads</label>
            <span className="text-xs font-mono text-cyan-400 font-bold">{requestCount} Simultaneous Requests</span>
          </div>
          <input
            type="range"
            min={2}
            max={8}
            step={1}
            value={requestCount}
            onChange={(e) => setRequestCount(Number(e.target.value))}
            className="w-full accent-cyan-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>2 Threads (Duo)</span>
            <span>8 Threads (High Contention)</span>
          </div>
        </div>

        {/* Resolution Strategy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <label className="text-xs font-mono uppercase text-slate-400 block font-semibold">3. Conflict Strategy</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="OCC_VERSION_CHECK">OCC Strict Version Check</option>
            <option value="PRIORITY_FIRST">Clinical Priority Preemption (CRITICAL &gt; HIGH)</option>
            <option value="FIRST_COME_FIRST_SERVED">Microsecond Timestamp FCFS</option>
          </select>
          <div className="text-[11px] text-slate-400 pt-1 leading-tight">
            {strategy === 'OCC_VERSION_CHECK' && 'Rejects any request whose expectedVersion != actualVersion.'}
            {strategy === 'PRIORITY_FIRST' && 'Higher severity pre-empts lower severity even if arriving later.'}
            {strategy === 'FIRST_COME_FIRST_SERVED' && 'Earliest sub-millisecond timestamp claims lock.'}
          </div>
        </div>
      </div>

      {/* Launch Battle Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSimulate}
          disabled={isRunning}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-950/50 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <Swords className="w-5 h-5" />
          <span>{isRunning ? 'Running Concurrency Battle...' : 'Launch High-Contention Race'}</span>
        </button>
      </div>

      {/* Results Breakdown */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                  Race Complete
                </span>
                <span className="text-xs font-mono text-slate-400">Time: {result.executionTimeMs}ms</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Contention on {result.resourceName} (Version v{result.initialVersion} &rarr; v{result.finalVersion})
              </h3>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-emerald-500/40 text-right">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Confirmed Lock Winner</span>
              <span className="text-sm font-bold text-emerald-400">{result.winnerPatientName} ({result.winnerPriority})</span>
            </div>
          </div>

          {/* Requests Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase font-bold text-slate-400">
              Contending Request Threads ({result.requests.length} Total)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.requests.map((req, idx) => {
                const isWinner = req.status === 'CONFIRMED';
                return (
                  <div
                    key={req.txnId}
                    className={`p-4 rounded-2xl border transition-all ${
                      isWinner
                        ? 'bg-emerald-950/20 border-emerald-500 shadow-lg shadow-emerald-950/40'
                        : 'bg-slate-950/60 border-slate-800/80 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{req.patientName}</span>
                          <span
                            className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                              req.priority === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-300'
                                : req.priority === 'HIGH'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {req.priority}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 block mt-0.5">TXN: {req.txnId}</span>
                      </div>

                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${
                          isWinner
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Latency: {req.latencyMs}ms</span>
                      <span>Lock: {req.lockStatus}</span>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{req.reason}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
