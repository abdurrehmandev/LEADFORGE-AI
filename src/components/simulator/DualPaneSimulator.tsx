import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../services/api';
import { AIAnalysis } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { TemperatureBadge, ScoreMeter } from '../common/StatusPills';
import {
  Bot,
  Send,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Globe2,
  Calendar,
  UserPlus
} from 'lucide-react';

interface PresetPersona {
  id: string;
  name: string;
  category: string;
  initialPrompt: string;
  leadContext: {
    service: string;
    location: string;
    budget: string;
  };
}

const PRESET_PERSONAS: PresetPersona[] = [
  {
    id: 'solar_hot_en',
    name: 'High-Intent Prospect (English)',
    category: 'Solar',
    initialPrompt: 'Hi, I own a single-family house in Austin. My monthly electric bill is around $340. I want to install a 10kW system with battery storage before summer. What are the costs and tax incentives?',
    leadContext: { service: 'Residential Solar 10kW', location: 'Austin, TX', budget: '$25,000' }
  },
  {
    id: 'solar_urdu',
    name: 'Solar Inquiry (Roman Urdu)',
    category: 'Solar',
    initialPrompt: 'Salam, mujhe apne 1 Kanal ghar ke liye 12kW on-grid solar system lagwana hai. Monthly bill approx 65,000 PKR ata hai. Kya net metering aur installment plans available hain?',
    leadContext: { service: '12kW On-Grid System', location: 'Lahore, Pakistan', budget: 'PKR 1.8M' }
  },
  {
    id: 'real_estate_buyer',
    name: 'Commercial Real Estate Investor',
    category: 'Real Estate',
    initialPrompt: 'Looking for a multi-tenant retail plaza or flex warehouse in Dallas. Budget is $2.5M to $4M, pre-approved with 1031 exchange closing in 45 days.',
    leadContext: { service: 'Commercial Acquisition', location: 'Dallas, TX', budget: '$3,500,000' }
  },
  {
    id: 'dental_implant',
    name: 'Dental Implant Patient',
    category: 'Dental',
    initialPrompt: 'Hello, I have been missing 3 molars on my lower jaw and want permanent dental implants. Do you offer sedation and weekend consultations?',
    leadContext: { service: 'All-on-4 Implants', location: 'Local Clinic', budget: '$6,000' }
  },
  {
    id: 'skeptic_shopper',
    name: 'Price Comparison Shopper',
    category: 'Solar',
    initialPrompt: 'Just looking for quotes. Other company offered $1.80 per watt. Can you beat that or are you more expensive?',
    leadContext: { service: 'Solar Quote', location: 'Phoenix, AZ', budget: 'Under $15,000' }
  }
];

