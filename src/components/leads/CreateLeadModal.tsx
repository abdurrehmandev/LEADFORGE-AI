import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../services/api';
import { Lead } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { X, Sparkles, User, Mail, Phone, MapPin, DollarSign, MessageSquare } from 'lucide-react';

export const CreateLeadModal: React.FC<{ isOpen: boolean; onClose: () => void; onCreated: (lead: Lead) => void }> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { currentWorkspace } = useWorkspace();
  const { showToast } = useNotification();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('Manual');
  const [service, setService] = useState(currentWorkspace.aiConfig.services[0]?.name || 'Standard Consultation');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [urgency, setUrgency] = useState<'immediate' | '1-2 weeks' | '1 month+' | 'exploring'>('1-2 weeks');
  const [inquiry, setInquiry] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast({ type: 'warning', title: 'Name required', message: 'Please provide a contact name.' });
      return;
    }

    try {
      setLoading(true);
      const newLead = await api.createLead(currentWorkspace.id, {
        name,
        email: email || undefined,
        phone: phone || undefined,
        source,
        service,
        location: location || undefined,
        budget: budget || undefined,
        urgency,
        requirements: { inquiry },
      });

      showToast({
        type: 'success',
        title: 'Lead Created & AI Qualified',
        message: `${newLead.name} qualified with score ${newLead.score}/100 (${newLead.temperature})`
      });

      onCreated(newLead);
      onClose();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to create lead', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between bg-[#080808]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm bg-[#171717] border border-[#262626] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-[0.15em] text-[#737373]">Pipeline Ingestion</span>
              <h3 className="font-light text-base text-white">Create Lead Record</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-sm text-[#737373] hover:text-white hover:bg-[#111111]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm pl-9 pr-3 py-2 text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">Phone / WhatsApp</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 321-7890"
                  className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm pl-9 pr-3 py-2 text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@example.com"
                  className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm pl-9 pr-3 py-2 text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">Inbound Channel</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#c5a059] uppercase tracking-wider text-[11px]"
              >
                <option value="Website Widget" className="bg-[#0a0a0a]">Website Widget</option>
                <option value="WhatsApp" className="bg-[#0a0a0a]">WhatsApp</option>
                <option value="Meta Ads" className="bg-[#0a0a0a]">Meta Ads</option>
                <option value="Gmail" className="bg-[#0a0a0a]">Gmail</option>
                <option value="Referral" className="bg-[#0a0a0a]">Referral</option>
                <option value="Manual" className="bg-[#0a0a0a]">Manual Ingestion</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">Service Scope</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#c5a059]"
              >
                {currentWorkspace.aiConfig.services.map((s) => (
                  <option key={s.name} value={s.name} className="bg-[#0a0a0a]">
                    {s.name} ({s.priceRange})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">Estimated Budget</label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. $15,000 - $25,000"
                  className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm pl-9 pr-3 py-2 text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">Location / Territory</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. North Austin, TX"
                  className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm pl-9 pr-3 py-2 text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">Timeline / Urgency</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#c5a059] uppercase tracking-wider text-[11px]"
              >
                <option value="immediate" className="bg-[#0a0a0a]">Immediate (48 Hours)</option>
                <option value="1-2 weeks" className="bg-[#0a0a0a]">1-2 Weeks</option>
                <option value="1 month+" className="bg-[#0a0a0a]">1 Month+</option>
                <option value="exploring" className="bg-[#0a0a0a]">Just Exploring</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#737373] mb-1">Inquiry / Requirements</label>
            <div className="relative">
              <MessageSquare className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-2.5" />
              <textarea
                rows={3}
                value={inquiry}
                onChange={(e) => setInquiry(e.target.value)}
                placeholder="Paste customer notes, transcript, or project requirements..."
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm pl-9 pr-3 py-2 text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-[#c5a059]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#1a1a1a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#737373] hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[11px] uppercase tracking-wider font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? 'AI Scoring...' : 'Create & Qualify'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
