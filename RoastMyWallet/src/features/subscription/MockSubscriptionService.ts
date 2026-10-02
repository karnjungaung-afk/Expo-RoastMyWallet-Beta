import type { SubscriptionStatus, SubscriptionOffering, ServiceResult } from '@/types';
import type { ISubscriptionService } from './SubscriptionService';

/**
 * Mock implementation for development and testing.
 * Swap this for RevenueCatSubscriptionService in production
 * by updating the DI binding in services/index.ts.
 *
 * Set mockPlan to 'pro' to test Pro features during development.
 */
export class MockSubscriptionService implements ISubscriptionService {
  private mockStatus: SubscriptionStatus;
  private cachedStatus: SubscriptionStatus | null = null;

  constructor(options: { initialStatus?: SubscriptionStatus } = {}) {
    // Change to 'pro' to test Pro features locally
    this.mockStatus = options.initialStatus ?? 'free';
  }

  async getStatus(): Promise<ServiceResult<SubscriptionStatus>> {
    // Simulate network delay
    await delay(300);
    this.cachedStatus = this.mockStatus;
    return { data: this.mockStatus, error: null };
  }

  async isPro(): Promise<boolean> {
    if (this.cachedStatus !== null) {
      return this.cachedStatus === 'pro' || this.cachedStatus === 'trial';
    }
    const result = await this.getStatus();
    return result.data === 'pro' || result.data === 'trial';
  }

  async getOfferings(): Promise<ServiceResult<SubscriptionOffering[]>> {
    await delay(200);
    return {
      data: [
        {
          id: 'default',
          displayName: 'RoastMyWallet Pro',
          packages: [
            {
              id: 'pro_monthly',
              displayName: 'Monthly',
              price: 39,
              currency: 'THB',
              period: 'month',
            },
            {
              id: 'pro_yearly',
              displayName: 'Yearly',
              price: 349,
              currency: 'THB',
              period: 'year',
            },
          ],
        },
      ],
      error: null,
    };
  }

  async purchase(packageId: string): Promise<ServiceResult<SubscriptionStatus>> {
    await delay(1500); // Simulate purchase flow
    this.mockStatus = 'pro';
    this.cachedStatus = 'pro';
    return { data: 'pro', error: null };
  }

  async restorePurchases(): Promise<ServiceResult<SubscriptionStatus>> {
    await delay(1000);
    // In mock: restore returns current mock status
    return { data: this.mockStatus, error: null };
  }

  async refreshStatus(): Promise<ServiceResult<SubscriptionStatus>> {
    await delay(200);
    this.cachedStatus = this.mockStatus;
    return { data: this.mockStatus, error: null };
  }

  // Dev helper: toggle Pro status for testing
  _setMockPlan(status: SubscriptionStatus) {
    this.mockStatus = status;
    this.cachedStatus = status;
  }
}

// ─── REVENUE CAT STUB ────────────────────────────────────────────────────────
// Production implementation — uncomment and implement when RevenueCat is ready

/*
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { env } from '@/config/env';
import { ENTITLEMENT_PRO } from './SubscriptionService';

export class RevenueCatSubscriptionService implements ISubscriptionService {
  constructor() {
    if (env.revenueCatApiKey) {
      Purchases.setLogLevel(LOG_LEVEL.ERROR);
      Purchases.configure({ apiKey: env.revenueCatApiKey });
    }
  }

  async getStatus(): Promise<ServiceResult<SubscriptionStatus>> {
    try {
      const customer = await Purchases.getCustomerInfo();
      const isActive = customer.entitlements.active[ENTITLEMENT_PRO] !== undefined;
      return { data: isActive ? 'pro' : 'free', error: null };
    } catch (e) {
      return { data: 'unknown', error: String(e) };
    }
  }

  async isPro(): Promise<boolean> {
    const result = await this.getStatus();
    return result.data === 'pro' || result.data === 'trial';
  }

  async getOfferings(): Promise<ServiceResult<SubscriptionOffering[]>> {
    try {
      const offerings = await Purchases.getOfferings();
      // Map RevenueCat offerings to our type...
      return { data: [], error: null };
    } catch (e) {
      return { data: [], error: String(e) };
    }
  }

  async purchase(packageId: string): Promise<ServiceResult<SubscriptionStatus>> {
    try {
      // Find the package and purchase it...
      return { data: 'pro', error: null };
    } catch (e) {
      return { data: 'free', error: String(e) };
    }
  }

  async restorePurchases(): Promise<ServiceResult<SubscriptionStatus>> {
    try {
      const customer = await Purchases.restorePurchases();
      const isActive = customer.entitlements.active[ENTITLEMENT_PRO] !== undefined;
      return { data: isActive ? 'pro' : 'free', error: null };
    } catch (e) {
      return { data: 'unknown', error: String(e) };
    }
  }

  async refreshStatus(): Promise<ServiceResult<SubscriptionStatus>> {
    return this.getStatus();
  }
}
*/

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
