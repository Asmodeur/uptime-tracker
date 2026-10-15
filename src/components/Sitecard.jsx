import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import HistoryLog from './HistoryLog';
import { ExternalLink, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react';

function Sitecard({ id, name, url, status, responseTime, uptimePercentage, onDelete }) {
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

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 shadow-sm flex flex-col justify-between">
      <div>
        {/* Title, URL and Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-bold text-sm truncate">
              {name}
            </h3>
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

        {/* Simple 2-column info box */}
        <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block">Response Time</span>
            <span className="font-semibold text-white font-mono text-sm">
              {responseTime ? `${responseTime} ms` : '—'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Uptime Record</span>
            <span className="font-semibold text-emerald-400 font-mono text-sm">
              {uptimePercentage ? `${uptimePercentage}%` : '100%'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-700/60">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition"
          >
            <Clock className="w-3.5 h-3.5" />
            {showHistory ? 'Hide History' : 'Check History'}
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`text-xs px-2 py-1 rounded transition font-medium flex items-center gap-1 ${
              confirmDelete
                ? 'bg-rose-600 text-white font-bold'
                : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmDelete ? 'Confirm Delete?' : 'Delete'}
          </button>
        </div>

        {/* Expandable History Drawer */}
        {showHistory && <HistoryLog siteId={id} />}
      </div>
    </div>
  );
}

export default Sitecard;