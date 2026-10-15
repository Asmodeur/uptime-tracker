import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import HistoryLog from './HistoryLog';
import { ExternalLink, Trash2, Clock, Zap, ChevronDown, ChevronUp } from 'lucide-react';

function Sitecard({ id, name, url, status, responseTime, uptimePercentage, recentChecks = [], onDelete }) {
  const [showHistory, setShowHistory] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setIsDeleting(true);
    await onDelete(id);
    setIsDeleting(false);
  };

  // Speed evaluation
  let latencyBadgeColor = 'text-slate-300';
  let latencyLabel = 'Normal';
  if (responseTime) {
    if (responseTime < 200) {
      latencyBadgeColor = 'text-emerald-400';
      latencyLabel = 'Fast';
    } else if (responseTime < 600) {
      latencyBadgeColor = 'text-amber-400';
      latencyLabel = 'Moderate';
    } else {
      latencyBadgeColor = 'text-rose-400';
      latencyLabel = 'Slow';
    }
  }

  // Ensure 10 visual sparkline bars
  const displayChecks = recentChecks && recentChecks.length > 0 ? recentChecks : [];

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-5 shadow-lg backdrop-blur-sm transition-colors duration-150 flex flex-col justify-between">
      <div>
        {/* Header: Title, URL, Status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-white font-bold text-base truncate tracking-tight flex items-center gap-1.5">
              {name}
            </h2>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-blue-400 text-xs truncate flex items-center gap-1 mt-0.5 transition"
              title={url}
            >
              <span className="truncate">{url}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Primary Metrics: Latency & Uptime */}
        <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              CloudWatch Latency
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-lg font-bold font-mono ${latencyBadgeColor}`}>
                {responseTime ? `${responseTime}ms` : '—'}
              </span>
              {responseTime && (
                <span className="text-[10px] text-slate-400 font-medium">({latencyLabel})</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              RDS Uptime Record
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold font-mono text-emerald-400">
                {uptimePercentage ? `${uptimePercentage}%` : '100%'}
              </span>
            </div>
          </div>
        </div>

        {/* Sparkline / Recent Checks Visual Timeline */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 font-medium">
            <span>Recent Checks Timeline</span>
            <span>Latest</span>
          </div>
          <div className="flex items-center gap-1 h-5 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            {displayChecks.length === 0 ? (
              <span className="text-[10px] text-slate-500 mx-auto">Awaiting first check...</span>
            ) : (
              displayChecks.map((chk, idx) => (
                <div
                  key={idx}
                  title={`Status: ${chk.status.toUpperCase()}${chk.response_time ? ` (${chk.response_time}ms)` : ''}`}
                  className={`flex-1 h-full rounded-[2px] transition hover:opacity-75 ${
                    chk.status === 'up'
                      ? 'bg-emerald-500'
                      : chk.status === 'down'
                      ? 'bg-rose-500'
                      : 'bg-slate-600'
                  }`}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-700/60">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition"
          >
            <Clock className="w-3.5 h-3.5" />
            {showHistory ? 'Hide Check Log' : 'View Check Log'}
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`text-xs px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${
              confirmDelete
                ? 'bg-rose-600 text-white animate-pulse'
                : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmDelete ? 'Confirm Delete?' : 'Delete'}
          </button>
        </div>

        {/* Expandable History Component */}
        {showHistory && <HistoryLog siteId={id} />}
      </div>
    </div>
  );
}

export default Sitecard;