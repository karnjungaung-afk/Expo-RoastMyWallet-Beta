/**
 * PauseBuy — Deterministic Need Score Engine
 *
 * This module owns the actual score calculation.
 * The AI NEVER modifies the Need Score — it only explains it.
 * If AI is unavailable, this continues to work perfectly.
 *
 * Score range: 0–100
 *   0–39   → HIGH impulse risk
 *   40–69  → MEDIUM impulse risk
 *   70–100 → Likely useful
 */

import type {
  PurchaseReason,
  UsageFrequency,
  BudgetImpact,
  EmotionalState,
  ScoringQuestionnaire,
  ImpulseRisk,
} from '@/types';

// ─── RESULT TYPE ─────────────────────────────────────────────────────────────

export interface ScoringFactor {
  label: string;
  delta: number;
  explanation: string;
}

export interface ScoringResult {
  score: number;           // 0–100, clamped and rounded
  risk: ImpulseRisk;
  factors: ScoringFactor[];
  topWarning: string | null;
}

// ─── WEIGHTS ─────────────────────────────────────────────────────────────────

const REASON_DELTAS: Record<PurchaseReason, { delta: number; label: string; explanation: string }> = {
  need:        { delta: +20, label: 'Genuine need',           explanation: 'You identified this as a genuine need.' },
  replacement: { delta: +15, label: 'Replacing broken item',  explanation: 'You\'re replacing something that no longer works.' },
  want:        { delta:   0, label: 'General want',           explanation: 'You want this item.' },
  other:       { delta:   0, label: 'Unspecified reason',     explanation: 'Reason not specified.' },
  sale:        { delta: -10, label: 'Discount-triggered',     explanation: 'The sale price is the primary trigger.' },
  influencer:  { delta: -15, label: 'Influencer-influenced',  explanation: 'You saw this promoted by someone online.' },
  fomo:        { delta: -20, label: 'Fear of missing out',    explanation: 'FOMO is a well-known impulse spending trap.' },
  bored:       { delta: -25, label: 'Boredom shopping',       explanation: 'Purchases made while bored are frequently regretted.' },
};

const FREQUENCY_DELTAS: Record<UsageFrequency, { delta: number; explanation: string }> = {
  daily:   { delta: +20, explanation: 'Daily use gives excellent value-per-use.' },
  weekly:  { delta: +10, explanation: 'Weekly use is solid justification.' },
  monthly: { delta:   0, explanation: 'Monthly use is modest but acceptable.' },
  rarely:  { delta: -15, explanation: 'Rare use means high cost-per-use.' },
  never:   { delta: -30, explanation: 'If you\'ll never use it, what\'s the point?' },
};

const BUDGET_DELTAS: Record<BudgetImpact, { delta: number; explanation: string }> = {
  none:        { delta: +10, explanation: 'Fits comfortably within budget.' },
  minor:       { delta:  +5, explanation: 'Small budget impact.' },
  moderate:    { delta:  -5, explanation: 'Will noticeably affect spending this month.' },
  significant: { delta: -15, explanation: 'This purchase will strain your budget.' },
};

// ─── MAIN SCORE FUNCTION ─────────────────────────────────────────────────────

export function calculateNeedScore(
  reason: PurchaseReason,
  questionnaire: ScoringQuestionnaire,
): ScoringResult {
  let score = 50; // Neutral baseline
  const factors: ScoringFactor[] = [];

  // 1. Purchase reason (max ±25)
  const rd = REASON_DELTAS[reason] ?? REASON_DELTAS.other;
  if (rd.delta !== 0) {
    score += rd.delta;
    factors.push({ label: rd.label, delta: rd.delta, explanation: rd.explanation });
  }

  // 2. Was it planned? (±15)
  if (questionnaire.plannedBefore) {
    score += 15;
    factors.push({ label: 'Planned purchase', delta: 15, explanation: 'You had already planned this before seeing it.' });
  } else {
    score -= 10;
    factors.push({ label: 'Unplanned purchase', delta: -10, explanation: 'This purchase was not planned before you encountered it.' });
  }

  // 3. Already own alternative? (±15)
  if (questionnaire.hasAlternative) {
    score -= 15;
    factors.push({ label: 'Already owns alternative', delta: -15, explanation: 'You already own something that serves a similar purpose.' });
  } else {
    score += 10;
    factors.push({ label: 'No alternative owned', delta: 10, explanation: 'You don\'t already own something similar.' });
  }

  // 4. Usage frequency (±20)
  const fd = FREQUENCY_DELTAS[questionnaire.usageFrequency] ?? FREQUENCY_DELTAS.monthly;
  score += fd.delta;
  factors.push({ label: `Usage: ${questionnaire.usageFrequency}`, delta: fd.delta, explanation: fd.explanation });

  // 5. Would buy at full price? (±10)
  if (questionnaire.wouldBuyAtFullPrice) {
    score += 10;
    factors.push({ label: 'Discount-independent', delta: 10, explanation: 'You\'d buy this even without the discount. Good signal.' });
  } else {
    score -= 10;
    factors.push({ label: 'Discount-dependent', delta: -10, explanation: 'The discount is the main driver, not the need.' });
  }

  // 6. Budget impact (±15)
  const bd = BUDGET_DELTAS[questionnaire.budgetImpact] ?? BUDGET_DELTAS.minor;
  score += bd.delta;
  factors.push({ label: `Budget: ${questionnaire.budgetImpact}`, delta: bd.delta, explanation: bd.explanation });

  // 7. Emotional state modifier (±10)
  score += getEmotionalDelta(questionnaire.emotionalState, factors);

  // Clamp to 0–100
  score = Math.max(0, Math.min(100, Math.round(score)));

  const risk: ImpulseRisk = score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high';

  // Most negative factor is the top warning
  const sortedNeg = factors.filter(f => f.delta < 0).sort((a, b) => a.delta - b.delta);
  const topWarning = sortedNeg.length > 0 ? sortedNeg[0].explanation : null;

  return { score, risk, factors, topWarning };
}

