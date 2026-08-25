import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Resource, ResourceType, ResourceStatus } from '../../types';
import {
  Bed,
  Layers,
  RotateCcw,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  Activity,
  Plus
} from 'lucide-react';

interface Props {
  onOpenNewTxnModal: (patientId?: string, resourceId?: string) => void;
}

export const ResourceGrid: React.FC<Props> = ({ onOpenNewTxnModal }) => {
  const { resources } = useSocket();
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filteredResources = resources.filter((r) => {
    const matchesType = typeFilter === 'ALL' || r.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.department.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const handleResetResource = async (resourceId: string) => {
    await fetch(`/api/resources/${resourceId}/reset`, { method: 'POST' });
  };

  const getStatusBadge = (status: ResourceStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'OCCUPIED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'RESERVED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'LOCKED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      case 'OFFLINE':
      default:
        return 'bg-slate-700/40 text-slate-400 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search resources, wards, OR suites..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Resource Types</option>
            <option value="BED_ICU">ICU Beds</option>
            <option value="BED_EMERGENCY">Emergency Beds</option>
            <option value="BED_WARD">Ward Beds</option>
            <option value="OPERATION_ROOM">Operation Rooms</option>
            <option value="EQUIPMENT">Life Support Equipment</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="RESERVED">Reserved</option>
            <option value="LOCKED">Distributed Lock</option>
          </select>
        </div>

        <button
          onClick={() => onOpenNewTxnModal()}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-950/40 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Allocation Transaction</span>
        </button>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredResources.map((res) => {
          const isLocked = res.status === 'LOCKED';
          const isAvailable = res.status === 'AVAILABLE';

          return (
            <div
              key={res.id}
              className={`bg-slate-900 border rounded-2xl p-4.5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl ${
                isLocked
                  ? 'border-rose-500/60 shadow-rose-950/20 glow-border-rose'
                  : isAvailable
                  ? 'border-slate-800 hover:border-emerald-500/40'
                  : 'border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">{res.department}</span>
                    <h4 className="font-bold text-sm text-white mt-0.5">{res.name}</h4>
                  </div>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(res.status)}`}>
                    {res.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                  <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                    <span>OCC Version:</span>
                    <span className="text-cyan-400 font-semibold">v{res.version}</span>
                  </div>

                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Assigned Patient:</span>
                    <span className="text-slate-200 font-medium truncate max-w-[130px]">
                      {res.assignedPatientName || 'None'}
                    </span>
                  </div>

                  {res.lockedByTxnId && (
                    <div className="flex justify-between text-rose-400 font-mono text-[10px] bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/40">
                      <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Lock Owner:</span>
                      <span className="truncate max-w-[110px]">{res.lockedByTxnId}</span>
                    </div>
                  )}
                </div>

                {res.specs && Object.keys(res.specs).length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {Object.entries(res.specs).map(([k, v]) => (
                      <span key={k} className="text-[10px] font-mono bg-slate-800/60 text-slate-400 px-1.5 py-0.5 rounded">
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenNewTxnModal(undefined, res.id)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition text-center"
                >
                  Allocate
                </button>

                <button
                  onClick={() => handleResetResource(res.id)}
                  title="Manual OCC version bump & release lock"
                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
