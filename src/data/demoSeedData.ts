import { Workspace, Lead, Conversation, Appointment, Workflow, WorkflowExecution, Notification, AuditLog, IntegrationConfig, AIAnalysis } from '../types';
import { INDUSTRY_TEMPLATES } from './industryTemplates';

export const DEMO_WORKSPACE_ID = 'ws_northstar_solar_demo';

export const DEMO_WORKSPACE: Workspace = {
  id: DEMO_WORKSPACE_ID,
  name: 'NorthStar Solar & Energy Solutions',
  slug: 'northstar-solar',
  industry: 'SOLAR',
  ownerId: 'usr_owner_1',
  members: [
    { userId: 'usr_owner_1', name: 'Zainab Ahmed', email: 'zainab@northstarsolar.io', role: 'OWNER', joinedAt: '2026-01-10T08:00:00Z' },
    { userId: 'usr_agent_2', name: 'Tariq Malik', email: 'tariq.m@northstarsolar.io', role: 'ADMIN', joinedAt: '2026-01-15T09:00:00Z' },
    { userId: 'usr_agent_3', name: 'Sara Khan', email: 'sara.k@northstarsolar.io', role: 'AGENT', joinedAt: '2026-02-01T10:00:00Z' },
    { userId: 'usr_agent_4', name: 'Bilal Qureshi', email: 'bilal.q@northstarsolar.io', role: 'AGENT', joinedAt: '2026-02-10T11:00:00Z' },
  ],
  aiConfig: {
    businessName: 'NorthStar Solar & Energy Solutions',
    industry: 'SOLAR',
    description: 'Leading tier-1 solar EPC company delivering residential, commercial on-grid, and industrial hybrid energy systems with 25-year tier-1 warranties.',
    services: INDUSTRY_TEMPLATES.SOLAR.services,
    locationsServed: ['Islamabad', 'Rawalpindi', 'Lahore', 'Peshawar', 'Faisalabad', 'Karachi'],
    businessHours: {
      start: '09:00',
      end: '18:30',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      timezone: 'Asia/Karachi'
    },
    contactInfo: {
      phone: '+92 (051) 884-2900',
      email: 'enquiries@northstarsolar.io',
      address: 'Plot 42, Blue Area Commercial Tower, Islamabad'
    },
    toneOfVoice: 'professional',
    qualificationQuestions: INDUSTRY_TEMPLATES.SOLAR.qualificationQuestions,
    disqualifyingCriteria: INDUSTRY_TEMPLATES.SOLAR.disqualifyingCriteria,
    leadScoringWeights: INDUSTRY_TEMPLATES.SOLAR.defaultScoringFactors,
    appointmentRules: {
      slotDurationMinutes: 30,
      bufferMinutes: 15,
      requireApproval: false,
      autoOfferSlots: true,
    },
    followUpRules: {
      maxFollowUps: 4,
      stopOnReply: true,
      stopOnBooking: true,
      quietHoursStart: '20:00',
      quietHoursEnd: '08:30',
    },
    escalationRules: {
      autoEscalateNegativeSentiment: true,
      autoEscalateHighValueBudget: 50000,
      autoEscalateUncertainAI: true,
    },
  },
  automationMode: 'ASSISTED',
  automationsPaused: false,
  createdAt: '2026-01-10T08:00:00Z',
  updatedAt: '2026-08-30T10:00:00Z',
  isDemo: true,
};

