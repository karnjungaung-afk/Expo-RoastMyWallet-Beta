import { create } from 'zustand';
import { notificationService } from '@/features/notifications/NotificationService';
import { registerPushToken } from '@/features/notifications/registerPushToken';
import type { Purchase } from '@/types';

interface NotificationStoreState {
  hasPermission: boolean;
  pushToken: string | null;
  scheduledIds: Record<string, string>; // purchaseId → notificationId
  isInitialized: boolean;

  initialize: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  schedulePurchaseReminder: (purchase: Purchase) => Promise<void>;
  cancelPurchaseReminder: (purchaseId: string) => Promise<void>;
  cancelAll: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  hasPermission: false,
  pushToken: null,
  scheduledIds: {},
  isInitialized: false,

  initialize: async () => {
    try {
      await notificationService.setupAndroidChannels();

      const perm = await notificationService.hasPermission();
      let token: string | null = null;

      if (perm) {
        token = await notificationService.getPushToken();
        // Register token with Supabase for server-side digest notifications
        // Non-blocking: if user is not yet authenticated, this will silently fail
        registerPushToken().catch(() => {});
      }

      set({ hasPermission: perm, pushToken: token, isInitialized: true });

      // Handle notification taps — navigate to purchase detail
      notificationService.addResponseListener(response => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        if (data?.purchaseId) {
          notificationService.clearBadge();
          // Expo Router handles the deep link automatically via the 'purchase/[id]' scheme
          // This listener is for any additional side effects (e.g., badge clear)
        }
      });
    } catch (err) {
      // Notification init failure must never break app startup
      console.warn('[NotificationStore] Initialize failed (non-fatal):', err);
      set({ isInitialized: true });
    }
  },

  requestPermission: async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      const token = await notificationService.getPushToken();
      set({ hasPermission: true, pushToken: token });
      // Register token now that we have permission
      registerPushToken().catch(() => {});
    } else {
      set({ hasPermission: false });
    }
    return granted;
  },

  schedulePurchaseReminder: async (purchase: Purchase) => {
    const { hasPermission, scheduledIds } = get();
    if (!hasPermission || !purchase.waitingUntil) return;

    // Cancel any existing reminder for this purchase before creating new one
    const existingId = scheduledIds[purchase.id];
    if (existingId) {
      await notificationService.cancelPurchaseReminder(existingId);
    }

    const notifId = await notificationService.scheduleDecisionReminder(purchase);
    if (notifId) {
      set(s => ({
        scheduledIds: { ...s.scheduledIds, [purchase.id]: notifId },
      }));
    }
  },

  cancelPurchaseReminder: async (purchaseId: string) => {
    const notifId = get().scheduledIds[purchaseId];
    if (notifId) {
      await notificationService.cancelPurchaseReminder(notifId);
      set(s => {
        const next = { ...s.scheduledIds };
        delete next[purchaseId];
        return { scheduledIds: next };
      });
    }
  },

  cancelAll: async () => {
    await notificationService.cancelAllReminders();
    set({ scheduledIds: {} });
  },
}));
