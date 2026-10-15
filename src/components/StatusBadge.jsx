import React from 'react';

function StatusBadge({ status }) {
  if (status === 'up') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        OPERATIONAL
      </span>
    );
  }

  if (status === 'down') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
        </span>
        DOWNTIME
      </span>
    );
  }

  if (status === 'degraded') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        DEGRADED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-300 border border-slate-600/40">
      <span className="w-2 h-2 rounded-full bg-slate-400" />
      PENDING
    </span>
  );
}

export default StatusBadge;