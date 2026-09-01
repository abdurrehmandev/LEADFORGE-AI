import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../services/api';
import { Lead, Conversation, LeadStatus, LeadTemperature, Appointment } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { TemperatureBadge, StatusPill, ScoreMeter, SourceBadge } from '../common/StatusPills';
import {
  X,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  User,
  Send,
  RefreshCw,
  FileText,
  DollarSign,
  Tag,
  ShieldAlert,
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';

export const LeadDetailDrawer: React.FC<{
  lead: Lead | null;
  onClose: () => void;
  onLeadUpdated: (lead: Lead) => void;
}> = ({ lead, onClose, onLeadUpdated }) => {
  const { currentWorkspace } = useWorkspace();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'chat' | 'appointments'>('overview');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [reQualifying, setReQualifying] = useState(false);
  const [draftingAI, setDraftingAI] = useState(false);

  // Appointment form state
  const [bookingTime, setBookingTime] = useState('');
  const [assignedSpecialist, setAssignedSpecialist] = useState(
    currentWorkspace.members[2]?.name || currentWorkspace.members[0]?.name || 'Specialist'
  );
  const [bookingLoading, setBookingLoading] = useState(false);

  const loadConversation = async () => {
    if (!lead) return;
    try {
      const conv = await api.getConversation(currentWorkspace.id, lead.id);
      setConversation(conv || null);
    } catch (e) {
      console.warn('Failed to load conversation:', e);
    }
  };

  useEffect(() => {
    if (lead) {
      loadConversation();
    }
  }, [lead?.id]);

  if (!lead) return null;

  const handleStatusChange = async (newStatus: LeadStatus) => {
    try {
      const updated = await api.updateLead(currentWorkspace.id, lead.id, { status: newStatus });
      onLeadUpdated(updated);
      showToast({ type: 'success', title: 'Status Updated', message: `Lead marked as ${newStatus}` });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Update failed', message: e.message });
    }
  };

  const handleReQualify = async () => {
    try {
      setReQualifying(true);
      const res = await api.qualifyLead(currentWorkspace.id, lead.id);
      onLeadUpdated(res.lead);
      showToast({
        type: 'success',
        title: 'AI Re-Qualification Complete',
        message: `Score updated to ${res.lead.score}/100 (${res.lead.temperature})`
      });
    } catch (e: any) {
      showToast({ type: 'error', title: 'AI Qualification error', message: e.message });
    } finally {
      setReQualifying(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setSendingMessage(true);
      const res = await api.sendMessage(currentWorkspace.id, lead.id, replyText, 'agent', 'LeadForge Specialist');
      setConversation(res.conversation);
      onLeadUpdated(res.lead);
      setReplyText('');
      showToast({ type: 'success', title: 'Message Sent', message: 'Delivered to prospect channel.' });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Send failed', message: e.message });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDraftAIFollowUp = async () => {
    try {
      setDraftingAI(true);
      const draft = await api.draftFollowUp(currentWorkspace.id, lead.id, 1);
      setReplyText(draft.message);
      setActiveTab('chat');
      showToast({
        type: 'info',
        title: 'AI Draft Prepared',
        message: 'Personalized outreach message generated for your review.'
      });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Draft failed', message: e.message });
    } finally {
      setDraftingAI(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingTime) {
      showToast({ type: 'warning', title: 'Select a time', message: 'Please pick a consultation date & time.' });
      return;
    }

    try {
      setBookingLoading(true);
      const startTime = new Date(bookingTime).toISOString();
      const endTime = new Date(new Date(bookingTime).getTime() + 45 * 60000).toISOString();

      await api.createAppointment(currentWorkspace.id, {
        leadId: lead.id,
        leadName: lead.name,
        leadEmail: lead.email,
        leadPhone: lead.phone,
        service: lead.service || currentWorkspace.aiConfig.services[0]?.name,
        startTime,
        endTime,
        assignedAgentName: assignedSpecialist,
        status: 'CONFIRMED',
        locationType: 'video',
        locationDetails: 'https://meet.google.com/lfg-lead-eval',
      });

      const updatedLead = await api.getLeads(currentWorkspace.id);
      const found = updatedLead.find((l) => l.id === lead.id);
      if (found) onLeadUpdated(found);

      showToast({
        type: 'success',
        title: 'Appointment Confirmed',
        message: `Scheduled with ${assignedSpecialist} for ${new Date(startTime).toLocaleString()}`
      });
      setActiveTab('appointments');
    } catch (e: any) {
      showToast({ type: 'error', title: 'Booking error', message: e.message });
    } finally {
      setBookingLoading(false);
    }
  };

  const analysis = lead.aiAnalysis;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-2xl bg-[#0a0a0a] border-l border-[#1a1a1a] shadow-2xl flex flex-col">
          {/* Top Bar */}
          <div className="p-5 border-b border-[#1a1a1a] bg-[#080808] flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-light text-white tracking-wide truncate">{lead.name}</h2>
                <TemperatureBadge temperature={lead.temperature} score={lead.score} size="md" />
                <SourceBadge source={lead.source} />
              </div>

              <div className="mt-2 flex items-center gap-4 text-xs text-[#737373] flex-wrap font-light">
                {lead.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#737373]" />
                    {lead.phone}
                  </span>
                )}
                {lead.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#737373]" />
                    {lead.email}
                  </span>
                )}
                {lead.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#737373]" />
                    {lead.location}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReQualify}
                disabled={reQualifying}
                title="Run real-time qualification check"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#111111] hover:bg-[#171717] text-[#c5a059] border border-[#262626] text-[11px] uppercase tracking-wider transition disabled:opacity-50 font-medium"
              >
                <Sparkles className={`w-3.5 h-3.5 ${reQualifying ? 'animate-spin' : ''}`} />
                <span>{reQualifying ? 'Evaluating...' : 'Re-Qualify'}</span>
              </button>
              <button onClick={onClose} className="p-1.5 rounded-sm text-[#737373] hover:text-white hover:bg-[#111111]">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Status & Action Strip */}
          <div className="px-5 py-3 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-[#737373]">Stage:</span>
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                className="bg-[#111111] border border-[#262626] rounded-sm px-2.5 py-1 text-[#e5e5e5] text-xs focus:outline-none focus:border-[#c5a059] uppercase tracking-wider text-[11px]"
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="APPOINTMENT_BOOKED">Appointment Booked</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="WON">Closed Won</option>
                <option value="LOST">Lost</option>
                <option value="REACTIVATION">Reactivation</option>
                <option value="UNQUALIFIED">Unqualified</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDraftAIFollowUp}
                disabled={draftingAI}
                className="px-3 py-1 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[11px] uppercase tracking-wider font-semibold transition flex items-center gap-1 shadow-sm"
              >
                <Sparkles className="w-3 h-3" />
                <span>{draftingAI ? 'Drafting...' : 'AI Follow-up Draft'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#1a1a1a] bg-[#080808] px-5 text-xs">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'ai', label: `AI Signals (${lead.score})` },
              { id: 'chat', label: `Transcript (${conversation?.messages.length || 0})` },
              { id: 'appointments', label: 'Consultations' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-[10px] uppercase tracking-widest transition ${
                  activeTab === tab.id
                    ? 'border-b border-[#c5a059] text-[#c5a059] font-medium'
                    : 'text-[#737373] hover:text-[#e5e5e5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Score & Summary Card */}
                <div className="p-4 rounded-sm bg-[#111111] border border-[#1a1a1a] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-[#737373]">Lead Scoring Index</span>
                    <ScoreMeter score={lead.score} />
                  </div>
                  {analysis?.reasoning && (
                    <p className="text-xs text-[#e5e5e5] leading-relaxed bg-[#0a0a0a] p-3 rounded-sm border border-[#1a1a1a] font-light">
                      <span className="text-[#c5a059] uppercase tracking-wider text-[10px] block mb-1">AI Note</span>
                      {analysis.reasoning}
                    </p>
                  )}
                </div>

                {/* Requirement & Opportunity Metrics */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-sm bg-[#111111] border border-[#1a1a1a]">
                    <div className="text-[10px] uppercase tracking-wider text-[#737373] flex items-center gap-1 mb-1">
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                      Estimated Budget
                    </div>
                    <div className="text-sm font-mono text-emerald-400">{lead.budget || 'Custom / Flexible'}</div>
                  </div>

                  <div className="p-3.5 rounded-sm bg-[#111111] border border-[#1a1a1a]">
                    <div className="text-[10px] uppercase tracking-wider text-[#737373] flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Decision Urgency
                    </div>
                    <div className="text-sm text-[#c5a059] capitalize font-light">{lead.urgency || '1-2 weeks'}</div>
                  </div>

                  <div className="p-3.5 rounded-sm bg-[#111111] border border-[#1a1a1a]">
                    <div className="text-[10px] uppercase tracking-wider text-[#737373] flex items-center gap-1 mb-1">
                      <FileText className="w-3 h-3 text-[#c5a059]" />
                      Service Scope
                    </div>
                    <div className="text-sm text-white font-light">{lead.service || 'Consultation'}</div>
                  </div>

                  <div className="p-3.5 rounded-sm bg-[#111111] border border-[#1a1a1a]">
                    <div className="text-[10px] uppercase tracking-wider text-[#737373] flex items-center gap-1 mb-1">
                      <User className="w-3 h-3 text-[#737373]" />
                      Assigned Member
                    </div>
                    <div className="text-sm text-white font-light">{lead.assignedAgentName || 'Unassigned'}</div>
                  </div>
                </div>

                {/* Specific Requirements JSON / Keys */}
                {lead.requirements && Object.keys(lead.requirements).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase tracking-widest text-[#737373]">Extracted Signals</h4>
                    <div className="p-3.5 rounded-sm bg-[#111111] border border-[#1a1a1a] space-y-1.5 text-xs">
                      {Object.entries(lead.requirements).map(([k, v]) => (
                        <div key={k} className="flex items-start justify-between gap-4 py-1 border-b border-[#1a1a1a] last:border-0">
                          <span className="text-[#737373] capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="text-white font-light text-right">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase tracking-widest text-[#737373]">Tags & Segments</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.tags.map((t) => (
                      <span key={t} className="text-xs px-2.5 py-1 rounded-sm bg-[#111111] text-[#e5e5e5] border border-[#1a1a1a] flex items-center gap-1">
                        <Tag className="w-3 h-3 text-[#c5a059]" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. AI QUALIFICATION TAB */}
            {activeTab === 'ai' && (
              <div className="space-y-5">
                {/* Score Breakdown Card */}
                <div className="p-4 rounded-sm bg-[#111111] border border-[#1a1a1a] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#737373]">Scoring Matrix</span>
                      <h4 className="text-xs font-medium uppercase tracking-wider text-white">Qualification Diagnostic</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-mono text-[#c5a059]">{lead.score}/100</div>
                      <TemperatureBadge temperature={lead.temperature} size="sm" />
                    </div>
                  </div>

                  {analysis?.scoreBreakdown && (
                    <div className="space-y-2 pt-2 border-t border-[#1a1a1a] text-xs">
                      {Object.entries(analysis.scoreBreakdown).map(([criterion, points]) => (
                        <div key={criterion} className="flex items-center justify-between">
                          <span className="text-[#737373] capitalize font-light">{criterion.replace(/_/g, ' ')}</span>
                          <span className="font-mono text-emerald-400">+{points} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommended Next Best Action */}
                {analysis?.recommendedAction && (
                  <div className="p-4 rounded-sm bg-[#111111] border border-[#1a1a1a] space-y-2">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-emerald-400">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Recommended Next Action
                    </div>
                    <p className="text-xs text-[#e5e5e5] leading-relaxed font-light">{analysis.recommendedAction}</p>
                  </div>
                )}

                {/* Missing Fields Checklist */}
                {analysis?.missingFields && analysis.missingFields.length > 0 && (
                  <div className="p-4 rounded-sm bg-amber-950/20 border border-amber-900/40 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Missing Discovery Criteria
                    </div>
                    <ul className="space-y-1">
                      {analysis.missingFields.map((field, idx) => (
                        <li key={idx} className="text-xs text-amber-200/80 flex items-center gap-1.5 font-light">
                          <span className="w-1 h-1 bg-amber-400" />
                          <span>{field}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Defensive Shield */}
                <div className="p-3.5 rounded-sm bg-[#111111] border border-[#1a1a1a] text-[11px] text-[#737373] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-emerald-500" />
                    <span>Prompt sanitization & intent guardrails active</span>
                  </div>
                  <span className="text-emerald-500 font-mono text-[10px]">SECURE</span>
                </div>
              </div>
            )}

            {/* 3. LIVE CHAT & TRANSCRIPT TAB */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-[480px]">
                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-[#050505] rounded-sm border border-[#1a1a1a]">
                  {!conversation || conversation.messages.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[#737373]">
                      No message history recorded yet for this prospect.
                    </div>
                  ) : (
                    conversation.messages.map((msg) => {
                      const isLead = msg.sender === 'lead';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isLead ? 'items-start' : 'items-end'}`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#737373] mb-1 px-1">
                            <span>{isLead ? lead.name : msg.senderName || 'Specialist'}</span>
                            <span>•</span>
                            <span className="font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div
                            className={`max-w-[85%] p-3 rounded-sm text-xs leading-relaxed ${
                              isLead
                                ? 'bg-[#111111] text-[#e5e5e5] border border-[#1a1a1a]'
                                : 'bg-[#171717] text-white border border-[#262626]'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Reply Input Form */}
                <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type an outbound message or load AI draft..."
                    className="flex-1 bg-[#111111] border border-[#1a1a1a] rounded-sm px-3.5 py-2 text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-[#c5a059]"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !replyText.trim()}
                    className="px-4 py-2 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[11px] uppercase tracking-wider font-semibold transition disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            )}

            {/* 4. APPOINTMENTS TAB */}
            {activeTab === 'appointments' && (
              <div className="space-y-6">
                {/* Schedule Booking Form */}
                <form onSubmit={handleBookAppointment} className="p-4 rounded-sm bg-[#111111] border border-[#1a1a1a] space-y-4">
                  <h4 className="text-[10px] uppercase tracking-widest text-[#737373] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#c5a059]" />
                    Book Consultation
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[#737373] text-[10px] uppercase tracking-wider mb-1">Date & Time</label>
                      <input
                        type="datetime-local"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm px-3 py-2 text-[#e5e5e5] text-xs focus:outline-none focus:border-[#c5a059]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#737373] text-[10px] uppercase tracking-wider mb-1">Assigned Specialist</label>
                      <select
                        value={assignedSpecialist}
                        onChange={(e) => setAssignedSpecialist(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm px-3 py-2 text-[#e5e5e5] text-xs focus:outline-none focus:border-[#c5a059]"
                      >
                        {currentWorkspace.members.map((m) => (
                          <option key={m.userId} value={m.name}>
                            {m.name} ({m.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-2.5 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[11px] uppercase tracking-wider font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{bookingLoading ? 'Scheduling...' : 'Confirm Appointment'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
