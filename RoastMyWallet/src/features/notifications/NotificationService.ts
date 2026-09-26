import * as ExpoNotifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { NotificationType, NotificationData, Purchase } from '@/types';

// ─── CONFIGURATION ────────────────────────────────────────────────────────────

ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

// ─── NOTIFICATION SERVICE ─────────────────────────────────────────────────────

export class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ── Permissions ─────────────────────────────────────────────────────────

  async requestPermission(): Promise<boolean> {
    if (!Device.isDevice) {
      // Simulator/emulator — permissions don't apply
      return false;
    }

    const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync();

    if (existingStatus === 'granted') return true;

    const { status } = await ExpoNotifications.requestPermissionsAsync();
    return status === 'granted';
  }

  async hasPermission(): Promise<boolean> {
    const { status } = await ExpoNotifications.getPermissionsAsync();
    return status === 'granted';
  }

  async getPushToken(): Promise<string | null> {
    if (!Device.isDevice) return null;
    if (!(await this.hasPermission())) return null;

    try {
      const token = await ExpoNotifications.getExpoPushTokenAsync();
      return token.data;
    } catch {
      return null;
    }
  }

  // ── Schedule Notifications ────────────────────────────────────────────────

  async scheduleDecisionReminder(purchase: Purchase): Promise<string | null> {
    if (!purchase.waitingUntil) return null;
    if (!(await this.hasPermission())) return null;

    const triggerDate = new Date(purchase.waitingUntil);
    if (triggerDate <= new Date()) return null;

    try {
      const id = await ExpoNotifications.scheduleNotificationAsync({
        content: {
          title: 'Time to decide',
          body: `เมื่อวานคุณอยากซื้อ ${purchase.productName} — วันนี้ยังอยากได้อยู่ไหม?`,
          data: {
            type: 'decision_reminder' as NotificationType,
            purchaseId: purchase.id,
          } as NotificationData,
          sound: false,
        },
        trigger: {
          type: ExpoNotifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
      return id;
    } catch (err) {
      console.error('[NotificationService] Schedule failed:', err);
      return null;
    }
  }

  async scheduleSpendingLimitWarning(
    limitType: 'daily' | 'weekly' | 'monthly',
    percentUsed: number
  ): Promise<void> {
    if (!(await this.hasPermission())) return;

    const titles: Record<string, string> = {
      daily: 'Daily limit warning',
      weekly: 'Weekly limit warning',
      monthly: 'Monthly limit warning',
    };

    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: titles[limitType],
        body: `คุณใช้งบ ${Math.round(percentUsed)}% ของ ${limitType} limit แล้ว`,
        data: {
          type: 'spending_limit_warning' as NotificationType,
        } as NotificationData,
        sound: false,
      },
      trigger: null, // immediate
    });
  }

  // ── Cancel Notifications ─────────────────────────────────────────────────

  async cancelPurchaseReminder(notificationId: string): Promise<void> {
    try {
      await ExpoNotifications.cancelScheduledNotificationAsync(notificationId);
    } catch (err) {
      console.error('[NotificationService] Cancel failed:', err);
    }
  }

  async cancelAllReminders(): Promise<void> {
    await ExpoNotifications.cancelAllScheduledNotificationsAsync();
  }

  // ── Listeners ────────────────────────────────────────────────────────────

  addReceivedListener(
    callback: (notification: ExpoNotifications.Notification) => void
  ): ExpoNotifications.EventSubscription {
    return ExpoNotifications.addNotificationReceivedListener(callback);
  }

  addResponseListener(
    callback: (response: ExpoNotifications.NotificationResponse) => void
  ): ExpoNotifications.EventSubscription {
    return ExpoNotifications.addNotificationResponseReceivedListener(callback);
  }

  // ── Badge ────────────────────────────────────────────────────────────────

  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'ios') {
      await ExpoNotifications.setBadgeCountAsync(count);
    }
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  // ── Android Channel ──────────────────────────────────────────────────────

  async setupAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    await ExpoNotifications.setNotificationChannelAsync('decisions', {
      name: 'Decision Reminders',
      importance: ExpoNotifications.AndroidImportance.DEFAULT,
      sound: null,
      vibrationPattern: [0, 250],
      lightColor: '#1B3557',
    });

    await ExpoNotifications.setNotificationChannelAsync('limits', {
      name: 'Spending Limits',
      importance: ExpoNotifications.AndroidImportance.HIGH,
      sound: null,
      vibrationPattern: [0, 500],
      lightColor: '#C98A2A',
    });

    await ExpoNotifications.setNotificationChannelAsync('squad', {
      name: 'Squad Activity',
      importance: ExpoNotifications.AndroidImportance.DEFAULT,
      sound: null,
    });
  }
}

export const notificationService = NotificationService.getInstance();

