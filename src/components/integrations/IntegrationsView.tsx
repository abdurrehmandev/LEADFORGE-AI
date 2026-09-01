import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../services/api';
import { IntegrationConfig } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import {
  Blocks,
  CheckCircle2,
  ExternalLink,
  Key,
  Webhook,
  MessageSquare,
  Mail,
  Calendar,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export const IntegrationsView: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const { showToast } = useNotification();
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!currentWorkspace?.id) return;
    try {
      setLoading(true);
      const data = await api.getIntegrations(currentWorkspace.id);
      setIntegrations(data);
    } catch (e) {
      console.warn('Failed to load integrations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentWorkspace?.id]);

  const handleToggle = async (integ: IntegrationConfig) => {
    const isConnected = integ.status === 'CONNECTED' || integ.status === 'MOCK_ACTIVE';
    const nextStatus = isConnected ? 'NOT_CONFIGURED' : 'CONNECTED';
    try {
      const updated = await api.updateIntegration(currentWorkspace.id, integ.id, {
        status: nextStatus,
      });
      setIntegrations((prev) => prev.map((i) => (i.id === integ.id ? updated : i)));
      showToast({
        type: 'success',
        title: 'Integration Updated',
        message: `${integ.name} is now ${nextStatus === 'CONNECTED' ? 'connected' : 'disconnected'}.`
      });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Update failed', message: e.message });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#050505]">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#737373] block mb-1">
            Omni-Channel Connectors
          </span>
          <h1 className="text-3xl font-extralight text-white tracking-tight flex items-center gap-3">
            <span>Integrations & API Gateways</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-[#111111] text-[#c5a059] border border-[#262626]">
              {integrations.filter((i) => i.status === 'CONNECTED' || i.status === 'MOCK_ACTIVE').length} Connected
            </span>
          </h1>
          <p className="text-xs text-[#737373] mt-1 font-light">
            Connect WhatsApp Business API, Meta Lead Ads, Google Calendar, and Custom Webhooks.
          </p>
        </div>
      </header>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integ) => {
          const isConnected = integ.status === 'CONNECTED' || integ.status === 'MOCK_ACTIVE';
          return (
            <div
              key={integ.id}
              className="p-5 rounded-sm bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#262626] transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-sm bg-[#171717] border border-[#262626] flex items-center justify-center">
                      <Blocks className="w-4 h-4 text-[#c5a059]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-medium uppercase tracking-wider text-white">{integ.name}</h3>
                      <p className="text-[10px] text-[#737373] uppercase font-mono">{integ.type}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(integ)}
                    className="text-[#c5a059] hover:opacity-80 transition"
                  >
                    {isConnected ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6 text-[#404040]" />}
                  </button>
                </div>

                <p className="text-xs text-[#737373] leading-relaxed font-light">{integ.description}</p>
              </div>

              <div className="pt-3 border-t border-[#141414] flex items-center justify-between text-xs">
                <span
                  className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-sm border ${
                    isConnected
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40'
                      : 'bg-[#111111] text-[#737373] border-[#1a1a1a]'
                  }`}
                >
                  {isConnected ? 'Active' : 'Disabled'}
                </span>

                <button
                  onClick={() => showToast({ type: 'info', title: 'Connector Config', message: `Configure keys and webhook URLs for ${integ.name}.` })}
                  className="text-[10px] uppercase tracking-wider text-[#c5a059] hover:underline"
                >
                  Configure &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
