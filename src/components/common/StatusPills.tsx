import React from 'react';
import { LeadStatus, LeadTemperature } from '../../types';
import { Flame, Sun, Snowflake, CheckCircle2, Clock, Calendar, AlertCircle, Ban, Sparkles } from 'lucide-react';

export const TemperatureBadge: React.FC<{ temperature: LeadTemperature; score?: number; size?: 'sm' | 'md' | 'lg' }> = ({
  temperature,
  score,
  size = 'md',
}) => {
  const config = {
    HOT: {
      bg: 'bg-rose-950/40 text-rose-300 border-rose-800/40',
      icon: Flame,
      iconColor: 'text-rose-400',
      label: 'HOT',
    },
    WARM: {
      bg: 'bg-amber-950/40 text-[#c5a059] border-[#c5a059]/30',
      icon: Sun,
      iconColor: 'text-[#c5a059]',
      label: 'WARM',
    },
    COLD: {
      bg: 'bg-sky-950/30 text-sky-300 border-sky-800/40',
      icon: Snowflake,
      iconColor: 'text-sky-400',
      label: 'COLD',
    },
  }[temperature] || {
    bg: 'bg-[#111111] text-[#737373] border-[#1a1a1a]',
    icon: Snowflake,
    iconColor: 'text-[#737373]',
    label: temperature,
  };

  const IconComponent = config.icon;
  const sizeClasses = {
    sm: 'text-[10px] uppercase tracking-wider px-2 py-0.5 gap-1',
    md: 'text-[11px] uppercase tracking-wider px-2.5 py-0.5 gap-1.5 font-medium',
    lg: 'text-xs uppercase tracking-widest px-3 py-1 gap-2 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-sm border whitespace-nowrap ${config.bg} ${sizeClasses}`}
    >
      <IconComponent className="w-3 h-3 shrink-0" />
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="opacity-80 font-mono text-[10px]">({score})</span>
      )}
    </span>
  );
};

export const StatusPill: React.FC<{ status: LeadStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const config: Record<LeadStatus, { label: string; bg: string; text: string; border: string; icon: any }> = {
    NEW: { label: 'New', bg: 'bg-[#111111]', text: 'text-sky-400', border: 'border-sky-900/40', icon: Sparkles },
    CONTACTED: { label: 'Contacted', bg: 'bg-[#111111]', text: 'text-[#c5a059]', border: 'border-[#c5a059]/30', icon: Clock },
    QUALIFIED: { label: 'AI Qualified', bg: 'bg-emerald-950/30', text: 'text-emerald-400', border: 'border-emerald-800/40', icon: CheckCircle2 },
    UNQUALIFIED: { label: 'Unqualified', bg: 'bg-[#111111]', text: 'text-[#737373]', border: 'border-[#1a1a1a]', icon: Ban },
    APPOINTMENT_BOOKED: { label: 'Appointment', bg: 'bg-[#111111]', text: 'text-amber-300', border: 'border-amber-700/40', icon: Calendar },
    NEGOTIATION: { label: 'Negotiation', bg: 'bg-[#111111]', text: 'text-amber-400', border: 'border-amber-600/40', icon: AlertCircle },
    WON: { label: 'Closed Won', bg: 'bg-emerald-950/40', text: 'text-emerald-300 font-semibold', border: 'border-emerald-600/50', icon: CheckCircle2 },
    LOST: { label: 'Lost', bg: 'bg-rose-950/30', text: 'text-rose-400', border: 'border-rose-900/40', icon: Ban },
    REACTIVATION: { label: 'Reactivation', bg: 'bg-[#111111]', text: 'text-cyan-400', border: 'border-cyan-800/40', icon: Sparkles },
  };

  const item = config[status] || { label: status, bg: 'bg-[#111111]', text: 'text-[#737373]', border: 'border-[#1a1a1a]', icon: Sparkles };
  const Icon = item.icon;

  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-[11px] px-2.5 py-1 gap-1.5';

  return (
    <span className={`inline-flex items-center rounded-sm border ${item.bg} ${item.text} ${item.border} ${sizeClass} font-medium whitespace-nowrap uppercase tracking-wider`}>
      <Icon className="w-3 h-3 shrink-0" />
      <span>{item.label}</span>
    </span>
  );
};

export const ScoreMeter: React.FC<{ score: number; showNumber?: boolean; size?: 'sm' | 'md' }> = ({
  score,
  showNumber = true,
  size = 'md',
}) => {
  const getScoreColor = (s: number) => {
    if (s >= 70) return 'from-[#c5a059] to-rose-500 text-rose-400';
    if (s >= 40) return 'from-[#8a6d3b] to-[#c5a059] text-[#c5a059]';
    return 'from-[#262626] to-[#737373] text-[#737373]';
  };

  const height = size === 'sm' ? 'h-1 w-16' : 'h-1.5 w-20';

  return (
    <div className="flex items-center gap-2">
      <div className={`${height} bg-[#171717] rounded-sm overflow-hidden border border-[#262626]`}>
        <div
          className={`h-full rounded-sm bg-gradient-to-r ${getScoreColor(score)} transition-all duration-500`}
          style={{ width: `${Math.min(Math.max(score, 5), 100)}%` }}
        />
      </div>
      {showNumber && (
        <span className={`font-mono text-xs ${score >= 70 ? 'text-rose-400' : score >= 40 ? 'text-[#c5a059]' : 'text-[#737373]'}`}>
          {score}
        </span>
      )}
    </div>
  );
};

export const SourceBadge: React.FC<{ source: string }> = ({ source }) => {
  const sourceColors: Record<string, string> = {
    'Website Widget': 'bg-[#111111] text-cyan-400 border-cyan-900/30',
    'WhatsApp': 'bg-[#111111] text-emerald-400 border-emerald-900/30',
    'Meta Ads': 'bg-[#111111] text-blue-400 border-blue-900/30',
    'Gmail': 'bg-[#111111] text-red-400 border-red-900/30',
    'Referral': 'bg-[#111111] text-[#c5a059] border-[#c5a059]/30',
    'Webhook': 'bg-[#111111] text-purple-400 border-purple-900/30',
    'Manual': 'bg-[#111111] text-[#737373] border-[#1a1a1a]',
  };

  const style = sourceColors[source] || 'bg-[#111111] text-[#737373] border-[#1a1a1a]';

  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${style} whitespace-nowrap font-mono`}>
      {source}
    </span>
  );
};
