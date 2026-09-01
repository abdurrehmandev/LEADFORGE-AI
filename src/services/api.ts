import {
  Workspace,
  Lead,
  Conversation,
  Appointment,
  Workflow,
  WorkflowExecution,
  Notification,
  AuditLog,
  IntegrationConfig,
  AIAnalysis,
} from '../types';

export const api = {
  // --- WORKSPACES ---
  async getWorkspaces(): Promise<Workspace[]> {
    const res = await fetch('/api/workspaces');
    if (!res.ok) throw new Error('Failed to fetch workspaces');
    const data = await res.json();
    return data.workspaces;
  },

  async getWorkspace(id: string): Promise<Workspace> {
    const res = await fetch(`/api/workspaces/${id}`);
    if (!res.ok) throw new Error('Failed to fetch workspace');
    const data = await res.json();
    return data.workspace;
  },

  async createWorkspace(payload: Partial<Workspace>): Promise<Workspace> {
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create workspace');
    const data = await res.json();
    return data.workspace;
  },

  async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const res = await fetch(`/api/workspaces/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update workspace');
    const data = await res.json();
    return data.workspace;
  },

  async reseedWorkspace(id: string): Promise<void> {
    const res = await fetch(`/api/workspaces/${id}/reseed`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reseed demo data');
  },

  async setPauseAutomations(id: string, paused: boolean): Promise<Workspace> {
    const res = await fetch(`/api/workspaces/${id}/pause-automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paused })
    });
    if (!res.ok) throw new Error('Failed to update automation state');
    const data = await res.json();
    return data.workspace;
  },

  // --- LEADS ---
  async getLeads(workspaceId: string): Promise<Lead[]> {
    const res = await fetch(`/api/workspaces/${workspaceId}/leads`);
    if (!res.ok) throw new Error('Failed to fetch leads');
    const data = await res.json();
    return data.leads;
  },

  async createLead(workspaceId: string, lead: Partial<Lead>): Promise<Lead> {
    const res = await fetch(`/api/workspaces/${workspaceId}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    });
    if (!res.ok) throw new Error('Failed to create lead');
    const data = await res.json();
    return data.lead;
  },

  async updateLead(workspaceId: string, leadId: string, updates: Partial<Lead>): Promise<Lead> {
    const res = await fetch(`/api/workspaces/${workspaceId}/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update lead');
    const data = await res.json();
    return data.lead;
  },

  async deleteLead(workspaceId: string, leadId: string): Promise<void> {
    const res = await fetch(`/api/workspaces/${workspaceId}/leads/${leadId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete lead');
  },

  async qualifyLead(workspaceId: string, leadId: string): Promise<{ lead: Lead; aiAnalysis: AIAnalysis }> {
    const res = await fetch(`/api/workspaces/${workspaceId}/leads/${leadId}/qualify`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to qualify lead with AI');
    return res.json();
  },

  async bulkTag(workspaceId: string, leadIds: string[], tag: string): Promise<void> {
    await fetch(`/api/workspaces/${workspaceId}/leads/bulk-tag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds, tag })
    });
  },

  async bulkAssign(workspaceId: string, leadIds: string[], agentId: string, agentName: string): Promise<void> {
    await fetch(`/api/workspaces/${workspaceId}/leads/bulk-assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds, agentId, agentName })
    });
  },

  async bulkStatus(workspaceId: string, leadIds: string[], status: string): Promise<void> {
    await fetch(`/api/workspaces/${workspaceId}/leads/bulk-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds, status })
    });
  },

  // --- CONVERSATIONS ---
  async getConversations(workspaceId: string): Promise<Conversation[]> {
    const res = await fetch(`/api/workspaces/${workspaceId}/conversations`);
    if (!res.ok) throw new Error('Failed to fetch conversations');
    const data = await res.json();
    return data.conversations;
  },

  async getConversation(workspaceId: string, leadId: string): Promise<Conversation | undefined> {
    const res = await fetch(`/api/workspaces/${workspaceId}/conversations/${leadId}`);
    if (!res.ok) return undefined;
    const data = await res.json();
    return data.conversation;
  },

  async sendMessage(
    workspaceId: string,
    leadId: string,
    content: string,
    sender: 'agent' | 'lead' = 'agent',
    senderName = 'Agent'
  ): Promise<{ conversation: Conversation; lead: Lead }> {
    const res = await fetch(`/api/workspaces/${workspaceId}/conversations/${leadId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, sender, senderName })
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  // --- SIMULATOR ---
  async chatSimulator(
    workspaceId: string,
    messages: { sender: string; content: string }[],
    latestMessage: string,
    leadContext?: Partial<Lead>
  ): Promise<{
    reply: string;
    shouldOfferAppointment: boolean;
    extractedSignals: Record<string, string>;
    liveAnalysis: AIAnalysis;
  }> {
    const res = await fetch(`/api/workspaces/${workspaceId}/simulator/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, latestMessage, leadContext })
    });
    if (!res.ok) throw new Error('Simulator request failed');
    return res.json();
  },

  // --- APPOINTMENTS ---
  async getAppointments(workspaceId: string): Promise<Appointment[]> {
    const res = await fetch(`/api/workspaces/${workspaceId}/appointments`);
    if (!res.ok) throw new Error('Failed to fetch appointments');
    const data = await res.json();
    return data.appointments;
  },

  async createAppointment(workspaceId: string, apt: Partial<Appointment>): Promise<Appointment> {
    const res = await fetch(`/api/workspaces/${workspaceId}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apt)
    });
    if (!res.ok) throw new Error('Failed to schedule appointment');
    const data = await res.json();
    return data.appointment;
  },

  async updateAppointment(workspaceId: string, aptId: string, updates: Partial<Appointment>): Promise<Appointment> {
    const res = await fetch(`/api/workspaces/${workspaceId}/appointments/${aptId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update appointment');
    const data = await res.json();
    return data.appointment;
  },

  // --- WORKFLOWS ---
  async getWorkflows(workspaceId: string): Promise<Workflow[]> {
    const res = await fetch(`/api/workspaces/${workspaceId}/workflows`);
    if (!res.ok) throw new Error('Failed to fetch workflows');
    const data = await res.json();
    return data.workflows;
  },

  async saveWorkflow(workspaceId: string, workflow: Partial<Workflow>): Promise<Workflow> {
    const res = await fetch(`/api/workspaces/${workspaceId}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow)
    });
    if (!res.ok) throw new Error('Failed to save workflow');
    const data = await res.json();
    return data.workflow;
  },

  async toggleWorkflow(workspaceId: string, wfId: string, isEnabled: boolean): Promise<Workflow> {
    const res = await fetch(`/api/workspaces/${workspaceId}/workflows/${wfId}/toggle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isEnabled })
    });
    if (!res.ok) throw new Error('Failed to toggle workflow');
    const data = await res.json();
    return data.workflow;
  },

  async getWorkflowExecutions(workspaceId: string): Promise<WorkflowExecution[]> {
    const res = await fetch(`/api/workspaces/${workspaceId}/workflow-executions`);
    if (!res.ok) throw new Error('Failed to fetch workflow executions');
    const data = await res.json();
    return data.executions;
  },

  // --- NOTIFICATIONS & AUDIT & INTEGRATIONS ---
  async getNotifications(workspaceId: string): Promise<Notification[]> {
    const res = await fetch(`/api/workspaces/${workspaceId}/notifications`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    const data = await res.json();
    return data.notifications;
  },

  async markNotificationRead(workspaceId: string, notifId: string): Promise<void> {
    await fetch(`/api/workspaces/${workspaceId}/notifications/${notifId}/read`, { method: 'PUT' });
  },

  async markAllNotificationsRead(workspaceId: string): Promise<void> {
    await fetch(`/api/workspaces/${workspaceId}/notifications/read-all`, { method: 'POST' });
  },

  async getAuditLogs(workspaceId: string): Promise<AuditLog[]> {
    const res = await fetch(`/api/workspaces/${workspaceId}/audit-logs`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    const data = await res.json();
    return data.auditLogs;
  },

  async getIntegrations(workspaceId: string): Promise<IntegrationConfig[]> {
    const res = await fetch(`/api/workspaces/${workspaceId}/integrations`);
    if (!res.ok) throw new Error('Failed to fetch integrations');
    const data = await res.json();
    return data.integrations;
  },

  async updateIntegration(workspaceId: string, intId: string, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig> {
    const res = await fetch(`/api/workspaces/${workspaceId}/integrations/${intId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update integration');
    const data = await res.json();
    return data.integration;
  },

  // --- AI ACTIONS ---
  async draftFollowUp(workspaceId: string, leadId: string, step = 1): Promise<{ subject: string; message: string; reason: string }> {
    const res = await fetch(`/api/workspaces/${workspaceId}/ai/followup-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, step })
    });
    if (!res.ok) throw new Error('Failed to draft AI follow up');
    return res.json();
  },

  async draftReactivation(workspaceId: string, leadId: string): Promise<{ message: string; incentiveOffer: string }> {
    const res = await fetch(`/api/workspaces/${workspaceId}/ai/reactivate-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId })
    });
    if (!res.ok) throw new Error('Failed to draft reactivation');
    return res.json();
  },

  async getAIInsights(workspaceId: string): Promise<{
    insights: { summary: string; actionItems: string[]; bottleneckAnalysis: string };
    metrics: Record<string, number>;
  }> {
    const res = await fetch(`/api/workspaces/${workspaceId}/ai/insights`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to generate AI insights');
    return res.json();
  },

  // --- INBOUND WEBHOOK TEST TRIGGER ---
  async testInboundWebhook(payload: Record<string, any>): Promise<any> {
    const res = await fetch('/api/webhooks/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-idempotency-key': `test_${Date.now()}`
      },
      body: JSON.stringify(payload)
    });
    return res.json();
  }
};
