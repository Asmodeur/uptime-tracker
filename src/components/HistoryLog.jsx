import React, { useState, useEffect } from 'react';
import { getHistory } from '../services/api';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

function HistoryLog({ siteId }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const data = await getHistory(siteId);
        if (isMounted) setHistory(data);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [siteId]);

  if (isLoading) {
    return (
      <div className="mt-4 border-t border-slate-700/80 pt-3 text-center">
        <p className="text-xs text-slate-400 animate-pulse">Fetching RDS PostgreSQL check logs...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="mt-4 border-t border-slate-700/80 pt-3 text-center">
        <p className="text-xs text-slate-500">No checks recorded yet. Next EventBridge cycle will record data.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-slate-700/80 pt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Clock className="w-3 h-3" /> Historical Ping Logs (RDS Checks Table)
        </span>
        <span className="text-[10px] text-slate-500">Recent {history.length}</span>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {history.map((check) => {
          const isUp = check.status === 'up';
          const dateStr = new Date(check.checked_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          return (
            <div
              key={check.id}
              className={`flex items-center justify-between p-2 rounded-lg text-xs border ${
                isUp
                  ? 'bg-slate-900/40 border-slate-800 text-slate-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {isUp ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span className="font-mono text-[11px] text-slate-400">{dateStr}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {check.http_status_code ? `HTTP ${check.http_status_code}` : 'ERR'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isUp ? (
                  <span className="font-mono text-emerald-400 font-medium">
                    {check.response_time}ms
                  </span>
                ) : (
                  <span className="text-[11px] text-rose-400 font-medium truncate max-w-[140px]" title={check.error_message}>
                    {check.error_message || 'Timeout'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HistoryLog;