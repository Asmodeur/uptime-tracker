import React from 'react';
import { X, Server, Database, Cloud, Bell, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

function ProjectInfoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-400" />
              Website Uptime Tracker — Cloud Migration to AWS
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              CSE2025: AWS Solution Architect · Project Submission
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300">
          
          {/* Student & College Metadata Box */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 font-medium block">Student Name & Roll No:</span>
              <span className="text-white font-semibold text-sm">Nilam Sikdar (24BCC7025)</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Program & Specialization:</span>
              <span className="text-white font-medium">B.Tech Computer Science & Engineering</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Institution:</span>
              <span className="text-white font-medium">VIT-AP University, Amaravati</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Faculty Guide:</span>
              <span className="text-white font-semibold">Dr Renita R</span>
            </div>
          </div>

          {/* Project Objective */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Project Objective
            </h3>
            <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              Migrate a decoupled web monitoring application from multi-provider hobby tiers to a unified, resilient AWS cloud architecture. The system monitors HTTP endpoints, tracks latency and availability metrics, and records audit logs into a relational database.
            </p>
          </div>

          {/* AWS Architecture Summary */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              AWS Cloud Architecture
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
                <div className="flex items-center gap-2 font-semibold text-white mb-1">
                  <Cloud className="w-3.5 h-3.5 text-orange-400" /> Frontend & CDN
                </div>
                <p className="text-slate-400 text-[11px]">
                  React (Vite + Tailwind CSS) deployed with global edge caching and SSL encryption.
                </p>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
                <div className="flex items-center gap-2 font-semibold text-white mb-1">
                  <Server className="w-3.5 h-3.5 text-amber-400" /> Backend API & Workers
                </div>
                <p className="text-slate-400 text-[11px]">
                  Node.js Express / AWS Lambda handlers orchestrated with Amazon EventBridge scheduled cron checks.
                </p>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
                <div className="flex items-center gap-2 font-semibold text-white mb-1">
                  <Database className="w-3.5 h-3.5 text-blue-400" /> Database Tier
                </div>
                <p className="text-slate-400 text-[11px]">
                  Amazon RDS PostgreSQL with ACID compliance, relational schemas for sites and historical pings.
                </p>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
                <div className="flex items-center gap-2 font-semibold text-white mb-1">
                  <Bell className="w-3.5 h-3.5 text-rose-400" /> Telemetry & Alerts
                </div>
                <p className="text-slate-400 text-[11px]">
                  Amazon CloudWatch latency tracking and Amazon SNS alert topics for downtime dispatch.
                </p>
              </div>
            </div>
          </div>

          {/* Submission Deliverables */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              Course Submission Deliverables
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[11px]">
              <li><strong>GitHub Repository:</strong> Full source code, commit history, and CI/CD linkage.</li>
              <li><strong>Infrastructure as Code:</strong> Terraform (<code className="text-orange-300">terraform/</code>) and AWS SAM template (<code className="text-orange-300">aws/template.yaml</code>).</li>
              <li><strong>Database DDL:</strong> PostgreSQL relational schema & seed script (<code className="text-orange-300">database/schema.sql</code>).</li>
              <li><strong>Reports & Documentation:</strong> Complete technical project report and Viva Q&A guide included in repository.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectInfoModal;
