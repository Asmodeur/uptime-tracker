import React from 'react';
import Sitecard from './Sitecard';
import { Globe, PlusCircle } from 'lucide-react';

function SiteList({ sites, onDelete, onOpenAddModal }) {
  if (sites.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-12 text-center max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Globe className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white">No websites monitored yet</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Add an HTTP or HTTPS endpoint above to start monitoring its availability, latency, and historical uptime via AWS Lambda.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {sites.map((site) => (
        <Sitecard
          key={site.id}
          id={site.id}
          name={site.name}
          url={site.url}
          status={site.status}
          responseTime={site.response_time}
          uptimePercentage={site.uptime_percentage}
          recentChecks={site.recent_checks}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default SiteList;