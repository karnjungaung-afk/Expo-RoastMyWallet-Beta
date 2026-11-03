import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/services/supabase';

// Required so the auth popup can close itself on web.
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'apple';

/** Thrown when the user closes the browser — callers should stay silent. */
export class OAuthCancelled extends Error {
  constructor() { super('oauth_cancelled'); this.name = 'OAuthCancelled'; }
}

/** Reads params from both ?query and #fragment (Supabase uses either, depending on flow). */
function parseParams(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  const [beforeHash, hash = ''] = url.split('#');
  const query = beforeHash.includes('?') ? beforeHash.split('?')[1] : '';
  for (const part of [query, hash]) {
    for (const pair of part.split('&')) {
      if (!pair) continue;
      const [k, v = ''] = pair.split('=');
      out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    }
  }
  return out;
}

/**
 * Sign in with Google / Apple through Supabase Auth.
 * Success is observed by authStore's onAuthStateChange listener, which then
 * loads the profile; the root route guard moves the user into the app.
 *
 * The redirect URL must be in Supabase → Authentication → URL Configuration:
 *   native: Linking.createURL('auth-callback')  (roastmywallet://auth-callback)
 *   web:    the site origin
 */
export async function signInWithOAuthProvider(provider: OAuthProvider): Promise<void> {
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return; // browser navigates away; session is detected on return
  }

  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('missing_oauth_url');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') throw new OAuthCancelled();

  const p = parseParams(result.url);
  if (p.error || p.error_description) throw new Error(p.error_description ?? p.error);

  if (p.code) {
    const { error: exErr } = await supabase.auth.exchangeCodeForSession(p.code);
    if (exErr) throw exErr;
    return;
  }
  if (p.access_token && p.refresh_token) {
    const { error: setErr } = await supabase.auth.setSession({
      access_token: p.access_token,
      refresh_token: p.refresh_token,
    });
    if (setErr) throw setErr;
    return;
  }
  throw new Error('oauth_incomplete');
}

/** Maps technical errors to short Thai messages for the UI. */
export function oauthErrorMessage(err: unknown, provider: OAuthProvider): string {
  const name = provider === 'google' ? 'Google' : 'Apple';
  const msg = String((err as any)?.message ?? err ?? '').toLowerCase();
  if (msg.includes('not enabled') || msg.includes('unsupported provider') || msg.includes('provider is not'))
    return `ยังไม่ได้เปิดใช้การเข้าสู่ระบบด้วย ${name} (ผู้ดูแลต้องเปิดใน Supabase ก่อน)`;
  if (msg.includes('redirect') || msg.includes('url not allowed'))
    return 'Redirect URL ยังไม่ได้ตั้งค่าใน Supabase';
  if (msg.includes('network') || msg.includes('fetch'))
    return 'เชื่อมต่อเครือข่ายไม่ได้ กรุณาลองใหม่';
  return `เข้าสู่ระบบด้วย ${name} ไม่สำเร็จ กรุณาลองใหม่`;
}
