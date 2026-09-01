import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useNotification } from '../../context/NotificationContext';
import { Sparkles, Building2, Bot, Check, ArrowRight, ArrowLeft } from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const { createCustomWorkspace, setActiveView } = useWorkspace();
  const { showToast } = useNotification();

  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('Solar & Renewable Energy');
  const [assistantName, setAssistantName] = useState('Nova');
  const [tone, setTone] = useState<'professional' | 'warm' | 'urgent' | 'authoritative'>('professional');
  const [primaryService, setPrimaryService] = useState('Residential Installation');
  const [minBudget, setMinBudget] = useState('$10,000');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!businessName.trim()) {
      showToast({ type: 'warning', title: 'Business Name Required', message: 'Please provide your company name.' });
      return;
    }

    try {
      setLoading(true);
      await createCustomWorkspace({
        name: businessName.trim(),
        industry,
        aiConfig: {
          assistantName,
          tone,
          systemPrompt: `You are ${assistantName}, the automated qualification assistant for ${businessName}.`,
          services: [{ name: primaryService, priceRange: `${minBudget}+`, description: 'Primary service offering' }],
          scoreWeights: { budgetMatch: 30, timelineUrgency: 25, locationMatch: 20, projectDetail: 25 },
          disqualificationRules: ['Budget below threshold', 'Outside service territory']
        }
      });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Onboarding error', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 bg-[#050505]">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#737373]">Industry Workspace Wizard</span>
        <h1 className="text-3xl font-extralight text-white tracking-tight">Deploy Custom AI Qualification Agent</h1>
        <p className="text-xs text-[#737373] font-light">Step {step} of 3 • Custom rules, scoring weights, and channels</p>
      </div>

      {/* Step Container */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-8 rounded-sm space-y-6">
        {step === 1 && (
          <div className="space-y-4 text-xs font-light">
            <h3 className="text-sm font-medium uppercase tracking-wider text-white">Company & Industry</h3>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">Company / Organization Name *</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Apex Solar Solutions"
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-[#e5e5e5] text-xs focus:outline-none focus:border-[#c5a059]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">Industry Vertical</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-[#e5e5e5] text-xs focus:outline-none focus:border-[#c5a059]"
              >
                <option value="Solar & Renewable Energy" className="bg-[#0a0a0a]">Solar & Renewable Energy</option>
                <option value="Commercial Real Estate" className="bg-[#0a0a0a]">Commercial Real Estate</option>
                <option value="Dental & Healthcare" className="bg-[#0a0a0a]">Dental & Healthcare</option>
                <option value="Legal & Advisory" className="bg-[#0a0a0a]">Legal & Advisory</option>
                <option value="Home Remodeling & Roofing" className="bg-[#0a0a0a]">Home Remodeling & Roofing</option>
                <option value="B2B SaaS & Tech" className="bg-[#0a0a0a]">B2B SaaS & Tech</option>
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-xs font-light">
            <h3 className="text-sm font-medium uppercase tracking-wider text-white">AI Concierge Persona</h3>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">Assistant Name</label>
              <input
                type="text"
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                placeholder="e.g. Nova, Atlas, Zara"
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-[#e5e5e5] text-xs focus:outline-none focus:border-[#c5a059]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">Conversation Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-[#e5e5e5] text-xs focus:outline-none focus:border-[#c5a059]"
              >
                <option value="professional" className="bg-[#0a0a0a]">Professional & Consultative</option>
                <option value="warm" className="bg-[#0a0a0a]">Warm & Empathetic</option>
                <option value="urgent" className="bg-[#0a0a0a]">High-Urgency & Direct</option>
                <option value="authoritative" className="bg-[#0a0a0a]">Authoritative & Executive</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-xs font-light">
            <h3 className="text-sm font-medium uppercase tracking-wider text-white">Qualification Scope</h3>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">Primary Offering / Service</label>
              <input
                type="text"
                value={primaryService}
                onChange={(e) => setPrimaryService(e.target.value)}
                placeholder="e.g. 10kW Solar Installation"
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-[#e5e5e5] text-xs focus:outline-none focus:border-[#c5a059]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">Minimum Budget Threshold</label>
              <input
                type="text"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                placeholder="e.g. $10,000"
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-[#e5e5e5] text-xs focus:outline-none focus:border-[#c5a059]"
              />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-[#141414]">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-sm text-xs text-[#737373] hover:text-white flex items-center gap-1.5 transition uppercase tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveView('dashboard')}
              className="px-4 py-2 rounded-sm text-xs text-[#737373] hover:text-white transition uppercase tracking-wider"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5 transition"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="px-6 py-2 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? 'Deploying...' : 'Launch Workspace'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
