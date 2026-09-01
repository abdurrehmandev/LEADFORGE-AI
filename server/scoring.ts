import { ScoringWeights, LeadTemperature } from '../src/types';

export interface ScoreFactorsInput {
  hasClearIntent?: boolean;
  intentConfidence?: number; // 0 to 1
  hasSufficientBudget?: boolean;
  budgetNumeric?: number;
  urgencyLevel?: 'high' | 'medium' | 'low';
  serviceMatched?: boolean;
  locationMatched?: boolean;
  requirementCompletenessRatio?: number; // 0 to 1
  messagesCount?: number;
  hasAppointmentRequested?: boolean;
  isDisqualified?: boolean;
}

export function calculateDeterministicLeadScore(
  factors: ScoreFactorsInput,
  weights: ScoringWeights = {
    intent: 20,
    budgetFit: 15,
    urgency: 15,
    serviceMatch: 15,
    locationMatch: 10,
    requirementCompleteness: 10,
    engagement: 10,
    appointmentIntent: 5,
  }
): { score: number; temperature: LeadTemperature; breakdown: Record<string, number> } {
  if (factors.isDisqualified) {
    return {
      score: 10,
      temperature: 'COLD',
      breakdown: { intent: 5, disqualificationPenalty: -90 }
    };
  }

  const breakdown: Record<string, number> = {};

  // 1. Intent factor (up to weights.intent)
  const intentRatio = factors.intentConfidence ?? (factors.hasClearIntent ? 1.0 : 0.4);
  breakdown.intent = Math.round(weights.intent * Math.min(Math.max(intentRatio, 0), 1));

  // 2. Budget fit (up to weights.budgetFit)
  const budgetRatio = factors.hasSufficientBudget ? 1.0 : (factors.budgetNumeric ? 0.7 : 0.3);
  breakdown.budgetFit = Math.round(weights.budgetFit * budgetRatio);

  // 3. Urgency (up to weights.urgency)
  const urgencyMultiplier = factors.urgencyLevel === 'high' ? 1.0 : factors.urgencyLevel === 'medium' ? 0.6 : 0.2;
  breakdown.urgency = Math.round(weights.urgency * urgencyMultiplier);

  // 4. Service match (up to weights.serviceMatch)
  breakdown.serviceMatch = factors.serviceMatched ? weights.serviceMatch : Math.round(weights.serviceMatch * 0.4);

  // 5. Location match (up to weights.locationMatch)
  breakdown.locationMatch = factors.locationMatched ? weights.locationMatch : Math.round(weights.locationMatch * 0.3);

  // 6. Requirement completeness (up to weights.requirementCompleteness)
  const reqRatio = factors.requirementCompletenessRatio ?? 0.5;
  breakdown.requirementCompleteness = Math.round(weights.requirementCompleteness * reqRatio);

  // 7. Engagement (up to weights.engagement)
  const msgCount = factors.messagesCount ?? 2;
  const engagementRatio = msgCount >= 4 ? 1.0 : msgCount >= 2 ? 0.7 : 0.3;
  breakdown.engagement = Math.round(weights.engagement * engagementRatio);

  // 8. Appointment intent (up to weights.appointmentIntent)
  breakdown.appointmentIntent = factors.hasAppointmentRequested ? weights.appointmentIntent : 0;

  // Sum all factors and clamp between 0 and 100
  let totalScore = Object.values(breakdown).reduce((acc, val) => acc + val, 0);
  totalScore = Math.min(Math.max(totalScore, 0), 100);

  let temperature: LeadTemperature = 'COLD';
  if (totalScore >= 70) {
    temperature = 'HOT';
  } else if (totalScore >= 40) {
    temperature = 'WARM';
  } else {
    temperature = 'COLD';
  }

  return {
    score: totalScore,
    temperature,
    breakdown
  };
}
