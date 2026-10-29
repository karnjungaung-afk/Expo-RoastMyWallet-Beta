/**
 * DeepLinkHandler — handles roastmywallet:// deep links
 *
 * Supabase sends two types of deep link after email actions:
 *   roastmywallet://confirm?token_hash=...&type=signup
 *   roastmywallet://reset-password?token_hash=...&type=recovery
 *
 * Set these in Supabase Dashboard → Authentication → URL Configuration:
 *   Redirect URLs:
 *     roastmywallet://confirm
 *     roastmywallet://reset-password
 */

import { useEffect } from 'react';
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

    // Handle link that opened the app from a closed state
    Linking.getInitialURL().then(url => {
      if (url) handleUrl(url, router);
    });

    // Handle link while app is already running
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url, router);
    });

    return () => {
      sub.remove();
      subscription.unsubscribe();
    };
  }, []);
}

async function handleUrl(url: string, router: ReturnType<typeof useRouter>) {
  if (!url) return;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
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
      if (parsed.pathname.includes('reset-password')) {
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
