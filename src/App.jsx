import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import AddSiteForm from './components/AddSiteForm';
import SiteList from './components/SiteList';
import ProjectInfoModal from './components/ProjectInfoModal';
import { getSites, addSite, checkSites, deleteSite } from './services/api';
import { Server, Cloud, Database, Bell, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

function App() {
  const [sites, setSites] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
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
    }, 30000); // 30-second poll
    return () => clearInterval(interval);
  }, [loadData, autoRefresh]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* College Project Header */}
      <Header
        isChecking={isChecking}
        onRunCheck={runCheck}
        lastRefresh={lastRefresh}
        onOpenInfo={() => setIsInfoOpen(true)}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
      />

      {/* Main Student Dashboard */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        
        {/* Section 1: Overview Metric Cards */}
        <div>
          <MetricCards sites={sites} />
        </div>

        {/* Section 2: Add New Website Form */}
        <div>
          <AddSiteForm onAdd={handleAdd} />
        </div>

        {/* Section 3: Monitored Websites List */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Monitored Websites
              </h2>
              <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-mono font-medium">
                {sites.length} Active
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {lastRefresh
                ? `Last sync: ${lastRefresh.toLocaleTimeString()}`
                : 'Connecting...'}
            </span>
          </div>

          <SiteList sites={sites} onDelete={handleDelete} />
        </div>

        {/* Section 4: AWS Cloud Architecture Explanation (Clear for Viva & Teacher Review) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cloud className="w-4 h-4 text-orange-400" />
                AWS Cloud Architecture & Services
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Architecture deployed in AWS Region: <code className="text-orange-300 font-mono">ap-southeast-2</code> (Sydney)
              </p>
            </div>
            <button
              onClick={() => setIsInfoOpen(true)}
              className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
            >
              Full Course Details &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-white flex items-center gap-1.5 mb-1">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                AWS Lambda (Compute)
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Serverless Node.js 20.x functions (<code className="text-slate-300">UptimeTrackerApiHandler</code> & <code className="text-slate-300">UptimeTrackerHealthChecker</code>) executing health checks without managing servers.
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-white flex items-center gap-1.5 mb-1">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                Amazon API Gateway
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                HTTP REST API proxy routing incoming frontend requests to Lambda with automated CORS headers.
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-white flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Amazon EventBridge
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Scheduled automated cron rule (<code className="text-slate-300">UptimeEveryMinuteCheck</code>) invoking health checks every 60 seconds.
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-white flex items-center gap-1.5 mb-1">
                <Bell className="w-3.5 h-3.5 text-rose-400" />
                Amazon SNS (Alerts)
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Notification topic (<code className="text-slate-300">UptimeDowntimeAlerts</code>) dispatching alerts when a monitored website goes down.
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-white flex items-center gap-1.5 mb-1">
                <Database className="w-3.5 h-3.5 text-purple-400" />
                Database Tier
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Amazon RDS PostgreSQL schema with fallback storage storing response times and uptime logs.
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-white flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Vercel + GitHub CI/CD
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Static frontend deployed on global CDN with automatic deployments from git pushes to <code className="text-slate-300">main</code>.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Course Info Modal */}
      <ProjectInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />

      {/* College Project Submission Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            CSE2025: AWS Solution Architect · B.Tech CSE Project Submission
          </p>
          <p>
            Nilam Sikdar (24BCC7025) · Faculty Guide: Dr Renita R · VIT-AP University
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;