import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import AddSiteForm from './components/AddSiteForm';
import SiteList from './components/SiteList';
import ProjectInfoModal from './components/ProjectInfoModal';
import { getSites, addSite, checkSites, deleteSite } from './services/api';

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
    }, 30000); // 30-second interval
    return () => clearInterval(interval);
  }, [loadData, autoRefresh]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <Header
        isChecking={isChecking}
        onRunCheck={runCheck}
        lastRefresh={lastRefresh}
        onOpenInfo={() => setIsInfoOpen(true)}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {/* Simple Summary Metric Cards */}
        <MetricCards sites={sites} />

        {/* AWS Cloud Services Architecture Ribbon */}
        <div className="mb-6 p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 font-semibold border border-orange-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              AWS Architecture Integrated
            </span>
            <span className="text-slate-400">
              AWS Lambda (Compute) · Amazon RDS (PostgreSQL) · EventBridge (Cron) · CloudWatch (Metrics) · SNS (Alerts)
            </span>
          </div>
          <button
            onClick={() => setIsInfoOpen(true)}
            className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2 shrink-0 self-start sm:self-auto"
          >
            View Cloud Specs &rarr;
          </button>
        </div>

        {/* Add Website Form */}
        <AddSiteForm onAdd={handleAdd} />

        {/* Monitored Sites Header */}
        <div className="mb-4 flex items-center justify-between">
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

        {/* Sites Grid */}
        <SiteList sites={sites} onDelete={handleDelete} />
      </main>

      {/* Academic Project Info Modal */}
      <ProjectInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />

      {/* Academic College Project Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-5 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            CSE2025: AWS Solution Architect · Cloud Migration Project
          </p>
          <p>
            Developed by <span className="text-white font-medium">Nilam Sikdar</span> (24BCC7025) · Faculty Guide: <span className="text-white font-medium">Dr Renita R</span> · VIT-AP University
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;