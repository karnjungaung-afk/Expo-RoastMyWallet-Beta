// URL polyfill is applied at app entry (app/_layout.tsx) before this module loads.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

/**
 * Shared Supabase client for auth, database and Edge Functions.
 *
 * Supabase's publishable key is safe to ship in a public/mobile client.
 * NEVER use a secret/service-role key in this file.
 */
export const supabase = createClient(
  env.supabaseUrl,
  env.supabasePublishableKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
