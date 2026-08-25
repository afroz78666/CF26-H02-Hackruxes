import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { ResourceGrid } from './ResourceGrid';
import { TransactionStream } from './TransactionStream';
import { SagaDashboard } from './SagaDashboard';
import { ConcurrencySimulatorView } from './ConcurrencySimulatorView';
import { FailureLabView } from './FailureLabView';
import { AuditLedger } from './AuditLedger';
import { Transaction } from '../../types';
import {
  Shield,
  Layers,
  Zap,
  Workflow,
  Swords,
  Flame,
  FileText,
  Bed,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Server
} from 'lucide-react';

interface Props {
  onOpenNewTxnModal: (patientId?: string, resourceId?: string) => void;
  onOpenSurgeryModal: () => void;
}

export const AdminPortal: React.FC<Props> = ({ onOpenNewTxnModal, onOpenSurgeryModal }) => {
  const { resources, transactions, sagas, chaosFlags, setActiveModalTxn } = useSocket();
  const [activeTab, setActiveTab] = useState<'RESOURCES' | 'TRANSACTIONS' | 'SAGA' | 'CONCURRENCY' | 'CHAOS' | 'AUDIT'>('RESOURCES');

  const icuBeds = resources.filter((r) => r.type === 'BED_ICU');
  const icuOccupied = icuBeds.filter((r) => r.status === 'OCCUPIED').length;
  const icuOccupancyRate = icuBeds.length ? Math.round((icuOccupied / icuBeds.length) * 100) : 0;

  const successTxns = transactions.filter((t) => t.status === 'SUCCESS').length;
  const successRate = transactions.length ? Math.round((successTxns / transactions.length) * 100) : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">ICU Bed Occupancy</span>
            <Bed className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-white">{icuOccupancyRate}%</span>
            <span className="text-xs text-slate-400 font-mono">({icuOccupied}/{icuBeds.length})</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                icuOccupancyRate > 80 ? 'bg-rose-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${icuOccupancyRate}%` }}
            />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Active Resources</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-white">{resources.length}</span>
            <span className="text-xs text-emerald-400 font-mono">
              ({resources.filter((r) => r.status === 'AVAILABLE').length} free)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2 block font-mono">Sharded OCC Versioning</span>
        </div>

        {/* KPI 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Transaction Stream</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-white">{transactions.length}</span>
            <span className="text-xs text-amber-400 font-mono">Events</span>
          </div>
          <span className="text-[10px] text-emerald-400 mt-2 block font-mono">
            {successRate}% Success Rate
          </span>
        </div>

        {/* KPI 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Distributed Sagas</span>
            <Workflow className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-white">{sagas.length}</span>
            <span className="text-xs text-purple-300 font-mono">Orchestrated</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2 block font-mono">Multi-Resource Locking</span>
        </div>

        {/* KPI 5 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Cluster Health</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-xl font-bold font-mono ${chaosFlags.serviceUnavailable ? 'text-rose-400' : 'text-emerald-400'}`}>
              {chaosFlags.serviceUnavailable ? 'DEGRADED' : 'HEALTHY'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2 block font-mono">WebSocket Cluster Synced</span>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('RESOURCES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === 'RESOURCES'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Bed className="w-4 h-4" />
          <span>Clinical Resources Grid</span>
        </button>

        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === 'TRANSACTIONS'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>OCC Transactions Stream</span>
        </button>

        <button
          onClick={() => setActiveTab('SAGA')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === 'SAGA'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Workflow className="w-4 h-4" />
          <span>Saga Surgery Suite</span>
        </button>

        <button
          onClick={() => setActiveTab('CONCURRENCY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === 'CONCURRENCY'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Concurrency Race Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('CHAOS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === 'CHAOS'
              ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Failure & Chaos Lab</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === 'AUDIT'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Ledger & Time-Travel</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'RESOURCES' && <ResourceGrid onOpenNewTxnModal={onOpenNewTxnModal} />}
        {activeTab === 'TRANSACTIONS' && <TransactionStream onSelectTxn={(txn) => setActiveModalTxn(txn)} />}
        {activeTab === 'SAGA' && <SagaDashboard onOpenSurgeryModal={onOpenSurgeryModal} />}
        {activeTab === 'CONCURRENCY' && <ConcurrencySimulatorView />}
        {activeTab === 'CHAOS' && <FailureLabView />}
        {activeTab === 'AUDIT' && <AuditLedger />}
      </div>
    </div>
  );
};
