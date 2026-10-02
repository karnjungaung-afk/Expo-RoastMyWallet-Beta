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
    // Handle link that opened the app from a closed state
    Linking.getInitialURL().then(url => {
      if (url) handleUrl(url, router);
    });

    // Handle link while app is already running
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url, router);
    });

    return () => sub.remove();
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
