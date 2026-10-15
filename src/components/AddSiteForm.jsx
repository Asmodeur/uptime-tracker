import React, { useState } from 'react';
import { Plus, Globe, Loader2, AlertCircle } from 'lucide-react';

function AddSiteForm({ onAdd }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill a friendly site name on URL blur if empty
  const handleUrlBlur = () => {
    if (!name.trim() && url.trim().includes('.')) {
      try {
        const clean = url.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
        const domain = clean.split('.')[0];
        if (domain && domain.length > 1) {
          setName(domain.charAt(0).toUpperCase() + domain.slice(1));
        }
      } catch (err) {
        // ignore
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a website URL');
      return;
    }

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    const finalName = name.trim() || new URL(finalUrl).hostname;

    try {
      setIsSubmitting(true);
      await onAdd({ name: finalName, url: finalUrl, check_interval: 30 });
      setName('');
      setUrl('');
    } catch (err) {
      setError(err.message || 'Failed to add website');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-400" />
          Add Website to Monitor
        </h2>
        <span className="text-xs text-slate-400">
          Tracks uptime status, latency (ms), and HTTP response codes
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="Site Name (e.g. Google, GitHub)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="sm:col-span-6">
            <input
              type="text"
              placeholder="Website URL (e.g. https://google.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 transition font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2 px-3 text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {isSubmitting ? 'Adding...' : 'Add Website'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-2.5 text-xs text-rose-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </div>
  );
}

export default AddSiteForm;