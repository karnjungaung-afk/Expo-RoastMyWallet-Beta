/**
 * registerPushToken
 *
 * Call this once after notification permission is granted.
 * Saves the Expo push token to Supabase so the server-side
 * weekly-digest Edge Function can send notifications.
 *
 * This is a separate file to keep NotificationService free of
 * Supabase imports (avoids circular dependencies in the test tree).
 */
import { Platform } from 'react-native';
import { notificationService } from './NotificationService';
import { supabase } from '@/services/supabase';

export async function registerPushToken(): Promise<void> {
  try {
    const token = await notificationService.getPushToken();
    if (!token) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const platform: 'ios' | 'android' | 'web' =
      Platform.OS === 'ios' ? 'ios'
      : Platform.OS === 'android' ? 'android'
      : 'web';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('push_tokens').upsert({
      user_id: user.id,
      token,
      platform,
    });
  } catch (err) {
    // Non-fatal — the app works fully even without tokens registered.
    // Server digest simply won't send to this device until token is stored.
    console.error('[registerPushToken] Failed to save push token:', err);
  }
}
