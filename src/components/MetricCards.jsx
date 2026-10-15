import React from 'react';
import { Globe2, CheckCircle2, Gauge, AlertTriangle } from 'lucide-react';

function MetricCards({ sites = [] }) {
  const totalSites = sites.length;
  const upSites = sites.filter((s) => s.status === 'up').length;
  const downSites = sites.filter((s) => s.status === 'down').length;

  // Calculate average response time for active sites
  const validLatencies = sites
    .filter((s) => s.status === 'up' && s.response_time)
    .map((s) => s.response_time);
  
  const avgLatency =
    validLatencies.length > 0
      ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length)
      : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {/* Total Sites */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Monitored Sites</span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Globe2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-white tracking-tight">{totalSites}</div>
        <p className="text-xs text-slate-400 mt-1">Configured HTTP/HTTPS endpoints</p>
      </div>

      {/* Online / Offline status */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Current Health</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-white tracking-tight">
          <span className="text-emerald-400">{upSites} Up</span>
          {downSites > 0 && <span className="text-rose-400 text-lg ml-2 font-semibold">({downSites} Down)</span>}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {totalSites > 0 ? `${((upSites / totalSites) * 100).toFixed(0)}% available right now` : 'No sites added yet'}
        </p>
      </div>

      {/* Average Latency */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Average Response Time</span>
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-white tracking-tight">
          {avgLatency ? `${avgLatency} ms` : '—'}
        </div>
        <p className="text-xs text-slate-400 mt-1">Across operational endpoints</p>
      </div>
    </div>
  );
}

export default MetricCards;
