import React, { useState } from 'react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { LeadsView } from './components/leads/LeadsView';
import { DualPaneSimulator } from './components/simulator/DualPaneSimulator';
import { WorkflowsView } from './components/workflows/WorkflowsView';
import { AppointmentsView } from './components/appointments/AppointmentsView';
import { ReactivationView } from './components/reactivation/ReactivationView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { IntegrationsView } from './components/integrations/IntegrationsView';
import { SettingsView } from './components/settings/SettingsView';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { LandingView } from './components/landing/LandingView';
import { CreateLeadModal } from './components/leads/CreateLeadModal';
import { LiveChatWidgetModal } from './components/widget/LiveChatWidgetModal';

const AppContent: React.FC = () => {
  const { activeView, setSelectedLead } = useWorkspace();
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [showWidget, setShowWidget] = useState(false);

  return (
    <div className="flex flex-col h-screen w-full bg-[#050505] text-[#e5e5e5] font-sans antialiased overflow-hidden selection:bg-[#c5a059] selection:text-black">
      {/* Top Navbar */}
      <Navbar onOpenWidget={() => setShowWidget(true)} />

      {/* Body: Sidebar + Main Content View */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Persistent Left Sidebar */}
        <Sidebar />

        {/* Dynamic Main View Area */}
        <main className="flex-1 overflow-y-auto bg-[#050505]">
          {activeView === 'dashboard' && (
            <DashboardView onOpenCreateLead={() => setShowCreateLead(true)} />
          )}
          {activeView === 'leads' && <LeadsView />}
          {activeView === 'simulator' && <DualPaneSimulator />}
          {activeView === 'workflows' && <WorkflowsView />}
          {activeView === 'appointments' && <AppointmentsView />}
          {activeView === 'reactivation' && <ReactivationView />}
          {activeView === 'analytics' && <AnalyticsView />}
          {activeView === 'integrations' && <IntegrationsView />}
          {activeView === 'settings' && <SettingsView />}
          {activeView === 'onboarding' && <OnboardingWizard />}
          {activeView === 'landing' && <LandingView />}
        </main>
      </div>

      {/* Global Modals */}
      <CreateLeadModal
        isOpen={showCreateLead}
        onClose={() => setShowCreateLead(false)}
        onCreated={(lead) => {
          setSelectedLead(lead);
        }}
      />

      <LiveChatWidgetModal
        isOpen={showWidget}
        onClose={() => setShowWidget(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <NotificationProvider>
      <WorkspaceProvider>
        <AppContent />
      </WorkspaceProvider>
    </NotificationProvider>
  );
}
