import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/storage';
import { qualifyLeadWithAI, generateSimulatorResponse, generateAIFollowUpDraft, generateReactivationDraft, generateExecutiveInsights } from './server/gemini';
import { processEventTrigger } from './server/workflowEngine';
import { Lead } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // --- 1. HEALTH CHECK ---
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'LEADFORGE AI Server',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // --- 2. WORKSPACES ---
  app.get('/api/workspaces', (req, res) => {
    const workspaces = db.getAllWorkspaces();
    res.json({ workspaces });
  });

  app.get('/api/workspaces/:id', (req, res) => {
    const ws = db.getWorkspace(req.params.id);
    if (!ws) return res.status(404).json({ error: 'Workspace not found' });
    res.json({ workspace: ws });
  });

  app.post('/api/workspaces', (req, res) => {
    const newWs = db.createWorkspace(req.body);
    res.status(201).json({ workspace: newWs });
  });

  app.put('/api/workspaces/:id', (req, res) => {
    const updated = db.updateWorkspace(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Workspace not found' });
    res.json({ workspace: updated });
  });

  app.post('/api/workspaces/:id/reseed', (req, res) => {
    db.seedDemoData();
    res.json({ success: true, message: 'Demo data reseeded successfully.' });
  });

  app.post('/api/workspaces/:id/pause-automations', (req, res) => {
    const { paused } = req.body;
    const updated = db.updateWorkspace(req.params.id, { automationsPaused: !!paused });
    db.logAudit(req.params.id, 'usr_owner', 'Owner', 'AUTOMATION_TOGGLED', 'settings', undefined, `${paused ? 'Paused' : 'Resumed'} all workspace automations`);
    res.json({ workspace: updated });
  });

  app.get('/api/workspaces/:id/export', (req, res) => {
    const data = db.exportWorkspaceData(req.params.id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="leadforge_export_${req.params.id}.json"`);
    res.json(data);
  });

  // --- 3. LEADS CRM ---
  app.get('/api/workspaces/:id/leads', (req, res) => {
    const leads = db.getLeads(req.params.id);
    res.json({ leads });
  });

  app.post('/api/workspaces/:id/leads', async (req, res) => {
    try {
      const workspaceId = req.params.id;
      const ws = db.getWorkspace(workspaceId);
      if (!ws) return res.status(404).json({ error: 'Workspace not found' });

      const rawLead = req.body;
      const leadId = rawLead.id || `lead_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Perform initial AI qualification
      const convoSnippet = rawLead.requirements?.inquiry || rawLead.notes || `Customer requested ${rawLead.service || 'consultation'}`;
      const aiAnalysis = await qualifyLeadWithAI(convoSnippet, ws.aiConfig, rawLead);

      const lead: Lead = {
        id: leadId,
        workspaceId,
        name: rawLead.name || 'New Prospect',
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
        assignedAgentId: rawLead.assignedAgentId || (ws.members[2]?.userId || ws.members[0]?.userId),
        assignedAgentName: rawLead.assignedAgentName || (ws.members[2]?.name || ws.members[0]?.name),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: rawLead.tags || [aiAnalysis.temperature === 'HOT' ? 'High Intent' : 'Inbound'],
        aiAnalysis,
      };

      const saved = db.createLead(lead, req.body.creatorName || 'CRM Ingestion');

      // Trigger workflows
      await processEventTrigger(workspaceId, 'LEAD_CREATED', saved);
      if (saved.score >= 70) {
        await processEventTrigger(workspaceId, 'SCORE_CHANGED', saved);
      }

      res.status(201).json({ lead: saved });
    } catch (err: any) {
      console.error('Create lead error:', err);
      res.status(500).json({ error: err.message || 'Failed to create lead' });
    }
  });

  app.put('/api/workspaces/:id/leads/:leadId', async (req, res) => {
    const { id: workspaceId, leadId } = req.params;
    const currentLead = db.getLead(workspaceId, leadId);
    if (!currentLead) return res.status(404).json({ error: 'Lead not found' });

    const updated = db.updateLead(workspaceId, leadId, req.body);
    if (!updated) return res.status(404).json({ error: 'Lead not found' });

    // Check if status changed to APPOINTMENT_BOOKED
    if (req.body.status === 'APPOINTMENT_BOOKED' && currentLead.status !== 'APPOINTMENT_BOOKED') {
      await processEventTrigger(workspaceId, 'APPOINTMENT_BOOKED', updated);
    } else if (req.body.score && req.body.score !== currentLead.score) {
      await processEventTrigger(workspaceId, 'SCORE_CHANGED', updated);
    } else {
      await processEventTrigger(workspaceId, 'LEAD_UPDATED', updated);
    }

    res.json({ lead: updated });
  });

  app.delete('/api/workspaces/:id/leads/:leadId', (req, res) => {
    const success = db.deleteLead(req.params.id, req.params.leadId);
    if (!success) return res.status(404).json({ error: 'Lead not found' });
    res.json({ success: true });
  });

  app.post('/api/workspaces/:id/leads/:leadId/qualify', async (req, res) => {
    try {
      const { id: workspaceId, leadId } = req.params;
      const ws = db.getWorkspace(workspaceId);
      const lead = db.getLead(workspaceId, leadId);
      if (!ws || !lead) return res.status(404).json({ error: 'Lead or workspace not found' });

      const conv = db.getConversationByLeadId(workspaceId, leadId);
      const conversationText = conv?.messages.map(m => `${m.sender}: ${m.content}`).join('\n') || JSON.stringify(lead.requirements || {});

      const aiAnalysis = await qualifyLeadWithAI(conversationText, ws.aiConfig, lead);
      
      const updated = db.updateLead(workspaceId, leadId, {
        score: aiAnalysis.score,
        temperature: aiAnalysis.temperature,
        aiAnalysis,
        status: aiAnalysis.qualification === 'unqualified' ? 'UNQUALIFIED' : (lead.status === 'NEW' ? 'QUALIFIED' : lead.status)
      }, 'AI Qualification Engine');

      db.logAudit(workspaceId, 'system', 'AI Engine', 'AI_QUALIFICATION', 'lead', leadId, `AI re-qualified lead ${lead.name} with score ${aiAnalysis.score}/100`);

      res.json({ lead: updated, aiAnalysis });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Qualification failed' });
    }
  });

  // Bulk actions
  app.post('/api/workspaces/:id/leads/bulk-tag', (req, res) => {
    const { leadIds, tag } = req.body;
    if (!Array.isArray(leadIds) || !tag) return res.status(400).json({ error: 'Invalid payload' });

    leadIds.forEach(lid => {
      const lead = db.getLead(req.params.id, lid);
      if (lead && !lead.tags.includes(tag)) {
        db.updateLead(req.params.id, lid, { tags: [...lead.tags, tag] });
      }
    });
    res.json({ success: true, count: leadIds.length });
  });

  app.post('/api/workspaces/:id/leads/bulk-assign', (req, res) => {
    const { leadIds, agentId, agentName } = req.body;
    if (!Array.isArray(leadIds) || !agentId) return res.status(400).json({ error: 'Invalid payload' });

    leadIds.forEach(lid => {
      db.updateLead(req.params.id, lid, { assignedAgentId: agentId, assignedAgentName: agentName });
    });
    res.json({ success: true, count: leadIds.length });
  });

  app.post('/api/workspaces/:id/leads/bulk-status', (req, res) => {
    const { leadIds, status } = req.body;
    if (!Array.isArray(leadIds) || !status) return res.status(400).json({ error: 'Invalid payload' });

    leadIds.forEach(lid => {
      db.updateLead(req.params.id, lid, { status });
    });
    res.json({ success: true, count: leadIds.length });
  });

  // --- 4. CONVERSATIONS & CHAT SIMULATOR ---
  app.get('/api/workspaces/:id/conversations', (req, res) => {
    const conversations = db.getConversations(req.params.id);
    res.json({ conversations });
  });

  app.get('/api/workspaces/:id/conversations/:leadId', (req, res) => {
    const conv = db.getConversationByLeadId(req.params.id, req.params.leadId);
    res.json({ conversation: conv });
  });

  app.post('/api/workspaces/:id/conversations/:leadId/messages', async (req, res) => {
    try {
      const { id: workspaceId, leadId } = req.params;
      const { content, sender, senderName } = req.body;
      const message = {
        id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        conversationId: `conv_${leadId}`,
        sender: sender || 'agent',
        senderName: senderName || 'Agent',
        content,
        timestamp: new Date().toISOString()
      };

      const result = db.addMessageToConversation(workspaceId, leadId, message);
      if (!result) return res.status(404).json({ error: 'Conversation or lead not found' });

      // If lead replied, trigger cancel of pending drip sequences
      if (sender === 'lead') {
        await processEventTrigger(workspaceId, 'LEAD_REPLIED', result.lead);
      }

      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Dual-Pane AI Conversation Simulator endpoint
  app.post('/api/workspaces/:id/simulator/chat', async (req, res) => {
    try {
      const { id: workspaceId } = req.params;
      const ws = db.getWorkspace(workspaceId);
      if (!ws) return res.status(404).json({ error: 'Workspace not found' });

      const { messages, latestMessage, leadContext } = req.body;
      const assistantResult = await generateSimulatorResponse(messages || [], ws.aiConfig, latestMessage);

      // Run live lead intelligence qualification
      const fullTranscript = [...(messages || []), { sender: 'lead', content: latestMessage }]
        .map(m => `${m.sender}: ${m.content}`)
        .join('\n');

      const liveAnalysis = await qualifyLeadWithAI(fullTranscript, ws.aiConfig, leadContext || {});

      res.json({
        reply: assistantResult.reply,
        shouldOfferAppointment: assistantResult.shouldOfferAppointment,
        extractedSignals: assistantResult.extractedSignals,
        liveAnalysis
      });
    } catch (e: any) {
      console.error('Simulator chat error:', e);
      res.status(500).json({ error: e.message || 'Simulator error' });
    }
  });

  // --- 5. APPOINTMENTS ---
  app.get('/api/workspaces/:id/appointments', (req, res) => {
    const appointments = db.getAppointments(req.params.id);
    res.json({ appointments });
  });

  app.post('/api/workspaces/:id/appointments', async (req, res) => {
    try {
      const workspaceId = req.params.id;
      const aptData = {
        ...req.body,
        id: req.body.id || `apt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        workspaceId,
        createdAt: new Date().toISOString()
      };

      const created = db.createAppointment(aptData);
      const lead = db.getLead(workspaceId, created.leadId);
      if (lead) {
        await processEventTrigger(workspaceId, 'APPOINTMENT_BOOKED', lead, { appointment: created });
      }

      res.status(201).json({ appointment: created });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/workspaces/:id/appointments/:aptId', (req, res) => {
    const updated = db.updateAppointment(req.params.id, req.params.aptId, req.body);
    if (!updated) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ appointment: updated });
  });

  // --- 6. WORKFLOWS ---
  app.get('/api/workspaces/:id/workflows', (req, res) => {
    const workflows = db.getWorkflows(req.params.id);
    res.json({ workflows });
  });

  app.post('/api/workspaces/:id/workflows', (req, res) => {
    const wf = {
      ...req.body,
      id: req.body.id || `wf_${Date.now()}`,
      workspaceId: req.params.id,
      createdAt: new Date().toISOString(),
      executionCount: 0
    };
    const saved = db.saveWorkflow(wf);
    res.status(201).json({ workflow: saved });
  });

  app.put('/api/workspaces/:id/workflows/:wfId/toggle', (req, res) => {
    const { isEnabled } = req.body;
    const updated = db.toggleWorkflow(req.params.id, req.params.wfId, !!isEnabled);
    if (!updated) return res.status(404).json({ error: 'Workflow not found' });
    res.json({ workflow: updated });
  });

  app.get('/api/workspaces/:id/workflow-executions', (req, res) => {
    const executions = db.getWorkflowExecutions(req.params.id);
    res.json({ executions });
  });

  // --- 7. NOTIFICATIONS & AUDIT & INTEGRATIONS ---
  app.get('/api/workspaces/:id/notifications', (req, res) => {
    const notifications = db.getNotifications(req.params.id);
    res.json({ notifications });
  });

  app.put('/api/workspaces/:id/notifications/:notifId/read', (req, res) => {
    const success = db.markNotificationAsRead(req.params.id, req.params.notifId);
    res.json({ success });
  });

  app.post('/api/workspaces/:id/notifications/read-all', (req, res) => {
    db.markAllNotificationsAsRead(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/workspaces/:id/audit-logs', (req, res) => {
    const auditLogs = db.getAuditLogs(req.params.id);
    res.json({ auditLogs });
  });

  app.get('/api/workspaces/:id/integrations', (req, res) => {
    const integrations = db.getIntegrations(req.params.id);
    res.json({ integrations });
  });

  app.put('/api/workspaces/:id/integrations/:intId', (req, res) => {
    const updated = db.updateIntegration(req.params.id, req.params.intId, req.body);
    if (!updated) return res.status(404).json({ error: 'Integration not found' });
    res.json({ integration: updated });
  });

  // --- 8. AI DRAFTS & EXECUTIVE INSIGHTS ---
  app.post('/api/workspaces/:id/ai/followup-draft', async (req, res) => {
    try {
      const { leadId, step } = req.body;
      const ws = db.getWorkspace(req.params.id);
      const lead = db.getLead(req.params.id, leadId);
      if (!ws || !lead) return res.status(404).json({ error: 'Lead or workspace not found' });

      const draft = await generateAIFollowUpDraft(lead, ws.aiConfig, step || 1);
      res.json(draft);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/workspaces/:id/ai/reactivate-draft', async (req, res) => {
    try {
      const { leadId } = req.body;
      const ws = db.getWorkspace(req.params.id);
      const lead = db.getLead(req.params.id, leadId);
      if (!ws || !lead) return res.status(404).json({ error: 'Lead or workspace not found' });

      const draft = await generateReactivationDraft(lead, ws.aiConfig);
      res.json(draft);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/workspaces/:id/ai/insights', async (req, res) => {
    try {
      const ws = db.getWorkspace(req.params.id);
      if (!ws) return res.status(404).json({ error: 'Workspace not found' });

      const leads = db.getLeads(req.params.id);
      const appointments = db.getAppointments(req.params.id);

      const totalLeads = leads.length;
      const hotCount = leads.filter(l => l.temperature === 'HOT').length;
      const warmCount = leads.filter(l => l.temperature === 'WARM').length;
      const coldCount = leads.filter(l => l.temperature === 'COLD').length;
      const wonCount = leads.filter(l => l.status === 'WON').length;
      const appointmentsCount = appointments.length;
      const conversionRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

      // Calculate sources
      const srcMap: Record<string, number> = {};
      leads.forEach(l => { srcMap[l.source] = (srcMap[l.source] || 0) + 1; });
      const topSources = Object.entries(srcMap).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);

      // Calculate services
      const srvMap: Record<string, number> = {};
      leads.forEach(l => { if (l.service) srvMap[l.service] = (srvMap[l.service] || 0) + 1; });
      const topServices = Object.entries(srvMap).map(([service, count]) => ({ service, count })).sort((a, b) => b.count - a.count);

      const insights = await generateExecutiveInsights({
        totalLeads,
        hotCount,
        warmCount,
        coldCount,
        appointmentsCount,
        wonCount,
        conversionRate,
        topSources,
        topServices
      }, ws.aiConfig);

      res.json({ insights, metrics: { totalLeads, hotCount, warmCount, coldCount, appointmentsCount, wonCount, conversionRate } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 9. INBOUND WEBHOOKS ---
  app.post('/api/webhooks/leads', async (req, res) => {
    try {
      const idempotencyKey = (req.headers['x-idempotency-key'] as string) || (req.body.idempotency_key as string) || `wh_${req.body.email || req.body.phone || Date.now()}`;
      
      if (db.isWebhookProcessed(idempotencyKey)) {
        return res.status(200).json({ status: 'duplicate_ignored', message: 'Webhook event already processed (idempotent response)' });
      }

      const workspaceId = req.body.workspace_id || req.query.workspace_id || 'ws_northstar_solar_demo';
      const ws = db.getWorkspace(workspaceId as string);
      if (!ws) return res.status(404).json({ error: 'Workspace not found' });

      const rawLead = req.body;
      const convoText = rawLead.message || rawLead.notes || rawLead.requirements || `Inbound webhook lead submission for ${rawLead.service || 'consultation'}`;
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
        assignedAgentId: ws.members[2]?.userId || ws.members[0]?.userId,
        assignedAgentName: ws.members[2]?.name || ws.members[0]?.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Webhook Ingestion', aiAnalysis.temperature === 'HOT' ? 'Hot Alert' : 'Standard'],
        aiAnalysis
      };

      const saved = db.createLead(lead, 'Webhook API');
      await processEventTrigger(ws.id, 'LEAD_CREATED', saved);

      res.status(201).json({ status: 'success', lead_id: saved.id, score: saved.score, temperature: saved.temperature });
    } catch (e: any) {
      console.error('Webhook error:', e);
      res.status(500).json({ error: e.message });
    }
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LEADFORGE AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
