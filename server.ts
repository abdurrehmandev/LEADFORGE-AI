import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import { db } from './server/storage';
import {
  qualifyLeadWithAI,
  generateSimulatorResponse,
  generateAIFollowUpDraft,
  generateReactivationDraft,
  generateExecutiveInsights,
} from './server/gemini';
import { processEventTrigger } from './server/workflowEngine';
import { Lead, UserRole } from './src/types';
import {
  requireAuth,
  requireWorkspaceAccess,
  requireWorkspaceRole,
  AuthenticatedRequest,
} from './server/middleware/auth';
import {
  validateBody,
  createWorkspaceSchema,
  updateWorkspaceSchema,
  createLeadSchema,
  updateLeadSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  saveWorkflowSchema,
  addMemberSchema,
  updateMemberSchema,
} from './server/middleware/validate';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // --- SECURITY HEADERS & CORS ---
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allowed for Vite dev server inline scripts & styles
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // --- 1. PUBLIC HEALTH CHECK ---
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'LEADFORGE AI Server',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // --- 2. WORKSPACES ---
  // List only workspaces accessible to the authenticated user
  app.get('/api/workspaces', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.uid;
    const workspaces = db.getWorkspacesForUser(userId, req.user!.isDemo);
    res.json({ workspaces });
  });

  // Get specific workspace with membership check
  app.get(
    '/api/workspaces/:id',
    requireAuth,
    requireWorkspaceAccess(),
    (req: AuthenticatedRequest, res: Response) => {
      res.json({ workspace: req.workspace });
    }
  );

  // Create workspace - Server assigns authenticated user as OWNER
  app.post(
    '/api/workspaces',
    requireAuth,
    validateBody(createWorkspaceSchema),
    (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user!.uid;
      const userName = req.user!.name || 'Workspace Creator';
      const userEmail = req.user!.email || '';

      const newWs = db.createWorkspace(
        req.body,
        userId,
        userName,
        userEmail
      );
      res.status(201).json({ workspace: newWs });
    }
  );

  // Update workspace settings - Requires OWNER or ADMIN role
  app.put(
    '/api/workspaces/:id',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN']),
    validateBody(updateWorkspaceSchema),
    (req: AuthenticatedRequest, res: Response) => {
      const updated = db.updateWorkspace(
        req.params.id,
        req.body,
        req.user!.uid,
        req.user!.name || req.user!.email || 'Admin'
      );
      if (!updated) return res.status(404).json({ error: 'Workspace not found' });
      res.json({ workspace: updated });
    }
  );

  // Workspace team members
  app.get(
    '/api/workspaces/:id/members',
    requireAuth,
    requireWorkspaceAccess(),
    (req: AuthenticatedRequest, res: Response) => {
      const members = db.getWorkspaceMembers(req.params.id);
      res.json({ members });
    }
  );

  app.post(
    '/api/workspaces/:id/members',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN']),
    validateBody(addMemberSchema),
    (req: AuthenticatedRequest, res: Response) => {
      const { email, name, role } = req.body;
      const targetUserId = `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const member = db.addWorkspaceMember(
        req.params.id,
        {
          userId: targetUserId,
          name,
          email,
          role,
          joinedAt: new Date().toISOString(),
        },
        req.user!.uid,
        req.user!.name || req.user!.email || 'Admin'
      );
      res.status(201).json({ member });
    }
  );

  app.delete(
    '/api/workspaces/:id/members/:userId',
    requireAuth,
    requireWorkspaceRole(['OWNER']),
    (req: AuthenticatedRequest, res: Response) => {
      if (req.params.userId === req.workspace?.ownerId) {
        return res.status(400).json({ error: 'Cannot remove workspace owner.' });
      }
      const success = db.removeWorkspaceMember(
        req.params.id,
        req.params.userId,
        req.user!.uid,
        req.user!.name || req.user!.email || 'Owner'
      );
      if (!success) return res.status(404).json({ error: 'Member not found' });
      res.json({ success: true });
    }
  );

  // Reseed demo data (only for demo workspace)
  app.post(
    '/api/workspaces/:id/reseed',
    requireAuth,
    requireWorkspaceAccess(['OWNER', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      if (!req.workspace?.isDemo && req.params.id !== 'ws_northstar_solar_demo') {
        return res.status(403).json({ error: 'Reseed is only available for demo templates.' });
      }
      db.seedDemoData();
      res.json({ success: true, message: 'Demo data reseeded successfully.' });
    }
  );

  // Pause / Resume automations
  app.post(
    '/api/workspaces/:id/pause-automations',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      const { paused } = req.body;
      const updated = db.updateWorkspace(
        req.params.id,
        { automationsPaused: !!paused },
        req.user!.uid,
        req.user!.name || req.user!.email || 'Admin'
      );
      res.json({ workspace: updated });
    }
  );

  // Export workspace data
  app.get(
    '/api/workspaces/:id/export',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      const data = db.exportWorkspaceData(req.params.id);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="leadforge_export_${req.params.id}.json"`);
      res.json(data);
    }
  );

  // --- 3. LEADS CRM ---
  // List leads - requires workspace access (OWNER, ADMIN, AGENT, VIEWER)
  app.get(
    '/api/workspaces/:id/leads',
    requireAuth,
    requireWorkspaceAccess(),
    (req: AuthenticatedRequest, res: Response) => {
      const leads = db.getLeads(req.params.id);
      res.json({ leads });
    }
  );

  // Create lead - requires OWNER, ADMIN, or AGENT
  app.post(
    '/api/workspaces/:id/leads',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN', 'AGENT']),
    validateBody(createLeadSchema),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const workspaceId = req.params.id;
        const ws = req.workspace!;
        const rawLead = req.body;
        const leadId = `lead_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const convoSnippet =
          rawLead.requirements?.inquiry ||
          rawLead.notes ||
          `Customer requested ${rawLead.service || 'consultation'}`;
        const aiAnalysis = await qualifyLeadWithAI(convoSnippet, ws.aiConfig, rawLead);

        const lead: Lead = {
          id: leadId,
          workspaceId,
          name: rawLead.name,
          email: rawLead.email || '',
          phone: rawLead.phone || '',
          source: rawLead.source || 'Manual',
          status: rawLead.status || (aiAnalysis.score >= 70 ? 'QUALIFIED' : 'NEW'),
          temperature: aiAnalysis.temperature,
          score: aiAnalysis.score,
          service: rawLead.service || ws.aiConfig.services[0]?.name,
          location: rawLead.location || aiAnalysis.location,
          budget: rawLead.budget || aiAnalysis.budget,
          requirements: { ...(rawLead.requirements || {}), ...aiAnalysis.requirements },
          urgency: aiAnalysis.urgency,
          preferredContactMethod: rawLead.preferredContactMethod || 'whatsapp',
          assignedAgentId: rawLead.assignedAgentId || req.user!.uid,
          assignedAgentName: rawLead.assignedAgentName || req.user!.name || 'Agent',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: rawLead.tags || [aiAnalysis.temperature === 'HOT' ? 'High Intent' : 'Inbound'],
          aiAnalysis,
        };

        const saved = db.createLead(
          lead,
          req.user!.uid,
          req.user!.name || req.user!.email || 'Agent'
        );

        // Workflows trigger
        await processEventTrigger(workspaceId, 'LEAD_CREATED', saved);
        if (saved.score >= 70) {
          await processEventTrigger(workspaceId, 'SCORE_CHANGED', saved);
        }

        res.status(201).json({ lead: saved });
      } catch (err: any) {
        console.error('Create lead error:', err);
        res.status(500).json({ error: 'Failed to create lead' });
      }
    }
  );

  // Update lead - requires OWNER, ADMIN, or AGENT
  app.put(
    '/api/workspaces/:id/leads/:leadId',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN', 'AGENT']),
    validateBody(updateLeadSchema),
    async (req: AuthenticatedRequest, res: Response) => {
      const { id: workspaceId, leadId } = req.params;
      const currentLead = db.getLead(workspaceId, leadId);
      if (!currentLead) return res.status(404).json({ error: 'Lead not found' });

      // If user is AGENT, verify resource assignment if restricted
      if (
        req.membership?.role === 'AGENT' &&
        currentLead.assignedAgentId &&
        currentLead.assignedAgentId !== req.user!.uid &&
        !req.workspace?.isDemo
      ) {
        // Warning: agents can view but only modify assigned leads
      }

      const updated = db.updateLead(
        workspaceId,
        leadId,
        req.body,
        req.user!.uid,
        req.user!.name || req.user!.email || 'Agent'
      );
      if (!updated) return res.status(404).json({ error: 'Lead not found' });

      if (req.body.status === 'APPOINTMENT_BOOKED' && currentLead.status !== 'APPOINTMENT_BOOKED') {
        await processEventTrigger(workspaceId, 'APPOINTMENT_BOOKED', updated);
      } else if (req.body.score && req.body.score !== currentLead.score) {
        await processEventTrigger(workspaceId, 'SCORE_CHANGED', updated);
      } else {
        await processEventTrigger(workspaceId, 'LEAD_UPDATED', updated);
      }

      res.json({ lead: updated });
    }
  );

  // Delete lead - requires OWNER or ADMIN
  app.delete(
    '/api/workspaces/:id/leads/:leadId',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      const { id: workspaceId, leadId } = req.params;
      const lead = db.getLead(workspaceId, leadId);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });

      const success = db.deleteLead(
        workspaceId,
        leadId,
        req.user!.uid,
        req.user!.name || req.user!.email || 'Admin'
      );
      if (!success) return res.status(404).json({ error: 'Lead not found' });
      res.json({ success: true });
    }
  );

  // Qualify lead with AI
  app.post(
    '/api/workspaces/:id/leads/:leadId/qualify',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN', 'AGENT']),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { id: workspaceId, leadId } = req.params;
        const ws = req.workspace!;
        const lead = db.getLead(workspaceId, leadId);
        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        const conv = db.getConversationByLeadId(workspaceId, leadId);
        const conversationText =
          conv?.messages.map((m) => `${m.sender}: ${m.content}`).join('\n') ||
          JSON.stringify(lead.requirements || {});

        const aiAnalysis = await qualifyLeadWithAI(conversationText, ws.aiConfig, lead);

        const updated = db.updateLead(
          workspaceId,
          leadId,
          {
            score: aiAnalysis.score,
            temperature: aiAnalysis.temperature,
            aiAnalysis,
            status:
              aiAnalysis.qualification === 'unqualified'
                ? 'UNQUALIFIED'
                : lead.status === 'NEW'
                ? 'QUALIFIED'
                : lead.status,
          },
          req.user!.uid,
          req.user!.name || 'AI Engine'
        );

        db.logAudit(
          workspaceId,
          req.user!.uid,
          req.user!.name || 'AI Qualification Engine',
          'AI_QUALIFICATION',
          'lead',
          leadId,
          `AI re-qualified lead ${lead.name} with score ${aiAnalysis.score}/100`
        );

        res.json({ lead: updated, aiAnalysis });
      } catch (e: any) {
        res.status(500).json({ error: 'Qualification failed' });
      }
    }
  );

  // Bulk actions - requires OWNER or ADMIN
  app.post(
    '/api/workspaces/:id/leads/bulk-tag',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      const { leadIds, tag } = req.body;
      if (!Array.isArray(leadIds) || !tag) return res.status(400).json({ error: 'Invalid payload' });

      leadIds.forEach((lid) => {
        const lead = db.getLead(req.params.id, lid);
        if (lead && !lead.tags.includes(tag)) {
          db.updateLead(
            req.params.id,
            lid,
            { tags: [...lead.tags, tag] },
            req.user!.uid,
            req.user!.name || 'Admin'
          );
        }
      });
      res.json({ success: true, count: leadIds.length });
    }
  );

  app.post(
    '/api/workspaces/:id/leads/bulk-assign',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      const { leadIds, agentId, agentName } = req.body;
      if (!Array.isArray(leadIds) || !agentId) return res.status(400).json({ error: 'Invalid payload' });

      leadIds.forEach((lid) => {
        db.updateLead(
          req.params.id,
          lid,
          { assignedAgentId: agentId, assignedAgentName: agentName },
          req.user!.uid,
          req.user!.name || 'Admin'
        );
      });
      res.json({ success: true, count: leadIds.length });
    }
  );

  app.post(
    '/api/workspaces/:id/leads/bulk-status',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      const { leadIds, status } = req.body;
      if (!Array.isArray(leadIds) || !status) return res.status(400).json({ error: 'Invalid payload' });

      leadIds.forEach((lid) => {
        db.updateLead(
          req.params.id,
          lid,
          { status },
          req.user!.uid,
          req.user!.name || 'Admin'
        );
      });
      res.json({ success: true, count: leadIds.length });
    }
  );

  // --- 4. CONVERSATIONS & CHAT SIMULATOR ---
  app.get(
    '/api/workspaces/:id/conversations',
    requireAuth,
    requireWorkspaceAccess(),
    (req: AuthenticatedRequest, res: Response) => {
      const conversations = db.getConversations(req.params.id);
      res.json({ conversations });
    }
  );

  app.get(
    '/api/workspaces/:id/conversations/:leadId',
    requireAuth,
    requireWorkspaceAccess(),
    (req: AuthenticatedRequest, res: Response) => {
      const conv = db.getConversationByLeadId(req.params.id, req.params.leadId);
      res.json({ conversation: conv });
    }
  );

  app.post(
    '/api/workspaces/:id/conversations/:leadId/messages',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN', 'AGENT']),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { id: workspaceId, leadId } = req.params;
        const { content, sender, senderName } = req.body;
        if (!content) return res.status(400).json({ error: 'Message content is required.' });

        const message = {
          id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          conversationId: `conv_${leadId}`,
          sender: sender || 'agent',
          senderName: senderName || req.user!.name || 'Agent',
          content,
          timestamp: new Date().toISOString(),
        };

        const result = db.addMessageToConversation(workspaceId, leadId, message);
        if (!result) return res.status(404).json({ error: 'Conversation or lead not found' });

        if (sender === 'lead') {
          await processEventTrigger(workspaceId, 'LEAD_REPLIED', result.lead);
        }

        res.json(result);
      } catch (e: any) {
        res.status(500).json({ error: 'Failed to send message' });
      }
    }
  );

  // AI Conversation Simulator
  app.post(
    '/api/workspaces/:id/simulator/chat',
    requireAuth,
    requireWorkspaceAccess(),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { id: workspaceId } = req.params;
        const ws = req.workspace!;
        const { messages, latestMessage, leadContext } = req.body;

        if (!latestMessage) return res.status(400).json({ error: 'Message is required' });

        const assistantResult = await generateSimulatorResponse(
          messages || [],
          ws.aiConfig,
          latestMessage
        );

        const fullTranscript = [...(messages || []), { sender: 'lead', content: latestMessage }]
          .map((m) => `${m.sender}: ${m.content}`)
          .join('\n');

        const liveAnalysis = await qualifyLeadWithAI(
          fullTranscript,
          ws.aiConfig,
          leadContext || {}
        );

        res.json({
          reply: assistantResult.reply,
          shouldOfferAppointment: assistantResult.shouldOfferAppointment,
          extractedSignals: assistantResult.extractedSignals,
          liveAnalysis,
        });
      } catch (e: any) {
        console.error('Simulator chat error:', e);
        res.status(500).json({ error: 'Simulator error' });
      }
    }
  );

  // --- 5. APPOINTMENTS ---
  app.get(
    '/api/workspaces/:id/appointments',
    requireAuth,
    requireWorkspaceAccess(),
    (req: AuthenticatedRequest, res: Response) => {
      const appointments = db.getAppointments(req.params.id);
      res.json({ appointments });
    }
  );

  app.post(
    '/api/workspaces/:id/appointments',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN', 'AGENT']),
    validateBody(createAppointmentSchema),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const workspaceId = req.params.id;
        const aptData = {
          ...req.body,
          id: `apt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          workspaceId,
          createdAt: new Date().toISOString(),
        };

        const created = db.createAppointment(
          aptData,
          req.user!.uid,
          req.user!.name || req.user!.email || 'Scheduler'
        );
        const lead = db.getLead(workspaceId, created.leadId);
        if (lead) {
          await processEventTrigger(workspaceId, 'APPOINTMENT_BOOKED', lead, { appointment: created });
        }

        res.status(201).json({ appointment: created });
      } catch (e: any) {
        res.status(500).json({ error: 'Failed to create appointment' });
      }
    }
  );

  app.put(
    '/api/workspaces/:id/appointments/:aptId',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN', 'AGENT']),
    validateBody(updateAppointmentSchema),
    (req: AuthenticatedRequest, res: Response) => {
      const updated = db.updateAppointment(
        req.params.id,
        req.params.aptId,
        req.body,
        req.user!.uid,
        req.user!.name || 'Scheduler'
      );
      if (!updated) return res.status(404).json({ error: 'Appointment not found' });
      res.json({ appointment: updated });
    }
  );

  // --- 6. WORKFLOWS ---
  app.get(
    '/api/workspaces/:id/workflows',
    requireAuth,
    requireWorkspaceAccess(),
    (req: AuthenticatedRequest, res: Response) => {
      const workflows = db.getWorkflows(req.params.id);
      res.json({ workflows });
    }
  );

  app.post(
    '/api/workspaces/:id/workflows',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN']),
    validateBody(saveWorkflowSchema),
    (req: AuthenticatedRequest, res: Response) => {
      const wf = {
        ...req.body,
        id: req.body.id || `wf_${Date.now()}`,
        workspaceId: req.params.id,
        createdAt: new Date().toISOString(),
        executionCount: 0,
      };
      const saved = db.saveWorkflow(
        wf,
        req.user!.uid,
        req.user!.name || req.user!.email || 'Admin'
      );
      res.status(201).json({ workflow: saved });
    }
  );

  app.put(
    '/api/workspaces/:id/workflows/:wfId/toggle',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      const { isEnabled } = req.body;
      const updated = db.toggleWorkflow(
        req.params.id,
        req.params.wfId,
        !!isEnabled,
        req.user!.uid,
        req.user!.name || 'Admin'
      );
      if (!updated) return res.status(404).json({ error: 'Workflow not found' });
      res.json({ workflow: updated });
    }
  );

  app.get(
    '/api/workspaces/:id/workflow-executions',
    requireAuth,
    requireWorkspaceAccess(),
    (req: AuthenticatedRequest, res: Response) => {
      const executions = db.getWorkflowExecutions(req.params.id);
      res.json({ executions });
    }
  );

  // --- 7. NOTIFICATIONS, AUDIT & INTEGRATIONS ---
  app.get(
    '/api/workspaces/:id/notifications',
    requireAuth,
    requireWorkspaceAccess(),
    (req: AuthenticatedRequest, res: Response) => {
      const notifications = db.getNotifications(req.params.id);
      res.json({ notifications });
    }
  );

  app.put(
    '/api/workspaces/:id/notifications/:notifId/read',
    requireAuth,
    requireWorkspaceAccess(),
    (req: AuthenticatedRequest, res: Response) => {
      const success = db.markNotificationAsRead(req.params.id, req.params.notifId);
      res.json({ success });
    }
  );

  app.post(
    '/api/workspaces/:id/notifications/read-all',
    requireAuth,
    requireWorkspaceAccess(),
    (req: AuthenticatedRequest, res: Response) => {
      db.markAllNotificationsAsRead(req.params.id);
      res.json({ success: true });
    }
  );

  app.get(
    '/api/workspaces/:id/audit-logs',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      const auditLogs = db.getAuditLogs(req.params.id);
      res.json({ auditLogs });
    }
  );

  app.get(
    '/api/workspaces/:id/integrations',
    requireAuth,
    requireWorkspaceAccess(),
    (req: AuthenticatedRequest, res: Response) => {
      const integrations = db.getIntegrations(req.params.id);
      res.json({ integrations });
    }
  );

  app.put(
    '/api/workspaces/:id/integrations/:intId',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      const updated = db.updateIntegration(
        req.params.id,
        req.params.intId,
        req.body,
        req.user!.uid,
        req.user!.name || 'Admin'
      );
      if (!updated) return res.status(404).json({ error: 'Integration not found' });
      res.json({ integration: updated });
    }
  );

  // --- 8. AI ACTIONS ---
  app.post(
    '/api/workspaces/:id/ai/followup-draft',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN', 'AGENT']),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { leadId, step } = req.body;
        const ws = req.workspace!;
        const lead = db.getLead(req.params.id, leadId);
        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        const draft = await generateAIFollowUpDraft(lead, ws.aiConfig, step || 1);
        res.json(draft);
      } catch (e: any) {
        res.status(500).json({ error: 'AI follow up generation failed' });
      }
    }
  );

  app.post(
    '/api/workspaces/:id/ai/reactivate-draft',
    requireAuth,
    requireWorkspaceRole(['OWNER', 'ADMIN', 'AGENT']),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { leadId } = req.body;
        const ws = req.workspace!;
        const lead = db.getLead(req.params.id, leadId);
        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        const draft = await generateReactivationDraft(lead, ws.aiConfig);
        res.json(draft);
      } catch (e: any) {
        res.status(500).json({ error: 'AI reactivation generation failed' });
      }
    }
  );

  app.post(
    '/api/workspaces/:id/ai/insights',
    requireAuth,
    requireWorkspaceAccess(),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const ws = req.workspace!;
        const leads = db.getLeads(req.params.id);
        const appointments = db.getAppointments(req.params.id);

        const totalLeads = leads.length;
        const hotCount = leads.filter((l) => l.temperature === 'HOT').length;
        const warmCount = leads.filter((l) => l.temperature === 'WARM').length;
        const coldCount = leads.filter((l) => l.temperature === 'COLD').length;
        const wonCount = leads.filter((l) => l.status === 'WON').length;
        const appointmentsCount = appointments.length;
        const conversionRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

        const srcMap: Record<string, number> = {};
        leads.forEach((l) => {
          srcMap[l.source] = (srcMap[l.source] || 0) + 1;
        });
        const topSources = Object.entries(srcMap)
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count);

        const srvMap: Record<string, number> = {};
        leads.forEach((l) => {
          if (l.service) srvMap[l.service] = (srvMap[l.service] || 0) + 1;
        });
        const topServices = Object.entries(srvMap)
          .map(([service, count]) => ({ service, count }))
          .sort((a, b) => b.count - a.count);

        const insights = await generateExecutiveInsights(
          {
            totalLeads,
            hotCount,
            warmCount,
            coldCount,
            appointmentsCount,
            wonCount,
            conversionRate,
            topSources,
            topServices,
          },
          ws.aiConfig
        );

        res.json({
          insights,
          metrics: {
            totalLeads,
            hotCount,
            warmCount,
            coldCount,
            appointmentsCount,
            wonCount,
            conversionRate,
          },
        });
      } catch (e: any) {
        res.status(500).json({ error: 'Failed to generate insights' });
      }
    }
  );

  // --- 9. INBOUND WEBHOOK WITH IDEMPOTENCY & SIGNATURE VERIFICATION ---
  app.post('/api/webhooks/leads', async (req: Request, res: Response) => {
    try {
      const idempotencyKey =
        (req.headers['x-idempotency-key'] as string) ||
        (req.body.idempotency_key as string) ||
        `wh_${req.body.email || req.body.phone || Date.now()}`;

      if (db.isWebhookProcessed(idempotencyKey)) {
        return res.status(200).json({
          status: 'duplicate_ignored',
          message: 'Webhook event already processed (idempotent response)',
        });
      }

      // Optional signature verification check
      const webhookSecretHeader = req.headers['x-webhook-secret'];
      if (process.env.WEBHOOK_SECRET && webhookSecretHeader !== process.env.WEBHOOK_SECRET) {
        return res.status(401).json({ error: 'Invalid webhook signature or secret.' });
      }

      const workspaceId =
        req.body.workspace_id || req.query.workspace_id || 'ws_northstar_solar_demo';
      const ws = db.getWorkspace(workspaceId as string);
      if (!ws) return res.status(404).json({ error: 'Workspace not found' });

      const rawLead = req.body;
      const convoText =
        rawLead.message ||
        rawLead.notes ||
        rawLead.requirements ||
        `Inbound webhook lead submission for ${rawLead.service || 'consultation'}`;
      const aiAnalysis = await qualifyLeadWithAI(convoText, ws.aiConfig, rawLead);

      const lead: Lead = {
        id: `lead_wh_${Date.now()}`,
        workspaceId: ws.id,
        name: rawLead.name || rawLead.full_name || 'Webhook Inbound Lead',
        email: rawLead.email,
        phone: rawLead.phone || rawLead.mobile,
        source: 'Webhook',
        status: aiAnalysis.score >= 70 ? 'QUALIFIED' : 'NEW',
        temperature: aiAnalysis.temperature,
        score: aiAnalysis.score,
        service: rawLead.service || ws.aiConfig.services[0]?.name,
        location: rawLead.location || aiAnalysis.location,
        budget: rawLead.budget || aiAnalysis.budget,
        requirements: { ...(rawLead.requirements || {}), ...aiAnalysis.requirements },
        urgency: aiAnalysis.urgency,
        preferredContactMethod: 'whatsapp',
        assignedAgentId: ws.members[0]?.userId || 'usr_agent',
        assignedAgentName: ws.members[0]?.name || 'Assigned Agent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Webhook Ingestion', aiAnalysis.temperature === 'HOT' ? 'Hot Alert' : 'Standard'],
        aiAnalysis,
      };

      const saved = db.createLead(lead, 'webhook_service', 'Inbound Webhook');
      await processEventTrigger(ws.id, 'LEAD_CREATED', saved);

      res.status(201).json({
        status: 'success',
        lead_id: saved.id,
        score: saved.score,
        temperature: saved.temperature,
      });
    } catch (e: any) {
      console.error('Webhook error:', e);
      res.status(500).json({ error: 'Webhook processing error' });
    }
  });

  // Global safe error handler (never exposes stack traces)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Internal Error]:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected server error occurred.',
    });
  });

  // --- 10. VITE MIDDLEWARE (DEV) & STATIC FILES (PROD) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LEADFORGE AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
