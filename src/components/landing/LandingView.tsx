import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Sparkles, Bot, Shield, CheckCircle2, ArrowRight, Zap, Play } from 'lucide-react';

export const LandingView: React.FC = () => {
  const { setActiveView } = useWorkspace();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-16 bg-[#050505] text-[#e5e5e5]">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#111111] border border-[#262626] text-[11px] uppercase tracking-widest text-[#c5a059]">
          <Sparkles className="w-3 h-3 text-[#c5a059]" />
          <span>Next-Generation Inbound Qualification CRM</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extralight text-white tracking-tight leading-tight max-w-3xl mx-auto">
          Autonomous Lead Qualification & Direct Calendar Booking
        </h1>

        <p className="text-sm text-[#737373] max-w-2xl mx-auto font-light leading-relaxed">
          LeadForge AI engages website visitors, WhatsApp inquiries, and ad leads in real-time, extracts budget & urgency signals, and qualifies deals instantly.
        </p>

        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => setActiveView('dashboard')}
            className="px-6 py-3 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black text-xs uppercase tracking-wider font-semibold shadow-sm transition flex items-center gap-2"
          >
            <span>Open Executive Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveView('simulator')}
            className="px-6 py-3 rounded-sm bg-[#111111] hover:bg-[#171717] border border-[#262626] text-[#e5e5e5] text-xs uppercase tracking-wider font-medium transition flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Launch AI Simulator</span>
          </button>
        </div>
      </section>

      {/* 3 Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-sm bg-[#0a0a0a] border border-[#1a1a1a] space-y-3">
          <div className="w-8 h-8 rounded-sm bg-[#171717] border border-[#262626] flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#c5a059]" />
          </div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-white">Sub-2s Real-Time Response</h3>
          <p className="text-xs text-[#737373] leading-relaxed font-light">
            Instantly engages prospects across website widgets and WhatsApp channels with zero wait time.
          </p>
        </div>

        <div className="p-6 rounded-sm bg-[#0a0a0a] border border-[#1a1a1a] space-y-3">
          <div className="w-8 h-8 rounded-sm bg-[#171717] border border-[#262626] flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#c5a059]" />
          </div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-white">Multi-Lingual AI Intelligence</h3>
          <p className="text-xs text-[#737373] leading-relaxed font-light">
            Seamless conversational qualification in English, Roman Urdu, and industry-specific terminology.
          </p>
        </div>

        <div className="p-6 rounded-sm bg-[#0a0a0a] border border-[#1a1a1a] space-y-3">
          <div className="w-8 h-8 rounded-sm bg-[#171717] border border-[#262626] flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#c5a059]" />
          </div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-white">Prompt-Shield Guardrails</h3>
          <p className="text-xs text-[#737373] leading-relaxed font-light">
            Enterprise zero-shot guardrails protect against prompt injections and competitor comparisons.
          </p>
        </div>
      </section>
    </div>
  );
};
