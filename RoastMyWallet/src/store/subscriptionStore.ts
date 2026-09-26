import { create } from 'zustand';
import type { SubscriptionStatus, SubscriptionOffering } from '@/types';
import type { ISubscriptionService } from '@/features/subscription/SubscriptionService';
import { MockSubscriptionService } from '@/features/subscription/MockSubscriptionService';

// Instantiate the active service here — swap for RevenueCatSubscriptionService in production
const subscriptionService: ISubscriptionService = new MockSubscriptionService({
  initialStatus: 'free', // Change to 'pro' to test Pro features
});

interface SubscriptionStoreState {
  status: SubscriptionStatus;
  offerings: SubscriptionOffering[];
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  purchase: (packageId: string) => Promise<boolean>;
  restorePurchases: () => Promise<void>;

  // Computed
  isPro: () => boolean;
  isProOrTrial: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionStoreState>((set, get) => ({
  status: 'unknown',
  offerings: [],
  isLoading: false,
  isPurchasing: false,
  isRestoring: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const [statusResult, offeringsResult] = await Promise.all([
        subscriptionService.getStatus(),
        subscriptionService.getOfferings(),
      ]);

      set({
        status: statusResult.data ?? 'unknown',
        offerings: offeringsResult.data ?? [],
        isLoading: false,
      });
    } catch (err) {
      set({ status: 'unknown', isLoading: false, error: String(err) });
    }
  },

  refresh: async () => {
    const result = await subscriptionService.refreshStatus();
    if (result.data) {
      set({ status: result.data });
    }
  },

  purchase: async (packageId) => {
    set({ isPurchasing: true, error: null });
    try {
      const result = await subscriptionService.purchase(packageId as any);
      if (result.data) {
        set({ status: result.data, isPurchasing: false });
        return result.data === 'pro' || result.data === 'trial';
      }
      set({ isPurchasing: false, error: result.error ?? 'Purchase failed' });
      return false;
    } catch (err) {
      set({ isPurchasing: false, error: String(err) });
      return false;
    }
  },

  restorePurchases: async () => {
    set({ isRestoring: true, error: null });
    try {
      const result = await subscriptionService.restorePurchases();
      if (result.data) {
        set({ status: result.data, isRestoring: false });
      } else {
        set({ isRestoring: false, error: result.error ?? 'Restore failed' });
      }
    } catch (err) {
      set({ isRestoring: false, error: String(err) });
    }
  },

  isPro: () => {
    const status = get().status;
    return status === 'pro' || status === 'trial';
  },

  isProOrTrial: () => {
    const status = get().status;
    return status === 'pro' || status === 'trial';
  },
}));
