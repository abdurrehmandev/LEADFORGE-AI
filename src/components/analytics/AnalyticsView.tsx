import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../services/api';
import { Lead } from '../../types';
import { BarChart3, TrendingUp, Users, CheckCircle2, Flame, RefreshCw } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!currentWorkspace?.id) return;
    try {
      setLoading(true);
      const data = await api.getLeads(currentWorkspace.id);
      setLeads(data);
    } catch (e) {
      console.warn('Failed to load leads for analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentWorkspace?.id]);

  // Channel distribution
  const channelCounts = leads.reduce((acc, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Temp distribution
  const hotCount = leads.filter((l) => l.temperature === 'HOT').length;
  const warmCount = leads.filter((l) => l.temperature === 'WARM').length;
  const coldCount = leads.filter((l) => l.temperature === 'COLD').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#050505]">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#737373] block mb-1">
            Pipeline Telemetry & Attribution
          </span>
          <h1 className="text-3xl font-extralight text-white tracking-tight flex items-center gap-3">
            <span>Analytics & Intelligence</span>
          </h1>
          <p className="text-xs text-[#737373] mt-1 font-light">
            Channel acquisition efficiency, scoring breakdown, and qualification metrics.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-[#111111] border border-[#262626] text-[#e5e5e5] hover:border-[#c5a059] text-[11px] uppercase tracking-wider transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#c5a059]' : 'text-[#737373]'}`} />
          <span>Refresh</span>
        </button>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-sm relative overflow-hidden">
          <p className="text-[10px] uppercase tracking-widest text-[#737373]">Avg Qualification Score</p>
          <h3 className="text-3xl font-light text-white mt-2 font-mono">
            {leads.length > 0 ? Math.round(leads.reduce((a, b) => a + b.score, 0) / leads.length) : 0}
            <span className="text-sm text-[#737373]">/100</span>
          </h3>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#c5a059]/30 to-[#c5a059]" />
        </div>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-sm relative overflow-hidden">
          <p className="text-[10px] uppercase tracking-widest text-[#737373]">High-Intent Ratio</p>
          <h3 className="text-3xl font-light text-[#c5a059] mt-2 font-mono">
            {leads.length > 0 ? Math.round((hotCount / leads.length) * 100) : 0}%
          </h3>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-rose-500/30 to-rose-500" />
        </div>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-sm relative overflow-hidden">
          <p className="text-[10px] uppercase tracking-widest text-[#737373]">Avg Response Latency</p>
          <h3 className="text-3xl font-light text-emerald-400 mt-2 font-mono">
            1.8 <span className="text-sm text-[#737373]">sec</span>
          </h3>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/30 to-emerald-500" />
        </div>
      </div>

      {/* Distribution Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Channel Breakdown */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-6 space-y-4">
          <span className="text-[9px] uppercase tracking-[0.15em] text-[#737373]">Inbound Channels</span>
          <h3 className="text-xs font-medium uppercase tracking-wider text-white">Lead Acquisition by Channel</h3>

          <div className="space-y-3 pt-2">
            {Object.entries(channelCounts).map(([channel, countVal]) => {
              const count = Number(countVal);
              const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
              return (
                <div key={channel} className="space-y-1">
                  <div className="flex justify-between text-xs font-light">
                    <span className="text-[#e5e5e5]">{channel}</span>
                    <span className="text-[#737373] font-mono">{count} leads ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#171717] rounded-sm overflow-hidden border border-[#262626]">
                    <div
                      className="h-full bg-gradient-to-r from-[#8a6d3b] to-[#c5a059]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Temperature Breakdown */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-6 space-y-4">
          <span className="text-[9px] uppercase tracking-[0.15em] text-[#737373]">Qualification Stratification</span>
          <h3 className="text-xs font-medium uppercase tracking-wider text-white">Temperature Segmentation</h3>

          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-sm bg-[#111111] border border-[#1a1a1a] flex justify-between items-center">
              <span className="text-xs text-rose-300 font-light">🔥 HOT (70-100 pts)</span>
              <span className="text-sm font-mono text-white">{hotCount}</span>
            </div>
            <div className="p-3 rounded-sm bg-[#111111] border border-[#1a1a1a] flex justify-between items-center">
              <span className="text-xs text-[#c5a059] font-light">☀️ WARM (40-69 pts)</span>
              <span className="text-sm font-mono text-white">{warmCount}</span>
            </div>
            <div className="p-3 rounded-sm bg-[#111111] border border-[#1a1a1a] flex justify-between items-center">
              <span className="text-xs text-sky-300 font-light">❄️ COLD (0-39 pts)</span>
              <span className="text-sm font-mono text-white">{coldCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
