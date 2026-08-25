import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Vitals } from '../../types';
import { Activity, Heart, Wind, Thermometer } from 'lucide-react';

interface Props {
  vitals: Vitals;
}

export const VitalsChart: React.FC<Props> = ({ vitals }) => {
  const [dataPoints, setDataPoints] = useState<any[]>([]);

  useEffect(() => {
    // Generate recent historical telemetry wave based on base vitals
    const now = Date.now();
    const points = [];
    for (let i = 12; i >= 0; i--) {
      const time = new Date(now - i * 5000);
      const hrVariance = Math.sin(i) * 4 + (Math.random() * 4 - 2);
      const o2Variance = Math.cos(i) * 0.8;

      points.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        heartRate: Math.round(vitals.heartRate + hrVariance),
        oxygen: Math.min(100, Math.round(vitals.oxygenLevel + o2Variance)),
      });
    }
    setDataPoints(points);

    // Live update interval
    const interval = setInterval(() => {
      setDataPoints((prev) => {
        const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const hrVariance = (Math.random() * 6 - 3);
        const o2Variance = (Math.random() * 1.5 - 0.75);

        const newPoint = {
          time: nextTime,
          heartRate: Math.round(vitals.heartRate + hrVariance),
          oxygen: Math.min(100, Math.round(vitals.oxygenLevel + o2Variance)),
        };
        return [...prev.slice(1), newPoint];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [vitals.heartRate, vitals.oxygenLevel]);

  return (
    <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 space-y-4">
      {/* Vitals Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Heart Rate */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">Heart Rate</span>
            <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-slate-100">{vitals.heartRate}</span>
            <span className="text-[10px] text-slate-400">BPM</span>
          </div>
        </div>

        {/* Oxygen */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">SpO2 Oxygen</span>
            <Wind className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-cyan-300">{vitals.oxygenLevel}</span>
            <span className="text-[10px] text-slate-400">%</span>
          </div>
        </div>

        {/* Blood Pressure */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">Blood Pressure</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base font-bold font-mono text-amber-300">{vitals.bloodPressure}</span>
            <span className="text-[10px] text-slate-400">mmHg</span>
          </div>
        </div>

        {/* Temperature */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">Body Temp</span>
            <Thermometer className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-emerald-300">{vitals.temperature}</span>
            <span className="text-[10px] text-slate-400">°C</span>
          </div>
        </div>
      </div>

      {/* Live Telemetry Wave Chart */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Live Telemetry Stream
          </span>
          <span className="text-[10px] font-mono text-slate-500">Updated: {vitals.lastUpdated}</span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorO2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
              <YAxis stroke="#475569" fontSize={10} domain={['dataMin - 10', 'dataMax + 10']} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="heartRate" name="Heart Rate (BPM)" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorHr)" />
              <Area type="monotone" dataKey="oxygen" name="Oxygen (%)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorO2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
