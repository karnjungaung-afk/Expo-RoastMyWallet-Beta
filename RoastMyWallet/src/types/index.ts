// ─── USER & AUTH ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  currency: Currency;
  language: Language;
  timezone: string;
  monthlyBudget: number | null;
  weeklyBudget: number | null;
  dailyBudget: number | null;
  theme: AppTheme;
  aiEnabled: boolean;
  aiPersonality: AIPersonality;
  defaultWaitingHours: number;
  notificationsEnabled: boolean;
  squadEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── PURCHASE ─────────────────────────────────────────────────────────────────

export type PurchaseStatus = 'waiting' | 'bought' | 'avoided' | 'expired' | 'reconsidering';

export type PurchaseReason =
  | 'need'
  | 'want'
  | 'sale'
  | 'influencer'
  | 'fomo'
  | 'bored'
  | 'replacement'
  | 'other';

export type PurchaseCategory =
  | 'electronics'
  | 'fashion'
  | 'beauty'
  | 'home'
  | 'food'
  | 'gaming'
  | 'sports'
  | 'books'
  | 'travel'
  | 'entertainment'
  | 'health'
  | 'tools'
  | 'other';

export type ShoppingPlatform =
  | 'tiktok_shop'
  | 'shopee'
  | 'lazada'
  | 'instagram'
  | 'facebook'
  | 'amazon'
  | 'other_website'
  | 'physical_store'
  | 'unknown';

export type ImpulseRisk = 'high' | 'medium' | 'low';

export type UsageFrequency = 'daily' | 'weekly' | 'monthly' | 'rarely' | 'never';
export type BudgetImpact = 'none' | 'minor' | 'moderate' | 'significant';
export type EmotionalState = 'calm' | 'excited' | 'bored' | 'stressed' | 'happy' | 'unknown';

export interface ScoringQuestionnaire {
  plannedBefore: boolean;        // "Did you plan to buy this before seeing it?"
  hasAlternative: boolean;       // "Do you already own something similar?"
  usageFrequency: UsageFrequency; // "How often will you realistically use it?"
  wouldBuyAtFullPrice: boolean;  // "Would you still buy it at full price?"
  budgetImpact: BudgetImpact;   // "How does this affect your current budget?"
  emotionalState: EmotionalState;
}

export interface Purchase {
  id: string;
  userId: string;
  productName: string;
  price: number;
  currency: Currency;
  url: string | null;
  imageUrl: string | null;
  platform: ShoppingPlatform;
  category: PurchaseCategory;
  reason: PurchaseReason;
  notes: string | null;
  questionnaire: ScoringQuestionnaire | null;
  needScore: number | null;      // 0–100
  impulseRisk: ImpulseRisk | null;
  aiRoast: string | null;
  aiReason: string | null;
  aiRecommendation: AIRecommendation | null;
  status: PurchaseStatus;
  waitingUntil: string | null;
  waitingHours: number;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreatePurchaseInput = Pick<
  Purchase,
  | 'productName'
  | 'price'
  | 'currency'
  | 'url'
  | 'imageUrl'
  | 'platform'
  | 'category'
  | 'reason'
  | 'notes'
  | 'questionnaire'
  | 'waitingHours'
>;

// ─── AI ───────────────────────────────────────────────────────────────────────

export type AIRecommendation = 'buy' | 'wait' | 'skip';

export interface AIAnalysis {
  roast: string;
  reason: string;
  risk: ImpulseRisk;
  recommendation: AIRecommendation;
  questions: string[];
  patternNote: string | null;  // Pro only: pattern-based insight
  confidenceNote: string | null;
}

export type AIPersonality = 'balanced' | 'strict' | 'gentle' | 'savage';

// ─── SUBSCRIPTION ─────────────────────────────────────────────────────────────

export type SubscriptionPlan = 'free' | 'pro';
export type SubscriptionStatus = 'free' | 'pro' | 'expired' | 'cancelled' | 'trial' | 'unknown';

export interface SubscriptionState {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: string | null;
  trialEndsAt: string | null;
  isLoading: boolean;
}

export interface SubscriptionOffering {
  id: string;
  displayName: string;
  packages: SubscriptionPackage[];
}

export interface SubscriptionPackage {
  id: 'pro_monthly' | 'pro_yearly';
  displayName: string;
  price: number;
  currency: Currency;
  period: 'month' | 'year';
}

// ─── SQUAD ────────────────────────────────────────────────────────────────────

export interface Squad {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  members: SquadMember[];
  settings: SquadSettings;
  createdAt: string;
}

export interface SquadMember {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'owner' | 'member';
  joinedAt: string;
  canRoast: boolean;
  canViewPurchases: boolean;
}

export interface SquadSettings {
  alertOnSpendingLimit: boolean;
  alertThreshold: number;        // alert when x% of limit reached
  autoRoastEnabled: boolean;
  privacyLevel: 'all' | 'limits_only' | 'none';
}

export interface SquadMessage {
  id: string;
  squadId: string;
  userId: string;
  purchaseId: string | null;
  content: string;
  type: 'roast' | 'support' | 'system';
  createdAt: string;
  author: {
    displayName: string;
    avatarUrl: string | null;
  };
}

// ─── SPENDING LIMITS ──────────────────────────────────────────────────────────

export interface SpendingLimits {
  userId: string;
  daily: number | null;
  weekly: number | null;
  monthly: number | null;
  impulseOnly: boolean; // Apply limits only to impulse purchases
}

export interface SpendingProgress {
  daily: LimitProgress | null;
  weekly: LimitProgress | null;
  monthly: LimitProgress | null;
}

export interface LimitProgress {
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isExceeded: boolean;
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

export interface MonthlyStats {
  month: string; // YYYY-MM
  totalPurchases: number;
  boughtCount: number;
  avoidedCount: number;
  waitingCount: number;
  totalSpent: number;
  totalAvoided: number;
  impulseRate: number; // 0–100%
  avgWaitingHours: number;
  topCategory: PurchaseCategory | null;
  topReason: PurchaseReason | null;
}

export interface InsightsSummary {
  currentMonth: MonthlyStats;
  previousMonth: MonthlyStats | null;
  totalLifetimeAvoided: number;
  totalLifetimeSpent: number;
  allTimeAvoided: number;
  streakDays: number;
  bestMonth: MonthlyStats | null;
  proSavings: number; // estimated subscription ROI
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'decision_reminder'
  | 'spending_limit_warning'
  | 'spending_limit_exceeded'
  | 'squad_message'
  | 'weekly_summary'
  | 'purchase_expired';

export interface NotificationData {
  type: NotificationType;
  purchaseId?: string;
  squadId?: string;
  /** expo-notifications requires data: Record<string, unknown> */
  [key: string]: unknown;
}

// ─── INTERCEPT ────────────────────────────────────────────────────────────────

export type InterceptTrigger = 'app_open' | 'url_open' | 'share_intent' | 'manual';

export interface InterceptEvent {
  trigger: InterceptTrigger;
  platform: ShoppingPlatform;
  url: string | null;
  detectedAt: string;
}

// ─── COMMON ───────────────────────────────────────────────────────────────────

export type Currency = 'THB' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'SGD' | 'MYR';

export type Language = 'en' | 'th' | 'ja' | 'zh';

export type AppTheme = 'cozy_minimal' | 'mecha_blue' | 'warm_japanese' | 'dark_command' | 'clean_mono';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}
