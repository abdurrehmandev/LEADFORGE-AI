import {
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
  Lead,
  Conversation,
  Appointment,
  Workflow,
  WorkflowExecution,
  Notification,
  AuditLog,
  IntegrationConfig,
  AIAnalysis,
  UserRole,
} from '../types';
import { auth } from './firebase';

/**
 * Centralized API client with automatic Firebase ID token attachment,
 * token refresh handling, and standardized error processing.
 */
async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Obtain fresh Firebase ID Token if user is logged in
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
    } catch (tokenErr) {
      console.error('[API] Failed to retrieve fresh Firebase ID token:', tokenErr);
      throw new Error('Authentication token expired or unavailable. Please sign in again.');
    }
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // Non-JSON response
    }

    if (response.status === 401) {
      throw new Error(errorData.message || 'Authentication required or session expired. Please sign in.');
    }
    if (response.status === 403) {
      throw new Error(errorData.message || 'Forbidden: Insufficient permissions for this workspace.');
    }
    if (response.status === 404) {
      throw new Error(errorData.error || errorData.message || 'Requested resource was not found.');
    }
    if (response.status === 503) {
      throw new Error('Service is temporarily unavailable.');
    }

    throw new Error(errorData.message || errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // --- WORKSPACES ---
  async getWorkspaces(): Promise<Workspace[]> {
    const data = await apiFetch<{ workspaces: Workspace[] }>('/api/workspaces');
    return data.workspaces;
  },

  async getWorkspace(id: string): Promise<Workspace> {
    const data = await apiFetch<{ workspace: Workspace }>(`/api/workspaces/${id}`);
    return data.workspace;
  },

  async createWorkspace(payload: Partial<Workspace>): Promise<Workspace> {
    const data = await apiFetch<{ workspace: Workspace }>('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.workspace;
  },

  async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const data = await apiFetch<{ workspace: Workspace }>(`/api/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.workspace;
  },

  async getWorkspaceMembers(id: string): Promise<WorkspaceMember[]> {
    const data = await apiFetch<{ members: WorkspaceMember[] }>(`/api/workspaces/${id}/members`);
    return data.members;
  },

  async addWorkspaceMember(id: string, payload: { email: string; name: string; role: UserRole }): Promise<WorkspaceMember> {
    const data = await apiFetch<{ member: WorkspaceMember }>(`/api/workspaces/${id}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.member;
  },

  async updateMemberRole(id: string, userId: string, role: UserRole): Promise<WorkspaceMember> {
    const data = await apiFetch<{ member: WorkspaceMember }>(`/api/workspaces/${id}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
    return data.member;
  },

  async removeWorkspaceMember(id: string, userId: string): Promise<void> {
    await apiFetch(`/api/workspaces/${id}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  // --- INVITATIONS ---
  async getInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
    const data = await apiFetch<{ invitations: WorkspaceInvitation[] }>(`/api/workspaces/${workspaceId}/invitations`);
    return data.invitations;
  },

  async createInvitation(workspaceId: string, email: string, role: UserRole): Promise<WorkspaceInvitation> {
    const data = await apiFetch<{ invitation: WorkspaceInvitation }>(`/api/workspaces/${workspaceId}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
    return data.invitation;
  },

  async acceptInvitation(workspaceId: string, invitationId: string): Promise<WorkspaceMember> {
    const data = await apiFetch<{ member: WorkspaceMember }>(`/api/workspaces/${workspaceId}/invitations/${invitationId}/accept`, {
      method: 'POST',
    });
    return data.member;
  },

  async revokeInvitation(workspaceId: string, invitationId: string): Promise<void> {
    await apiFetch(`/api/workspaces/${workspaceId}/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  },

  async reseedWorkspace(id: string): Promise<void> {
    await apiFetch(`/api/workspaces/${id}/reseed`, { method: 'POST' });
  },

  async setPauseAutomations(id: string, paused: boolean): Promise<Workspace> {
    const data = await apiFetch<{ workspace: Workspace }>(`/api/workspaces/${id}/pause-automations`, {
      method: 'POST',
      body: JSON.stringify({ paused }),
    });
    return data.workspace;
  },

  // --- LEADS ---
  async getLeads(workspaceId: string): Promise<Lead[]> {
    const data = await apiFetch<{ leads: Lead[] }>(`/api/workspaces/${workspaceId}/leads`);
    return data.leads;
  },

  async createLead(workspaceId: string, lead: Partial<Lead>): Promise<Lead> {
    const data = await apiFetch<{ lead: Lead }>(`/api/workspaces/${workspaceId}/leads`, {
      method: 'POST',
      body: JSON.stringify(lead),
    });
    return data.lead;
  },

  async updateLead(workspaceId: string, leadId: string, updates: Partial<Lead>): Promise<Lead> {
    const data = await apiFetch<{ lead: Lead }>(`/api/workspaces/${workspaceId}/leads/${leadId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.lead;
  },

  async deleteLead(workspaceId: string, leadId: string): Promise<void> {
    await apiFetch(`/api/workspaces/${workspaceId}/leads/${leadId}`, {
      method: 'DELETE',
    });
  },

  async recalculateLeadScore(workspaceId: string, leadId: string): Promise<Lead> {
    const data = await apiFetch<{ lead: Lead }>(`/api/workspaces/${workspaceId}/leads/${leadId}/recalculate-score`, {
      method: 'POST',
    });
    return data.lead;
  },

  async qualifyLead(workspaceId: string, leadId: string): Promise<{ lead: Lead; aiAnalysis: AIAnalysis }> {
    return apiFetch<{ lead: Lead; aiAnalysis: AIAnalysis }>(
      `/api/workspaces/${workspaceId}/leads/${leadId}/qualify`,
      {
        method: 'POST',
      }
    );
  },

  async bulkTag(workspaceId: string, leadIds: string[], tag: string): Promise<void> {
    await apiFetch(`/api/workspaces/${workspaceId}/leads/bulk-tag`, {
      method: 'POST',
      body: JSON.stringify({ leadIds, tag }),
    });
  },

  async bulkAssign(workspaceId: string, leadIds: string[], agentId: string, agentName: string): Promise<void> {
    await apiFetch(`/api/workspaces/${workspaceId}/leads/bulk-assign`, {
      method: 'POST',
      body: JSON.stringify({ leadIds, agentId, agentName }),
    });
  },

  async bulkStatus(workspaceId: string, leadIds: string[], status: string): Promise<void> {
    await apiFetch(`/api/workspaces/${workspaceId}/leads/bulk-status`, {
      method: 'POST',
      body: JSON.stringify({ leadIds, status }),
    });
  },

  // --- CONVERSATIONS ---
  async getConversations(workspaceId: string): Promise<Conversation[]> {
    const data = await apiFetch<{ conversations: Conversation[] }>(`/api/workspaces/${workspaceId}/conversations`);
    return data.conversations;
  },

  async getConversation(workspaceId: string, leadId: string): Promise<Conversation | undefined> {
    try {
      const data = await apiFetch<{ conversation: Conversation }>(
        `/api/workspaces/${workspaceId}/conversations/${leadId}`
      );
      return data.conversation;
    } catch {
      return undefined;
    }
  },

  async sendMessage(
    workspaceId: string,
    leadId: string,
    content: string,
    sender: 'agent' | 'lead' = 'agent',
    senderName = 'Agent'
  ): Promise<{ conversation: Conversation; lead: Lead }> {
    return apiFetch<{ conversation: Conversation; lead: Lead }>(
      `/api/workspaces/${workspaceId}/conversations/${leadId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content, sender, senderName }),
      }
    );
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
    return apiFetch(`/api/workspaces/${workspaceId}/simulator/chat`, {
      method: 'POST',
      body: JSON.stringify({ messages, latestMessage, leadContext }),
    });
  },

  // --- APPOINTMENTS ---
  async getAppointments(workspaceId: string): Promise<Appointment[]> {
    const data = await apiFetch<{ appointments: Appointment[] }>(`/api/workspaces/${workspaceId}/appointments`);
    return data.appointments;
  },

  async createAppointment(workspaceId: string, apt: Partial<Appointment>): Promise<Appointment> {
    const data = await apiFetch<{ appointment: Appointment }>(`/api/workspaces/${workspaceId}/appointments`, {
      method: 'POST',
      body: JSON.stringify(apt),
    });
    return data.appointment;
  },

  async updateAppointment(workspaceId: string, aptId: string, updates: Partial<Appointment>): Promise<Appointment> {
    const data = await apiFetch<{ appointment: Appointment }>(`/api/workspaces/${workspaceId}/appointments/${aptId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.appointment;
  },

  // --- WORKFLOWS ---
  async getWorkflows(workspaceId: string): Promise<Workflow[]> {
    const data = await apiFetch<{ workflows: Workflow[] }>(`/api/workspaces/${workspaceId}/workflows`);
    return data.workflows;
  },

  async saveWorkflow(workspaceId: string, workflow: Partial<Workflow>): Promise<Workflow> {
    const data = await apiFetch<{ workflow: Workflow }>(`/api/workspaces/${workspaceId}/workflows`, {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
    return data.workflow;
  },

  async toggleWorkflow(workspaceId: string, wfId: string, isEnabled: boolean): Promise<Workflow> {
    const data = await apiFetch<{ workflow: Workflow }>(`/api/workspaces/${workspaceId}/workflows/${wfId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ isEnabled }),
    });
    return data.workflow;
  },

  async getWorkflowExecutions(workspaceId: string): Promise<WorkflowExecution[]> {
    const data = await apiFetch<{ executions: WorkflowExecution[] }>(
      `/api/workspaces/${workspaceId}/workflow-executions`
    );
    return data.executions;
  },

  // --- NOTIFICATIONS & AUDIT & INTEGRATIONS ---
  async getNotifications(workspaceId: string): Promise<Notification[]> {
    const data = await apiFetch<{ notifications: Notification[] }>(`/api/workspaces/${workspaceId}/notifications`);
    return data.notifications;
  },

  async markNotificationRead(workspaceId: string, notifId: string): Promise<void> {
    await apiFetch(`/api/workspaces/${workspaceId}/notifications/${notifId}/read`, { method: 'PUT' });
  },

  async markAllNotificationsRead(workspaceId: string): Promise<void> {
    await apiFetch(`/api/workspaces/${workspaceId}/notifications/read-all`, { method: 'POST' });
  },

  async getAuditLogs(workspaceId: string): Promise<AuditLog[]> {
    const data = await apiFetch<{ auditLogs: AuditLog[] }>(`/api/workspaces/${workspaceId}/audit-logs`);
    return data.auditLogs;
  },

  async getIntegrations(workspaceId: string): Promise<IntegrationConfig[]> {
    const data = await apiFetch<{ integrations: IntegrationConfig[] }>(`/api/workspaces/${workspaceId}/integrations`);
    return data.integrations;
  },

  async updateIntegration(
    workspaceId: string,
    intId: string,
    updates: Partial<IntegrationConfig>
  ): Promise<IntegrationConfig> {
    const data = await apiFetch<{ integration: IntegrationConfig }>(
      `/api/workspaces/${workspaceId}/integrations/${intId}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
    return data.integration;
  },

  // --- AI ACTIONS ---
  async draftFollowUp(
    workspaceId: string,
    leadId: string,
    step = 1
  ): Promise<{ subject: string; message: string; reason: string }> {
    return apiFetch<{ subject: string; message: string; reason: string }>(
      `/api/workspaces/${workspaceId}/ai/followup-draft`,
      {
        method: 'POST',
        body: JSON.stringify({ leadId, step }),
      }
    );
  },

  async draftReactivation(
    workspaceId: string,
    leadId: string
  ): Promise<{ message: string; incentiveOffer: string }> {
    return apiFetch<{ message: string; incentiveOffer: string }>(
      `/api/workspaces/${workspaceId}/ai/reactivate-draft`,
      {
        method: 'POST',
        body: JSON.stringify({ leadId }),
      }
    );
  },

  async getAIInsights(workspaceId: string): Promise<{
    insights: { summary: string; actionItems: string[]; bottleneckAnalysis: string };
    metrics: Record<string, number>;
  }> {
    return apiFetch(`/api/workspaces/${workspaceId}/ai/insights`, {
      method: 'POST',
    });
  },

  // --- INBOUND WEBHOOK TEST TRIGGER ---
  async testInboundWebhook(payload: Record<string, any>): Promise<any> {
    const res = await fetch('/api/webhooks/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-idempotency-key': `test_${Date.now()}`,
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};
