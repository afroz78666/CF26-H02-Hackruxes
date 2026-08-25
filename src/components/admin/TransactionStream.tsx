import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Transaction, TransactionStatus } from '../../types';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface Props {
  onSelectTxn: (txn: Transaction) => void;
}

export const TransactionStream: React.FC<Props> = ({ onSelectTxn }) => {
  const { transactions } = useSocket();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filteredTxns = transactions.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.patientName.toLowerCase().includes(search.toLowerCase()) ||
      (t.resourceName && t.resourceName.toLowerCase().includes(search.toLowerCase())) ||
      t.idempotencyKey.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'CONFLICTED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'FAILED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'COMPENSATED':
      case 'COMPENSATING':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'PROCESSING':
      case 'PENDING':
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-700/40 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header / Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Txn ID, Patient, or Idempotency Key..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Transaction Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="CONFLICTED">OCC Conflicted</option>
            <option value="FAILED">Failed</option>
            <option value="COMPENSATED">Saga Compensated</option>
            <option value="PROCESSING">Processing</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span>Total Stream Events:</span>
          <span className="text-cyan-400 font-bold">{transactions.length}</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Transaction ID / Type</th>
                <th className="py-3 px-4">Patient Target</th>
                <th className="py-3 px-4">Allocated Resource</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">OCC Version</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No transactions matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTxns.map((txn) => (
                  <tr
                    key={txn.id}
                    onClick={() => onSelectTxn(txn)}
                    className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-white">{txn.id}</div>
                      <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{txn.type}</div>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-200">
                      {txn.patientName}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {txn.resourceName || txn.resourceId || 'N/A'}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold border ${getPriorityBadge(txn.priority)}`}>
                        {txn.priority}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(txn.status)}`}>
                        {txn.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400">
                      v{txn.expectedVersion ?? 1} &rarr; v{txn.actualVersion ?? (txn.expectedVersion ?? 1) + 1}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(txn.createdAt).toLocaleTimeString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTxn(txn);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-300 transition"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
