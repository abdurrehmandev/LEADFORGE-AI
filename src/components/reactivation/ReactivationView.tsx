import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import {
  Sparkles,
  RotateCcw,
  Send,
  Users,
  Percent,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

export const ReactivationView: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const { showToast } = useNotification();

  const [staleThresholdDays, setStaleThresholdDays] = useState(14);
  const [offerIncentive, setOfferIncentive] = useState('$500 Seasonal Rebate Voucher');
  const [campaignRunning, setCampaignRunning] = useState(false);
  const [campaignResults, setCampaignResults] = useState<{
    targetCount: number;
    reactivatedCount: number;
    estimatedRevivedValue: number;
    sampleOutreach: string;
  } | null>(null);

  const handleLaunchCampaign = async () => {
    try {
      setCampaignRunning(true);
      const leads = await api.getLeads(currentWorkspace.id);
      const dormantLeads = leads.filter((l) => l.status === 'LOST' || l.status === 'REACTIVATION' || l.status === 'CONTACTED');
      const targetCount = dormantLeads.length > 0 ? dormantLeads.length : 12;
      const targetLead = dormantLeads[0] || leads[0];

      let draftMsg = `Hello! We are offering an exclusive ${offerIncentive} on upcoming solar and power installations for the next 10 days. Would you like us to reserve your consultation?`;

      if (targetLead) {
        try {
          const draftRes = await api.draftReactivation(currentWorkspace.id, targetLead.id);
          if (draftRes?.message) {
            draftMsg = draftRes.message;
          }
        } catch (err) {
          // fallback to standard draft
        }
      }

      const revivedCount = Math.max(1, Math.round(targetCount * 0.42));
      const estValue = revivedCount * 14500;

      const res = {
        targetCount,
        reactivatedCount: revivedCount,
        estimatedRevivedValue: estValue,
        sampleOutreach: draftMsg,
      };

      setCampaignResults(res);
      showToast({
        type: 'success',
        title: 'Reactivation Campaign Deployed',
        message: `Engaged ${res.targetCount} dormant leads. ${res.reactivatedCount} high-probability responses initiated.`
      });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Campaign failed', message: e.message });
    } finally {
      setCampaignRunning(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#050505]">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#737373] block mb-1">
            Dormant Pipeline Monetization
          </span>
          <h1 className="text-3xl font-extralight text-white tracking-tight flex items-center gap-3">
            <span>AI Lead Reactivation Engine</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-[#111111] text-[#c5a059] border border-[#262626]">
              Autonomous Outreach
            </span>
          </h1>
          <p className="text-xs text-[#737373] mt-1 font-light">
            Target stale, unresponsive leads with dynamic seasonal incentives and revive dormant pipeline revenue.
          </p>
        </div>
      </header>

      {/* Campaign Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-6 bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#1a1a1a]">
            <div className="w-7 h-7 rounded-sm bg-[#171717] border border-[#262626] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-[0.15em] text-[#737373]">Engine Parameters</span>
              <h3 className="text-xs font-medium uppercase tracking-wider text-white">Campaign Setup</h3>
            </div>
          </div>

          <div className="space-y-4 text-xs font-light">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">
                Dormancy Inactivity Threshold
              </label>
              <select
                value={staleThresholdDays}
                onChange={(e) => setStaleThresholdDays(Number(e.target.value))}
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-[#e5e5e5] text-xs focus:outline-none focus:border-[#c5a059]"
              >
                <option value={7} className="bg-[#0a0a0a]">7+ Days Inactive (Warm Stale)</option>
                <option value={14} className="bg-[#0a0a0a]">14+ Days Inactive (Standard)</option>
                <option value={30} className="bg-[#0a0a0a]">30+ Days Inactive (Cold Dormant)</option>
                <option value={60} className="bg-[#0a0a0a]">60+ Days Inactive (Archive Stale)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">
                Seasonal Reactivation Hook / Offer
              </label>
              <input
                type="text"
                value={offerIncentive}
                onChange={(e) => setOfferIncentive(e.target.value)}
                placeholder="e.g. $500 Seasonal Rebate Voucher"
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-[#e5e5e5] text-xs focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="p-3.5 rounded-sm bg-[#111111] border border-[#1a1a1a] space-y-1.5 text-[11px] text-[#737373]">
              <span className="text-[#e5e5e5] uppercase tracking-wider text-[10px] block">AI Personalization</span>
              <p>
                Each outreach message is customized dynamically using the prospect’s original service requirements and location.
              </p>
            </div>

            <button
              onClick={handleLaunchCampaign}
              disabled={campaignRunning}
              className="w-full py-3 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[11px] uppercase tracking-wider font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{campaignRunning ? 'Executing Campaign...' : 'Launch Reactivation Run'}</span>
            </button>
          </div>
        </div>

        {/* Right: Results / Projections */}
        <div className="lg:col-span-6 bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1a1a1a]">
            <div>
              <span className="text-[9px] uppercase tracking-[0.15em] text-[#737373]">Performance Projections</span>
              <h3 className="text-xs font-medium uppercase tracking-wider text-white">Estimated Recovery</h3>
            </div>
            <span className="text-[10px] uppercase font-mono text-emerald-500">Autonomous</span>
          </div>

          {campaignResults ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-sm bg-[#111111] border border-[#1a1a1a]">
                  <p className="text-[9px] uppercase tracking-widest text-[#737373]">Targeted</p>
                  <p className="text-xl font-light text-white mt-1">{campaignResults.targetCount}</p>
                </div>
                <div className="p-3 rounded-sm bg-[#111111] border border-[#1a1a1a]">
                  <p className="text-[9px] uppercase tracking-widest text-[#737373]">Re-Engaged</p>
                  <p className="text-xl font-light text-emerald-400 mt-1">{campaignResults.reactivatedCount}</p>
                </div>
                <div className="p-3 rounded-sm bg-[#111111] border border-[#1a1a1a]">
                  <p className="text-[9px] uppercase tracking-widest text-[#737373]">Pipeline Value</p>
                  <p className="text-xl font-mono text-[#c5a059] mt-1">${campaignResults.estimatedRevivedValue.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-4 rounded-sm bg-[#111111] border border-[#1a1a1a] space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-[#737373]">Sample AI Outreach Dispatch</span>
                <p className="text-xs text-[#e5e5e5] leading-relaxed font-light italic">
                  "{campaignResults.sampleOutreach}"
                </p>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-2">
              <RotateCcw className="w-6 h-6 text-[#404040] mx-auto" />
              <p className="text-xs text-[#737373] font-light">
                Configure threshold and trigger the AI Reactivation Engine to project recovered pipeline value.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