export const DualPaneSimulator: React.FC = () => {
  const { currentWorkspace, setSelectedLead, setActiveView } = useWorkspace();
  const { showToast } = useNotification();

  const [messages, setMessages] = useState<{ sender: 'lead' | 'assistant'; content: string }[]>([
    {
      sender: 'assistant',
      content: `Welcome to ${currentWorkspace.name}. I am your automated qualification concierge. How may I assist you with your project today?`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePersona, setActivePersona] = useState<PresetPersona>(PRESET_PERSONAS[0]);

  // Live Diagnostic State
  const [liveAnalysis, setLiveAnalysis] = useState<AIAnalysis>({
    score: 25,
    temperature: 'COLD',
    qualification: 'exploring',
    urgency: 'exploring',
    requirements: {},
    scoreBreakdown: { baseline_intent: 25 },
    reasoning: 'Initial session opened. Collecting qualification requirements.',
    recommendedAction: 'Inquire regarding service scope, property parameters, and investment timeline.',
    missingFields: ['Budget / Value', 'Decision Timeline', 'Property / Project scope']
  });
  const [shouldOfferAppointment, setShouldOfferAppointment] = useState(false);
  const [extractedSignals, setExtractedSignals] = useState<Record<string, string>>({});

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputText;
    if (!message.trim()) return;

    const newMessages = [...messages, { sender: 'lead' as const, content: message }];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.chatSimulator(
        currentWorkspace.id,
        newMessages,
        message,
        activePersona.leadContext
      );

      setMessages((prev) => [...prev, { sender: 'assistant', content: response.reply }]);
      if (response.liveAnalysis) {
        setLiveAnalysis(response.liveAnalysis);
      }
      setShouldOfferAppointment(response.shouldOfferAppointment);
      if (response.extractedSignals) {
        setExtractedSignals(response.extractedSignals);
      }

      if (response.liveAnalysis.score >= 70 && !shouldOfferAppointment) {
        showToast({
          type: 'hot',
          title: 'Lead Reached HOT Status',
          message: `AI score updated to ${response.liveAnalysis.score}/100. Appointment availability unlocked.`
        });
      }
    } catch (e: any) {
      showToast({ type: 'error', title: 'Simulator Error', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        sender: 'assistant',
        content: `Welcome to ${currentWorkspace.name}. I am your automated qualification concierge. How may I assist you with your project today?`
      }
    ]);
    setLiveAnalysis({
      score: 25,
      temperature: 'COLD',
      qualification: 'exploring',
      urgency: 'exploring',
      requirements: {},
      scoreBreakdown: { baseline_intent: 25 },
      reasoning: 'Initial session opened. Collecting qualification requirements.',
      recommendedAction: 'Inquire regarding service scope, property parameters, and investment timeline.',
      missingFields: ['Budget / Value', 'Decision Timeline', 'Property scope']
    });
    setShouldOfferAppointment(false);
    setExtractedSignals({});
  };

  const handleSelectPersona = (p: PresetPersona) => {
    setActivePersona(p);
    handleReset();
    setTimeout(() => {
      handleSendMessage(p.initialPrompt);
    }, 100);
  };

  const handlePromoteToCRM = async () => {
    try {
      const newLead = await api.createLead(currentWorkspace.id, {
        name: activePersona.name.replace(/[^a-zA-Z\s]/g, '').trim() || 'Simulated Prospect',
        source: 'Website Widget',
        service: activePersona.leadContext.service,
        location: liveAnalysis.location || activePersona.leadContext.location,
        budget: liveAnalysis.budget || activePersona.leadContext.budget,
        urgency: liveAnalysis.urgency,
        requirements: { ...liveAnalysis.requirements, ...extractedSignals },
        score: liveAnalysis.score,
        temperature: liveAnalysis.temperature,
        status: liveAnalysis.score >= 70 ? 'QUALIFIED' : 'NEW',
      });

      showToast({
        type: 'success',
        title: 'Lead Ingested into CRM',
        message: `${newLead.name} saved to pipeline with score ${newLead.score}/100.`
      });

      setSelectedLead(newLead);
      setActiveView('leads');
    } catch (e: any) {
      showToast({ type: 'error', title: 'Promotion failed', message: e.message });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-[#050505]">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#737373] block mb-1">
            Real-Time Diagnostic Suite
          </span>
          <h1 className="text-3xl font-extralight text-white tracking-tight flex items-center gap-3">
            <span>AI Simulator & Diagnostics</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-[#111111] text-[#c5a059] border border-[#262626]">
              Live Engine
            </span>
          </h1>
          <p className="text-xs text-[#737373] mt-1 font-light">
            Stress-test conversation flows in English or Roman Urdu and inspect live scoring signals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm bg-[#111111] border border-[#262626] text-[#e5e5e5] hover:border-[#c5a059] text-[11px] uppercase tracking-wider transition font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#737373]" />
            <span>Reset</span>
          </button>
          <button
            onClick={handlePromoteToCRM}
            className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[11px] uppercase tracking-wider font-semibold shadow-sm transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Promote to CRM</span>
          </button>
        </div>
      </header>

      {/* Preset Persona Quick Selector */}
      <div className="p-4 rounded-sm bg-[#0a0a0a] border border-[#1a1a1a] space-y-2.5">
        <div className="text-[10px] uppercase tracking-widest text-[#737373] flex items-center gap-1.5">
          <Globe2 className="w-3.5 h-3.5 text-[#c5a059]" />
          <span>Preset Test Scenarios</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPersona(p)}
              className={`px-3 py-1.5 rounded-sm text-xs transition border ${
                activePersona.id === p.id
                  ? 'bg-[#171717] text-[#c5a059] border-[#c5a059]'
                  : 'bg-[#111111] text-[#737373] border-[#1a1a1a] hover:text-[#e5e5e5] hover:border-[#262626]'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Live Interactive Chat (7 Cols) */}
        <div className="lg:col-span-7 rounded-sm bg-[#0a0a0a] border border-[#1a1a1a] overflow-hidden flex flex-col h-[680px]">
          {/* Chat Pane Header */}
          <div className="p-4 border-b border-[#1a1a1a] bg-[#080808] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-sm bg-[#171717] border border-[#262626] flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-[#c5a059]" />
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-white">
                  {currentWorkspace.aiConfig.assistantName}
                </h3>
                <p className="text-[10px] text-[#737373] uppercase tracking-wider">
                  Tone: {currentWorkspace.aiConfig.tone} • Industry: {currentWorkspace.industry}
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-widest font-mono text-emerald-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live Simulation
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[#050505]">
            {messages.map((msg, index) => {
              const isLead = msg.sender === 'lead';
              return (
                <div key={index} className={`flex flex-col ${isLead ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#737373] mb-1 px-1">
                    <span>{isLead ? 'Simulated Prospect' : currentWorkspace.aiConfig.assistantName}</span>
                  </div>
                  <div
                    className={`max-w-[85%] p-3.5 rounded-sm text-xs leading-relaxed ${
                      isLead
                        ? 'bg-[#171717] text-white border border-[#262626]'
                        : 'bg-[#0a0a0a] text-[#e5e5e5] border border-[#1a1a1a]'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#737373] py-2 px-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-[#c5a059]" />
                <span className="font-light">Evaluating intent signals...</span>
              </div>
            )}
          </div>

          {/* Appointment Offer Callout */}
          {shouldOfferAppointment && (
            <div className="p-3 bg-amber-950/20 border-t border-[#c5a059]/40 flex items-center justify-between gap-2 text-xs text-[#c5a059]">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#c5a059]" />
                <span className="font-light">Lead qualified. Booking consultation recommendation available.</span>
              </div>
              <button
                onClick={handlePromoteToCRM}
                className="px-2.5 py-1 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black font-semibold text-[10px] uppercase tracking-wider transition"
              >
                Book Now
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-[#1a1a1a] bg-[#0a0a0a] flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type customer message in English or Roman Urdu..."
              className="flex-1 bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-[#c5a059]"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="px-4 py-2 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[11px] uppercase tracking-wider font-semibold transition disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* RIGHT PANE: Live Lead Intelligence Diagnostic (5 Cols) */}
        <div className="lg:col-span-5 rounded-sm bg-[#0a0a0a] border border-[#1a1a1a] p-5 space-y-5 h-[680px] overflow-y-auto">
          {/* Top Metric Strip */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1a1a1a]">
            <div>
              <span className="text-[9px] uppercase tracking-[0.15em] text-[#737373]">Live Telemetry</span>
              <h3 className="text-xs font-medium uppercase tracking-wider text-white">Qualification State</h3>
            </div>
            <TemperatureBadge temperature={liveAnalysis.temperature} score={liveAnalysis.score} size="md" />
          </div>

          {/* Lead Score Progress */}
          <div className="p-4 rounded-sm bg-[#111111] border border-[#1a1a1a] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="uppercase tracking-wider text-[10px] text-[#737373]">Intent Score</span>
              <span className="font-mono text-sm text-[#c5a059]">{liveAnalysis.score}/100</span>
            </div>
            <ScoreMeter score={liveAnalysis.score} />
            <p className="text-[11px] text-[#737373] leading-relaxed font-light">
              Evaluated autonomously against budget alignment, location, and purchase timeline.
            </p>
          </div>

          {/* Extracted Signals Card */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-[#737373] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Extracted Parameters</span>
            </div>
            <div className="p-3.5 rounded-sm bg-[#111111] border border-[#1a1a1a] space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                <span className="text-[#737373]">Budget / Value:</span>
                <span className="text-emerald-400 font-mono">
                  {liveAnalysis.budget || extractedSignals.budget || 'Inquiry pending'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                <span className="text-[#737373]">Location:</span>
                <span className="text-[#e5e5e5]">
                  {liveAnalysis.location || extractedSignals.location || 'Location pending'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                <span className="text-[#737373]">Decision Timeline:</span>
                <span className="text-[#c5a059] uppercase text-[11px]">{liveAnalysis.urgency || 'exploring'}</span>
              </div>
            </div>
          </div>

          {/* Missing Fields Checklist */}
          {liveAnalysis.missingFields && liveAnalysis.missingFields.length > 0 && (
            <div className="p-3.5 rounded-sm bg-amber-950/20 border border-amber-900/40 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                <span>Missing Discovery Signals</span>
              </div>
              <ul className="space-y-1">
                {liveAnalysis.missingFields.map((f, i) => (
                  <li key={i} className="text-xs text-amber-200/80 flex items-center gap-1.5 font-light">
                    <span className="w-1 h-1 bg-amber-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Recommended Next Action */}
          {liveAnalysis.recommendedAction && (
            <div className="p-3.5 rounded-sm bg-[#111111] border border-[#1a1a1a] space-y-1.5">
              <div className="text-[10px] uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>Next Prescriptive Action</span>
              </div>
              <p className="text-xs text-[#e5e5e5] leading-relaxed font-light">{liveAnalysis.recommendedAction}</p>
            </div>
          )}

          {/* Reasoning */}
          {liveAnalysis.reasoning && (
            <div className="text-[11px] text-[#737373] leading-relaxed p-3 rounded-sm bg-[#080808] border border-[#1a1a1a]">
              <span className="text-[#e5e5e5] uppercase tracking-wider text-[10px] block mb-1">Diagnostic Log</span>
              {liveAnalysis.reasoning}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
