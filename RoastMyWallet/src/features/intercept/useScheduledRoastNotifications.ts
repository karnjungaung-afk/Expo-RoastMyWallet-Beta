/**
 * useScheduledRoastNotifications
 *
 * Schedules time-based "roast" push notifications to fire during
 * the user's typical peak shopping hours (evening by default).
 *
 * Unlike share-intent interception, these notifications work even when
 * the user is browsing in a browser or another app.
 *
 * Default schedule:
 *   - 20:00 daily — "กำลังจะช้อปปิ้งอยู่ไหม? 🔥"
 *   - One randomised afternoon nudge (13:00–14:00)
 *
 * The user can customise or disable this from Settings.
 * Scheduling is idempotent: calling multiple times cancels old ones first.
 */

import { useEffect } from 'react';
import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

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

async function scheduleRoastNotifications() {
  // Remote notifications aren't supported on Android Expo Go
  if (Platform.OS === 'android' && isExpoGo) return;

  const { status } = await ExpoNotifications.getPermissionsAsync();
  if (status !== 'granted') return;

  // Cancel existing roast notifications first
  const scheduled = await ExpoNotifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    const tag = (n.content.data as Record<string, unknown>)?.tag;
    if (tag === EVENING_NOTIFICATION_ID_KEY || tag === AFTERNOON_NOTIFICATION_ID_KEY) {
      await ExpoNotifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  // Evening roast — every day at 20:00
  await ExpoNotifications.scheduleNotificationAsync({
    content: {
      title: '🔥 RoastMyWallet',
      body: getRandom(EVENING_ROASTS),
      data: { tag: EVENING_NOTIFICATION_ID_KEY, type: 'roast_reminder' },
      sound: false,
    },
    trigger: {
      type: ExpoNotifications.SchedulableTriggerInputTypes.CALENDAR,
      repeats: true,
      hour: 20,
      minute: 0,
    },
  });

  // Afternoon roast — every day at 13:15
  await ExpoNotifications.scheduleNotificationAsync({
    content: {
      title: '⏸ หยุดแค่นาทีเดียว',
      body: getRandom(AFTERNOON_ROASTS),
      data: { tag: AFTERNOON_NOTIFICATION_ID_KEY, type: 'roast_reminder' },
      sound: false,
    },
    trigger: {
      type: ExpoNotifications.SchedulableTriggerInputTypes.CALENDAR,
      repeats: true,
      hour: 13,
      minute: 15,
    },
  });
}

export function useScheduledRoastNotifications(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    scheduleRoastNotifications().catch(err =>
      console.warn('[RoastNotifications] Schedule failed (non-fatal):', err),
    );
  }, [enabled]);
}
