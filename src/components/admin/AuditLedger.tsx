import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { AuditEvent } from '../../types';
import {
  FileText,
  Search,
  Filter,
  History,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';

export const AuditLedger: React.FC = () => {
  const { auditEvents, resources } = useSocket();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [replayResourceId, setReplayResourceId] = useState<string>('');

  const filteredEvents = auditEvents.filter((evt) => {
    const matchesStatus = statusFilter === 'ALL' || evt.status === statusFilter;
    const matchesSearch =
      evt.eventType.toLowerCase().includes(search.toLowerCase()) ||
      evt.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      evt.details.toLowerCase().includes(search.toLowerCase()) ||
      (evt.transactionId && evt.transactionId.toLowerCase().includes(search.toLowerCase())) ||
      (evt.resourceId && evt.resourceId.toLowerCase().includes(search.toLowerCase()));
    const matchesReplay = !replayResourceId || evt.resourceId === replayResourceId;
    return matchesStatus && matchesSearch && matchesReplay;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'FAILED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'INFO':
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search audit trail, event type, service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Event Severities</option>
            <option value="INFO">Info</option>
            <option value="SUCCESS">Success</option>
            <option value="WARNING">Warning</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Time-Travel Replay Selector */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={replayResourceId}
              onChange={(e) => setReplayResourceId(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">Time-Travel Replay (All Resources)</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                  Replay: {r.name} ({r.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Recorded Audit Records: <span className="text-cyan-400 font-bold">{filteredEvents.length}</span>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2.5">
        {filteredEvents.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto stroke-1 mb-3 text-slate-600" />
            <h4 className="text-base font-semibold text-slate-300">No Audit Events Logged</h4>
            <p className="text-xs mt-1">Audit log records all state changes, locks, and saga compensations.</p>
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 transition-all shadow-sm space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(evt.status)}`}>
                    {evt.status}
                  </span>
                  <span className="text-xs font-mono font-bold text-white">{evt.eventType}</span>
                  <span className="text-xs text-slate-400">• {evt.serviceName}</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                  <span>TXN: {evt.transactionId}</span>
                  <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">{evt.details}</p>

              {(evt.previousState || evt.newState) && (
                <div className="text-[11px] font-mono bg-slate-950 p-2 rounded-xl border border-slate-800/80 flex items-center gap-2 text-slate-400">
                  <span className="text-slate-500">State Transition:</span>
                  {evt.previousState && <span className="text-rose-400">{evt.previousState}</span>}
                  {evt.previousState && <span>&rarr;</span>}
                  <span className="text-emerald-400 font-semibold">{evt.newState}</span>
                  {evt.resourceId && <span className="text-cyan-400 ml-auto">[{evt.resourceId}]</span>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
