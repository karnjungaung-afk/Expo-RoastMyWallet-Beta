import type * as NotificationsTypes from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { NotificationType, NotificationData, Purchase } from '@/types';

// Expo Go on Android may not contain the native notification module required by
// this SDK version. Avoid loading expo-notifications at module startup there.
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo';
const notificationsUnavailable =
  Platform.OS === 'android' && isExpoGo;

type NotificationsModule = typeof import('expo-notifications');
let notificationsModule: NotificationsModule | null | undefined;

function getNotifications(): NotificationsModule | null {
  if (notificationsUnavailable) return null;
  if (notificationsModule !== undefined) return notificationsModule;
  try {
    // Lazy-load so an unavailable native module cannot crash app startup.
    notificationsModule = require('expo-notifications') as NotificationsModule;
  } catch (error) {
    console.warn('[Notifications] Native notifications unavailable:', error);
    notificationsModule = null;
  }
  return notificationsModule;
}

const initialNotifications = getNotifications();
initialNotifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

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
    const notifications = getNotifications();
    if (!notifications) return false;
    try {
      const { status: existingStatus } = await notifications.getPermissionsAsync();
      if (existingStatus === 'granted') return true;
      const { status } = await notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.warn('[Notifications] Permission request unavailable:', error);
      return false;
    }
  }

  async hasPermission(): Promise<boolean> {
    const notifications = getNotifications();
    if (!notifications) return false;
    try {
      const { status } = await notifications.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  async getPushToken(): Promise<string | null> {
    if (!Device.isDevice || !(await this.hasPermission())) return null;
    const notifications = getNotifications();
    if (!notifications || (Platform.OS === 'android' && isExpoGo)) return null;
    try {
      const projectId =
        (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ||
        undefined;
      const token = await notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      return token.data;
    } catch (error) {
      console.warn('[Notifications] Push token unavailable (non-fatal):', error);
      return null;
    }
  }

  async scheduleDecisionReminder(purchase: Purchase): Promise<string | null> {
    if (!purchase.waitingUntil || !(await this.hasPermission())) return null;
    const notifications = getNotifications();
    if (!notifications) return null;
    const triggerDate = new Date(purchase.waitingUntil);
    if (triggerDate <= new Date()) return null;
    try {
      return await notifications.scheduleNotificationAsync({
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
          type: notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    } catch (error) {
      console.error('[Notifications] Schedule failed:', error);
      return null;
    }
  }

  async scheduleSpendingLimitWarning(
    limitType: 'daily' | 'weekly' | 'monthly',
    percentUsed: number,
  ): Promise<void> {
    if (!(await this.hasPermission())) return;
    const notifications = getNotifications();
    if (!notifications) return;
    const titles: Record<string, string> = {
      daily: 'Daily limit warning',
      weekly: 'Weekly limit warning',
      monthly: 'Monthly limit warning',
    };
    try {
      await notifications.scheduleNotificationAsync({
        content: {
          title: titles[limitType],
          body: `คุณใช้งบ ${Math.round(percentUsed)}% ของ ${limitType} limit แล้ว`,
          data: { type: 'spending_limit_warning' as NotificationType } as NotificationData,
          sound: false,
        },
        trigger: null,
      });
    } catch (error) {
      console.warn('[Notifications] Spending warning failed:', error);
    }
  }

  async cancelPurchaseReminder(notificationId: string): Promise<void> {
    const notifications = getNotifications();
    if (!notifications) return;
    try {
      await notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('[Notifications] Cancel failed:', error);
    }
  }

  async cancelAllReminders(): Promise<void> {
    const notifications = getNotifications();
    if (!notifications) return;
    try {
      await notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.warn('[Notifications] Cancel all failed:', error);
    }
  }

  addReceivedListener(
    callback: (notification: NotificationsTypes.Notification) => void,
  ): NotificationsTypes.EventSubscription | null {
    const notifications = getNotifications();
    return notifications
      ? notifications.addNotificationReceivedListener(callback)
      : null;
  }

  addResponseListener(
    callback: (response: NotificationsTypes.NotificationResponse) => void,
  ): NotificationsTypes.EventSubscription | null {
    const notifications = getNotifications();
    return notifications
      ? notifications.addNotificationResponseReceivedListener(callback)
      : null;
  }

  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS !== 'ios') return;
    const notifications = getNotifications();
    if (!notifications) return;
    try {
      await notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.warn('[Notifications] Badge update failed:', error);
    }
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  async setupAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;
    const notifications = getNotifications();
    if (!notifications) return;
    try {
      await notifications.setNotificationChannelAsync('decisions', {
        name: 'Decision Reminders',
        importance: notifications.AndroidImportance.DEFAULT,
        sound: null,
        vibrationPattern: [0, 250],
        lightColor: '#1B3557',
      });
      await notifications.setNotificationChannelAsync('limits', {
        name: 'Spending Limits',
        importance: notifications.AndroidImportance.HIGH,
        sound: null,
        vibrationPattern: [0, 500],
        lightColor: '#C98A2A',
      });
      await notifications.setNotificationChannelAsync('squad', {
        name: 'Squad Activity',
        importance: notifications.AndroidImportance.DEFAULT,
        sound: null,
      });
    } catch (error) {
      console.warn('[Notifications] Android channel setup failed:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance();
