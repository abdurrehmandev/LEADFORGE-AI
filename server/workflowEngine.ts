import { db } from './storage';
import { Lead, Workflow, WorkflowExecution, WorkflowTriggerType } from '../src/types';
import { generateAIFollowUpDraft } from './gemini';

export async function processEventTrigger(
  workspaceId: string,
  trigger: WorkflowTriggerType,
  lead: Lead,
  extraPayload?: Record<string, any>
): Promise<WorkflowExecution[]> {
  const workspace = db.getWorkspace(workspaceId);
  if (!workspace) return [];

  // Check if workspace owner has paused all automations
  if (workspace.automationsPaused) {
    console.log(`[Workflow Engine] Automations paused for workspace ${workspaceId}. Skipping trigger ${trigger}.`);
    return [];
  }

  const workflows = db.getWorkflows(workspaceId).filter((w) => w.isEnabled && w.trigger === trigger);
  const results: WorkflowExecution[] = [];

  for (const wf of workflows) {
    const isMatch = checkConditions(wf, lead);
    if (!isMatch) continue;

    const executedActions: string[] = [];
    let status: WorkflowExecution['status'] = 'SUCCESS';
    let reason: string | undefined;

    for (const action of wf.actions) {
      try {
        switch (action.type) {
          case 'UPDATE_STATUS': {
            const newStatus = action.parameters.status;
            if (newStatus) {
              db.updateLead(workspaceId, lead.id, { status: newStatus }, `Workflow: ${wf.name}`);
              executedActions.push(`Updated status to ${newStatus}`);
            }
            break;
          }
          case 'MARK_TEMPERATURE': {
            const newTemp = action.parameters.temperature;
            if (newTemp) {
              db.updateLead(workspaceId, lead.id, { temperature: newTemp }, `Workflow: ${wf.name}`);
              executedActions.push(`Marked temperature as ${newTemp}`);
            }
            break;
          }
          case 'ASSIGN_AGENT': {
            const agentId = action.parameters.agentId;
            const agentName = action.parameters.agentName || 'Assigned Specialist';
            db.updateLead(workspaceId, lead.id, { assignedAgentId: agentId, assignedAgentName: agentName }, `Workflow: ${wf.name}`);
            executedActions.push(`Assigned to ${agentName}`);
            break;
          }
          case 'ADD_TAG': {
            const tag = action.parameters.tag;
            if (tag && !lead.tags.includes(tag)) {
              const updatedTags = [...lead.tags, tag];
              db.updateLead(workspaceId, lead.id, { tags: updatedTags }, `Workflow: ${wf.name}`);
              executedActions.push(`Added tag "${tag}"`);
            }
            break;
          }
          case 'SEND_NOTIFICATION': {
            const msg = action.parameters.message || `Automated alert for ${lead.name}`;
            db.createNotification({
              id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              workspaceId,
              title: action.parameters.title || `Workflow: ${wf.name}`,
              message: `${msg} — Lead: ${lead.name} (${lead.service || 'General'})`,
              type: lead.temperature === 'HOT' ? 'HOT_LEAD' : 'WORKFLOW_ALERT',
              leadId: lead.id,
              isRead: false,
              createdAt: new Date().toISOString()
            });
            executedActions.push(`Dispatched notification: "${msg}"`);
            break;
          }
          case 'SCHEDULE_FOLLOWUP': {
            const delayHours = action.parameters.delayHours || 24;
            const nextFollowUp = new Date(Date.now() + delayHours * 3600000).toISOString();
            db.updateLead(workspaceId, lead.id, { nextFollowUpAt: nextFollowUp }, `Workflow: ${wf.name}`);
            executedActions.push(`Scheduled follow-up for ${new Date(nextFollowUp).toLocaleString()}`);
            break;
          }
          case 'DRAFT_AI_FOLLOWUP': {
            if (workspace.automationMode === 'MANUAL' || workspace.automationMode === 'ASSISTED') {
              const draft = await generateAIFollowUpDraft(lead, workspace.aiConfig);
              db.createNotification({
                id: `notif_${Date.now()}_draft`,
                workspaceId,
                title: `🤖 AI Follow-up Draft Ready for Approval`,
                message: `Outreach draft prepared for ${lead.name}: "${draft.message.slice(0, 75)}..."`,
                type: 'AI_APPROVAL',
                leadId: lead.id,
                isRead: false,
                createdAt: new Date().toISOString()
              });
              executedActions.push(`AI drafted follow-up (queued for human approval: "${draft.subject}")`);
              status = 'PENDING_APPROVAL';
              reason = `${workspace.automationMode} Mode: Outbound message requires agent review.`;
            } else {
              // AUTOMATIC mode
              const draft = await generateAIFollowUpDraft(lead, workspace.aiConfig);
              db.addMessageToConversation(workspaceId, lead.id, {
                id: `msg_auto_${Date.now()}`,
                conversationId: `conv_${lead.id}`,
                sender: 'assistant',
                content: draft.message,
                timestamp: new Date().toISOString(),
                metadata: { aiGenerated: true, actionTriggered: wf.name }
              });
              executedActions.push(`AI automatically dispatched follow-up to ${lead.name}`);
            }
            break;
          }
          default:
            executedActions.push(`Processed action ${action.type}`);
        }
      } catch (err: any) {
        status = 'FAILED';
        reason = err.message || 'Unknown action failure';
        executedActions.push(`Action failed: ${err.message}`);
      }
    }

    // Update workflow execution count
    wf.executionCount = (wf.executionCount || 0) + 1;
    wf.lastExecutedAt = new Date().toISOString();
    db.saveWorkflow(wf);

    const execution: WorkflowExecution = {
      id: `wfe_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      workspaceId,
      workflowId: wf.id,
      workflowName: wf.name,
      leadId: lead.id,
      leadName: lead.name,
      status,
      reason,
      executedActions,
      timestamp: new Date().toISOString()
    };

    db.recordWorkflowExecution(execution);
    results.push(execution);
  }

  return results;
}

function checkConditions(workflow: Workflow, lead: Lead): boolean {
  if (!workflow.conditions || workflow.conditions.length === 0) {
    return true;
  }

  for (const cond of workflow.conditions) {
    let leadVal: any = (lead as any)[cond.field];
    if (leadVal === undefined) return false;

    switch (cond.operator) {
      case 'equals':
        if (leadVal !== cond.value) return false;
        break;
      case 'not_equals':
        if (leadVal === cond.value) return false;
        break;
      case 'greater_than':
        if (Number(leadVal) <= Number(cond.value)) return false;
        break;
      case 'less_than':
        if (Number(leadVal) >= Number(cond.value)) return false;
        break;
      case 'in':
        if (Array.isArray(cond.value)) {
          if (!cond.value.includes(leadVal)) return false;
        }
        break;
    }
  }

  return true;
}
