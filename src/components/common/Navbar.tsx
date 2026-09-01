import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { NotificationDrawer } from './NotificationDrawer';
import {
  Pause,
  Play,
  RotateCcw,
  Bell,
  Shield,
  Sparkles,
  ChevronDown,
  Building2,
  Code2,
  Globe
} from 'lucide-react';
import { UserRole } from '../../types';

export const Navbar: React.FC<{ onOpenWidget: () => void }> = ({ onOpenWidget }) => {
  const {
    currentWorkspace,
    workspaces,
    switchWorkspace,
    userRole,
    setUserRole,
    activeView,
    setActiveView,
    automationsPaused,
    togglePauseAutomations,
    reseedDemoData,
    unreadNotifsCount,
    isDemoMode,
  } = useWorkspace();

  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const roles: UserRole[] = ['OWNER', 'ADMIN', 'AGENT', 'VIEWER'];

  return (
    <>
      <header className="sticky top-0 z-40 h-16 bg-[#0a0a0a] border-b border-[#1a1a1a] px-6 sm:px-8 flex items-center justify-between gap-4">
        {/* Left: Brand & Workspace Switcher */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-[#c5a059] to-[#8a6d3b] rounded-sm rotate-45 flex items-center justify-center shrink-0">
              <span className="-rotate-45 text-[10px] font-bold text-black">LF</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-light tracking-[0.2em] uppercase text-white font-sans">
                  LEADFORGE<span className="text-[#c5a059]">.AI</span>
                </span>
                {isDemoMode && (
                  <span className="text-[9px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded-sm bg-[#171717] text-[#c5a059] border border-[#262626]">
                    DEMO
                  </span>
                )}
              </div>
              <p className="text-[10px] uppercase tracking-widest text-[#737373] hidden sm:block">Intelligent Qualification CRM</p>
            </div>
          </button>

          <div className="h-5 w-px bg-[#1a1a1a] hidden md:block" />

          {/* Workspace Switcher */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] text-xs font-normal text-[#e5e5e5] transition"
            >
              <Building2 className="w-3.5 h-3.5 text-[#c5a059]" />
              <span className="max-w-[160px] truncate">{currentWorkspace.name}</span>
              <ChevronDown className="w-3 h-3 text-[#737373]" />
            </button>

            {showWorkspaceDropdown && (
              <div className="absolute left-0 mt-2 w-64 rounded-sm bg-[#0a0a0a] border border-[#1a1a1a] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] uppercase tracking-widest text-[#737373] px-2.5 py-1">
                  Workspaces
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setShowWorkspaceDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-sm text-xs flex items-center justify-between transition ${
                      ws.id === currentWorkspace.id
                        ? 'bg-[#171717] text-[#c5a059] font-medium border-l-2 border-[#c5a059]'
                        : 'text-[#e5e5e5] hover:bg-[#111111]'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {ws.isDemo && <span className="text-[10px] text-emerald-500 font-mono">Demo</span>}
                  </button>
                ))}
                <div className="border-t border-[#1a1a1a] my-1 pt-1">
                  <button
                    onClick={() => {
                      setActiveView('onboarding');
                      setShowWorkspaceDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-sm text-xs text-[#c5a059] hover:bg-[#111111] flex items-center gap-1.5 transition uppercase tracking-wider text-[11px]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    + New Industry Workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions: Emergency Pause, Role Switcher, Reseed, Notifications, Widget */}
        <div className="flex items-center gap-2.5">
          {/* Emergency Pause Automations Button */}
          <button
            onClick={togglePauseAutomations}
            title={automationsPaused ? 'Resume AI and automated lead workflows' : 'Emergency pause automated workflows'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-wider font-medium border transition ${
              automationsPaused
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
                : 'bg-[#111111] text-[#737373] border-[#1a1a1a] hover:text-[#e5e5e5] hover:border-[#262626]'
            }`}
          >
            {automationsPaused ? (
              <>
                <Play className="w-3 h-3 text-rose-400 fill-rose-400" />
                <span className="hidden sm:inline">RESUME ENGINE</span>
                <span className="sm:hidden">RESUME</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">PAUSE ENGINE</span>
                <span className="sm:hidden">PAUSE</span>
              </>
            )}
          </button>

          {/* Reseed Demo Button */}
          {isDemoMode && (
            <button
              onClick={reseedDemoData}
              title="Reset and reload 50+ fresh demo leads and appointments"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#111111] border border-[#1a1a1a] text-[#737373] hover:text-[#e5e5e5] hover:border-[#262626] text-[11px] uppercase tracking-wider transition"
            >
              <RotateCcw className="w-3 h-3 text-[#737373]" />
              <span>Reseed</span>
            </button>
          )}

          {/* RBAC Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] text-[11px] uppercase tracking-wider text-[#e5e5e5] transition"
              title="Switch user role"
            >
              <Shield className="w-3 h-3 text-[#c5a059]" />
              <span className="font-mono text-[#c5a059]">{userRole}</span>
              <ChevronDown className="w-3 h-3 text-[#737373]" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-sm bg-[#0a0a0a] border border-[#1a1a1a] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] uppercase tracking-widest text-[#737373] px-2 py-1">
                  Access Level
                </div>
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setUserRole(r);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-sm text-xs flex items-center justify-between transition ${
                      r === userRole ? 'bg-[#171717] text-[#c5a059] font-medium' : 'text-[#e5e5e5] hover:bg-[#111111]'
                    }`}
                  >
                    <span className="uppercase tracking-wider">{r}</span>
                    <span className="text-[10px] text-[#737373]">
                      {r === 'OWNER' ? 'Full' : r === 'ADMIN' ? 'Ops' : r === 'AGENT' ? 'Leads' : 'View'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Test Live Widget Button (Gold Primary Button) */}
          <button
            onClick={onOpenWidget}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[11px] uppercase tracking-wider font-semibold shadow-sm transition"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Test Widget</span>
            <span className="sm:hidden">Widget</span>
          </button>

          {/* Public Landing Toggle */}
          <button
            onClick={() => setActiveView(activeView === 'landing' ? 'dashboard' : 'landing')}
            className={`p-2 rounded-sm border text-xs transition ${
              activeView === 'landing'
                ? 'bg-[#171717] text-[#c5a059] border-[#c5a059]'
                : 'bg-[#111111] text-[#737373] border-[#1a1a1a] hover:text-[#e5e5e5] hover:border-[#262626]'
            }`}
            title="Toggle Public SaaS Presentation"
          >
            <Globe className="w-3.5 h-3.5" />
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-2 rounded-sm bg-[#111111] border border-[#1a1a1a] text-[#737373] hover:text-[#e5e5e5] hover:border-[#262626] transition"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#c5a059] text-black rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-[#0a0a0a]">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Notification Drawer */}
      <NotificationDrawer isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
};
