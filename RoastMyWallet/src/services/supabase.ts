import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

/**
 * Shared Supabase client for auth, database and Edge Functions.
 *
 * Supabase's auth session is persisted in AsyncStorage for React Native.
 * The app never stores a service-role key here; only the public anon key
 * should be provided through the Expo app config / environment variables.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
