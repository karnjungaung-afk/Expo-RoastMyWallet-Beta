/**
 * Schedules daily roast reminders when notifications are supported.
 *
 * Android Expo Go does not support expo-notifications in this SDK. Avoid
 * importing the native package in that environment so app startup can proceed.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Compare the documented runtime string directly. This avoids relying on enum
// exports that can differ between Expo Constants versions.
const executionEnvironment = String(Constants.executionEnvironment ?? '').toLowerCase();
const appOwnership = String(Constants.appOwnership ?? '').toLowerCase();
const isExpoGo =
  executionEnvironment === 'storeclient' ||
  appOwnership === 'expo';
const notificationsUnavailable = Platform.OS === 'android' && isExpoGo;

const EVENING_NOTIFICATION_ID_KEY = 'rmw_evening_roast';
const AFTERNOON_NOTIFICATION_ID_KEY = 'rmw_afternoon_roast';

const EVENING_ROASTS = [
  '🔥 คืนนี้กำลังจะช้อปอยู่ไหม? ลองถามตัวเองก่อนว่า "จำเป็นจริงๆ ไหม?"',
  '🛍️ TikTok Shop กำลังรอคุณอยู่... แต่บัญชีธนาคารก็กำลังรอเหมือนกัน',
  '⏸ ก่อนกด Add to Cart — เปิด RoastMyWallet แล้วคิดให้ดีก่อนนะ!',
  '💸 ยอดใช้จ่ายเดือนนี้เป็นยังไงบ้าง? มาดูกันก่อนช้อปดีกว่า',
];

const AFTERNOON_ROASTS = [
  '☀️ พักเที่ยงแล้ว กำลังจะ scroll Shopee อยู่ไหม? หยุดแค่ 5 วินาทีก่อน',
  '🍜 กินข้าวเที่ยงเสร็จแล้วอย่าลืม: Flash Sale ≠ สิ่งที่ต้องการจริงๆ',
  '🌞 Lunch break = ไม่ใช่ Shopping break นะ! (หรือใช่?)',
];

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type NotificationsModule = typeof import('expo-notifications');
let notificationsModule: NotificationsModule | null | undefined;

function getNotifications(): NotificationsModule | null {
  if (notificationsUnavailable) return null;
  if (notificationsModule !== undefined) return notificationsModule;

  try {
    notificationsModule = require('expo-notifications') as NotificationsModule;
  } catch (error) {
    console.warn('[RoastNotifications] Native notifications unavailable:', error);
    notificationsModule = null;
  }

  return notificationsModule;
}

async function scheduleRoastNotifications() {
  const notifications = getNotifications();
  if (!notifications) return;

  try {
    const { status } = await notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    // Cancel existing roast notifications first.
    const scheduled = await notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      const tag = (notification.content.data as Record<string, unknown>)?.tag;
      if (
        tag === EVENING_NOTIFICATION_ID_KEY ||
        tag === AFTERNOON_NOTIFICATION_ID_KEY
      ) {
        await notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }

    // Evening roast — every day at 20:00.
    await notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 RoastMyWallet',
        body: getRandom(EVENING_ROASTS),
        data: { tag: EVENING_NOTIFICATION_ID_KEY, type: 'roast_reminder' },
        sound: false,
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.CALENDAR,
        repeats: true,
        hour: 20,
        minute: 0,
      },
    });

    // Afternoon roast — every day at 13:15.
    await notifications.scheduleNotificationAsync({
      content: {
        title: '⏸ หยุดแค่นาทีเดียว',
        body: getRandom(AFTERNOON_ROASTS),
        data: { tag: AFTERNOON_NOTIFICATION_ID_KEY, type: 'roast_reminder' },
        sound: false,
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.CALENDAR,
        repeats: true,
        hour: 13,
        minute: 15,
      },
    });
  } catch (error) {
    console.warn('[RoastNotifications] Scheduling failed (non-fatal):', error);
  }
}

export function useScheduledRoastNotifications(enabled: boolean) {
  useEffect(() => {
    if (!enabled || notificationsUnavailable) return;

    void scheduleRoastNotifications();
  }, [enabled]);
}
