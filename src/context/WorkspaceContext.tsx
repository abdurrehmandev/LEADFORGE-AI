import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Workspace, UserRole, Lead, Notification } from '../types';
import { api } from '../services/api';
import { DEMO_WORKSPACE } from '../data/demoSeedData';
import { useNotification } from './NotificationContext';

export type AppView =
  | 'dashboard'
  | 'leads'
  | 'simulator'
  | 'workflows'
  | 'appointments'
  | 'reactivation'
  | 'analytics'
  | 'integrations'
  | 'settings'
  | 'onboarding'
  | 'landing';

interface WorkspaceContextType {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  userRole: UserRole;
  activeView: AppView;
  selectedLead: Lead | null;
  unreadNotifsCount: number;
  isLoading: boolean;
  isDemoMode: boolean;
  automationsPaused: boolean;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  setUserRole: (role: UserRole) => void;
  setActiveView: (view: AppView) => void;
  setSelectedLead: (lead: Lead | null) => void;
  togglePauseAutomations: () => Promise<void>;
  reseedDemoData: () => Promise<void>;
  createCustomWorkspace: (payload: Partial<Workspace>) => Promise<Workspace>;
  updateCurrentWorkspaceConfig: (updates: Partial<Workspace>) => Promise<void>;
  refreshWorkspaceData: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useNotification();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([DEMO_WORKSPACE]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(DEMO_WORKSPACE);
  const [userRole, setUserRole] = useState<UserRole>('OWNER');
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchWorkspacesList = useCallback(async () => {
    try {
      setIsLoading(true);
      const wsList = await api.getWorkspaces();
      if (wsList && wsList.length > 0) {
        setWorkspaces(wsList);
        const current = wsList.find((w) => w.id === currentWorkspace.id) || wsList[0];
        setCurrentWorkspace(current);
      }
    } catch (e) {
      console.warn('Could not fetch workspaces from server, using pre-seeded state:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace.id]);

  const refreshUnreadNotifications = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    try {
      const notifs = await api.getNotifications(currentWorkspace.id);
      const unread = notifs.filter((n) => !n.isRead).length;
      setUnreadNotifsCount(unread);
    } catch (e) {
      // benign
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    fetchWorkspacesList();
  }, []);

  useEffect(() => {
    refreshUnreadNotifications();
  }, [currentWorkspace?.id, refreshUnreadNotifications]);

  const switchWorkspace = async (workspaceId: string) => {
    try {
      setIsLoading(true);
      const ws = await api.getWorkspace(workspaceId);
      setCurrentWorkspace(ws);
      setSelectedLead(null);
      showToast({
        type: 'info',
        title: `Switched Workspace`,
        message: `Active workspace: ${ws.name}`
      });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Error switching workspace', message: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePauseAutomations = async () => {
    const nextState = !currentWorkspace.automationsPaused;
    try {
      const updated = await api.setPauseAutomations(currentWorkspace.id, nextState);
      setCurrentWorkspace(updated);
      showToast({
        type: nextState ? 'warning' : 'success',
        title: nextState ? '⚠️ Automations Paused' : '✅ Automations Resumed',
        message: nextState
          ? 'All automated triggers and AI outreach have been halted.'
          : 'Automation workflows are now actively processing leads.'
      });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Failed to toggle automations', message: e.message });
    }
  };

  const reseedDemoData = async () => {
    try {
      setIsLoading(true);
      await api.reseedWorkspace(currentWorkspace.id);
      await fetchWorkspacesList();
      showToast({
        type: 'success',
        title: 'Demo Data Reseeded',
        message: 'NorthStar Solar workspace refreshed with 50+ leads, conversations, and appointments.'
      });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Reseed failed', message: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const createCustomWorkspace = async (payload: Partial<Workspace>): Promise<Workspace> => {
    try {
      setIsLoading(true);
      const newWs = await api.createWorkspace(payload);
      setWorkspaces((prev) => [...prev, newWs]);
      setCurrentWorkspace(newWs);
      setActiveView('dashboard');
      showToast({
        type: 'success',
        title: 'Workspace Created!',
        message: `Welcome to ${newWs.name}. Your AI qualification rules are live.`
      });
      return newWs;
    } catch (e: any) {
      showToast({ type: 'error', title: 'Failed to create workspace', message: e.message });
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCurrentWorkspaceConfig = async (updates: Partial<Workspace>) => {
    try {
      const updated = await api.updateWorkspace(currentWorkspace.id, updates);
      setCurrentWorkspace(updated);
      showToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Workspace configuration and AI parameters updated.'
      });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Failed to save settings', message: e.message });
    }
  };

  const refreshWorkspaceData = async () => {
    await fetchWorkspacesList();
    await refreshUnreadNotifications();
  };

  const isDemoMode = currentWorkspace.isDemo || currentWorkspace.id === 'ws_northstar_solar_demo';

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        userRole,
        activeView,
        selectedLead,
        unreadNotifsCount,
        isLoading,
        isDemoMode,
        automationsPaused: !!currentWorkspace.automationsPaused,
        switchWorkspace,
        setUserRole,
        setActiveView,
        setSelectedLead,
        togglePauseAutomations,
        reseedDemoData,
        createCustomWorkspace,
        updateCurrentWorkspaceConfig,
        refreshWorkspaceData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
