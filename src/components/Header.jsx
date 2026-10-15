import React from 'react';
import { Activity, RefreshCw, Info, CheckCircle2 } from 'lucide-react';

function Header({ isChecking, onRunCheck, lastRefresh, onOpenInfo, autoRefresh, setAutoRefresh }) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Brand & Student Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Website Uptime Monitor</h1>
                <span className="text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  CSE2025 Project
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Nilam Sikdar (24BCC7025) · VIT-AP University · Guide: Dr Renita R
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Auto refresh button */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition flex items-center gap-1.5 ${
                autoRefresh
                  ? 'bg-slate-800 text-emerald-400 border-emerald-500/30 hover:bg-slate-700'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Automatically refresh checks every 30 seconds"
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              Auto-Sync: {autoRefresh ? '30s' : 'Off'}
            </button>

            {/* Project Details Modal Button */}
            <button
              onClick={onOpenInfo}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
              title="View AWS architecture and academic project details"
            >
              <Info className="w-3.5 h-3.5 text-blue-400" />
              Project Info
            </button>

            {/* Run Manual Check Button */}
            <button
              onClick={onRunCheck}
              disabled={isChecking}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Checking...' : 'Check All Sites'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;