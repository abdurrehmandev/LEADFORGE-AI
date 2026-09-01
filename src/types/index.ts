export type UserRole = 'OWNER' | 'ADMIN' | 'AGENT' | 'VIEWER';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'UNQUALIFIED'
  | 'APPOINTMENT_BOOKED'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST'
  | 'REACTIVATION';

export type LeadTemperature = 'HOT' | 'WARM' | 'COLD';

export type AutomationMode = 'MANUAL' | 'ASSISTED' | 'AUTOMATIC';

export type IndustryType =
  | 'SOLAR'
  | 'REAL_ESTATE'
  | 'DENTAL'
  | 'CLINIC'
  | 'IMMIGRATION'
  | 'CONSTRUCTION'
  | 'SOFTWARE_AGENCY'
  | 'PROFESSIONAL_SERVICES';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  currentWorkspaceId: string;
}

export interface WorkspaceMember {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  joinedAt: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  invitedByName: string;
  createdAt: string;
  expiresAt: string;
  tokenHash?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
}

export interface BusinessAIConfig {
  businessName: string;
  industry: IndustryType;
  description: string;
  services: {
    id: string;
    name: string;
    description: string;
    typicalBudgetRange?: string;
  }[];
  locationsServed: string[];
  businessHours: {
    start: string; // e.g. "09:00"
    end: string;   // e.g. "18:00"
    days: string[]; // ["Mon", "Tue", "Wed", "Thu", "Fri"]
    timezone: string;
  };
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };
  toneOfVoice: 'professional' | 'friendly' | 'concise' | 'consultative' | 'urgent';
  qualificationQuestions: string[];
  disqualifyingCriteria: string[];
  leadScoringWeights: ScoringWeights;
  appointmentRules: {
    slotDurationMinutes: number;
    bufferMinutes: number;
    requireApproval: boolean;
    autoOfferSlots: boolean;
  };
  followUpRules: {
    maxFollowUps: number;
    stopOnReply: boolean;
    stopOnBooking: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
  escalationRules: {
    autoEscalateNegativeSentiment: boolean;
    autoEscalateHighValueBudget: number;
    autoEscalateUncertainAI: boolean;
  };
}

