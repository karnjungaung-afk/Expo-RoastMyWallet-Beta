import type {
  SubscriptionStatus,
  SubscriptionOffering,
  SubscriptionPackage,
  ServiceResult,
} from '@/types';

// ─── INTERFACE ────────────────────────────────────────────────────────────────
//
// All subscription logic goes through this interface.
// UI components never call RevenueCat or store APIs directly.
// Swap MockSubscriptionService → RevenueCatSubscriptionService without
// touching any UI component.

export interface ISubscriptionService {
  /**
   * Get the current subscription status.
   * Always resolves — never throws. Returns 'unknown' on error.
   */
  getStatus(): Promise<ServiceResult<SubscriptionStatus>>;

  /**
   * Returns true if the user has an active Pro plan.
   * Safe to call frequently — should be cached internally.
   */
  isPro(): Promise<boolean>;

  /**
   * Load available offerings from the store.
   * Pro: show actual store offerings.
   * Mock: return hardcoded offerings.
   */
  getOfferings(): Promise<ServiceResult<SubscriptionOffering[]>>;

  /**
   * Initiate a purchase flow.
   * Returns the new status on success.
   */
  purchase(packageId: SubscriptionPackage['id']): Promise<ServiceResult<SubscriptionStatus>>;

  /**
   * Restore previous purchases from the store.
   * Returns the restored status.
   */
  restorePurchases(): Promise<ServiceResult<SubscriptionStatus>>;

  /**
   * Check and validate current entitlements.
   * Called on app foreground to ensure the status is fresh.
   */
  refreshStatus(): Promise<ServiceResult<SubscriptionStatus>>;
}

// ─── ENTITLEMENT IDS ─────────────────────────────────────────────────────────

export const ENTITLEMENT_PRO = 'pro';

export const PACKAGE_IDS = {
  PRO_MONTHLY: 'pro_monthly',
  PRO_YEARLY: 'pro_yearly',
} as const;

// ─── FEATURE GATES ────────────────────────────────────────────────────────────
// Central list of what requires Pro. Never scatter isPro() calls.

export const PRO_FEATURES = {
  unlimitedHistory: true,
  advancedAI: true,
  personalizedRoasting: true,
  advancedScore: true,
  smartWaiting: true,
  advancedAnalytics: true,
  savingsDashboard: true,
  autoIntercept: true,
  squadRoasting: true,
  advancedLimits: true,
  customRules: true,
  advancedNotifications: true,
  cloudSync: true,
  customization: true,
} as const;

export type ProFeature = keyof typeof PRO_FEATURES;

export function requiresPro(_feature: ProFeature): true {
  return true;
}
