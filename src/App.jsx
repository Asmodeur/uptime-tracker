import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import AddSiteForm from './components/AddSiteForm';
import SiteList from './components/SiteList';
import { getSites, addSite, checkSites, deleteSite } from './services/api';

function App() {
  const [sites, setSites] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const isFetchingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const sitesData = await getSites();
      if (Array.isArray(sitesData)) {
        setSites(sitesData);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.warn('Sync note:', err.message);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const runCheck = async () => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      await checkSites();
      await loadData();
    } catch (err) {
      console.error('Check failed:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleAdd = async (newSite) => {
    await addSite(newSite);
    await loadData();
  };

  const handleDelete = async (deletedId) => {
    try {
      await deleteSite(deletedId);
      setSites((prev) => prev.filter((s) => s.id !== deletedId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  useEffect(() => {
    loadData();
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData();
    }, 30000); // 30-second interval
    return () => clearInterval(interval);
  }, [loadData, autoRefresh]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* College Project Header */}
      <Header
        isChecking={isChecking}
        onRunCheck={runCheck}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
      />

      {/* Main Student Dashboard */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        
        {/* Simple Summary Metric Cards */}
        <MetricCards sites={sites} />

        {/* Add Website Form */}
        <AddSiteForm onAdd={handleAdd} />

        {/* Monitored Websites List */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-wide">
                Monitored Websites
              </h2>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono font-medium">
                {sites.length} Active
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {lastRefresh
                ? `Last updated: ${lastRefresh.toLocaleTimeString()}`
                : 'Connecting...'}
            </span>
          </div>

          <SiteList sites={sites} onDelete={handleDelete} />
        </div>

        {/* Basic & Rudimentary Project Architecture Notes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs">
          <h3 className="font-semibold text-white mb-2.5 flex items-center gap-1.5 text-xs">
            <span>☁️</span> AWS Architecture & Services Used
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400 text-[11px]">
            <div className="bg-slate-950/50 p-2.5 rounded border border-slate-800/80">
              <strong className="text-slate-200 block mb-0.5">Region:</strong>
              <span><code className="text-orange-400 font-mono">ap-southeast-2</code> (Sydney)</span>
            </div>

            <div className="bg-slate-950/50 p-2.5 rounded border border-slate-800/80">
              <strong className="text-slate-200 block mb-0.5">Compute (AWS Lambda):</strong>
              <span>Node.js 20.x serverless handlers (<code className="text-slate-300">UptimeTrackerApiHandler</code>)</span>
            </div>

            <div className="bg-slate-950/50 p-2.5 rounded border border-slate-800/80">
              <strong className="text-slate-200 block mb-0.5">API Gateway:</strong>
              <span>HTTP REST proxy with CORS enabled for frontend requests</span>
            </div>

            <div className="bg-slate-950/50 p-2.5 rounded border border-slate-800/80">
              <strong className="text-slate-200 block mb-0.5">EventBridge Cron:</strong>
              <span>Automated 1-minute schedule (<code className="text-slate-300">UptimeEveryMinuteCheck</code>)</span>
            </div>

            <div className="bg-slate-950/50 p-2.5 rounded border border-slate-800/80">
              <strong className="text-slate-200 block mb-0.5">Alerts (Amazon SNS):</strong>
              <span>Notification topic (<code className="text-slate-300">UptimeDowntimeAlerts</code>) for downtime</span>
            </div>

            <div className="bg-slate-950/50 p-2.5 rounded border border-slate-800/80">
              <strong className="text-slate-200 block mb-0.5">Hosting:</strong>
              <span>Vercel (React Frontend) + GitHub CI/CD</span>
            </div>
          </div>
        </div>

      </main>

      {/* College Project Submission Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            CSE2025: AWS Solution Architect · College Project Submission
          </p>
          <p>
            Nilam Sikdar (24BCC7025) · Guide: Dr Renita R · VIT-AP University
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;