/**
 * app.config.js
 *
 * Reads environment variables from .env files and passes them into the app
 * via expo-constants' `extra` field.
 *
 * Usage in app: import { env } from '@/config/env'
 *
 * Never hardcode secrets here. Use .env.local for local overrides.
 * .env files must be in .gitignore.
 */

module.exports = ({ config }) => ({
  ...config,
  extra: {
    // Supabase
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',

    // API
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://your-project.supabase.co',

    // RevenueCat (optional — can be empty during development)
    revenueCatApiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? null,

    // App environment
    appEnvironment: process.env.APP_ENV ?? 'development',

    // Feature flags
    aiEnabled: process.env.AI_ENABLED !== 'false',

    // EAS
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '',
    },
  },
});
