import { create } from 'zustand';
import { Platform } from 'react-native';
import type { SubscriptionStatus, SubscriptionOffering, SubscriptionPackage } from '@/types';
import { supabase } from '@/services/supabase';
import { configureRevenueCat, loadRevenueCatOfferings, purchaseRevenueCatPackage, restoreRevenueCatPurchases } from '@/features/subscription/RevenueCatService';

interface SubscriptionStoreState {
  status: SubscriptionStatus;
  offerings: SubscriptionOffering[];
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  purchase: (packageId: SubscriptionPackage['id']) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  isPro: () => boolean;
  isProOrTrial: () => boolean;
}

const defaultOfferings: SubscriptionOffering[] = [{
  id: 'default',
  displayName: 'RoastMyWallet Pro',
  packages: [
    { id: 'pro_monthly', displayName: 'รายเดือน', price: 39, currency: 'THB', period: 'month' },
    { id: 'pro_yearly', displayName: 'รายปี', price: 349, currency: 'THB', period: 'year' },
  ],
}];

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
  if (data.plan === 'pro' && !data.status) return 'pro';
  if (data.status === 'canceled' || data.status === 'cancelled') return 'cancelled';
  return 'free';
}

async function refreshUntilWebhook(maxAttempts = 8): Promise<SubscriptionStatus> {
  let status: SubscriptionStatus = 'unknown';
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    status = await loadVerifiedStatus();
    if (status === 'pro' || status === 'trial' || status === 'expired' || status === 'cancelled') return status;
    if (attempt < maxAttempts - 1) await new Promise(resolve => setTimeout(resolve, 1500));
  }
  return status;
}

export const useSubscriptionStore = create<SubscriptionStoreState>((set, get) => ({
  status: 'unknown',
  offerings: defaultOfferings,
  isLoading: false,
  isPurchasing: false,
  isRestoring: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user && Platform.OS === 'android') {
        await configureRevenueCat(user.id);
        const liveOfferings = await loadRevenueCatOfferings();
        if (liveOfferings.some(item => item.packages.length > 0)) set({ offerings: liveOfferings });
      }
      const status = await loadVerifiedStatus();
      set({ status, isLoading: false });
    } catch (err) {
      // Configuration failure must not create a Pro entitlement.
      const status = await loadVerifiedStatus().catch(() => 'unknown' as SubscriptionStatus);
      set({ status, isLoading: false, error: String(err) });
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

  purchase: async (packageId) => {
    set({ isPurchasing: true, error: null });
    try {
      if (Platform.OS !== 'android') throw new Error('การซื้อผ่าน Google Play ใช้ได้เฉพาะ Android');
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw new Error('กรุณาเข้าสู่ระบบใหม่');
      await configureRevenueCat(user.id);
      await loadRevenueCatOfferings();
      await purchaseRevenueCatPackage(packageId);
      const status = await refreshUntilWebhook();
      set({ status, isPurchasing: false });
      if (status !== 'pro' && status !== 'trial') {
        set({ error: 'รับคำสั่งซื้อแล้ว แต่ยังไม่ได้รับการยืนยันจากเซิร์ฟเวอร์ โปรดกดตรวจสอบสถานะอีกครั้งภายหลัง' });
        return false;
      }
      return true;
    } catch (err) {
      set({ isPurchasing: false, error: err instanceof Error ? err.message : String(err) });
      return false;
    }
  },

  restorePurchases: async () => {
    set({ isRestoring: true, error: null });
    try {
      if (Platform.OS !== 'android') throw new Error('การกู้คืนการซื้อผ่าน Google Play ใช้ได้เฉพาะ Android');
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw new Error('กรุณาเข้าสู่ระบบใหม่');
      await configureRevenueCat(user.id);
      await restoreRevenueCatPurchases();
      const status = await refreshUntilWebhook();
      set({ status, isRestoring: false });
      if (status !== 'pro' && status !== 'trial') set({ error: 'ยังไม่พบสิทธิ์ Pro ที่ยืนยันแล้วในบัญชีนี้' });
    } catch (err) {
      set({ isRestoring: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  isPro: () => get().status === 'pro' || get().status === 'trial',
  isProOrTrial: () => get().status === 'pro' || get().status === 'trial',
}));
