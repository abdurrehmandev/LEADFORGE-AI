import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid URL parameters',
        details: result.error.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req.params = result.data as any;
    next();
  };
};

// Schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  industry: z.enum([
    'SOLAR',
    'REAL_ESTATE',
    'DENTAL',
    'CLINIC',
    'IMMIGRATION',
    'CONSTRUCTION',
    'SOFTWARE_AGENCY',
    'PROFESSIONAL_SERVICES',
  ]),
  slug: z.string().optional(),
  aiConfig: z.object({
    businessName: z.string(),
    industry: z.string(),
    description: z.string(),
    services: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        typicalBudgetRange: z.string().optional(),
      })
    ).optional().default([]),
    locationsServed: z.array(z.string()).optional().default([]),
    businessHours: z.object({
      start: z.string(),
      end: z.string(),
      days: z.array(z.string()),
      timezone: z.string(),
    }).optional(),
    contactInfo: z.object({
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
    }).optional(),
    toneOfVoice: z.enum(['professional', 'friendly', 'concise', 'consultative', 'urgent']).optional().default('professional'),
    qualificationQuestions: z.array(z.string()).optional().default([]),
    disqualifyingCriteria: z.array(z.string()).optional().default([]),
    leadScoringWeights: z.record(z.string(), z.number()).optional(),
    appointmentRules: z.object({
      slotDurationMinutes: z.number(),
      bufferMinutes: z.number(),
      requireApproval: z.boolean(),
      autoOfferSlots: z.boolean(),
    }).optional(),
    followUpRules: z.object({
      maxFollowUps: z.number(),
      stopOnReply: z.boolean(),
      stopOnBooking: z.boolean(),
      quietHoursStart: z.string(),
      quietHoursEnd: z.string(),
    }).optional(),
    escalationRules: z.object({
      autoEscalateNegativeSentiment: z.boolean(),
      autoEscalateHighValueBudget: z.number(),
      autoEscalateUncertainAI: z.boolean(),
    }).optional(),
  }),
  automationMode: z.enum(['MANUAL', 'ASSISTED', 'AUTOMATIC']).optional().default('ASSISTED'),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  industry: z.enum([
    'SOLAR',
    'REAL_ESTATE',
    'DENTAL',
    'CLINIC',
    'IMMIGRATION',
    'CONSTRUCTION',
    'SOFTWARE_AGENCY',
    'PROFESSIONAL_SERVICES',
  ]).optional(),
  aiConfig: z.record(z.string(), z.any()).optional(),
  automationMode: z.enum(['MANUAL', 'ASSISTED', 'AUTOMATIC']).optional(),
  automationsPaused: z.boolean().optional(),
});

export const createLeadSchema = z.object({
  name: z.string().min(1, 'Lead name is required').max(100),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
  source: z.string().max(50).optional().default('Manual'),
  status: z.enum([
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'UNQUALIFIED',
    'APPOINTMENT_BOOKED',
    'NEGOTIATION',
    'WON',
    'LOST',
    'REACTIVATION',
  ]).optional().default('NEW'),
  service: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  budget: z.string().max(100).optional(),
  urgency: z.enum(['immediate', 'this_week', 'this_month', 'researching', 'unknown']).optional().default('unknown'),
  preferredContactMethod: z.enum(['whatsapp', 'sms', 'email', 'phone']).optional().default('whatsapp'),
  assignedAgentId: z.string().optional(),
  assignedAgentName: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  requirements: z.record(z.string(), z.any()).optional().default({}),
  notes: z.string().max(2000).optional(),
  creatorName: z.string().optional(),
});

export const updateLeadSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
  status: z.enum([
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'UNQUALIFIED',
    'APPOINTMENT_BOOKED',
    'NEGOTIATION',
    'WON',
    'LOST',
    'REACTIVATION',
  ]).optional(),
  temperature: z.enum(['HOT', 'WARM', 'COLD']).optional(),
  score: z.number().min(0).max(100).optional(),
  service: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  budget: z.string().max(100).optional(),
  urgency: z.enum(['immediate', 'this_week', 'this_month', 'researching', 'unknown']).optional(),
  preferredContactMethod: z.enum(['whatsapp', 'sms', 'email', 'phone']).optional(),
  assignedAgentId: z.string().optional(),
  assignedAgentName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  requirements: z.record(z.string(), z.any()).optional(),
  notes: z.string().max(2000).optional(),
  aiAnalysis: z.record(z.string(), z.any()).optional(),
});

export const createAppointmentSchema = z.object({
  leadId: z.string().min(1),
  leadName: z.string().min(1),
  service: z.string().min(1),
  assignedAgentId: z.string().optional().default('usr_agent'),
  assignedAgentName: z.string().optional().default('Assigned Agent'),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  locationType: z.enum(['video', 'in_person', 'phone']).optional().default('video'),
  locationDetails: z.string().optional().default('Online Consultation Room'),
  notes: z.string().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional().default('SCHEDULED'),
});

export const updateAppointmentSchema = z.object({
  service: z.string().optional(),
  assignedAgentId: z.string().optional(),
  assignedAgentName: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  locationType: z.enum(['video', 'in_person', 'phone']).optional(),
  locationDetails: z.string().optional(),
  notes: z.string().optional(),
});

export const saveWorkflowSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  trigger: z.enum([
    'LEAD_CREATED',
    'SCORE_CHANGED',
    'STATUS_CHANGED',
    'APPOINTMENT_BOOKED',
    'INACTIVITY_TIMEOUT',
    'LEAD_REPLIED',
    'TEMPERATURE_CHANGED',
  ]),
  conditions: z.array(
    z.object({
      id: z.string(),
      field: z.string(),
      operator: z.string(),
      value: z.any(),
    })
  ).default([]),
  actions: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      config: z.record(z.string(), z.any()),
      delayMinutes: z.number().optional(),
    })
  ).default([]),
  isEnabled: z.boolean().default(true),
});

export const addMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['OWNER', 'ADMIN', 'AGENT', 'VIEWER']),
});

export const updateMemberSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'AGENT', 'VIEWER']),
});
