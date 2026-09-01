import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../firebase-applet-config.json';
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

let adminDb: Firestore | null = null;

export function getAdminFirestore(): Firestore | null {
  if (adminDb) return adminDb;
  try {
    if (!getApps().length) {
      initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
    adminDb = getFirestore(firebaseConfig.firestoreDatabaseId || undefined);
    return adminDb;
  } catch (err) {
    console.warn('[Firestore] Failed to initialize Firebase Admin, using memory cache:', err);
    return null;
  }
}

export class PersistentMultiTenantStorage {
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
  private initialized = false;

  constructor() {
    this.seedDemoDataLocal();
    this.initFirestoreSync();
  }

  private seedDemoDataLocal() {
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

  private async initFirestoreSync() {
    try {
      const fs = getAdminFirestore();
      if (!fs) return;

      // Check if demo workspace exists in Firestore, if not sync initial state
      const wsDoc = await fs.collection('workspaces').doc(DEMO_WORKSPACE.id).get();
      if (!wsDoc.exists) {
        await this.syncAllToFirestore();
      } else {
        // Hydrate from Firestore
        await this.hydrateFromFirestore();
      }
      this.initialized = true;
      console.log('[Firestore] Multi-tenant storage connected and synced with Firestore.');
    } catch (err) {
      console.warn('[Firestore] Sync error, operating with synchronized memory layer:', err);
    }
  }

  public async syncAllToFirestore() {
    const fs = getAdminFirestore();
    if (!fs) return;

    const batch = fs.batch();

    // Workspaces
    for (const ws of this.workspaces.values()) {
      batch.set(fs.collection('workspaces').doc(ws.id), ws);
    }

    // Leads
    for (const lead of this.leads.values()) {
      batch.set(fs.collection('workspaces').doc(lead.workspaceId).collection('leads').doc(lead.id), lead);
    }

    // Conversations
    for (const conv of this.conversations.values()) {
      batch.set(fs.collection('workspaces').doc(conv.workspaceId).collection('conversations').doc(conv.id), conv);
    }

    // Appointments
    for (const apt of this.appointments.values()) {
      batch.set(fs.collection('workspaces').doc(apt.workspaceId).collection('appointments').doc(apt.id), apt);
    }

    // Workflows
    for (const wf of this.workflows.values()) {
      batch.set(fs.collection('workspaces').doc(wf.workspaceId).collection('workflows').doc(wf.id), wf);
    }

    // Executions
    for (const exec of this.workflowExecutions.values()) {
      batch.set(fs.collection('workspaces').doc(exec.workspaceId).collection('workflow_executions').doc(exec.id), exec);
    }

    // Notifications
    for (const notif of this.notifications.values()) {
      batch.set(fs.collection('workspaces').doc(notif.workspaceId).collection('notifications').doc(notif.id), notif);
    }

    // Audit logs
    for (const log of this.auditLogs.values()) {
      batch.set(fs.collection('workspaces').doc(log.workspaceId).collection('audit_logs').doc(log.id), log);
    }

    // Integrations
    for (const integ of this.integrations.values()) {
      batch.set(fs.collection('workspaces').doc(integ.workspaceId).collection('integrations').doc(integ.id), integ);
    }

    await batch.commit();
  }

  public async hydrateFromFirestore() {
    const fs = getAdminFirestore();
    if (!fs) return;

    const wsSnap = await fs.collection('workspaces').get();
    for (const doc of wsSnap.docs) {
      const ws = doc.data() as Workspace;
      this.workspaces.set(ws.id, ws);

      // Hydrate subcollections
      const [leadsSnap, convsSnap, aptsSnap, wfsSnap, execsSnap, notifsSnap, logsSnap, integsSnap] = await Promise.all([
        fs.collection('workspaces').doc(ws.id).collection('leads').get(),
        fs.collection('workspaces').doc(ws.id).collection('conversations').get(),
        fs.collection('workspaces').doc(ws.id).collection('appointments').get(),
        fs.collection('workspaces').doc(ws.id).collection('workflows').get(),
        fs.collection('workspaces').doc(ws.id).collection('workflow_executions').get(),
        fs.collection('workspaces').doc(ws.id).collection('notifications').get(),
        fs.collection('workspaces').doc(ws.id).collection('audit_logs').get(),
        fs.collection('workspaces').doc(ws.id).collection('integrations').get(),
      ]);

      leadsSnap.docs.forEach((d) => this.leads.set(d.id, d.data() as Lead));
      convsSnap.docs.forEach((d) => this.conversations.set(d.id, d.data() as Conversation));
      aptsSnap.docs.forEach((d) => this.appointments.set(d.id, d.data() as Appointment));
      wfsSnap.docs.forEach((d) => this.workflows.set(d.id, d.data() as Workflow));
      execsSnap.docs.forEach((d) => this.workflowExecutions.set(d.id, d.data() as WorkflowExecution));
      notifsSnap.docs.forEach((d) => this.notifications.set(d.id, d.data() as Notification));
      logsSnap.docs.forEach((d) => this.auditLogs.set(d.id, d.data() as AuditLog));
      integsSnap.docs.forEach((d) => this.integrations.set(d.id, d.data() as IntegrationConfig));
    }
  }

  public seedDemoData() {
    this.seedDemoDataLocal();
    this.syncAllToFirestore().catch((e) => console.warn('[Firestore] Sync seed error:', e));
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
    
    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(ws.id).set(ws).catch(console.warn);
    }
    return ws;
  }

  public updateWorkspace(workspaceId: string, updates: Partial<Workspace>): Workspace | undefined {
    const ws = this.workspaces.get(workspaceId);
    if (!ws) return undefined;
    const updated = { ...ws, ...updates, updatedAt: new Date().toISOString() };
    this.workspaces.set(workspaceId, updated);
    
    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(workspaceId).set(updated, { merge: true }).catch(console.warn);
    }
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
    
    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(lead.workspaceId).collection('leads').doc(lead.id).set(lead).catch(console.warn);
    }

    // Create corresponding conversation
    const convId = `conv_${lead.id}`;
    if (!this.conversations.has(convId)) {
      const conv: Conversation = {
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
      };
      this.conversations.set(convId, conv);
      if (fs) {
        fs.collection('workspaces').doc(lead.workspaceId).collection('conversations').doc(conv.id).set(conv).catch(console.warn);
      }
    }

    return lead;
  }

  public updateLead(workspaceId: string, leadId: string, updates: Partial<Lead>, actorName = 'Agent'): Lead | undefined {
    const lead = this.getLead(workspaceId, leadId);
    if (!lead) return undefined;

    const updated = { ...lead, ...updates, updatedAt: new Date().toISOString() };
    this.leads.set(leadId, updated);
    this.logAudit(workspaceId, 'usr_agent', actorName, 'LEAD_UPDATED', 'lead', leadId, `Updated lead ${lead.name} status to ${updated.status} (Score ${updated.score})`);

    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(workspaceId).collection('leads').doc(leadId).set(updated, { merge: true }).catch(console.warn);
    }
    return updated;
  }

  public deleteLead(workspaceId: string, leadId: string): boolean {
    const lead = this.getLead(workspaceId, leadId);
    if (!lead) return false;
    this.leads.delete(leadId);
    
    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(workspaceId).collection('leads').doc(leadId).delete().catch(console.warn);
    }
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

    lead.lastContactedAt = message.timestamp;
    lead.updatedAt = new Date().toISOString();
    this.leads.set(lead.id, lead);

    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(workspaceId).collection('conversations').doc(conv.id).set(conv).catch(console.warn);
      fs.collection('workspaces').doc(workspaceId).collection('leads').doc(lead.id).set(lead, { merge: true }).catch(console.warn);
    }

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
    
    const lead = this.getLead(apt.workspaceId, apt.leadId);
    if (lead) {
      lead.status = 'APPOINTMENT_BOOKED';
      lead.appointmentId = apt.id;
      lead.updatedAt = new Date().toISOString();
      this.leads.set(lead.id, lead);
    }

    this.logAudit(apt.workspaceId, 'system', 'Scheduler', 'APPOINTMENT_CREATED', 'appointment', apt.id, `Booked appointment for ${apt.leadName} on ${apt.startTime}`);
    
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

    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(apt.workspaceId).collection('appointments').doc(apt.id).set(apt).catch(console.warn);
      if (lead) {
        fs.collection('workspaces').doc(apt.workspaceId).collection('leads').doc(lead.id).set(lead, { merge: true }).catch(console.warn);
      }
    }

    return apt;
  }

  public updateAppointment(workspaceId: string, aptId: string, updates: Partial<Appointment>): Appointment | undefined {
    const apt = this.appointments.get(aptId);
    if (!apt || apt.workspaceId !== workspaceId) return undefined;
    const updated = { ...apt, ...updates };
    this.appointments.set(aptId, updated);
    
    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(workspaceId).collection('appointments').doc(aptId).set(updated, { merge: true }).catch(console.warn);
    }
    return updated;
  }

  // --- WORKFLOWS ---
  public getWorkflows(workspaceId: string): Workflow[] {
    return Array.from(this.workflows.values()).filter((w) => w.workspaceId === workspaceId);
  }

  public saveWorkflow(wf: Workflow): Workflow {
    this.workflows.set(wf.id, wf);
    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(wf.workspaceId).collection('workflows').doc(wf.id).set(wf).catch(console.warn);
    }
    return wf;
  }

  public toggleWorkflow(workspaceId: string, wfId: string, isEnabled: boolean): Workflow | undefined {
    const wf = this.workflows.get(wfId);
    if (!wf || wf.workspaceId !== workspaceId) return undefined;
    wf.isEnabled = isEnabled;
    this.workflows.set(wfId, wf);
    
    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(workspaceId).collection('workflows').doc(wfId).set({ isEnabled }, { merge: true }).catch(console.warn);
    }
    return wf;
  }

  public getWorkflowExecutions(workspaceId: string): WorkflowExecution[] {
    return Array.from(this.workflowExecutions.values())
      .filter((e) => e.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public recordWorkflowExecution(exec: WorkflowExecution) {
    this.workflowExecutions.set(exec.id, exec);
    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(exec.workspaceId).collection('workflow_executions').doc(exec.id).set(exec).catch(console.warn);
    }
  }

  // --- NOTIFICATIONS ---
  public getNotifications(workspaceId: string): Notification[] {
    return Array.from(this.notifications.values())
      .filter((n) => n.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createNotification(notif: Notification): Notification {
    this.notifications.set(notif.id, notif);
    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(notif.workspaceId).collection('notifications').doc(notif.id).set(notif).catch(console.warn);
    }
    return notif;
  }

  public markNotificationAsRead(workspaceId: string, notifId: string): boolean {
    const notif = this.notifications.get(notifId);
    if (!notif || notif.workspaceId !== workspaceId) return false;
    notif.isRead = true;
    this.notifications.set(notifId, notif);
    
    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(workspaceId).collection('notifications').doc(notifId).set({ isRead: true }, { merge: true }).catch(console.warn);
    }
    return true;
  }

  public markAllNotificationsAsRead(workspaceId: string) {
    this.notifications.forEach((n) => {
      if (n.workspaceId === workspaceId) n.isRead = true;
    });
    
    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(workspaceId).collection('notifications').where('isRead', '==', false).get().then(snap => {
        const b = fs.batch();
        snap.docs.forEach(doc => b.update(doc.ref, { isRead: true }));
        b.commit().catch(console.warn);
      }).catch(console.warn);
    }
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
    
    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(workspaceId).collection('integrations').doc(intId).set(updated, { merge: true }).catch(console.warn);
    }
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
    
    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(workspaceId).collection('audit_logs').doc(log.id).set(log).catch(console.warn);
    }
  }

  // --- IDEMPOTENT WEBHOOK HANDLING ---
  public isWebhookProcessed(idempotencyKey: string): boolean {
    if (this.processedWebhookIds.has(idempotencyKey)) {
      return true;
    }
    this.processedWebhookIds.add(idempotencyKey);
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

export const db = new PersistentMultiTenantStorage();