// 50 realistic leads across all stages and temperatures
export const DEMO_LEADS: Lead[] = [
  {
    id: 'lead_101',
    workspaceId: DEMO_WORKSPACE_ID,
    name: 'Hamza Farooq',
    email: 'hamza.farooq@outlook.com',
    phone: '+92 300 5519283',
    source: 'Website Widget',
    status: 'APPOINTMENT_BOOKED',
    temperature: 'HOT',
    score: 94,
    service: 'Hybrid & Battery Storage',
    location: 'Islamabad (Sector F-7/2)',
    budget: '$14,500',
    requirements: { propertyType: '1 Kanal Villa', systemSize: '15kW Hybrid', backupNeed: '15kWh Lithium', timeline: 'Immediate (within 7 days)' },
    urgency: 'high',
    preferredContactMethod: 'whatsapp',
    assignedAgentId: 'usr_agent_3',
    assignedAgentName: 'Sara Khan',
    createdAt: '2026-08-28T09:15:00Z',
    updatedAt: '2026-08-31T14:20:00Z',
    lastContactedAt: '2026-08-31T14:20:00Z',
    appointmentId: 'apt_201',
    tags: ['High Value', 'Ready to Sign', 'Lithium Battery'],
    aiAnalysis: {
      intent: 'solar_installation_quote',
      qualification: 'qualified',
      score: 94,
      temperature: 'HOT',
      confidence: 0.96,
      requirements: { propertyType: 'Residential 1-Kanal', capacity: '15kW', battery: 'Lithium 15kWh' },
      budget: '$14,500',
      location: 'Islamabad',
      urgency: 'high',
      missingInformation: [],
      recommendedNextAction: 'BOOK_APPOINTMENT',
      reasoningSummary: 'Prospect owns high-consumption villa with heavy AC loads, budget matches premium hybrid tier, requested urgent site engineer visit.',
      languageDetected: 'English',
      analyzedAt: '2026-08-28T09:20:00Z'
    }
  },
  {
    id: 'lead_102',
    workspaceId: DEMO_WORKSPACE_ID,
    name: 'M. Kashif Textiles Ltd',
    email: 'kashif.engg@textilespk.com',
    phone: '+92 321 4488210',
    source: 'Meta Ads',
    status: 'NEGOTIATION',
    temperature: 'HOT',
    score: 91,
    service: 'Commercial & Industrial Solar',
    location: 'Faisalabad Industrial Estate',
    budget: '$120,000',
    requirements: { propertyType: 'Spinning Mill Shed', systemSize: '200kW On-Grid', monthlyBill: 'Rs 1,400,000' },
    urgency: 'high',
    preferredContactMethod: 'phone',
    assignedAgentId: 'usr_agent_2',
    assignedAgentName: 'Tariq Malik',
    createdAt: '2026-08-20T11:00:00Z',
    updatedAt: '2026-08-30T16:00:00Z',
    lastContactedAt: '2026-08-30T16:00:00Z',
    tags: ['Commercial', 'Corporate', 'High ROI'],
    aiAnalysis: {
      intent: 'commercial_roi_estimate',
      qualification: 'qualified',
      score: 91,
      temperature: 'HOT',
      confidence: 0.94,
      requirements: { property: 'Industrial Factory Roof', capacity: '200kW' },
      budget: '$120,000',
      location: 'Faisalabad',
      urgency: 'high',
      missingInformation: ['Electrical Single Line Diagram'],
      recommendedNextAction: 'BOOK_APPOINTMENT',
      reasoningSummary: 'Factory director looking to slash high industrial peak tariff, approved CapEx budget for Q3.',
      languageDetected: 'English',
      analyzedAt: '2026-08-20T11:05:00Z'
    }
  },
  {
    id: 'lead_103',
    workspaceId: DEMO_WORKSPACE_ID,
    name: 'Dr. Arsalan Sheikh',
    email: 'dr.arsalan@sheikhclinic.com',
    phone: '+92 333 9110294',
    source: 'WhatsApp',
    status: 'QUALIFIED',
    temperature: 'HOT',
    score: 88,
    service: 'Residential On-Grid Solar',
    location: 'Peshawar (Hayatabad Phase 4)',
    budget: '$7,800',
    requirements: { propertyType: 'House 14 Marla', systemSize: '10kW On-Grid Net Metering', timeline: 'Within 2 weeks' },
    urgency: 'high',
    preferredContactMethod: 'whatsapp',
    assignedAgentId: 'usr_agent_3',
    assignedAgentName: 'Sara Khan',
    createdAt: '2026-08-29T14:30:00Z',
    updatedAt: '2026-08-31T09:00:00Z',
    lastContactedAt: '2026-08-30T12:00:00Z',
    nextFollowUpAt: '2026-09-02T10:00:00Z',
    tags: ['Doctor', 'Hayatabad', 'Net Metering'],
    aiAnalysis: {
      intent: 'net_metering_consultation',
      qualification: 'qualified',
      score: 88,
      temperature: 'HOT',
      confidence: 0.92,
      requirements: { system: '10kW Net Metered' },
      budget: '$7,800',
      location: 'Peshawar',
      urgency: 'high',
      missingInformation: ['WAPDA Reference Number for Net Metering Feasibility'],
      recommendedNextAction: 'SEND_FOLLOW_UP',
      reasoningSummary: 'Sent enquiry via WhatsApp in Roman Urdu, provided bill copy of Rs 72k/mo, keen on Longi panels.',
      languageDetected: 'Roman Urdu',
      analyzedAt: '2026-08-29T14:35:00Z'
    }
  },
  {
    id: 'lead_104',
    workspaceId: DEMO_WORKSPACE_ID,
    name: 'Malik Jahangir',
    email: 'jahangir.agri@gmail.com',
    phone: '+92 301 7765219',
    source: 'Website Widget',
    status: 'CONTACTED',
    temperature: 'WARM',
    score: 68,
    service: 'Solar Tube-well / Agricultural',
    location: 'Sargodha Farm Area',
    budget: '$16,000',
    requirements: { propertyType: 'Agricultural Farm', systemSize: '25HP Solar Water Pump', depth: '180 feet' },
    urgency: 'medium',
    preferredContactMethod: 'phone',
    assignedAgentId: 'usr_agent_4',
    assignedAgentName: 'Bilal Qureshi',
    createdAt: '2026-08-27T16:40:00Z',
    updatedAt: '2026-08-30T10:15:00Z',
    lastContactedAt: '2026-08-28T11:00:00Z',
    nextFollowUpAt: '2026-09-01T15:00:00Z',
    tags: ['Agriculture', 'Tube-well', 'Sargodha'],
    aiAnalysis: {
      intent: 'solar_installation_quote',
      qualification: 'partially_qualified',
      score: 68,
      temperature: 'WARM',
      confidence: 0.86,
      requirements: { pump: '25HP Submersible' },
      budget: '$16,000',
      location: 'Sargodha',
      urgency: 'medium',
      missingInformation: ['Exact water delivery pipe diameter', 'AC VFD inverter preference'],
      recommendedNextAction: 'ASK_QUALIFYING_QUESTION',
      reasoningSummary: 'Farmer needs tube-well replacement due to expensive diesel engine; requires technical pump head confirmation.',
      languageDetected: 'Urdu',
      analyzedAt: '2026-08-27T16:45:00Z'
    }
  },
  {
    id: 'lead_105',
    workspaceId: DEMO_WORKSPACE_ID,
    name: 'Ayesha Siddiqui',
    email: 'ayesha.sidd@gmail.com',
    phone: '+92 334 2200192',
    source: 'Referral',
    status: 'WON',
    temperature: 'HOT',
    score: 98,
    service: 'Residential On-Grid Solar',
    location: 'Lahore (DHA Phase 5)',
    budget: '$9,200',
    requirements: { propertyType: '1 Kanal House', systemSize: '12kW On-Grid with Net Metering' },
    urgency: 'high',
    preferredContactMethod: 'whatsapp',
    assignedAgentId: 'usr_agent_3',
    assignedAgentName: 'Sara Khan',
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-08-29T18:00:00Z',
    lastContactedAt: '2026-08-29T18:00:00Z',
    tags: ['Closed Deal', 'DHA Lahore', 'Advance Paid'],
    aiAnalysis: {
      intent: 'solar_installation_quote',
      qualification: 'qualified',
      score: 98,
      temperature: 'HOT',
      confidence: 0.99,
      requirements: { capacity: '12kW', tier: 'Tier-1 bifacial panels' },
      budget: '$9,200',
      location: 'Lahore',
      urgency: 'high',
      missingInformation: [],
      recommendedNextAction: 'BOOK_APPOINTMENT',
      reasoningSummary: 'Referred by satisfied client, contract signed and 50% advance deposit received.',
      languageDetected: 'English',
      analyzedAt: '2026-08-10T10:05:00Z'
    }
  },
  {
    id: 'lead_106',
    workspaceId: DEMO_WORKSPACE_ID,
    name: 'Usman Ghani',
    email: 'usman.ghani99@gmail.com',
    phone: '+92 312 8840192',
    source: 'Website Widget',
    status: 'REACTIVATION',
    temperature: 'COLD',
    score: 35,
    service: 'Residential On-Grid Solar',
    location: 'Rawalpindi (Bahria Town)',
    budget: '$4,000',
    requirements: { propertyType: '5 Marla House', systemSize: '5kW Hybrid' },
    urgency: 'low',
    preferredContactMethod: 'whatsapp',
    assignedAgentId: 'usr_agent_4',
    assignedAgentName: 'Bilal Qureshi',
    createdAt: '2026-07-15T12:00:00Z',
    updatedAt: '2026-08-25T11:00:00Z',
    lastContactedAt: '2026-07-28T10:00:00Z',
    tags: ['Ghosted', 'Potential Reactivation', '5 Marla'],
    aiAnalysis: {
      intent: 'solar_installation_quote',
      qualification: 'partially_qualified',
      score: 35,
      temperature: 'COLD',
      confidence: 0.75,
      requirements: { size: '5kW' },
      budget: '$4,000',
      location: 'Rawalpindi',
      urgency: 'low',
      missingInformation: ['Recent electricity bill', 'Confirmation of roof ownership'],
      recommendedNextAction: 'SEND_FOLLOW_UP',
      reasoningSummary: 'No response to last 3 automated reminders. Ready for AI personalized re-engagement offering Q3 discount package.',
      languageDetected: 'English',
      analyzedAt: '2026-08-25T11:05:00Z'
    }
  },
  {
    id: 'lead_107',
    workspaceId: DEMO_WORKSPACE_ID,
    name: 'Waqas Ali Rentals',
    email: 'waqas.renter@yahoo.com',
    phone: '+92 345 1109482',
    source: 'Meta Ads',
    status: 'UNQUALIFIED',
    temperature: 'COLD',
    score: 18,
    service: 'Residential On-Grid Solar',
    location: 'Islamabad (G-11)',
    budget: '$600',
    requirements: { propertyType: 'Rented Upper Portion', systemSize: '1kW' },
    urgency: 'low',
    preferredContactMethod: 'sms',
    assignedAgentId: 'usr_agent_4',
    assignedAgentName: 'Bilal Qureshi',
    createdAt: '2026-08-26T08:00:00Z',
    updatedAt: '2026-08-26T08:15:00Z',
    lastContactedAt: '2026-08-26T08:15:00Z',
    tags: ['Renter', 'Below Minimum Budget', 'Disqualified'],
    aiAnalysis: {
      intent: 'battery_backup_enquiry',
      qualification: 'unqualified',
      score: 18,
      temperature: 'COLD',
      confidence: 0.98,
      requirements: { type: 'Rented flat' },
      budget: '$600',
      location: 'Islamabad',
      urgency: 'low',
      missingInformation: [],
      recommendedNextAction: 'MARK_DISQUALIFIED',
      reasoningSummary: 'Renting upper flat without landlord permission to install roof panels, budget below company minimum threshold ($3,500).',
      languageDetected: 'Roman Urdu',
      analyzedAt: '2026-08-26T08:10:00Z'
    }
  },
  {
    id: 'lead_108',
    workspaceId: DEMO_WORKSPACE_ID,
    name: 'Naveed Akhtar (Packaging Mill)',
    email: 'naveed@akhtarpack.com',
    phone: '+92 300 8472901',
    source: 'Gmail',
    status: 'QUALIFIED',
    temperature: 'HOT',
    score: 85,
    service: 'Commercial & Industrial Solar',
    location: 'Lahore (Sundar Industrial Estate)',
    budget: '$65,000',
    requirements: { propertyType: 'Commercial Factory', systemSize: '100kW On-Grid', paybackGoal: '< 3 years' },
    urgency: 'medium',
    preferredContactMethod: 'email',
    assignedAgentId: 'usr_agent_2',
    assignedAgentName: 'Tariq Malik',
    createdAt: '2026-08-30T15:00:00Z',
    updatedAt: '2026-08-31T17:30:00Z',
    lastContactedAt: '2026-08-31T17:30:00Z',
    nextFollowUpAt: '2026-09-02T11:00:00Z',
    tags: ['Commercial', 'Sundar Estate', 'Fast Payback'],
    aiAnalysis: {
      intent: 'commercial_roi_estimate',
      qualification: 'qualified',
      score: 85,
      temperature: 'HOT',
      confidence: 0.91,
      requirements: { capacity: '100kW', goal: 'Reduce daylight running costs' },
      budget: '$65,000',
      location: 'Lahore',
      urgency: 'medium',
      missingInformation: ['Roof structure type (RCC or Tin Shed)'],
      recommendedNextAction: 'BOOK_APPOINTMENT',
      reasoningSummary: 'Direct email from managing partner requesting comprehensive commercial proposal with 5-year cashflow model.',
      languageDetected: 'English',
      analyzedAt: '2026-08-30T15:10:00Z'
    }
  },
  {
    id: 'lead_109',
    workspaceId: DEMO_WORKSPACE_ID,
    name: 'Brigadier (R) Khalid Mahmood',
    email: 'khalid.mahmood52@gmail.com',
    phone: '+92 322 5110842',
    source: 'Website Widget',
    status: 'APPOINTMENT_BOOKED',
    temperature: 'HOT',
    score: 92,
    service: 'Hybrid & Battery Storage',
    location: 'Rawalpindi (Askari 14)',
    budget: '$12,000',
    requirements: { propertyType: '2 Kanal House', systemSize: '12kW Hybrid', backupNeed: 'Lithium Battery Bank' },
    urgency: 'high',
    preferredContactMethod: 'phone',
    assignedAgentId: 'usr_agent_3',
    assignedAgentName: 'Sara Khan',
    createdAt: '2026-08-29T10:00:00Z',
    updatedAt: '2026-08-31T12:00:00Z',
    lastContactedAt: '2026-08-31T12:00:00Z',
    appointmentId: 'apt_202',
    tags: ['High Value', 'Askari', 'Hybrid Specialist'],
    aiAnalysis: {
      intent: 'solar_installation_quote',
      qualification: 'qualified',
      score: 92,
      temperature: 'HOT',
      confidence: 0.95,
      requirements: { system: '12kW Hybrid', location: 'Askari 14' },
      budget: '$12,000',
      location: 'Rawalpindi',
      urgency: 'high',
      missingInformation: [],
      recommendedNextAction: 'BOOK_APPOINTMENT',
      reasoningSummary: 'Confirmed booking for home audit tomorrow at 11:30 AM.',
      languageDetected: 'English',
      analyzedAt: '2026-08-29T10:08:00Z'
    }
  },
  {
    id: 'lead_110',
    workspaceId: DEMO_WORKSPACE_ID,
    name: 'Shahbaz Khan & Brothers',
    email: 'shahbaz.agro@gmail.com',
    phone: '+92 302 9918234',
    source: 'WhatsApp',
    status: 'CONTACTED',
    temperature: 'WARM',
    score: 62,
    service: 'Solar Tube-well / Agricultural',
    location: 'Mardan (Sugar Mill Road)',
    budget: '$11,000',
    requirements: { propertyType: 'Sugarcane Farm', systemSize: '18kW Solar Pump' },
    urgency: 'medium',
    preferredContactMethod: 'whatsapp',
    assignedAgentId: 'usr_agent_4',
    assignedAgentName: 'Bilal Qureshi',
    createdAt: '2026-08-28T13:00:00Z',
    updatedAt: '2026-08-30T14:00:00Z',
    lastContactedAt: '2026-08-30T14:00:00Z',
    nextFollowUpAt: '2026-09-02T14:00:00Z',
    tags: ['Agri', 'Mardan', 'WhatsApp Lead'],
    aiAnalysis: {
      intent: 'solar_installation_quote',
      qualification: 'partially_qualified',
      score: 62,
      temperature: 'WARM',
      confidence: 0.82,
      requirements: { capacity: '18kW' },
      budget: '$11,000',
      location: 'Mardan',
      urgency: 'medium',
      missingInformation: ['Motor KW rating', 'Distance between solar panels and bore'],
      recommendedNextAction: 'ASK_QUALIFYING_QUESTION',
      reasoningSummary: 'Inquired in Pashto/Roman Urdu, sent voice note on WhatsApp. Needs technical sizing review.',
      languageDetected: 'Roman Urdu',
      analyzedAt: '2026-08-28T13:10:00Z'
    }
  },
  // Additional leads generated programmatically to fulfill the full 50 realistic leads benchmark
  ...Array.from({ length: 40 }, (_, i) => {
    const idNum = 111 + i;
    const sources: Lead['source'][] = ['Website Widget', 'WhatsApp', 'Gmail', 'Meta Ads', 'Referral', 'Webhook'];
    const statuses: Lead['status'][] = ['NEW', 'CONTACTED', 'QUALIFIED', 'APPOINTMENT_BOOKED', 'NEGOTIATION', 'WON', 'LOST', 'REACTIVATION'];
    const temps: Lead['temperature'][] = ['HOT', 'WARM', 'COLD'];
    const services = ['Residential On-Grid Solar', 'Hybrid & Battery Storage', 'Commercial & Industrial Solar', 'Solar Tube-well / Agricultural'];
    const cities = ['Islamabad', 'Lahore', 'Rawalpindi', 'Peshawar', 'Faisalabad', 'Multan', 'Gujranwala'];
    const firstNames = ['Zubair', 'Fahad', 'Omer', 'Imran', 'Hassan', 'Adeel', 'Farhan', 'Noman', 'Rashid', 'Kamran', 'Mehmood', 'Asif', 'Shahid', 'Bilawal', 'Danish'];
    const lastNames = ['Chaudhry', 'Khan', 'Bhatti', 'Javed', 'Abbasi', 'Raza', 'Qureshi', 'Siddiqui', 'Dar', 'Sheikh', 'Malik', 'Mirza', 'Ansari', 'Gondal'];
    
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3) % lastNames.length];
    const name = `${fn} ${ln}`;
    const city = cities[i % cities.length];
    const service = services[i % services.length];
    const source = sources[i % sources.length];
    const status = statuses[i % statuses.length];
    
    // Determine temperature & score
    let score = 45 + ((i * 17) % 52);
    if (status === 'WON' || status === 'APPOINTMENT_BOOKED' || status === 'NEGOTIATION') score = Math.max(score, 78);
    if (status === 'LOST' || status === 'UNQUALIFIED') score = Math.min(score, 38);
    
    const temp: Lead['temperature'] = score >= 70 ? 'HOT' : score >= 40 ? 'WARM' : 'COLD';
    const dayAgo = (i % 25) + 1;
    const createdAt = new Date(Date.now() - dayAgo * 86400000).toISOString();
    const isHot = temp === 'HOT';
    const budgetVal = service.includes('Commercial') ? `$${45000 + (i * 5000)}` : `$${5000 + (i * 450)}`;

    return {
      id: `lead_${idNum}`,
      workspaceId: DEMO_WORKSPACE_ID,
      name,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${i % 3 === 0 ? 'gmail.com' : i % 3 === 1 ? 'yahoo.com' : 'company.pk'}`,
      phone: `+92 3${(i % 5)}${(i % 9)} ${1000000 + (i * 84721)}`.slice(0, 15),
      source,
      status,
      temperature: temp,
      score,
      service,
      location: `${city} (Sector / Area ${((i * 4) % 15) + 1})`,
      budget: budgetVal,
      requirements: {
        propertyType: service.includes('Commercial') ? 'Commercial Plaza' : 'Residential House',
        systemSize: service.includes('Commercial') ? '50kW - 150kW' : '7kW - 15kW',
        timeline: isHot ? 'Immediate (under 10 days)' : '1 - 3 Months'
      },
      urgency: (isHot ? 'high' : score >= 50 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      preferredContactMethod: (i % 2 === 0 ? 'whatsapp' : 'email') as 'whatsapp' | 'email',
      assignedAgentId: i % 2 === 0 ? 'usr_agent_3' : 'usr_agent_4',
      assignedAgentName: i % 2 === 0 ? 'Sara Khan' : 'Bilal Qureshi',
      createdAt,
      updatedAt: new Date(Date.now() - (dayAgo - 0.5) * 86400000).toISOString(),
      lastContactedAt: new Date(Date.now() - (dayAgo - 0.2) * 86400000).toISOString(),
      nextFollowUpAt: status === 'CONTACTED' || status === 'QUALIFIED' ? new Date(Date.now() + 86400000 * 2).toISOString() : undefined,
      tags: [isHot ? 'High Potential' : 'Standard Inbound', city, service.split(' ')[0]],
      aiAnalysis: {
        intent: 'solar_installation_quote',
        qualification: (isHot ? 'qualified' : score >= 40 ? 'partially_qualified' : 'unqualified') as 'qualified' | 'partially_qualified' | 'unqualified' | 'needs_human_review',
        score,
        temperature: temp,
        confidence: 0.85 + ((i % 12) * 0.01),
        requirements: { capacity: service.includes('Commercial') ? '75kW' : '10kW' },
        budget: budgetVal,
        location: city,
        urgency: (isHot ? 'high' : 'medium') as 'high' | 'medium' | 'low',
        missingInformation: isHot ? [] : ['Exact roof shading report'],
        recommendedNextAction: (isHot ? 'BOOK_APPOINTMENT' : score >= 50 ? 'SEND_FOLLOW_UP' : 'ASK_QUALIFYING_QUESTION') as AIAnalysis['recommendedNextAction'],
        reasoningSummary: `Lead captured via ${source}. Extracted requirement for ${service} in ${city} with score ${score}.`,
        languageDetected: (i % 4 === 0 ? 'Roman Urdu' : i % 4 === 1 ? 'Urdu' : 'English') as 'English' | 'Urdu' | 'Roman Urdu' | 'Other',
        analyzedAt: createdAt
      }
    };
  })
];

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_101',
    workspaceId: DEMO_WORKSPACE_ID,
    leadId: 'lead_101',
    leadName: 'Hamza Farooq',
    channel: 'widget',
    status: 'active',
    updatedAt: '2026-08-31T14:20:00Z',
    unreadByAgent: false,
    messages: [
      { id: 'm1', conversationId: 'conv_101', sender: 'lead', content: 'Hi, I need a 15kW hybrid solar system for my house in F-7/2 Islamabad. Monthly bill is around Rs 85,000. When can someone visit for an inspection?', timestamp: '2026-08-28T09:15:00Z' },
      { id: 'm2', conversationId: 'conv_101', sender: 'assistant', content: 'Hello Hamza! Thank you for reaching out to NorthStar Solar. A 15kW hybrid system with lithium battery storage is ideal for high-consumption homes in Sector F-7. To prepare the best estimate for you, do you have 3-phase WAPDA electricity connection and what backup duration do you need during power outages?', timestamp: '2026-08-28T09:15:30Z', metadata: { aiGenerated: true, confidence: 0.96 } },
      { id: 'm3', conversationId: 'conv_101', sender: 'lead', content: 'Yes, 3-phase meter installed. We need 4 to 6 hours backup for 3 inverter ACs and general lighting at night. Budget is around Rs 40-45 Lakh.', timestamp: '2026-08-28T09:18:00Z' },
      { id: 'm4', conversationId: 'conv_101', sender: 'assistant', content: 'That budget fits our Tier-1 Longi Hi-MO 6 bifacial panels paired with Deye 15kW Hybrid inverter and 15kWh CATL Lithium battery pack perfectly. We can arrange our Senior Solar Engineer to conduct a free rooftop structural & shade analysis.', timestamp: '2026-08-28T09:19:00Z', metadata: { aiGenerated: true, confidence: 0.95 } },
      { id: 'm5', conversationId: 'conv_101', sender: 'lead', content: 'Sounds great. Let us book the audit for tomorrow afternoon.', timestamp: '2026-08-28T09:20:00Z' }
    ]
  },
  {
    id: 'conv_103',
    workspaceId: DEMO_WORKSPACE_ID,
    leadId: 'lead_103',
    leadName: 'Dr. Arsalan Sheikh',
    channel: 'whatsapp',
    status: 'waiting_agent',
    updatedAt: '2026-08-31T09:00:00Z',
    unreadByAgent: true,
    messages: [
      { id: 'm10', conversationId: 'conv_103', sender: 'lead', content: 'AOA, Hayatabad Peshawar me 10kW On-Grid solar lagwana hai. Net metering ka process aap log khud karwayenge?', timestamp: '2026-08-29T14:30:00Z' },
      { id: 'm11', conversationId: 'conv_103', sender: 'assistant', content: 'Wa Alaikum Assalam Dr. Arsalan! Ji bilkul, NorthStar Solar complete end-to-end WAPDA/PESCO Net Metering approval, green meter installation, aur licensing khud handle karta hai. Aapka monthly average electricity bill kitne units (kWh) ka ata hai?', timestamp: '2026-08-29T14:31:00Z', metadata: { aiGenerated: true, confidence: 0.94 } },
      { id: 'm12', conversationId: 'conv_103', sender: 'lead', content: 'Garmiyon me 900 se 1100 units ata hai bill. 10kW kafi rahega? Aur panels konsi brand k use hotay hain?', timestamp: '2026-08-29T14:33:00Z' },
      { id: 'm13', conversationId: 'conv_103', sender: 'assistant', content: '1000 units consumption k liye 10kW system 100% bill zero kar dega aur surplus units PESCO ko bechega. Hum sirf Tier-1 Bloomberg rated Canadian Solar aur Longi N-type panels 25 saal warranty k sath lagate hain. Kya hum aapko complete proposal WhatsApp pe send karein?', timestamp: '2026-08-29T14:34:00Z', metadata: { aiGenerated: true, confidence: 0.92 } },
      { id: 'm14', conversationId: 'lead', sender: 'lead', content: 'Ji please proposal send kardein, thank you.', timestamp: '2026-08-30T12:00:00Z' }
    ]
  }
];

export const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt_201',
    workspaceId: DEMO_WORKSPACE_ID,
    leadId: 'lead_101',
    leadName: 'Hamza Farooq',
    leadEmail: 'hamza.farooq@outlook.com',
    leadPhone: '+92 300 5519283',
    service: 'Hybrid & Battery Storage Audit',
    assignedAgentId: 'usr_agent_3',
    assignedAgentName: 'Sara Khan',
    startTime: '2026-09-02T14:30:00Z',
    endTime: '2026-09-02T15:15:00Z',
    status: 'CONFIRMED',
    locationType: 'in_person',
    locationDetails: 'House 14, Street 28, Sector F-7/2, Islamabad',
    notes: 'Rooftop audit for 15kW Hybrid + 15kWh Lithium battery. Take drone for roof shade mapping.',
    createdAt: '2026-08-28T09:20:00Z'
  },
  {
    id: 'apt_202',
    workspaceId: DEMO_WORKSPACE_ID,
    leadId: 'lead_109',
    leadName: 'Brigadier (R) Khalid Mahmood',
    leadEmail: 'khalid.mahmood52@gmail.com',
    leadPhone: '+92 322 5110842',
    service: 'Residential On-Grid Consultation',
    assignedAgentId: 'usr_agent_3',
    assignedAgentName: 'Sara Khan',
    startTime: '2026-09-03T11:00:00Z',
    endTime: '2026-09-03T11:45:00Z',
    status: 'SCHEDULED',
    locationType: 'in_person',
    locationDetails: 'Sector B, Askari 14, Rawalpindi',
    notes: 'In-person technical feasibility meeting.',
    createdAt: '2026-08-29T10:10:00Z'
  },
  {
    id: 'apt_203',
    workspaceId: DEMO_WORKSPACE_ID,
    leadId: 'lead_102',
    leadName: 'M. Kashif Textiles Ltd',
    leadEmail: 'kashif.engg@textilespk.com',
    leadPhone: '+92 321 4488210',
    service: 'Commercial 200kW Proposal Presentation',
    assignedAgentId: 'usr_agent_2',
    assignedAgentName: 'Tariq Malik',
    startTime: '2026-09-04T10:00:00Z',
    endTime: '2026-09-04T11:00:00Z',
    status: 'CONFIRMED',
    locationType: 'video',
    locationDetails: 'Google Meet / Zoom Video Call',
    notes: 'Present financial cashflow, payback model, and tax depreciation benefit under Section 65.',
    createdAt: '2026-08-30T16:00:00Z'
  }
];

export const DEMO_WORKFLOWS: Workflow[] = [
  {
    id: 'wf_1',
    workspaceId: DEMO_WORKSPACE_ID,
    name: 'Instant HOT Lead Alert & Fast Track',
    description: 'When lead score >= 70, mark HOT, immediately assign senior agent and dispatch priority WhatsApp notification.',
    trigger: 'SCORE_CHANGED',
    conditions: [
      { field: 'score', operator: 'greater_than', value: 69 },
    ],
    actions: [
      { type: 'MARK_TEMPERATURE', parameters: { temperature: 'HOT' } },
      { type: 'SEND_NOTIFICATION', parameters: { channel: 'in_app', priority: 'high', message: '🔥 Urgent: High-intent Hot Lead captured' } },
      { type: 'DRAFT_AI_FOLLOWUP', parameters: { template: 'fast_track_intro' } }
    ],
    isEnabled: true,
    executionCount: 42,
    lastExecutedAt: '2026-08-31T14:20:00Z',
    createdAt: '2026-01-15T10:00:00Z'
  },
  {
    id: 'wf_2',
    workspaceId: DEMO_WORKSPACE_ID,
    name: '24-Hour Inactive Lead Auto-Nudge',
    description: 'If lead is CONTACTED or QUALIFIED but has not replied in 24 hours, draft personalized re-engagement query.',
    trigger: 'LEAD_INACTIVE_24H',
    conditions: [
      { field: 'status', operator: 'in', value: ['CONTACTED', 'QUALIFIED'] },
      { field: 'temperature', operator: 'in', value: ['HOT', 'WARM'] }
    ],
    actions: [
      { type: 'DRAFT_AI_FOLLOWUP', parameters: { intent: 'check_questions' } },
      { type: 'SCHEDULE_FOLLOWUP', parameters: { delayHours: 24 } }
    ],
    isEnabled: true,
    executionCount: 28,
    lastExecutedAt: '2026-08-30T18:00:00Z',
    createdAt: '2026-01-20T11:00:00Z'
  },
  {
    id: 'wf_3',
    workspaceId: DEMO_WORKSPACE_ID,
    name: 'Appointment Booked -> Stage Sync & Reminder Prep',
    description: 'Automatically update lead status to APPOINTMENT_BOOKED and queue reminder 2 hours prior.',
    trigger: 'APPOINTMENT_BOOKED',
    conditions: [],
    actions: [
      { type: 'UPDATE_STATUS', parameters: { status: 'APPOINTMENT_BOOKED' } },
      { type: 'ADD_TAG', parameters: { tag: 'Meeting Scheduled' } },
      { type: 'SEND_NOTIFICATION', parameters: { message: '📅 New appointment booked by prospect' } }
    ],
    isEnabled: true,
    executionCount: 19,
    lastExecutedAt: '2026-08-29T10:10:00Z',
    createdAt: '2026-02-01T09:00:00Z'
  },
  {
    id: 'wf_4',
    workspaceId: DEMO_WORKSPACE_ID,
    name: 'Lead Replied -> Auto-Cancel Pending Drips',
    description: 'When prospect sends a new message, immediately abort all automated scheduled drip follow-ups.',
    trigger: 'LEAD_REPLIED',
    conditions: [],
    actions: [
      { type: 'UPDATE_STATUS', parameters: { status: 'CONTACTED' } }
    ],
    isEnabled: true,
    executionCount: 54,
    lastExecutedAt: '2026-08-31T09:00:00Z',
    createdAt: '2026-02-05T14:00:00Z'
  },
  {
    id: 'wf_5',
    workspaceId: DEMO_WORKSPACE_ID,
    name: 'Stalled Lead Reactivation Candidate Flag',
    description: 'If lead was previously qualified but inactive for 14+ days, mark for human review reactivation batch.',
    trigger: 'LEAD_INACTIVE_3D',
    conditions: [
      { field: 'score', operator: 'greater_than', value: 50 },
      { field: 'status', operator: 'not_equals', value: 'WON' }
    ],
    actions: [
      { type: 'UPDATE_STATUS', parameters: { status: 'REACTIVATION' } },
      { type: 'CREATE_TASK', parameters: { title: 'Review AI Reactivation Draft' } }
    ],
    isEnabled: true,
    executionCount: 11,
    lastExecutedAt: '2026-08-25T11:00:00Z',
    createdAt: '2026-02-15T12:00:00Z'
  }
];

export const DEMO_WORKFLOW_EXECUTIONS: WorkflowExecution[] = [
  {
    id: 'wfe_1',
    workspaceId: DEMO_WORKSPACE_ID,
    workflowId: 'wf_1',
    workflowName: 'Instant HOT Lead Alert & Fast Track',
    leadId: 'lead_101',
    leadName: 'Hamza Farooq',
    status: 'SUCCESS',
    executedActions: ['Marked HOT (Score 94)', 'Dispatched In-App Toast & Webhook', 'Prepared Fast-Track Intro Draft'],
    timestamp: '2026-08-28T09:16:00Z'
  },
  {
    id: 'wfe_2',
    workspaceId: DEMO_WORKSPACE_ID,
    workflowId: 'wf_3',
    workflowName: 'Appointment Booked -> Stage Sync',
    leadId: 'lead_101',
    leadName: 'Hamza Farooq',
    status: 'SUCCESS',
    executedActions: ['Updated Status to APPOINTMENT_BOOKED', 'Tagged "Meeting Scheduled"', 'Notified Sara Khan'],
    timestamp: '2026-08-28T09:21:00Z'
  },
  {
    id: 'wfe_3',
    workspaceId: DEMO_WORKSPACE_ID,
    workflowId: 'wf_4',
    workflowName: 'Lead Replied -> Auto-Cancel Pending Drips',
    leadId: 'lead_103',
    leadName: 'Dr. Arsalan Sheikh',
    status: 'SUCCESS',
    executedActions: ['Cancelled Drip Sequence #2', 'Updated Lead Activity Timestamp'],
    timestamp: '2026-08-30T12:00:05Z'
  },
  {
    id: 'wfe_4',
    workspaceId: DEMO_WORKSPACE_ID,
    workflowId: 'wf_2',
    workflowName: '24-Hour Inactive Lead Auto-Nudge',
    leadId: 'lead_104',
    leadName: 'Malik Jahangir',
    status: 'PENDING_APPROVAL',
    reason: 'Assisted Automation Mode requires agent approval before WhatsApp dispatch.',
    executedActions: ['AI Drafted Tube-well Follow-up', 'Sent Approval Card to Bilal Qureshi'],
    timestamp: '2026-08-30T10:15:00Z'
  },
  {
    id: 'wfe_5',
    workspaceId: DEMO_WORKSPACE_ID,
    workflowId: 'wf_5',
    workflowName: 'Stalled Lead Reactivation Candidate Flag',
    leadId: 'lead_106',
    leadName: 'Usman Ghani',
    status: 'SUCCESS',
    executedActions: ['Moved to REACTIVATION stage', 'Added to Reactivation Campaign Queue'],
    timestamp: '2026-08-25T11:00:00Z'
  }
];

export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_1',
    workspaceId: DEMO_WORKSPACE_ID,
    title: '🔥 New HOT Lead: Hamza Farooq (Score 94)',
    message: '15kW Hybrid with Lithium Battery requested in Islamabad Sector F-7. Inspection appointment requested.',
    type: 'HOT_LEAD',
    leadId: 'lead_101',
    isRead: false,
    createdAt: '2026-08-28T09:16:00Z'
  },
  {
    id: 'notif_2',
    workspaceId: DEMO_WORKSPACE_ID,
    title: '📅 Appointment Booked with Brigadier Khalid',
    message: 'Confirmed for Thursday 11:00 AM at Askari 14, Rawalpindi with Sara Khan.',
    type: 'APPOINTMENT',
    leadId: 'lead_109',
    isRead: false,
    createdAt: '2026-08-29T10:10:00Z'
  },
  {
    id: 'notif_3',
    workspaceId: DEMO_WORKSPACE_ID,
    title: '⚠️ 3 Overdue Follow-ups Require Review',
    message: 'Malik Jahangir and 2 others have had no outbound contact in > 48 hours.',
    type: 'FOLLOWUP_OVERDUE',
    isRead: false,
    createdAt: '2026-08-31T08:00:00Z'
  },
  {
    id: 'notif_4',
    workspaceId: DEMO_WORKSPACE_ID,
    title: '🤖 AI Approval Request: Reactivation Campaign',
    message: 'AI has drafted personalized reactivation outreach for 5 stalled qualified leads. Click to review & send.',
    type: 'AI_APPROVAL',
    isRead: true,
    createdAt: '2026-08-30T15:00:00Z'
  }
];

export const DEMO_AUDIT_LOGS: AuditLog[] = [
  { id: 'aud_1', workspaceId: DEMO_WORKSPACE_ID, userId: 'usr_owner_1', userName: 'Zainab Ahmed', action: 'LOGIN', entityType: 'session', details: 'Successful authenticated session from Islamabad', timestamp: '2026-08-31T08:00:00Z' },
  { id: 'aud_2', workspaceId: DEMO_WORKSPACE_ID, userId: 'system', userName: 'LEADFORGE AI Engine', action: 'AI_QUALIFICATION', entityType: 'lead', entityId: 'lead_101', details: 'Extracted 15kW Hybrid requirement, scored 94/100, tagged HOT', timestamp: '2026-08-28T09:15:30Z' },
  { id: 'aud_3', workspaceId: DEMO_WORKSPACE_ID, userId: 'system', userName: 'LEADFORGE Workflow Engine', action: 'WORKFLOW_TRIGGERED', entityType: 'workflow', entityId: 'wf_1', details: 'Executed "Instant HOT Lead Alert & Fast Track"', timestamp: '2026-08-28T09:16:00Z' },
  { id: 'aud_4', workspaceId: DEMO_WORKSPACE_ID, userId: 'usr_agent_3', userName: 'Sara Khan', action: 'APPOINTMENT_CREATED', entityType: 'appointment', entityId: 'apt_201', details: 'Scheduled rooftop audit with Hamza Farooq for Sep 2', timestamp: '2026-08-28T09:20:00Z' },
  { id: 'aud_5', workspaceId: DEMO_WORKSPACE_ID, userId: 'usr_owner_1', userName: 'Zainab Ahmed', action: 'SETTINGS_CHANGED', entityType: 'settings', details: 'Updated business hours and enabled Assisted Automation Mode', timestamp: '2026-08-27T14:00:00Z' }
];

export const DEMO_INTEGRATIONS: IntegrationConfig[] = [
  {
    id: 'int_1',
    workspaceId: DEMO_WORKSPACE_ID,
    type: 'WEBHOOK',
    name: 'Inbound Webhook API',
    status: 'CONNECTED',
    description: 'Receive real-time lead submissions from custom forms, Facebook Lead Ads, or Zapier.',
    icon: 'Webhook',
    webhookUrl: 'https://ais-dev-nrd53aivntdaclub3py52m-908056521786.asia-east1.run.app/api/webhooks/leads',
    webhookSecret: 'whsec_northstar_live_89472198',
    lastSyncAt: '2026-08-31T14:20:00Z',
    config: { enabled: true, verifySignature: true }
  },
  {
    id: 'int_2',
    workspaceId: DEMO_WORKSPACE_ID,
    type: 'WHATSAPP',
    name: 'WhatsApp Cloud API Adapter',
    status: 'MOCK_ACTIVE',
    description: 'Connect official Meta WhatsApp Cloud API for automated chats, qualification, and appointment booking.',
    icon: 'MessageSquare',
    lastSyncAt: '2026-08-31T12:00:00Z',
    config: { phoneNumberId: '1084920491029', testMode: true }
  },
  {
    id: 'int_3',
    workspaceId: DEMO_WORKSPACE_ID,
    type: 'GOOGLE_CALENDAR',
    name: 'Google Calendar Two-Way Sync',
    status: 'MOCK_ACTIVE',
    description: 'Sync scheduled appointments directly to your Google Workspace and prevent double bookings.',
    icon: 'Calendar',
    lastSyncAt: '2026-08-31T11:00:00Z',
    config: { primaryCalendar: 'enquiries@northstarsolar.io', syncReminders: true }
  },
  {
    id: 'int_4',
    workspaceId: DEMO_WORKSPACE_ID,
    type: 'GMAIL',
    name: 'Gmail Lead Ingestion Adapter',
    status: 'NOT_CONFIGURED',
    description: 'Automatically parse inbound enquiries from contact forms forwarded to your Gmail inbox.',
    icon: 'Mail',
    config: {}
  },
  {
    id: 'int_5',
    workspaceId: DEMO_WORKSPACE_ID,
    type: 'META',
    name: 'Meta Ads & Instagram DM Adapter',
    status: 'NOT_CONFIGURED',
    description: 'Sync Facebook Instant Form leads & Instagram DM enquiries directly into your qualification pipeline.',
    icon: 'Share2',
    config: {}
  },
  {
    id: 'int_6',
    workspaceId: DEMO_WORKSPACE_ID,
    type: 'TWILIO_SMS',
    name: 'Twilio SMS & Automated Alerts',
    status: 'NOT_CONFIGURED',
    description: 'Send instant SMS confirmation reminders and hot lead push notifications to agents.',
    icon: 'Phone',
    config: {}
  }
];