function getEmotionalDelta(state: EmotionalState, factors: ScoringFactor[]): number {
  const EMOTIONAL_MAP: Partial<Record<EmotionalState, { delta: number; label: string; explanation: string }>> = {
    bored:   { delta: -10, label: 'Boredom trigger', explanation: 'Shopping while bored is a classic impulse pattern.' },
    stressed:{ delta:  -8, label: 'Stress trigger',  explanation: 'Retail therapy rarely resolves the underlying stress.' },
    excited: { delta:  -5, label: 'Excitement bias', explanation: 'Excitement can inflate perceived need in the moment.' },
  };
  const e = EMOTIONAL_MAP[state];
  if (!e) return 0;
  factors.push({ label: e.label, delta: e.delta, explanation: e.explanation });
  return e.delta;
}

// ─── QUICK SCORE (no questionnaire) ──────────────────────────────────────────
// Used when the user skips the questionnaire. Conservative defaults.

export function calculateQuickScore(reason: PurchaseReason): ScoringResult {
  return calculateNeedScore(reason, {
    plannedBefore: false,
    hasAlternative: false,
    usageFrequency: 'monthly',
    wouldBuyAtFullPrice: reason !== 'sale' && reason !== 'fomo',
    budgetImpact: 'minor',
    emotionalState: 'unknown',
  });
}

// ─── WAITING PERIOD SUGGESTION ────────────────────────────────────────────────
// Approximate USD conversion for price-based waiting period tiers.
// Rates are illustrative only — not for financial calculations.

const USD_RATES: Record<string, number> = {
  THB: 0.028, USD: 1, EUR: 1.10, GBP: 1.25,
  JPY: 0.007, SGD: 0.74, MYR: 0.22,
};

export function suggestWaitingHours(price: number, risk: ImpulseRisk, currency: string): number {
  // Edge cases: negative or zero price → minimum wait
  if (!Number.isFinite(price) || price <= 0) return 6;

  const rate = USD_RATES[currency] ?? 1;
  const usd = price * rate;

  if (risk === 'high') {
    if (usd > 200) return 72;
    if (usd > 50)  return 48;
    return 24;
  }
  if (risk === 'medium') {
    if (usd > 200) return 48;
    if (usd > 50)  return 24;
    return 12;
  }
  // low risk
  if (usd > 200) return 24;
  if (usd > 50)  return 12;
  return 6;
}

// ─── AGGREGATE METRICS ───────────────────────────────────────────────────────

export function calculateAvoidedSpending(
  purchases: Array<{ price: number; status: string }>
): number {
  return purchases
    .filter(p => p.status === 'avoided' || p.status === 'expired')
    .reduce((sum, p) => sum + (Number.isFinite(p.price) ? p.price : 0), 0);
}

export function calculateImpulseRate(
  purchases: Array<{ status: string; impulseRisk: string | null }>
): number {
  const decided = purchases.filter(p => p.status === 'bought' || p.status === 'avoided');
  if (decided.length === 0) return 0;
  const impulseBought = decided.filter(
    p => p.status === 'bought' && p.impulseRisk === 'high'
  ).length;
  return Math.round((impulseBought / decided.length) * 100);
}

// ─── RISK LABEL ───────────────────────────────────────────────────────────────

export function getRiskLabel(risk: ImpulseRisk): string {
  return { high: 'HIGH RISK', medium: 'MEDIUM RISK', low: 'LIKELY USEFUL' }[risk];
}