export interface ScoringWeights {
  intent: number; // default +20
  budgetFit: number; // default +15
  urgency: number; // default +15
  serviceMatch: number; // default +15
  locationMatch: number; // default +10
  requirementCompleteness: number; // default +10
  engagement: number; // default +10
  appointmentIntent: number; // default +5
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  industry: IndustryType;
  ownerId: string;
  members: WorkspaceMember[];
  aiConfig: BusinessAIConfig;
  automationMode: AutomationMode;
  automationsPaused: boolean;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface LeadRequirements {
  [key: string]: string | number | boolean | undefined;
}

export interface AIAnalysis {
  intent: string;
  qualification: 'qualified' | 'partially_qualified' | 'unqualified' | 'needs_human_review';
  score: number;
  temperature: LeadTemperature;
  confidence: number;
  requirements: Record<string, string>;
  budget?: string;
  location?: string;
  urgency?: 'high' | 'medium' | 'low';
  missingInformation: string[];
  recommendedNextAction:
    | 'BOOK_APPOINTMENT'
    | 'SEND_FOLLOW_UP'
    | 'HUMAN_REVIEW'
    | 'ASK_QUALIFYING_QUESTION'
    | 'MARK_DISQUALIFIED'
    | 'SEND_PRICE_RANGE_ESTIMATE';
  reasoningSummary: string;
  languageDetected?: 'English' | 'Urdu' | 'Roman Urdu' | 'Other';
  analyzedAt: string;
}

export interface Lead {
  id: string;
  workspaceId: string;
  name: string;
  email?: string;
  phone?: string;
  source: 'Website Widget' | 'WhatsApp' | 'Gmail' | 'Meta Ads' | 'Referral' | 'Manual' | 'Webhook';
  status: LeadStatus;
  temperature: LeadTemperature;
  score: number;
  service?: string;
  location?: string;
  budget?: string;
  requirements?: Record<string, string>;
  urgency?: 'high' | 'medium' | 'low';
  preferredContactMethod?: 'whatsapp' | 'email' | 'phone' | 'sms';
  assignedAgentId?: string;
  assignedAgentName?: string;
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  appointmentId?: string;
  tags: string[];
  notes?: string;
  customFields?: Record<string, string>;
  aiAnalysis?: AIAnalysis;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'lead' | 'assistant' | 'agent' | 'system';
  senderName?: string;
  content: string;
  timestamp: string;
  requiresApproval?: boolean;
  isApproved?: boolean;
  metadata?: {
    aiGenerated?: boolean;
    confidence?: number;
    actionTriggered?: string;
  };
}

export interface Conversation {
  id: string;
  workspaceId: string;
  leadId: string;
  leadName: string;
  channel: 'widget' | 'whatsapp' | 'email' | 'sms' | 'simulator';
  status: 'active' | 'waiting_lead' | 'waiting_agent' | 'closed';
  messages: Message[];
  updatedAt: string;
  unreadByAgent: boolean;
}

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Appointment {
  id: string;
  workspaceId: string;
  leadId: string;
  leadName: string;
  leadEmail?: string;
  leadPhone?: string;
  service: string;
  assignedAgentId: string;
  assignedAgentName: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  status: AppointmentStatus;
  locationType: 'video' | 'phone' | 'in_person';
  locationDetails?: string;
  notes?: string;
  reminderSent?: boolean;
  createdAt: string;
}

export type WorkflowTriggerType =
  | 'LEAD_CREATED'
  | 'LEAD_UPDATED'
  | 'SCORE_CHANGED'
  | 'TEMPERATURE_CHANGED'
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_CANCELLED'
  | 'LEAD_INACTIVE_24H'
  | 'LEAD_INACTIVE_3D'
  | 'LEAD_REPLIED'
  | 'MANUAL_TRIGGER';

export interface WorkflowCondition {
  field: 'score' | 'temperature' | 'status' | 'source' | 'urgency' | 'service';
  operator: 'equals' | 'greater_than' | 'less_than' | 'in' | 'not_equals';
  value: string | number | string[];
}

export interface WorkflowAction {
  type:
    | 'UPDATE_STATUS'
    | 'MARK_TEMPERATURE'
    | 'ASSIGN_AGENT'
    | 'CREATE_TASK'
    | 'DRAFT_AI_FOLLOWUP'
    | 'SEND_NOTIFICATION'
    | 'SCHEDULE_FOLLOWUP'
    | 'OFFER_APPOINTMENT'
    | 'ADD_TAG';
  parameters: Record<string, any>;
}

export interface Workflow {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  trigger: WorkflowTriggerType;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isEnabled: boolean;
  executionCount: number;
  lastExecutedAt?: string;
  createdAt: string;
}

export interface WorkflowExecution {
  id: string;
  workspaceId: string;
  workflowId: string;
  workflowName: string;
  leadId: string;
  leadName: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'PENDING_APPROVAL';
  reason?: string;
  executedActions: string[];
  timestamp: string;
}

export interface Notification {
  id: string;
  workspaceId: string;
  title: string;
  message: string;
  type: 'HOT_LEAD' | 'APPOINTMENT' | 'FOLLOWUP_OVERDUE' | 'AI_APPROVAL' | 'WORKFLOW_ALERT' | 'SYSTEM';
  link?: string;
  leadId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  action:
    | 'LOGIN'
    | 'LEAD_CREATED'
    | 'LEAD_UPDATED'
    | 'LEAD_ASSIGNED'
    | 'AI_QUALIFICATION'
    | 'WORKFLOW_TRIGGERED'
    | 'WORKFLOW_COMPLETED'
    | 'WORKFLOW_FAILED'
    | 'WORKFLOW_SAVED'
    | 'APPOINTMENT_CREATED'
    | 'APPOINTMENT_UPDATED'
    | 'APPOINTMENT_CANCELLED'
    | 'AUTOMATION_TOGGLED'
    | 'INTEGRATION_CONFIGURED'
    | 'SETTINGS_CHANGED'
    | 'MEMBER_ADDED'
    | 'MEMBER_REMOVED'
    | 'REACTIVATION_SENT';
  entityType: 'lead' | 'workflow' | 'appointment' | 'integration' | 'settings' | 'session';
  entityId?: string;
  details: string;
  timestamp: string;
}

export interface IntegrationConfig {
  id: string;
  workspaceId: string;
  type: 'GMAIL' | 'GOOGLE_CALENDAR' | 'WHATSAPP' | 'META' | 'TWILIO_SMS' | 'WEBHOOK';
  name: string;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'MOCK_ACTIVE' | 'ERROR';
  description: string;
  icon: string;
  apiKeyMasked?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  lastSyncAt?: string;
  config: Record<string, any>;
}

export interface IndustryTemplate {
  id: IndustryType;
  name: string;
  icon: string;
  tagline: string;
  services: { id: string; name: string; description: string; typicalBudgetRange: string }[];
  qualificationQuestions: string[];
  disqualifyingCriteria: string[];
  defaultScoringFactors: ScoringWeights;
  commonIntents: string[];
  defaultFollowUpDays: number[];
  recommendedAppointmentDuration: number;
  sampleProspectPersonas: {
    title: string;
    language: 'English' | 'Urdu' | 'Roman Urdu';
    openingMessage: string;
    context: string;
  }[];
}
