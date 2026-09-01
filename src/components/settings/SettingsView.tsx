import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Settings,
  Shield,
  Bot,
  Sliders,
  Users,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { currentWorkspace, updateCurrentWorkspaceConfig, reseedDemoData, isDemoMode } = useWorkspace();
  const { showToast } = useNotification();

  const [assistantName, setAssistantName] = useState(currentWorkspace.aiConfig.assistantName);
  const [tone, setTone] = useState(currentWorkspace.aiConfig.tone);
  const [industry, setIndustry] = useState(currentWorkspace.industry);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateCurrentWorkspaceConfig({
        industry,
        aiConfig: {
          ...currentWorkspace.aiConfig,
          assistantName,
          tone,
        }
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Save failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#050505]">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#737373] block mb-1">
            Governance & AI Configuration
          </span>
          <h1 className="text-3xl font-extralight text-white tracking-tight flex items-center gap-3">
            <span>Workspace Settings</span>
          </h1>
          <p className="text-xs text-[#737373] mt-1 font-light">
            Assistant persona, qualification thresholds, scoring criteria, and team access roles.
          </p>
        </div>
      </header>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: AI Assistant Persona */}
        <div className="lg:col-span-7 bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#1a1a1a]">
            <div className="w-7 h-7 rounded-sm bg-[#171717] border border-[#262626] flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-[#c5a059]" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-[0.15em] text-[#737373]">Persona & Prompting</span>
              <h3 className="text-xs font-medium uppercase tracking-wider text-white">AI Assistant Configuration</h3>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs font-light">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">
                Assistant Name
              </label>
              <input
                type="text"
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-[#e5e5e5] text-xs focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">
                Interaction Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-[#e5e5e5] text-xs focus:outline-none focus:border-[#c5a059] uppercase tracking-wider text-[11px]"
              >
                <option value="professional" className="bg-[#0a0a0a]">Professional & Consultative</option>
                <option value="warm" className="bg-[#0a0a0a]">Warm & Empathetic</option>
                <option value="urgent" className="bg-[#0a0a0a]">High-Urgency & Direct</option>
                <option value="authoritative" className="bg-[#0a0a0a]">Authoritative & Executive</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">
                Industry Domain
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-[#e5e5e5] text-xs focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="pt-3 border-t border-[#141414] flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[11px] uppercase tracking-wider font-semibold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Info: Team Members & Demo Tools */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-sm space-y-4">
            <span className="text-[9px] uppercase tracking-[0.15em] text-[#737373]">Team Governance</span>
            <h3 className="text-xs font-medium uppercase tracking-wider text-white">Active Members</h3>

            <div className="space-y-2">
              {currentWorkspace.members.map((m) => (
                <div key={m.userId} className="p-3 rounded-sm bg-[#111111] border border-[#1a1a1a] flex items-center justify-between text-xs font-light">
                  <div>
                    <div className="text-white">{m.name}</div>
                    <div className="text-[10px] text-[#737373]">{m.email}</div>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-sm bg-[#171717] text-[#c5a059] border border-[#262626]">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {isDemoMode && (
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-sm space-y-3">
              <span className="text-[9px] uppercase tracking-[0.15em] text-[#737373]">Sandbox Controls</span>
              <h3 className="text-xs font-medium uppercase tracking-wider text-white">Reset Demo Environment</h3>
              <p className="text-xs text-[#737373] font-light leading-relaxed">
                Reload fresh demo leads, booked appointments, and multi-channel conversations.
              </p>
              <button
                onClick={reseedDemoData}
                className="w-full py-2.5 rounded-sm bg-[#111111] hover:bg-[#171717] border border-[#262626] text-[#e5e5e5] text-[11px] uppercase tracking-wider font-medium transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#737373]" />
                <span>Reseed 50+ Leads</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
