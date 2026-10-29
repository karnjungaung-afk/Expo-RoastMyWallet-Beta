import { create } from 'zustand';
import type { SubscriptionStatus, SubscriptionOffering } from '@/types';
import type { ISubscriptionService } from '@/features/subscription/SubscriptionService';
import { RevenueCatSubscriptionService } from '@/features/subscription/RevenueCatSubscriptionService';

// Never grant Pro from a mock purchase. Entitlements come from RevenueCat.
const subscriptionService: ISubscriptionService = new RevenueCatSubscriptionService();

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
  clearForSignedOut: () => void;

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
        error: statusResult.error ?? offeringsResult.error ?? null,
      });
    } catch (err) {
      set({ status: 'unknown', isLoading: false, error: String(err) });
    }
  },

  refresh: async () => {
    const result = await subscriptionService.refreshStatus();
    if (result.data && result.data !== 'unknown') {
      set({ status: result.data, error: result.error ?? null });
    } else {
      set({ error: result.error ?? 'ตรวจสอบสถานะ Pro ไม่สำเร็จ' });
    }
  },

  clearForSignedOut: () => {
    set({ status: 'unknown', offerings: [], isLoading: false, isPurchasing: false, isRestoring: false, error: null });
  },

  purchase: async (packageId) => {
    set({ isPurchasing: true, error: null });
    try {
      const result = await subscriptionService.purchase(packageId as any);
      if (result.error || !result.data || result.data === 'unknown') {
        set({ isPurchasing: false, error: result.error ?? 'ซื้อ Pro ไม่สำเร็จ' });
        return false;
      }
      set({ status: result.data, isPurchasing: false, error: null });
      return result.data === 'pro' || result.data === 'trial';
    } catch (err) {
      set({ isPurchasing: false, error: String(err) });
      return false;
    }
  },

  restorePurchases: async () => {
    set({ isRestoring: true, error: null });
    try {
      const result = await subscriptionService.restorePurchases();
      if (result.error || !result.data || result.data === 'unknown') {
        set({ isRestoring: false, error: result.error ?? 'กู้คืนการซื้อไม่สำเร็จ' });
      } else {
        set({ status: result.data, isRestoring: false, error: null });
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
