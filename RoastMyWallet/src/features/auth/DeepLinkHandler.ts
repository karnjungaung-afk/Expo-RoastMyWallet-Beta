/**
 * DeepLinkHandler — handles email-action deep links.
 *
 * OAuth callback URLs are intentionally handled by oauth.ts:
 *   - Web: Supabase's detectSessionInUrl
 *   - Native: openAuthSessionAsync + exchangeCodeForSession
 *
 * This listener only handles email confirmation and password recovery links.
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';

export function useDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/(auth)/reset-password' as any);
      }
    });

    // Web OAuth callbacks are consumed by Supabase's detectSessionInUrl.
    // Listening to the same URL here can exchange the PKCE code a second time
    // and produce flow_state_already_used.
    if (Platform.OS === 'web') {
      return () => subscription.unsubscribe();
    }

    // Handle email-action links that opened the app from a closed state.
    Linking.getInitialURL().then(url => {
      if (url) handleUrl(url, router);
    });

    // Handle email-action links while the native app is already running.
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url, router);
    });

    return () => {
      sub.remove();
      subscription.unsubscribe();
    };
  }, [router]);
}

async function handleUrl(url: string, router: ReturnType<typeof useRouter>) {
  if (!url) return;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }

  // oauth.ts owns this callback and exchanges its PKCE code. Do not race it.
  if (parsed.host === 'auth-callback' || parsed.pathname.includes('auth-callback')) {
    return;
  }

  const code = parsed.searchParams.get('code');
  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        // Supabase may already have consumed the PKCE code during browser startup.
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('[DeepLink] PKCE exchange failed:', error.message);
          return;
        }
      }
      if (parsed.pathname.includes('reset-password') || parsed.host === 'reset-password') {
        router.replace('/(auth)/reset-password' as any);
      } else {
        router.replace('/(tabs)');
      }
      return;
    } catch (err) {
      console.error('[DeepLink] PKCE callback failed:', err);
      return;
    }
  }

  const tokenHash = parsed.searchParams.get('token_hash');
  const type = parsed.searchParams.get('type') as
    | 'signup'
    | 'recovery'
    | 'email'
    | null;

  if (!tokenHash || !type) return;

  try {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (error) {
      console.error('[DeepLink] OTP verify failed:', error.message);
      return;
    }

    if (type === 'recovery') {
      router.replace('/(auth)/reset-password' as any);
    } else {
      router.replace('/(tabs)');
    }
  } catch (err) {
    console.error('[DeepLink] Unexpected error:', err);
  }
}
