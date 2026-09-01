import { IndustryTemplate, IndustryType } from '../types';

export const INDUSTRY_TEMPLATES: Record<IndustryType, IndustryTemplate> = {
  SOLAR: {
    id: 'SOLAR',
    name: 'Solar Energy & Battery Systems',
    icon: 'Sun',
    tagline: 'Qualify residential, commercial, and agricultural solar projects',
    services: [
      { id: 's1', name: 'Residential On-Grid Solar', description: '5kW - 15kW rooftop solar system for homeowners', typicalBudgetRange: '$4,000 - $15,000' },
      { id: 's2', name: 'Hybrid & Battery Storage', description: 'Solar paired with lithium/gel backup batteries for 24/7 power', typicalBudgetRange: '$8,000 - $25,000' },
      { id: 's3', name: 'Commercial & Industrial Solar', description: '25kW - 500kW rooftop & ground mounted installations for businesses', typicalBudgetRange: '$20,000 - $250,000' },
      { id: 's4', name: 'Solar Tube-well / Agricultural', description: 'Solar pumps and irrigation power systems for farms', typicalBudgetRange: '$6,000 - $35,000' },
    ],
    qualificationQuestions: [
      'What type of property is this for (Residential, Commercial, Farm)?',
      'What is your average monthly electricity bill or units (kWh) consumed?',
      'Do you own the property or lease it?',
      'Which city or district is the installation located in?',
      'What is your desired timeframe for installation (Immediate, 1-3 months, Researching)?'
    ],
    disqualifyingCriteria: [
      'Renting without landlord authorization',
      'Location outside service regions',
      'Budget under minimum 3kW threshold (< $1,500)',
      'Unshaded roof space less than 200 sq.ft'
    ],
    defaultScoringFactors: {
      intent: 20,
      budgetFit: 15,
      urgency: 15,
      serviceMatch: 15,
      locationMatch: 10,
      requirementCompleteness: 10,
      engagement: 10,
      appointmentIntent: 5,
    },
    commonIntents: [
      'solar_installation_quote',
      'battery_backup_enquiry',
      'net_metering_consultation',
      'commercial_roi_estimate'
    ],
    defaultFollowUpDays: [0, 1, 3, 7, 14],
    recommendedAppointmentDuration: 30,
    sampleProspectPersonas: [
      {
        title: 'High Intent Homeowner (English)',
        language: 'English',
        openingMessage: 'Hi, I need a 10kW hybrid solar system with 10kWh battery backup for my 1 Kanal house in Islamabad. Monthly bill is around Rs 85,000. Ready to install next week.',
        context: 'Direct requirement, high budget, immediate timeline, owns property.'
      },
      {
        title: 'Commercial Factory Owner (Roman Urdu)',
        language: 'Roman Urdu',
        openingMessage: 'Bhai factory k liye 50kW on-grid solar lagwana hai industrial area me. Monthly bill 4 lakh ata hai. Survey kab ho sakta hai?',
        context: 'Commercial high value lead asking for on-site survey.'
      },
      {
        title: 'Urdu Agricultural Enquiry',
        language: 'Urdu',
        openingMessage: 'السلام علیکم، مجھے اپنے فارم کے ٹیوب ویل کے لیے 15 کلو واٹ کا سولر سسٹم چاہیے، بجلی کا شدید مسئلہ ہے۔ خرچہ بتائیں؟',
        context: 'Farm solar pump tube-well enquiry with urgent power crisis.'
      }
    ]
  },

  REAL_ESTATE: {
    id: 'REAL_ESTATE',
    name: 'Real Estate & Property Development',
    icon: 'Building2',
    tagline: 'Qualify buyers, investors, and luxury property seekers',
    services: [
      { id: 'r1', name: 'Luxury Residential Purchase', description: 'Apartments, villas, and townhouses for primary living', typicalBudgetRange: '$100,000 - $1,500,000' },
      { id: 'r2', name: 'Commercial Plot & Office Space', description: 'Retail plazas, corporate floors, and commercial plots', typicalBudgetRange: '$200,000 - $3,000,000' },
      { id: 'r3', name: 'Off-Plan Investment Projects', description: 'High-yield developer projects with flexible installment plans', typicalBudgetRange: '$50,000 - $500,000' },
    ],
    qualificationQuestions: [
      'Are you looking to buy for personal living or investment?',
      'What preferred locations or societies are you targeting?',
      'What is your target budget and payment mode (Cash vs Installments)?',
      'What property size/configuration do you need (e.g. 3-bed, 10-Marla plot)?',
      'When are you looking to finalize the purchase?'
    ],
    disqualifyingCriteria: [
      'Looking for rental accommodation when firm only handles sales',
      'Budget substantially below minimum project entry price',
      'Non-serious speculative inquiries without contact info'
    ],
    defaultScoringFactors: {
      intent: 20,
      budgetFit: 20,
      urgency: 15,
      serviceMatch: 15,
      locationMatch: 10,
      requirementCompleteness: 10,
      engagement: 5,
      appointmentIntent: 5,
    },
    commonIntents: [
      'property_purchase_inquiry',
      'investment_yield_consultation',
      'site_visit_booking',
      'installment_plan_details'
    ],
    defaultFollowUpDays: [0, 1, 3, 7, 14],
    recommendedAppointmentDuration: 45,
    sampleProspectPersonas: [
      {
        title: 'Overseas Investor (English)',
        language: 'English',
        openingMessage: 'Hello, I am based in Dubai and looking to invest in a 2-bedroom luxury apartment with guaranteed rental yield. Budget is $180,000.',
        context: 'Cash-ready overseas investor seeking ROI.'
      },
      {
        title: 'Local Buyer (Roman Urdu)',
        language: 'Roman Urdu',
        openingMessage: 'AOA, 1 Kanal plot ya ready house chahiye DHA phase 6 me family k liye. Budget 6.5 Crore hai. Kal sham ko meeting possible hai?',
        context: 'High-net-worth local family buyer asking for in-person consultation.'
      }
    ]
  },

  DENTAL: {
    id: 'DENTAL',
    name: 'Dental Clinic & Orthodontics',
    icon: 'Smile',
    tagline: 'Qualify implants, aligners, smile makeovers, and surgeries',
    services: [
      { id: 'd1', name: 'Dental Implants & All-on-4', description: 'Permanent tooth replacement using titanium implants', typicalBudgetRange: '$800 - $5,000' },
      { id: 'd2', name: 'Clear Aligners & Orthodontics', description: 'Invisible teeth straightening solutions for teens and adults', typicalBudgetRange: '$1,200 - $3,500' },
      { id: 'd3', name: 'Cosmetic Veneers & Smile Makeover', description: 'Porcelain veneers, bonding, and laser whitening', typicalBudgetRange: '$500 - $4,000' },
      { id: 'd4', name: 'Emergency Dental Care', description: 'Root canals, pain relief, and wisdom tooth extractions', typicalBudgetRange: '$100 - $600' },
    ],
    qualificationQuestions: [
      'What specific dental concern or treatment are you looking for?',
      'Are you experiencing acute pain or is this an elective cosmetic procedure?',
      'Do you have any recent dental X-rays or prior treatment history?',
      'What days and times work best for your clinical consultation?'
    ],
    disqualifyingCriteria: [
      'Outside clinic geographical territory',
      'Demanding free full treatments'
    ],
    defaultScoringFactors: {
      intent: 25,
      budgetFit: 10,
      urgency: 25,
      serviceMatch: 15,
      locationMatch: 10,
      requirementCompleteness: 5,
      engagement: 5,
      appointmentIntent: 5,
    },
    commonIntents: [
      'implant_consultation',
      'clear_aligner_quote',
      'emergency_pain_appointment',
      'smile_makeover_consult'
    ],
    defaultFollowUpDays: [0, 1, 2, 5, 10],
    recommendedAppointmentDuration: 30,
    sampleProspectPersonas: [
      {
        title: 'Cosmetic Aligner Prospect (English)',
        language: 'English',
        openingMessage: 'Hi, I want to fix overlapping front teeth with clear aligners before my wedding in 4 months. How much does the initial 3D scan cost and can I book this Saturday?',
        context: 'High cosmetic intent, clear deadline, ready for appointment.'
      },
      {
        title: 'Dental Implant Enquiry (Roman Urdu)',
        language: 'Roman Urdu',
        openingMessage: 'Doctor sb mere walid k 2 daant nikal chuke hain, implants lagwane hain. Total procedure kitne din ka hota hai aur appointment kab milegi?',
        context: 'Family member seeking restorative implant surgery.'
      }
    ]
  },

  CLINIC: {
    id: 'CLINIC',
    name: 'Medical Clinic & Specialist Consultations',
    icon: 'Stethoscope',
    tagline: 'Triage patients, capture symptoms, and book specialist slots',
    services: [
      { id: 'c1', name: 'Specialist Consultation', description: 'Cardiology, Dermatology, Orthopedics, and Endocrinology visits', typicalBudgetRange: '$50 - $250' },
      { id: 'c2', name: 'Executive Health Screening', description: 'Comprehensive lab panels, ultrasounds, and doctor reviews', typicalBudgetRange: '$150 - $600' },
      { id: 'c3', name: 'Physiotherapy & Rehab Packages', description: 'Post-surgery recovery and chronic musculoskeletal therapy', typicalBudgetRange: '$200 - $800' },
    ],
    qualificationQuestions: [
      'Which specialist or symptom are you consulting for?',
      'Is this a first-time consultation or a follow-up review?',
      'What are your primary symptoms and how long have they persisted?',
      'Do you require in-person clinic visit or telemedicine video call?'
    ],
    disqualifyingCriteria: [
      'Life-threatening emergencies requiring immediate 911 / ER visit',
      'Seeking controlled narcotics or illegal prescriptions'
    ],
    defaultScoringFactors: {
      intent: 20,
      budgetFit: 10,
      urgency: 25,
      serviceMatch: 20,
      locationMatch: 10,
      requirementCompleteness: 5,
      engagement: 5,
      appointmentIntent: 5,
    },
    commonIntents: [
      'specialist_booking',
      'health_checkup_enquiry',
      'telehealth_request',
      'symptom_inquiry'
    ],
    defaultFollowUpDays: [0, 1, 2, 4, 7],
    recommendedAppointmentDuration: 20,
    sampleProspectPersonas: [
      {
        title: 'Dermatology Patient (English)',
        language: 'English',
        openingMessage: 'Good morning, I have developed a persistent allergic rash on my neck. Can I book a dermatology consultation for tomorrow afternoon?',
        context: 'Clear symptom, requesting next-day slot.'
      }
    ]
  },

  IMMIGRATION: {
    id: 'IMMIGRATION',
    name: 'Immigration & Visa Consultancy',
    icon: 'Globe',
    tagline: 'Qualify study visas, express entry, Golden Visas, and business immigration',
    services: [
      { id: 'i1', name: 'Canada Express Entry & PNP', description: 'Skilled worker PR pathways and provincial nominations', typicalBudgetRange: '$2,500 - $6,000' },
      { id: 'i2', name: 'UK / Europe Study Visas', description: 'University admission and student visa processing', typicalBudgetRange: '$1,500 - $3,500' },
      { id: 'i3', name: 'Golden Visa & Residency by Investment', description: 'UAE, Portugal, Greece residency via property/investment', typicalBudgetRange: '$5,000 - $20,000' },
    ],
    qualificationQuestions: [
      'Which destination country are you aiming for (Canada, UK, Europe, Australia, UAE)?',
      'What is your highest education level and age?',
      'Do you have an IELTS/PTE score or relevant skilled work experience?',
      'What is your estimated liquid budget for visa and tuition/settlement funds?'
    ],
    disqualifyingCriteria: [
      'Recent fraudulent document history or bans',
      'No budget for government processing fees',
      'Under minimum age / education criteria for pathway'
    ],
    defaultScoringFactors: {
      intent: 20,
      budgetFit: 20,
      urgency: 10,
      serviceMatch: 20,
      locationMatch: 5,
      requirementCompleteness: 15,
      engagement: 5,
      appointmentIntent: 5,
    },
    commonIntents: [
      'study_visa_assessment',
      'pr_eligibility_check',
      'golden_visa_consult',
      'work_permit_inquiry'
    ],
    defaultFollowUpDays: [0, 1, 3, 7, 14],
    recommendedAppointmentDuration: 40,
    sampleProspectPersonas: [
      {
        title: 'Skilled Tech Worker for Canada PR (English)',
        language: 'English',
        openingMessage: 'Hi, I am a 29yo Software Engineer with 6 years experience, Master degree, and IELTS 8.0 CLB. Want to assess my CRS score for Canada Express Entry.',
        context: 'Perfect qualification criteria, high education, high likelihood of conversion.'
      },
      {
        title: 'Study Visa Student (Roman Urdu)',
        language: 'Roman Urdu',
        openingMessage: 'AOA sir, UK me September intake k liye Master in Data Science apply krna hai. Grad GPA 3.4 hai. Admission aur visa guidance k liye session book krna hai.',
        context: 'Clear academic credentials, intake deadline specified.'
      }
    ]
  },

  CONSTRUCTION: {
    id: 'CONSTRUCTION',
    name: 'Construction & Architecture Firm',
    icon: 'Hammer',
    tagline: 'Qualify commercial builds, luxury home construction, and interior renovations',
    services: [
      { id: 'cn1', name: 'Grey Structure & Full Turnkey Construction', description: 'End-to-end residential and commercial building construction', typicalBudgetRange: '$50,000 - $500,000' },
      { id: 'cn2', name: 'Architectural & 3D Interior Design', description: 'Structural drawings, floor plans, and photorealistic 3D renders', typicalBudgetRange: '$3,000 - $25,000' },
      { id: 'cn3', name: 'Commercial Fit-outs & Renovation', description: 'Office remodeling, restaurant interiors, and structural retrofit', typicalBudgetRange: '$15,000 - $120,000' },
    ],
    qualificationQuestions: [
      'What is the size/covered area of your plot or facility?',
      'Do you already have architectural drawings or approvals?',
      'What is your target construction start date?',
      'What is your overall estimated project budget?'
    ],
    disqualifyingCriteria: [
      'Minor handiwork / small repair requests under $500',
      'Location outside provincial construction licensing area'
    ],
    defaultScoringFactors: {
      intent: 20,
      budgetFit: 25,
      urgency: 10,
      serviceMatch: 15,
      locationMatch: 15,
      requirementCompleteness: 10,
      engagement: 5,
      appointmentIntent: 0,
    },
    commonIntents: [
      'turnkey_construction_estimate',
      'architectural_drawing_service',
      'interior_fitout_quote',
      'renovation_cost_calculator'
    ],
    defaultFollowUpDays: [0, 1, 3, 7, 14],
    recommendedAppointmentDuration: 45,
    sampleProspectPersonas: [
      {
        title: 'Luxury Villa Construction (English)',
        language: 'English',
        openingMessage: 'We have a 1-Kanal corner plot ready for construction in Sector B. Looking for a full turnkey construction contract including grey structure and premium finishing. Start date next month.',
        context: 'High-value turnkey residential build.'
      }
    ]
  },

  SOFTWARE_AGENCY: {
    id: 'SOFTWARE_AGENCY',
    name: 'Software Agency & AI Dev House',
    icon: 'Code',
    tagline: 'Qualify custom SaaS, mobile apps, enterprise web, and AI automation contracts',
    services: [
      { id: 'sa1', name: 'Custom SaaS & Web Application MVP', description: 'Full-stack React, Node, Cloud architecture for startups', typicalBudgetRange: '$10,000 - $60,000' },
      { id: 'sa2', name: 'AI Integration & Agentic Automations', description: 'LLM agents, vector search, customer support automation', typicalBudgetRange: '$8,000 - $40,000' },
      { id: 'sa3', name: 'Cross-Platform Mobile Apps (iOS & Android)', description: 'Flutter/React Native mobile applications with backend APIs', typicalBudgetRange: '$12,000 - $50,000' },
      { id: 'sa4', name: 'Enterprise Cloud Architecture & DevOps', description: 'GCP, AWS, Kubernetes migration and CI/CD pipelines', typicalBudgetRange: '$15,000 - $75,000' },
    ],
    qualificationQuestions: [
      'What is the core problem and user base of the software you want to build?',
      'Do you have a completed specification (PRD / Figma designs) or starting from scratch?',
      'What is your target launch deadline?',
      'What is your allocated engineering budget range?'
    ],
    disqualifyingCriteria: [
      'Unfunded idea with equity-only compensation expectation',
      'Budget under $2,000 for complex enterprise applications',
      'Illegal software or academic homework requests'
    ],
    defaultScoringFactors: {
      intent: 20,
      budgetFit: 20,
      urgency: 15,
      serviceMatch: 15,
      locationMatch: 5,
      requirementCompleteness: 15,
      engagement: 5,
      appointmentIntent: 5,
    },
    commonIntents: [
      'mvp_development_scope',
      'ai_agent_integration',
      'mobile_app_quote',
      'technical_architecture_audit'
    ],
    defaultFollowUpDays: [0, 1, 3, 7, 14],
    recommendedAppointmentDuration: 30,
    sampleProspectPersonas: [
      {
        title: 'Fintech Startup Founder (English)',
        language: 'English',
        openingMessage: 'We are a seed-funded B2B fintech in Singapore looking to build our client portal and automated billing reconciliation engine. We have Figma designs ready. Target delivery in 8 weeks, budget $35,000.',
        context: 'Funded client, spec ready, timeline and budget aligned.'
      },
      {
        title: 'E-commerce Business Owner (Roman Urdu)',
        language: 'Roman Urdu',
        openingMessage: 'Hamari retail chain k liye custom inventory aur POS mobile app banwani hai jo Shopify k sath sync kare. Discovery call kab schedule ho sakti hai?',
        context: 'Multi-store retail business requesting discovery call.'
      }
    ]
  },

  PROFESSIONAL_SERVICES: {
    id: 'PROFESSIONAL_SERVICES',
    name: 'Professional Services & Consulting',
    icon: 'Briefcase',
    tagline: 'Qualify corporate legal, tax accounting, and business advisory clients',
    services: [
      { id: 'ps1', name: 'Corporate Tax & Accounting Advisory', description: 'Audit, tax returns, cross-border structuring and compliance', typicalBudgetRange: '$1,000 - $10,000/mo' },
      { id: 'ps2', name: 'Corporate Legal & Contract Drafting', description: 'Shareholder agreements, IP protection, and mergers', typicalBudgetRange: '$3,000 - $25,000' },
      { id: 'ps3', name: 'Management Consulting & Strategy', description: 'Operations optimization and digital transformation', typicalBudgetRange: '$10,000 - $80,000' },
    ],
    qualificationQuestions: [
      'What specific advisory or compliance challenge does your organization face?',
      'What is your company annual turnover and employee size?',
      'What is the urgency or regulatory deadline for this matter?',
      'Who will be the primary corporate stakeholder for this engagement?'
    ],
    disqualifyingCriteria: [
      'Individual small dispute outside corporate jurisdiction',
      'Non-payment history with previous firms'
    ],
    defaultScoringFactors: {
      intent: 20,
      budgetFit: 20,
      urgency: 15,
      serviceMatch: 20,
      locationMatch: 5,
      requirementCompleteness: 10,
      engagement: 5,
      appointmentIntent: 5,
    },
    commonIntents: [
      'tax_audit_advisory',
      'contract_review_retainer',
      'corporate_structuring',
      'consulting_retainer'
    ],
    defaultFollowUpDays: [0, 1, 3, 7, 14],
    recommendedAppointmentDuration: 30,
    sampleProspectPersonas: [
      {
        title: 'CFO seeking Tax Restructuring (English)',
        language: 'English',
        openingMessage: 'We are expanding operations into the Gulf region and need an international tax advisory firm to structure our holding entity. Fiscal year end is in 60 days.',
        context: 'Executive decision maker, clear deadline, high fee potential.'
      }
    ]
  }
};
