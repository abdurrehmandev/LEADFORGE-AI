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
  Message,
} from '../src/types';
import {
  DEMO_WORKSPACE,
  DEMO_LEADS,
  DEMO_CONVERSATIONS,
  DEMO_APPOINTMENTS,
  DEMO_WORKFLOWS,
  DEMO_WORKFLOW_EXECUTIONS,
  DEMO_NOTIFICATIONS,
  DEMO_AUDIT_LOGS,
  DEMO_INTEGRATIONS,
} from '../src/data/demoSeedData';

class MultiTenantStorage {
  private workspaces: Map<string, Workspace> = new Map();
  private leads: Map<string, Lead> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private appointments: Map<string, Appointment> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private workflowExecutions: Map<string, WorkflowExecution> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();
  private integrations: Map<string, IntegrationConfig> = new Map();
  private processedWebhookIds: Set<string> = new Set();

  constructor() {
    this.seedDemoData();
  }

  public seedDemoData() {
    // Clear existing demo entries
    this.workspaces.set(DEMO_WORKSPACE.id, JSON.parse(JSON.stringify(DEMO_WORKSPACE)));
    
    DEMO_LEADS.forEach((l) => this.leads.set(l.id, JSON.parse(JSON.stringify(l))));
    DEMO_CONVERSATIONS.forEach((c) => this.conversations.set(c.id, JSON.parse(JSON.stringify(c))));
    DEMO_APPOINTMENTS.forEach((a) => this.appointments.set(a.id, JSON.parse(JSON.stringify(a))));
    DEMO_WORKFLOWS.forEach((w) => this.workflows.set(w.id, JSON.parse(JSON.stringify(w))));
    DEMO_WORKFLOW_EXECUTIONS.forEach((e) => this.workflowExecutions.set(e.id, JSON.parse(JSON.stringify(e))));
    DEMO_NOTIFICATIONS.forEach((n) => this.notifications.set(n.id, JSON.parse(JSON.stringify(n))));
    DEMO_AUDIT_LOGS.forEach((al) => this.auditLogs.set(al.id, JSON.parse(JSON.stringify(al))));
    DEMO_INTEGRATIONS.forEach((i) => this.integrations.set(i.id, JSON.parse(JSON.stringify(i))));
  }

  // --- WORKSPACE ---
  public getWorkspace(workspaceId: string): Workspace | undefined {
    return this.workspaces.get(workspaceId);
  }

