import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../services/api';
import { Lead, Appointment } from '../../types';
import { TemperatureBadge, StatusPill, SourceBadge } from '../common/StatusPills';
import {
  Users,
  Flame,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  Sparkles,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
  Zap,
  Plus
} from 'lucide-react';

export const DashboardView: React.FC<{ onOpenCreateLead: () => void }> = ({ onOpenCreateLead }) => {
  const { currentWorkspace, setActiveView, setSelectedLead, automationsPaused } = useWorkspace();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<{ summary: string; actionItems: string[]; bottleneckAnalysis: string } | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const loadData = async () => {
    if (!currentWorkspace?.id) return;
    try {
      setLoading(true);
      const [leadList, aptList] = await Promise.all([
        api.getLeads(currentWorkspace.id),
        api.getAppointments(currentWorkspace.id),
      ]);
      setLeads(leadList);
      setAppointments(aptList);
    } catch (e) {
      console.warn('Failed to load dashboard metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    if (!currentWorkspace?.id) return;
    try {
      setLoadingInsights(true);
      const res = await api.getAIInsights(currentWorkspace.id);
      setAiInsights(res.insights);
    } catch (e) {
      console.warn('Failed to generate insights:', e);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    loadData();
    loadInsights();
  }, [currentWorkspace?.id]);

  // Aggregate Metrics
  const totalLeads = leads.length;
  const hotLeads = leads.filter((l) => l.temperature === 'HOT');
  const warmLeads = leads.filter((l) => l.temperature === 'WARM');
  const qualifiedCount = leads.filter((l) => ['QUALIFIED', 'APPOINTMENT_BOOKED', 'NEGOTIATION', 'WON'].includes(l.status)).length;
  const wonCount = leads.filter((l) => l.status === 'WON').length;
  const bookedCount = appointments.length;

  const qualifiedRatio = totalLeads > 0 ? Math.round((qualifiedCount / totalLeads) * 100) : 0;
  const conversionRatio = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#050505]">
      {/* Automations Paused Alert Banner */}
      {automationsPaused && (
        <div className="p-4 rounded-sm bg-rose-950/30 border border-rose-900/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold text-rose-200">Automations Paused</h4>
              <p className="text-xs text-rose-300/70 mt-0.5 font-light">
                Inbound leads are queued in CRM. Automated AI qualification & follow-up drips are suspended.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('settings')}
            className="px-3 py-1.5 rounded-sm bg-rose-900/40 hover:bg-rose-800/40 text-rose-200 text-[11px] uppercase tracking-wider border border-rose-700/50 transition shrink-0 font-medium"
          >
            Review Controls
          </button>
        </div>
      )}

      {/* Header with Elegant Dark Typography & Quick Actions */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#737373] block mb-1">
            Enterprise Pipeline Overview
          </span>
          <h1 className="text-3xl font-extralight text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-[#737373] mt-1 font-light">
            Active Workspace: <span className="text-[#e5e5e5]">{currentWorkspace.name}</span> • Industry: <span className="text-[#c5a059] uppercase tracking-wider text-[11px]">{currentWorkspace.industry}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-[#111111] border border-[#262626] text-[11px] uppercase tracking-wider text-[#e5e5e5] hover:border-[#c5a059] transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#c5a059]' : 'text-[#737373]'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setActiveView('simulator')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-[#111111] border border-[#262626] text-[11px] uppercase tracking-wider text-[#c5a059] hover:border-[#c5a059] transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Live AI Simulator</span>
          </button>

          <button
            onClick={onOpenCreateLead}
            className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[11px] uppercase tracking-wider font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Lead</span>
          </button>
        </div>
      </header>

      {/* Top 4 Metric Cards - Matching Elegant Dark theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 relative overflow-hidden rounded-sm">
          <p className="text-[10px] uppercase tracking-widest text-[#737373]">Total Pipeline Volume</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-3xl font-light text-white">{totalLeads}</h3>
            <span className="text-[10px] text-emerald-500 font-mono">+12.4% vs last mo</span>
          </div>
          <p className="text-[11px] text-[#737373] mt-2 font-light">{hotLeads.length} HOT priority leads active</p>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#c5a059]/20 to-[#c5a059]" />
        </div>

        {/* Card 2: AI Qualification Rate */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 relative overflow-hidden rounded-sm">
          <p className="text-[10px] uppercase tracking-widest text-[#737373]">AI Qualification Rate</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-3xl font-light text-white">{qualifiedRatio}%</h3>
            <span className="text-[10px] text-emerald-500 font-mono">Benchmark 45%</span>
          </div>
          <p className="text-[11px] text-[#737373] mt-2 font-light">{qualifiedCount} verified high intent</p>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/20 to-emerald-500" />
        </div>

        {/* Card 3: Booked Consultations */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 relative overflow-hidden rounded-sm">
          <p className="text-[10px] uppercase tracking-widest text-[#737373]">Booked Consultations</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-3xl font-light text-white">{bookedCount}</h3>
            <span className="text-[10px] text-[#c5a059] font-mono">100% automated</span>
          </div>
          <p className="text-[11px] text-[#737373] mt-2 font-light">Direct calendar integration</p>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#c5a059]/20 to-[#c5a059]" />
        </div>

        {/* Card 4: Deals Won & Pipeline Value */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 relative overflow-hidden rounded-sm">
          <p className="text-[10px] uppercase tracking-widest text-[#737373]">Closed Won Revenue</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-3xl font-light text-[#c5a059]">${(wonCount * 18500).toLocaleString()}</h3>
            <span className="text-[10px] text-emerald-500 font-mono">{conversionRatio}% conversion</span>
          </div>
          <p className="text-[11px] text-[#737373] mt-2 font-light">{wonCount} closed contracts</p>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#c5a059]/40 to-[#c5a059]" />
        </div>
      </div>

      {/* AI Executive Intelligence Analysis */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-sm bg-[#171717] border border-[#262626] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-[0.15em] text-[#737373]">Autonomous Diagnostics</span>
              <h2 className="text-sm font-light text-white tracking-wide">AI Pipeline Intelligence & Prescriptive Actions</h2>
            </div>
          </div>
          <button
            onClick={loadInsights}
            disabled={loadingInsights}
            className="text-[10px] uppercase tracking-widest text-[#c5a059] hover:underline flex items-center gap-1 font-mono"
          >
            <RefreshCw className={`w-3 h-3 ${loadingInsights ? 'animate-spin' : ''}`} />
            <span>Re-Analyze</span>
          </button>
        </div>

        {loadingInsights ? (
          <div className="py-6 text-center text-xs text-[#737373] font-light">Analyzing multi-channel conversions...</div>
        ) : aiInsights ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-sm bg-[#111111] border border-[#1a1a1a] space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-[#737373]">Executive Summary</span>
              <p className="text-xs text-[#e5e5e5] leading-relaxed font-light">{aiInsights.summary}</p>
            </div>
            <div className="p-4 rounded-sm bg-[#111111] border border-[#1a1a1a] space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-amber-400">Bottleneck Detected</span>
              <p className="text-xs text-[#e5e5e5] leading-relaxed font-light">{aiInsights.bottleneckAnalysis}</p>
            </div>
            <div className="p-4 rounded-sm bg-[#111111] border border-[#1a1a1a] space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-emerald-400">Recommended Actions</span>
              <ul className="text-xs text-[#e5e5e5] space-y-1.5 font-light">
                {aiInsights.actionItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#c5a059] font-mono mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#737373] font-light">Click Re-Analyze to generate AI pipeline intelligence.</p>
        )}
      </div>

      {/* Main Grid: Hot Inbound Leads & Calendar Consultations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hot Leads Table (2 Columns Span) */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm flex flex-col">
          <div className="p-4 border-b border-[#1a1a1a] flex justify-between items-center">
            <div>
              <span className="text-[9px] uppercase tracking-[0.15em] text-[#737373]">Priority Queue</span>
              <h3 className="text-xs font-medium uppercase tracking-wider text-white">Hot & Urgent Inbound Opportunities</h3>
            </div>
            <button
              onClick={() => setActiveView('leads')}
              className="text-[11px] uppercase tracking-wider text-[#c5a059] hover:underline flex items-center gap-1"
            >
              <span>View All Leads</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-[10px] uppercase tracking-widest text-[#404040] border-b border-[#1a1a1a] bg-[#080808]">
                <tr>
                  <th className="px-5 py-3 font-medium">Contact / Service</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-[#141414]">
                {hotLeads.slice(0, 6).map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="hover:bg-[#0f0f0f] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-light text-white">{lead.name}</div>
                      <div className="text-[11px] text-[#737373] mt-0.5">{lead.service || 'Consultation'}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <TemperatureBadge temperature={lead.temperature} score={lead.score} size="sm" />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={lead.status} size="sm" />
                    </td>
                    <td className="px-4 py-3.5">
                      <SourceBadge source={lead.source} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLead(lead);
                        }}
                        className="px-2.5 py-1 rounded-sm bg-[#111111] hover:bg-[#171717] text-[#c5a059] border border-[#262626] text-[10px] uppercase tracking-wider transition"
                      >
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Consultations (1 Column Span) */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm flex flex-col">
          <div className="p-4 border-b border-[#1a1a1a] flex justify-between items-center">
            <div>
              <span className="text-[9px] uppercase tracking-[0.15em] text-[#737373]">Scheduled Calls</span>
              <h3 className="text-xs font-medium uppercase tracking-wider text-white">Upcoming Consultations</h3>
            </div>
            <button
              onClick={() => setActiveView('appointments')}
              className="text-[11px] uppercase tracking-wider text-[#c5a059] hover:underline"
            >
              Calendar
            </button>
          </div>

          <div className="p-4 flex-1 space-y-3 overflow-y-auto">
            {appointments.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#737373]">No scheduled calls.</div>
            ) : (
              appointments.slice(0, 5).map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 rounded-sm bg-[#111111] border border-[#1a1a1a] space-y-1.5 hover:border-[#262626] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-light text-white">{apt.leadName}</span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 font-mono">
                      {apt.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#737373] flex items-center justify-between font-light">
                    <span>{apt.service}</span>
                    <span className="font-mono text-[#c5a059]">{new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
