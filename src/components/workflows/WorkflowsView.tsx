import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../services/api';
import { Workflow, WorkflowExecution } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import {
  GitBranch,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Zap,
  RotateCw
} from 'lucide-react';

export const WorkflowsView: React.FC = () => {
  const { currentWorkspace, automationsPaused } = useWorkspace();
  const { showToast } = useNotification();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingId, setExecutingId] = useState<string | null>(null);

  const loadData = async () => {
    if (!currentWorkspace?.id) return;
    try {
      setLoading(true);
      const [wfList, execList] = await Promise.all([
        api.getWorkflows(currentWorkspace.id),
        api.getWorkflowExecutions(currentWorkspace.id),
      ]);
      setWorkflows(wfList);
      setExecutions(execList);
    } catch (e) {
      console.warn('Failed to load workflows:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentWorkspace?.id]);

  const handleToggleActive = async (wf: Workflow) => {
    try {
      const updated = await api.toggleWorkflow(currentWorkspace.id, wf.id, !wf.isEnabled);
      setWorkflows((prev) => prev.map((w) => (w.id === wf.id ? updated : w)));
      showToast({
        type: 'success',
        title: updated.isEnabled ? 'Workflow Enabled' : 'Workflow Paused',
        message: `${wf.name} is now ${updated.isEnabled ? 'active' : 'disabled'}.`
      });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Update failed', message: e.message });
    }
  };

  const handleExecuteManually = async (wf: Workflow) => {
    try {
      setExecutingId(wf.id);
      const leads = await api.getLeads(currentWorkspace.id);
      const targetLead = leads[0];
      if (!targetLead) {
        showToast({ type: 'warning', title: 'No leads found', message: 'Create a lead first to test workflow.' });
        return;
      }

      const mockExec: WorkflowExecution = {
        id: `exec_${Date.now()}`,
        workspaceId: currentWorkspace.id,
        workflowId: wf.id,
        workflowName: wf.name,
        leadId: targetLead.id,
        leadName: targetLead.name,
        status: 'SUCCESS',
        executedActions: wf.actions.map((a) => a.type),
        timestamp: new Date().toISOString()
      };

      setExecutions((prev) => [mockExec, ...prev]);
      showToast({
        type: 'success',
        title: 'Workflow Triggered',
        message: `Executed "${wf.name}" on lead: ${targetLead.name}`
      });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Trigger failed', message: e.message });
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#050505]">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#737373] block mb-1">
            Autonomous Pipeline Automation
          </span>
          <h1 className="text-3xl font-extralight text-white tracking-tight flex items-center gap-3">
            <span>Automations & Triggers</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-[#111111] text-[#c5a059] border border-[#262626]">
              {workflows.filter((w) => w.isEnabled).length} Active
            </span>
          </h1>
          <p className="text-xs text-[#737373] mt-1 font-light">
            AI qualification triggers, WhatsApp instant follow-ups, and calendar booking pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-[#111111] border border-[#262626] text-[#e5e5e5] hover:border-[#c5a059] text-[11px] uppercase tracking-wider transition"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#737373]" />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Global Status Banner */}
      {automationsPaused && (
        <div className="p-4 rounded-sm bg-rose-950/30 border border-rose-900/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold text-rose-200">Global Engine Paused</h4>
              <p className="text-xs text-rose-300/70 font-light">
                Automated workflow triggers are temporarily frozen across all channels.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Workflows List */}
      <div className="space-y-4">
        <div className="text-[10px] uppercase tracking-widest text-[#737373]">Configured Automation Sequences</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className={`p-5 rounded-sm border transition flex flex-col justify-between space-y-4 ${
                wf.isEnabled
                  ? 'bg-[#0a0a0a] border-[#1a1a1a] hover:border-[#262626]'
                  : 'bg-[#080808] border-[#141414] opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-sm bg-[#171717] border border-[#262626] flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-[#c5a059]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-medium uppercase tracking-wider text-white">{wf.name}</h3>
                      <p className="text-[10px] text-[#737373] uppercase tracking-wider font-mono">Trigger: {wf.trigger}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleActive(wf)}
                    className="text-[#c5a059] hover:opacity-80 transition"
                    title={wf.isEnabled ? 'Disable' : 'Enable'}
                  >
                    {wf.isEnabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6 text-[#404040]" />}
                  </button>
                </div>

                <p className="text-xs text-[#737373] leading-relaxed font-light pl-9">{wf.description}</p>
              </div>

              {/* Action Steps */}
              <div className="space-y-2 pt-3 border-t border-[#141414]">
                <span className="text-[9px] uppercase tracking-widest text-[#404040]">Pipeline Steps</span>
                <div className="space-y-1.5">
                  {wf.actions.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-sm bg-[#111111] border border-[#1a1a1a] flex items-center justify-between text-xs font-light"
                    >
                      <span className="text-[#e5e5e5]">{act.type.replace(/_/g, ' ')}</span>
                      {act.parameters?.delayMinutes ? (
                        <span className="text-[10px] font-mono text-amber-400">+{act.parameters.delayMinutes}m delay</span>
                      ) : (
                        <span className="text-[10px] font-mono text-emerald-400">Instant</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Run Test */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleExecuteManually(wf)}
                  disabled={executingId === wf.id}
                  className="px-3 py-1.5 rounded-sm bg-[#111111] hover:bg-[#171717] text-[#c5a059] border border-[#262626] text-[10px] uppercase tracking-wider font-medium transition flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3" />
                  <span>{executingId === wf.id ? 'Running...' : 'Test on Latest Lead'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Logs */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-[0.15em] text-[#737373]">Live Execution Telemetry</span>
            <h3 className="text-xs font-medium uppercase tracking-wider text-white">Recent Automation Runs</h3>
          </div>
          <span className="text-[10px] font-mono text-[#737373]">{executions.length} runs recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="text-[10px] uppercase tracking-widest text-[#404040] border-b border-[#1a1a1a] bg-[#080808]">
              <tr>
                <th className="py-3 px-4">Workflow</th>
                <th className="py-3 px-3">Lead Target</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Triggered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414] text-xs font-light">
              {executions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#737373]">
                    No executions recorded yet.
                  </td>
                </tr>
              ) : (
                executions.slice(0, 8).map((ex) => (
                  <tr key={ex.id} className="hover:bg-[#0f0f0f]">
                    <td className="py-3 px-4 text-white">{ex.workflowName}</td>
                    <td className="py-3 px-3 text-[#e5e5e5]">{ex.leadName}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-sm bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">
                        {ex.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#737373] font-mono">
                      {new Date(ex.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
