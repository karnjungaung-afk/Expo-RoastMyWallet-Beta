import * as ExpoNotifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { NotificationType, NotificationData, Purchase } from '@/types';

// Remote push tokens on Android are NOT supported inside Expo Go since SDK 53.
// Local notification scheduling still works on all platforms including Expo Go.
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// ─── CONFIGURATION ────────────────────────────────────────────────────────────

ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
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

  async requestPermission(): Promise<boolean> {
    if (!Device.isDevice) return false;
    const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;
    const { status } = await ExpoNotifications.requestPermissionsAsync();
    return status === 'granted';
  }

  async hasPermission(): Promise<boolean> {
    const { status } = await ExpoNotifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Returns the Expo push token, or null when unavailable.
   *
   * - Returns null on Android Expo Go: remote push requires FCM/EAS infra
   *   that Expo Go doesn't provide since SDK 53. Local scheduling still works.
   * - Returns null on simulators/emulators (Device.isDevice is false).
   * - Returns null when permission hasn't been granted.
   * - All errors are caught — push-token failure is non-fatal.
   */
  async getPushToken(): Promise<string | null> {
    if (!Device.isDevice) return null;
    if (!(await this.hasPermission())) return null;

    // Android Expo Go doesn't support FCM-based push tokens since SDK 53.
    // Skip silently so the rest of the app keeps working.
    if (Platform.OS === 'android' && isExpoGo) {
      if (__DEV__) {
        console.log(
          '[Notifications] Skipping push token on Android Expo Go — ' +
            'use a development build for remote push support.',
        );
      }
      return null;
    }

    try {
      // Pass projectId explicitly when available so the call works outside
      // an EAS build too. Falls back to app config auto-detection when absent.
      const projectId =
        (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ||
        undefined;

      const token = await ExpoNotifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      return token.data;
    } catch (err) {
      // Non-fatal: local scheduling works without a push token.
      console.warn('[Notifications] Push token unavailable (non-fatal):', err);
      return null;
    }
  }

  async scheduleDecisionReminder(purchase: Purchase): Promise<string | null> {
    if (!purchase.waitingUntil) return null;
    if (!(await this.hasPermission())) return null;

    const triggerDate = new Date(purchase.waitingUntil);
    if (triggerDate <= new Date()) return null;

    try {
      return await ExpoNotifications.scheduleNotificationAsync({
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
    } catch (err) {
      console.error('[Notifications] Schedule failed:', err);
      return null;
    }
  }

  async scheduleSpendingLimitWarning(
    limitType: 'daily' | 'weekly' | 'monthly',
    percentUsed: number,
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
        data: { type: 'spending_limit_warning' as NotificationType } as NotificationData,
        sound: false,
      },
      trigger: null,
    });
  }

  async cancelPurchaseReminder(notificationId: string): Promise<void> {
    try {
      await ExpoNotifications.cancelScheduledNotificationAsync(notificationId);
    } catch (err) {
      console.error('[Notifications] Cancel failed:', err);
    }
  }

  async cancelAllReminders(): Promise<void> {
    await ExpoNotifications.cancelAllScheduledNotificationsAsync();
  }

  addReceivedListener(
    callback: (notification: ExpoNotifications.Notification) => void,
  ): ExpoNotifications.EventSubscription {
    return ExpoNotifications.addNotificationReceivedListener(callback);
  }

  addResponseListener(
    callback: (response: ExpoNotifications.NotificationResponse) => void,
  ): ExpoNotifications.EventSubscription {
    return ExpoNotifications.addNotificationResponseReceivedListener(callback);
  }

  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'ios') {
      await ExpoNotifications.setBadgeCountAsync(count);
    }
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

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
