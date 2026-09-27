/**
 * app.config.js
 *
 * Supabase client configuration for Expo.
 *
 * The Supabase publishable key is intentionally public and may be bundled
 * into the mobile app. Never put a Supabase secret/service-role key here.
 *
 * Environment variables override the project defaults below so the same
 * source works locally, on CI, and in EAS builds.
 */

const DEFAULT_SUPABASE_URL = 'https://hqezoifilosvaxsvrbwf.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_G0uNBEhWvOs0HiiP3PxNKA_zp74pJ4t';

module.exports = ({ config }) => {
  const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL;

  const supabasePublishableKey =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    DEFAULT_SUPABASE_PUBLISHABLE_KEY;

  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),

      // Supabase
      supabaseUrl,
      supabasePublishableKey,

      // Backward-compatible alias for older code.
      supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? supabasePublishableKey,

      // API
      apiBaseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL ?? supabaseUrl,

      // RevenueCat (optional during development)
      revenueCatApiKey:
        process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? null,

      // App environment
      appEnvironment:
        process.env.APP_ENV ?? 'development',

      // Feature flags
      aiEnabled:
        process.env.AI_ENABLED !== 'false',

      // EAS
      eas: {
        ...(config.extra?.eas ?? {}),
        projectId:
          process.env.EAS_PROJECT_ID ??
          config.extra?.eas?.projectId ??
          '',
      },
    },
  };
};
