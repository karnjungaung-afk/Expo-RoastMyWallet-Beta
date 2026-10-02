/**
 * app.config.js — RoastMyWallet
 *
 * Supabase publishable key is intentionally public; it is safe to bundle
 * in the mobile app. Never put a Supabase service-role/secret key here.
 *
 * For production, set all EXPO_PUBLIC_* variables as EAS Secrets:
 *   eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
 *   eas secret:create --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value "sb_publishable_..."
 *   eas secret:create --name EXPO_PUBLIC_REVENUECAT_API_KEY --value "..."
 *
 * Deep link redirect URLs to configure in Supabase Dashboard
 *   → Authentication → URL Configuration:
 *   Site URL:      roastmywallet://
 *   Redirect URLs: roastmywallet://confirm
 *                  roastmywallet://reset-password
 */

// Development fallbacks — override via EAS Secrets in production
const DEV_SUPABASE_URL = 'https://hqezoifilosvaxsvrbwf.supabase.co';
const DEV_SUPABASE_KEY = 'sb_publishable_G0uNBEhWvOs0HiiP3PxNKA_zp74pJ4t';

module.exports = ({ config }) => {
  const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || DEV_SUPABASE_URL;

  const supabasePublishableKey =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || DEV_SUPABASE_KEY;

  const appEnv = process.env.APP_ENV || 'development';
  const isProd = appEnv === 'production';

  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),

      // Supabase
      supabaseUrl,
      supabasePublishableKey,
      supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || supabasePublishableKey,

      // API
      apiBaseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || supabaseUrl,

      // RevenueCat — required for production in-app purchases
      revenueCatApiKey:
        process.env.EXPO_PUBLIC_REVENUECAT_API_KEY?.trim() || null,

      // Feature flags
      appEnvironment: appEnv,
      aiEnabled: process.env.AI_ENABLED !== 'false',

      // EAS
      eas: {
        ...(config.extra?.eas ?? {}),
        projectId:
          process.env.EAS_PROJECT_ID ||
          config.extra?.eas?.projectId ||
          '',
      },
    },
  };
};