  public getAllWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values());
  }

  public createWorkspace(ws: Workspace): Workspace {
    this.workspaces.set(ws.id, ws);
    this.logAudit(ws.id, 'usr_owner_1', 'System Owner', 'SETTINGS_CHANGED', 'settings', ws.id, `Created new workspace: ${ws.name}`);
    return ws;
  }

  public updateWorkspace(workspaceId: string, updates: Partial<Workspace>): Workspace | undefined {
    const ws = this.workspaces.get(workspaceId);
    if (!ws) return undefined;
    const updated = { ...ws, ...updates, updatedAt: new Date().toISOString() };
    this.workspaces.set(workspaceId, updated);
    return updated;
  }

  // --- LEADS ---
  public getLeads(workspaceId: string): Lead[] {
    return Array.from(this.leads.values())
      .filter((l) => l.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }

  public getLead(workspaceId: string, leadId: string): Lead | undefined {
    const lead = this.leads.get(leadId);
    if (lead && lead.workspaceId === workspaceId) {
      return lead;
    }
    return undefined;
  }

  public createLead(lead: Lead, actorName = 'Inbound Lead Engine'): Lead {
    this.leads.set(lead.id, lead);
    this.logAudit(lead.workspaceId, 'system', actorName, 'LEAD_CREATED', 'lead', lead.id, `Created lead ${lead.name} (${lead.service || 'General'}) with score ${lead.score}`);
    
    // Create corresponding conversation
    const convId = `conv_${lead.id}`;
    if (!this.conversations.has(convId)) {
      this.conversations.set(convId, {
        id: convId,
        workspaceId: lead.workspaceId,
        leadId: lead.id,
        leadName: lead.name,
        channel: lead.source === 'WhatsApp' ? 'whatsapp' : lead.source === 'Gmail' ? 'email' : 'widget',
        status: 'active',
        messages: [
          {
            id: `msg_${Date.now()}`,
            conversationId: convId,
            sender: 'lead',
            content: lead.requirements?.inquiry || `Hello, I would like to inquire about ${lead.service || 'your services'}.`,
            timestamp: lead.createdAt
          }
        ],
        updatedAt: lead.createdAt,
        unreadByAgent: true
      });
    }

    return lead;
  }

  public updateLead(workspaceId: string, leadId: string, updates: Partial<Lead>, actorName = 'Agent'): Lead | undefined {
    const lead = this.getLead(workspaceId, leadId);
    if (!lead) return undefined;

    const updated = { ...lead, ...updates, updatedAt: new Date().toISOString() };
    this.leads.set(leadId, updated);
    this.logAudit(workspaceId, 'usr_agent', actorName, 'LEAD_UPDATED', 'lead', leadId, `Updated lead ${lead.name} status to ${updated.status} (Score ${updated.score})`);
    return updated;
  }

  public deleteLead(workspaceId: string, leadId: string): boolean {
    const lead = this.getLead(workspaceId, leadId);
    if (!lead) return false;
    this.leads.delete(leadId);
    return true;
  }

  // --- CONVERSATIONS ---
  public getConversations(workspaceId: string): Conversation[] {
    return Array.from(this.conversations.values()).filter((c) => c.workspaceId === workspaceId);
  }

  public getConversationByLeadId(workspaceId: string, leadId: string): Conversation | undefined {
    return Array.from(this.conversations.values()).find((c) => c.workspaceId === workspaceId && c.leadId === leadId);
  }

  public addMessageToConversation(
    workspaceId: string,
    leadId: string,
    message: Message
  ): { conversation: Conversation; lead: Lead } | undefined {
    let conv = this.getConversationByLeadId(workspaceId, leadId);
    const lead = this.getLead(workspaceId, leadId);
    if (!lead) return undefined;

    if (!conv) {
      conv = {
        id: `conv_${leadId}`,
        workspaceId,
        leadId,
        leadName: lead.name,
        channel: 'widget',
        status: 'active',
        messages: [],
        updatedAt: new Date().toISOString(),
        unreadByAgent: message.sender === 'lead'
      };
    }

    conv.messages.push(message);
    conv.updatedAt = new Date().toISOString();
    conv.unreadByAgent = message.sender === 'lead';
    this.conversations.set(conv.id, conv);

    // Update lead last contacted
    lead.lastContactedAt = message.timestamp;
    lead.updatedAt = new Date().toISOString();
    this.leads.set(lead.id, lead);

    return { conversation: conv, lead };
  }

  // --- APPOINTMENTS ---
  public getAppointments(workspaceId: string): Appointment[] {
    return Array.from(this.appointments.values())
      .filter((a) => a.workspaceId === workspaceId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  public createAppointment(apt: Appointment): Appointment {
    this.appointments.set(apt.id, apt);
    
    // Auto-update lead status
    const lead = this.getLead(apt.workspaceId, apt.leadId);
    if (lead) {
      lead.status = 'APPOINTMENT_BOOKED';
      lead.appointmentId = apt.id;
      lead.updatedAt = new Date().toISOString();
      this.leads.set(lead.id, lead);
    }

    this.logAudit(apt.workspaceId, 'system', 'Scheduler', 'APPOINTMENT_CREATED', 'appointment', apt.id, `Booked appointment for ${apt.leadName} on ${apt.startTime}`);
    
    // Create in-app notification
    this.createNotification({
      id: `notif_${Date.now()}`,
      workspaceId: apt.workspaceId,
      title: `📅 Appointment Booked: ${apt.leadName}`,
      message: `Consultation confirmed for ${new Date(apt.startTime).toLocaleString()} with ${apt.assignedAgentName}.`,
      type: 'APPOINTMENT',
      leadId: apt.leadId,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return apt;
  }

  public updateAppointment(workspaceId: string, aptId: string, updates: Partial<Appointment>): Appointment | undefined {
    const apt = this.appointments.get(aptId);
    if (!apt || apt.workspaceId !== workspaceId) return undefined;
    const updated = { ...apt, ...updates };
    this.appointments.set(aptId, updated);
    return updated;
  }

  // --- WORKFLOWS ---
  public getWorkflows(workspaceId: string): Workflow[] {
    return Array.from(this.workflows.values()).filter((w) => w.workspaceId === workspaceId);
  }

  public saveWorkflow(wf: Workflow): Workflow {
    this.workflows.set(wf.id, wf);
    return wf;
  }

  public toggleWorkflow(workspaceId: string, wfId: string, isEnabled: boolean): Workflow | undefined {
    const wf = this.workflows.get(wfId);
    if (!wf || wf.workspaceId !== workspaceId) return undefined;
    wf.isEnabled = isEnabled;
    this.workflows.set(wfId, wf);
    return wf;
  }

  public getWorkflowExecutions(workspaceId: string): WorkflowExecution[] {
    return Array.from(this.workflowExecutions.values())
      .filter((e) => e.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public recordWorkflowExecution(exec: WorkflowExecution) {
    this.workflowExecutions.set(exec.id, exec);
  }

  // --- NOTIFICATIONS ---
  public getNotifications(workspaceId: string): Notification[] {
    return Array.from(this.notifications.values())
      .filter((n) => n.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createNotification(notif: Notification): Notification {
    this.notifications.set(notif.id, notif);
    return notif;
  }

  public markNotificationAsRead(workspaceId: string, notifId: string): boolean {
    const notif = this.notifications.get(notifId);
    if (!notif || notif.workspaceId !== workspaceId) return false;
    notif.isRead = true;
    this.notifications.set(notifId, notif);
    return true;
  }

  public markAllNotificationsAsRead(workspaceId: string) {
    this.notifications.forEach((n) => {
      if (n.workspaceId === workspaceId) n.isRead = true;
    });
  }

  // --- INTEGRATIONS ---
  public getIntegrations(workspaceId: string): IntegrationConfig[] {
    return Array.from(this.integrations.values()).filter((i) => i.workspaceId === workspaceId);
  }

  public updateIntegration(workspaceId: string, intId: string, updates: Partial<IntegrationConfig>): IntegrationConfig | undefined {
    const integration = this.integrations.get(intId);
    if (!integration || integration.workspaceId !== workspaceId) return undefined;
    const updated = { ...integration, ...updates };
    this.integrations.set(intId, updated);
    this.logAudit(workspaceId, 'usr_owner_1', 'Admin', 'INTEGRATION_CONFIGURED', 'integration', intId, `Updated configuration for ${updated.name}`);
    return updated;
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(workspaceId: string): AuditLog[] {
    return Array.from(this.auditLogs.values())
      .filter((l) => l.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public logAudit(
    workspaceId: string,
    userId: string,
    userName: string,
    action: AuditLog['action'],
    entityType: AuditLog['entityType'],
    entityId?: string,
    details = ''
  ) {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      workspaceId,
      userId,
      userName,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.set(log.id, log);
  }

  // --- IDEMPOTENT WEBHOOK HANDLING ---
  public isWebhookProcessed(idempotencyKey: string): boolean {
    if (this.processedWebhookIds.has(idempotencyKey)) {
      return true;
    }
    this.processedWebhookIds.add(idempotencyKey);
    // Keep size bounded to last 10,000 keys
    if (this.processedWebhookIds.size > 10000) {
      const first = this.processedWebhookIds.values().next().value;
      if (first) this.processedWebhookIds.delete(first);
    }
    return false;
  }

  // --- EXPORT DATA ---
  public exportWorkspaceData(workspaceId: string) {
    return {
      workspace: this.getWorkspace(workspaceId),
      leads: this.getLeads(workspaceId),
      conversations: this.getConversations(workspaceId),
      appointments: this.getAppointments(workspaceId),
      workflows: this.getWorkflows(workspaceId),
      workflowExecutions: this.getWorkflowExecutions(workspaceId),
      notifications: this.getNotifications(workspaceId),
      auditLogs: this.getAuditLogs(workspaceId),
      integrations: this.getIntegrations(workspaceId),
      exportedAt: new Date().toISOString()
    };
  }
}

export const db = new MultiTenantStorage();
