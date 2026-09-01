import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  Workspace,
  WorkspaceMember,
  UserRole,
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
let firestoreDisabled = false;

export function getAdminFirestore(): Firestore | null {
  if (firestoreDisabled) return null;
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
    console.warn('[Firestore] Failed to initialize Firebase Admin:', err);
    firestoreDisabled = true;
    return null;
  }
}

export class PersistentMultiTenantStorage {
  private workspaces: Map<string, Workspace> = new Map();
  private members: Map<string, Map<string, WorkspaceMember>> = new Map(); // workspaceId -> uid -> member
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
    this.initFirestoreSync().catch((err) => {
      console.warn('[Firestore] Background sync initialization note:', err?.message || err);
    });
  }

  private seedDemoDataLocal() {
    this.workspaces.set(DEMO_WORKSPACE.id, JSON.parse(JSON.stringify(DEMO_WORKSPACE)));

    const demoMembersMap = new Map<string, WorkspaceMember>();
    DEMO_WORKSPACE.members.forEach((m) => {
      demoMembersMap.set(m.userId, JSON.parse(JSON.stringify(m)));
    });
    this.members.set(DEMO_WORKSPACE.id, demoMembersMap);

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

      const wsDoc = await fs.collection('workspaces').doc(DEMO_WORKSPACE.id).get();
      if (!wsDoc.exists) {
        await this.syncAllToFirestore();
      } else {
        await this.hydrateFromFirestore();
      }
      this.initialized = true;
      console.log('[Firestore] Multi-tenant storage connected and synced with Firestore.');
    } catch (err: any) {
      if (err?.code === 7 || err?.message?.includes('Missing or insufficient permissions')) {
        firestoreDisabled = true;
      }
      console.warn('[Firestore] Operational sync notice:', err?.message || err);
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

    // Members
    for (const [wsId, memMap] of this.members.entries()) {
      for (const [uid, member] of memMap.entries()) {
        batch.set(fs.collection('workspaces').doc(wsId).collection('members').doc(uid), member);
      }
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

      // Hydrate members subcollection
      const membersSnap = await fs.collection('workspaces').doc(ws.id).collection('members').get();
      const memMap = new Map<string, WorkspaceMember>();
      membersSnap.docs.forEach((mDoc) => {
        memMap.set(mDoc.id, mDoc.data() as WorkspaceMember);
      });
      this.members.set(ws.id, memMap);

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
    this.syncAllToFirestore().catch((e) => console.warn('[Firestore] Sync seed notice:', e));
  }

  // --- WORKSPACE & MEMBERSHIP ---
  public getWorkspace(workspaceId: string): Workspace | undefined {
    return this.workspaces.get(workspaceId);
  }

  public getWorkspacesForUser(userId: string, isDemoUser = false): Workspace[] {
    const accessible: Workspace[] = [];
    for (const ws of this.workspaces.values()) {
      if (ws.isDemo || ws.id === 'ws_northstar_solar_demo') {
        accessible.push(ws);
      } else if (ws.ownerId === userId) {
        accessible.push(ws);
      } else {
        const memMap = this.members.get(ws.id);
        if (memMap && memMap.has(userId)) {
          accessible.push(ws);
        }
      }
    }
    return accessible;
  }

  public getWorkspaceMember(workspaceId: string, userId: string): WorkspaceMember | undefined {
    const memMap = this.members.get(workspaceId);
    return memMap?.get(userId);
  }

  public getWorkspaceMembers(workspaceId: string): WorkspaceMember[] {
    const memMap = this.members.get(workspaceId);
    if (!memMap) return [];
    return Array.from(memMap.values());
  }

  public addWorkspaceMember(workspaceId: string, member: WorkspaceMember, actorId: string, actorName: string): WorkspaceMember {
    let memMap = this.members.get(workspaceId);
    if (!memMap) {
      memMap = new Map();
      this.members.set(workspaceId, memMap);
    }
    memMap.set(member.userId, member);

    // Update workspace object's members list
    const ws = this.workspaces.get(workspaceId);
    if (ws) {
      const idx = ws.members.findIndex((m) => m.userId === member.userId);
      if (idx >= 0) {
        ws.members[idx] = member;
      } else {
        ws.members.push(member);
      }
    }

    this.logAudit(workspaceId, actorId, actorName, 'MEMBER_ADDED', 'settings', member.userId, `Added team member ${member.name} (${member.email}) as ${member.role}`);

    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(workspaceId).collection('members').doc(member.userId).set(member).catch(console.warn);
      if (ws) {
        fs.collection('workspaces').doc(workspaceId).update({ members: ws.members }).catch(console.warn);
      }
    }

    return member;
  }

  public removeWorkspaceMember(workspaceId: string, userId: string, actorId: string, actorName: string): boolean {
    const memMap = this.members.get(workspaceId);
    if (!memMap || !memMap.has(userId)) return false;

    const member = memMap.get(userId);
    memMap.delete(userId);

    const ws = this.workspaces.get(workspaceId);
    if (ws) {
      ws.members = ws.members.filter((m) => m.userId !== userId);
    }

    this.logAudit(workspaceId, actorId, actorName, 'MEMBER_REMOVED', 'settings', userId, `Removed member ${member?.name || userId}`);

    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(workspaceId).collection('members').doc(userId).delete().catch(console.warn);
      if (ws) {
        fs.collection('workspaces').doc(workspaceId).update({ members: ws.members }).catch(console.warn);
      }
    }

    return true;
  }

  /**
   * Creates a workspace securely with server-generated ID and authenticated creator as OWNER.
   */
  public createWorkspace(
    data: {
      name: string;
      industry: Workspace['industry'];
      slug?: string;
      aiConfig: Workspace['aiConfig'];
      automationMode?: Workspace['automationMode'];
    },
    creatorId: string,
    creatorName = 'Workspace Owner',
    creatorEmail = ''
  ): Workspace {
    const id = `ws_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    const now = new Date().toISOString();

    const ownerMember: WorkspaceMember = {
      userId: creatorId,
      name: creatorName,
      email: creatorEmail,
      role: 'OWNER',
      joinedAt: now,
    };

    const ws: Workspace = {
      id,
      name: data.name,
      slug,
      industry: data.industry,
      ownerId: creatorId,
      members: [ownerMember],
      aiConfig: data.aiConfig,
      automationMode: data.automationMode || 'ASSISTED',
      automationsPaused: false,
      createdAt: now,
      updatedAt: now,
      isDemo: false,
    };

    this.workspaces.set(id, ws);

    const memMap = new Map<string, WorkspaceMember>();
    memMap.set(creatorId, ownerMember);
    this.members.set(id, memMap);

    this.logAudit(id, creatorId, creatorName, 'SETTINGS_CHANGED', 'settings', id, `Created organization workspace: ${ws.name}`);

    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(id).set(ws).catch(console.warn);
      fs.collection('workspaces').doc(id).collection('members').doc(creatorId).set(ownerMember).catch(console.warn);
    }

    return ws;
  }

  public updateWorkspace(
    workspaceId: string,
    updates: Partial<Workspace>,
    actorId = 'system',
    actorName = 'Admin'
  ): Workspace | undefined {
    const ws = this.workspaces.get(workspaceId);
    if (!ws) return undefined;

    // Mass-assignment protection: immutable fields
    const safeUpdates: Partial<Workspace> = {
      ...(updates.name ? { name: updates.name } : {}),
      ...(updates.industry ? { industry: updates.industry } : {}),
      ...(updates.aiConfig ? { aiConfig: updates.aiConfig } : {}),
      ...(updates.automationMode ? { automationMode: updates.automationMode } : {}),
      ...(updates.automationsPaused !== undefined ? { automationsPaused: updates.automationsPaused } : {}),
      updatedAt: new Date().toISOString(),
    };

    const updated = { ...ws, ...safeUpdates };
    this.workspaces.set(workspaceId, updated);

    this.logAudit(workspaceId, actorId, actorName, 'SETTINGS_CHANGED', 'settings', workspaceId, `Updated workspace configuration`);

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

  public createLead(lead: Lead, actorId = 'system', actorName = 'Inbound Lead Engine'): Lead {
    this.leads.set(lead.id, lead);
    this.logAudit(lead.workspaceId, actorId, actorName, 'LEAD_CREATED', 'lead', lead.id, `Created lead ${lead.name} (${lead.service || 'General'}) with score ${lead.score}`);

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
            timestamp: lead.createdAt,
          },
        ],
        updatedAt: lead.createdAt,
        unreadByAgent: true,
      };
      this.conversations.set(convId, conv);
      if (fs) {
        fs.collection('workspaces').doc(lead.workspaceId).collection('conversations').doc(conv.id).set(conv).catch(console.warn);
      }
    }

    return lead;
  }

  public updateLead(
    workspaceId: string,
    leadId: string,
    updates: Partial<Lead>,
    actorId = 'system',
    actorName = 'Agent'
  ): Lead | undefined {
    const lead = this.getLead(workspaceId, leadId);
    if (!lead) return undefined;

    // Mass-assignment protection
    const safeUpdates: Partial<Lead> = {
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.email !== undefined ? { email: updates.email } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.temperature !== undefined ? { temperature: updates.temperature } : {}),
      ...(updates.score !== undefined ? { score: updates.score } : {}),
      ...(updates.service !== undefined ? { service: updates.service } : {}),
      ...(updates.location !== undefined ? { location: updates.location } : {}),
      ...(updates.budget !== undefined ? { budget: updates.budget } : {}),
      ...(updates.urgency !== undefined ? { urgency: updates.urgency } : {}),
      ...(updates.preferredContactMethod !== undefined ? { preferredContactMethod: updates.preferredContactMethod } : {}),
      ...(updates.assignedAgentId !== undefined ? { assignedAgentId: updates.assignedAgentId } : {}),
      ...(updates.assignedAgentName !== undefined ? { assignedAgentName: updates.assignedAgentName } : {}),
      ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
      ...(updates.requirements !== undefined ? { requirements: updates.requirements } : {}),
      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
      ...(updates.aiAnalysis !== undefined ? { aiAnalysis: updates.aiAnalysis } : {}),
      ...(updates.appointmentId !== undefined ? { appointmentId: updates.appointmentId } : {}),
      ...(updates.lastContactedAt !== undefined ? { lastContactedAt: updates.lastContactedAt } : {}),
      updatedAt: new Date().toISOString(),
    };

    const updated = { ...lead, ...safeUpdates };
    this.leads.set(leadId, updated);
    this.logAudit(workspaceId, actorId, actorName, 'LEAD_UPDATED', 'lead', leadId, `Updated lead ${lead.name} (Status: ${updated.status}, Score: ${updated.score})`);

    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(workspaceId).collection('leads').doc(leadId).set(updated, { merge: true }).catch(console.warn);
    }
    return updated;
  }

  public deleteLead(workspaceId: string, leadId: string, actorId = 'system', actorName = 'Agent'): boolean {
    const lead = this.getLead(workspaceId, leadId);
    if (!lead) return false;
    this.leads.delete(leadId);

    this.logAudit(workspaceId, actorId, actorName, 'LEAD_UPDATED', 'lead', leadId, `Deleted lead record: ${lead.name}`);

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
        unreadByAgent: message.sender === 'lead',
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

  public createAppointment(apt: Appointment, actorId = 'system', actorName = 'Scheduler'): Appointment {
    this.appointments.set(apt.id, apt);

    const lead = this.getLead(apt.workspaceId, apt.leadId);
    if (lead) {
      lead.status = 'APPOINTMENT_BOOKED';
      lead.appointmentId = apt.id;
      lead.updatedAt = new Date().toISOString();
      this.leads.set(lead.id, lead);
    }

    this.logAudit(apt.workspaceId, actorId, actorName, 'APPOINTMENT_CREATED', 'appointment', apt.id, `Booked appointment for ${apt.leadName} on ${apt.startTime}`);

    this.createNotification({
      id: `notif_${Date.now()}`,
      workspaceId: apt.workspaceId,
      title: `📅 Appointment Booked: ${apt.leadName}`,
      message: `Consultation confirmed for ${new Date(apt.startTime).toLocaleString()} with ${apt.assignedAgentName}.`,
      type: 'APPOINTMENT',
      leadId: apt.leadId,
      isRead: false,
      createdAt: new Date().toISOString(),
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

  public updateAppointment(
    workspaceId: string,
    aptId: string,
    updates: Partial<Appointment>,
    actorId = 'system',
    actorName = 'Scheduler'
  ): Appointment | undefined {
    const apt = this.appointments.get(aptId);
    if (!apt || apt.workspaceId !== workspaceId) return undefined;

    const safeUpdates: Partial<Appointment> = {
      ...(updates.service !== undefined ? { service: updates.service } : {}),
      ...(updates.assignedAgentId !== undefined ? { assignedAgentId: updates.assignedAgentId } : {}),
      ...(updates.assignedAgentName !== undefined ? { assignedAgentName: updates.assignedAgentName } : {}),
      ...(updates.startTime !== undefined ? { startTime: updates.startTime } : {}),
      ...(updates.endTime !== undefined ? { endTime: updates.endTime } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.locationType !== undefined ? { locationType: updates.locationType } : {}),
      ...(updates.locationDetails !== undefined ? { locationDetails: updates.locationDetails } : {}),
      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
    };

    const updated = { ...apt, ...safeUpdates };
    this.appointments.set(aptId, updated);

    this.logAudit(workspaceId, actorId, actorName, 'APPOINTMENT_UPDATED', 'appointment', aptId, `Updated appointment for ${apt.leadName} (${updated.status})`);

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

  public saveWorkflow(wf: Workflow, actorId = 'system', actorName = 'Admin'): Workflow {
    this.workflows.set(wf.id, wf);
    this.logAudit(wf.workspaceId, actorId, actorName, 'WORKFLOW_SAVED', 'workflow', wf.id, `Saved workflow: ${wf.name}`);

    const fs = getAdminFirestore();
    if (fs) {
      fs.collection('workspaces').doc(wf.workspaceId).collection('workflows').doc(wf.id).set(wf).catch(console.warn);
    }
    return wf;
  }

  public toggleWorkflow(workspaceId: string, wfId: string, isEnabled: boolean, actorId = 'system', actorName = 'Admin'): Workflow | undefined {
    const wf = this.workflows.get(wfId);
    if (!wf || wf.workspaceId !== workspaceId) return undefined;
    wf.isEnabled = isEnabled;
    this.workflows.set(wfId, wf);

    this.logAudit(workspaceId, actorId, actorName, 'WORKFLOW_SAVED', 'workflow', wfId, `${isEnabled ? 'Enabled' : 'Disabled'} workflow: ${wf.name}`);

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
      fs.collection('workspaces')
        .doc(workspaceId)
        .collection('notifications')
        .where('isRead', '==', false)
        .get()
        .then((snap) => {
          const b = fs.batch();
          snap.docs.forEach((doc) => b.update(doc.ref, { isRead: true }));
          b.commit().catch(console.warn);
        })
        .catch(console.warn);
    }
  }

  // --- INTEGRATIONS ---
  public getIntegrations(workspaceId: string): IntegrationConfig[] {
    return Array.from(this.integrations.values()).filter((i) => i.workspaceId === workspaceId);
  }

  public updateIntegration(
    workspaceId: string,
    intId: string,
    updates: Partial<IntegrationConfig>,
    actorId = 'system',
    actorName = 'Admin'
  ): IntegrationConfig | undefined {
    const integration = this.integrations.get(intId);
    if (!integration || integration.workspaceId !== workspaceId) return undefined;

    const safeUpdates: Partial<IntegrationConfig> = {
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.config !== undefined ? { config: updates.config } : {}),
    };

    const updated = { ...integration, ...safeUpdates };
    this.integrations.set(intId, updated);
    this.logAudit(workspaceId, actorId, actorName, 'INTEGRATION_CONFIGURED', 'integration', intId, `Updated configuration for ${updated.name}`);

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
      timestamp: new Date().toISOString(),
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
      members: this.getWorkspaceMembers(workspaceId),
      leads: this.getLeads(workspaceId),
      conversations: this.getConversations(workspaceId),
      appointments: this.getAppointments(workspaceId),
      workflows: this.getWorkflows(workspaceId),
      workflowExecutions: this.getWorkflowExecutions(workspaceId),
      notifications: this.getNotifications(workspaceId),
      auditLogs: this.getAuditLogs(workspaceId),
      integrations: this.getIntegrations(workspaceId),
      exportedAt: new Date().toISOString(),
    };
  }
}

export const db = new PersistentMultiTenantStorage();
