import React from 'react';
import { useWorkspace, AppView } from '../../context/WorkspaceContext';
import {
  LayoutDashboard,
  Users,
  Bot,
  GitBranch,
  CalendarDays,
  Sparkles,
  BarChart3,
  Blocks,
  Settings,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, automationsPaused, currentWorkspace } = useWorkspace();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads CRM', icon: Users, badge: '50+' },
    { id: 'simulator', label: 'AI Simulator', icon: Bot, badge: 'LIVE', badgeColor: 'bg-[#171717] text-[#c5a059] border-[#c5a059]/40' },
    { id: 'workflows', label: 'Automations', icon: GitBranch },
    { id: 'appointments', label: 'Appointments', icon: CalendarDays },
    { id: 'reactivation', label: 'Reactivation', icon: Sparkles, badge: 'AI Engine', badgeColor: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'integrations', label: 'Integrations', icon: Blocks },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-60 bg-[#080808] border-r border-[#1a1a1a] flex flex-col justify-between shrink-0 select-none">
      <div className="p-5 space-y-6">
        {/* Workspace Quick Card */}
        <div className="p-3.5 rounded-sm bg-[#0a0a0a] border border-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-sm bg-[#171717] border border-[#262626] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-[#c5a059]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] uppercase tracking-widest text-[#737373]">Active Domain</p>
              <h3 className="text-xs font-light text-white truncate">{currentWorkspace.name}</h3>
            </div>
          </div>
          {automationsPaused && (
            <div className="mt-2.5 pt-2 border-t border-[#1a1a1a] flex items-center gap-1.5 text-[10px] text-rose-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              Automations Paused
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          <div className="text-[10px] uppercase tracking-[0.15em] text-[#404040] px-3 pb-2 font-mono">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-xs transition uppercase tracking-wider ${
                  isActive
                    ? 'bg-[#111111] text-[#c5a059] font-medium border-l-2 border-[#c5a059]'
                    : 'text-[#737373] hover:text-[#e5e5e5] hover:bg-[#111111]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#c5a059]' : 'text-[#737373]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-sm border font-mono ${
                      isActive
                        ? 'bg-[#171717] text-[#c5a059] border-[#c5a059]/40'
                        : item.badgeColor || 'bg-[#111111] text-[#737373] border-[#1a1a1a]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info / Onboarding Wizard */}
      <div className="p-5 border-t border-[#1a1a1a] space-y-3">
        <button
          onClick={() => setActiveView('onboarding')}
          className="w-full flex items-center justify-between p-3 rounded-sm bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#c5a059]/50 transition group text-left"
        >
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Setup Wizard
            </div>
            <p className="text-[10px] text-[#737373] mt-0.5">Custom Industry Profile</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#737373] group-hover:text-[#c5a059] group-hover:translate-x-0.5 transition" />
        </button>

        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-[#404040] px-1">
          <span>v1.0 SaaS</span>
          <span className="flex items-center gap-1.5 text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            System Live
          </span>
        </div>
      </div>
    </aside>
  );
};
