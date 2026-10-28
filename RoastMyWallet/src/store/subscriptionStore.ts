import { create } from 'zustand';
import type { SubscriptionStatus, SubscriptionOffering } from '@/types';
import { supabase } from '@/services/supabase';

interface SubscriptionStoreState {
  status: SubscriptionStatus;
  offerings: SubscriptionOffering[];
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  purchase: (packageId: string) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  isPro: () => boolean;
  isProOrTrial: () => boolean;
}

const offerings: SubscriptionOffering[] = [{
  id: 'default',
  displayName: 'RoastMyWallet Pro',
  packages: [
    { id: 'pro_monthly', displayName: 'Monthly', price: 39, currency: 'THB', period: 'month' },
    { id: 'pro_yearly', displayName: 'Yearly', price: 349, currency: 'THB', period: 'year' },
  ],
}];

// Fail closed: subscription state is read from the server-owned row only.
// Never set Pro based on a client purchase callback, mock, or checkout redirect.
async function loadVerifiedStatus(): Promise<SubscriptionStatus> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return 'unknown';
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('plan,status,expires_at,current_period_end')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return 'free';

  const expiryValue = data.current_period_end ?? data.expires_at;
  if (expiryValue && new Date(expiryValue).getTime() <= Date.now()) return 'expired';
  if (data.plan === 'pro' && (data.status === 'active' || data.status === 'trialing')) {
    return data.status === 'trialing' ? 'trial' : 'pro';
  }
  return data.plan === 'pro' && !data.status ? 'pro' : 'free';
}

export const useSubscriptionStore = create<SubscriptionStoreState>((set, get) => ({
  status: 'unknown',
  offerings,
  isLoading: false,
  isPurchasing: false,
  isRestoring: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const status = await loadVerifiedStatus();
      set({ status, isLoading: false });
    } catch (err) {
      set({ status: 'unknown', isLoading: false, error: String(err) });
    }
  },

  refresh: async () => {
    try {
      const status = await loadVerifiedStatus();
      set({ status, error: null });
    } catch (err) {
      set({ status: 'unknown', error: String(err) });
    }
  },

  purchase: async (_packageId) => {
    // Native RevenueCat SDK is not installed/configured yet. Do not simulate a purchase.
    set({ isPurchasing: false, error: 'การชำระเงินจริงยังตั้งค่าไม่เสร็จ กรุณาลองใหม่ภายหลัง' });
    return false;
  },

  restorePurchases: async () => {
    set({ isRestoring: true, error: null });
    try {
      const status = await loadVerifiedStatus();
      set({ status, isRestoring: false });
    } catch (err) {
      set({ status: 'unknown', isRestoring: false, error: String(err) });
    }
  },

  isPro: () => get().status === 'pro' || get().status === 'trial',
  isProOrTrial: () => get().status === 'pro' || get().status === 'trial',
}));
