import Constants from 'expo-constants';

// These values come from app.config.js → extra, which reads from .env files
// Never hardcode secrets here. Never commit .env files.

interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiBaseUrl: string;
  revenueCatApiKey: string | null;
  environment: 'development' | 'preview' | 'production';
  aiEnabled: boolean;
}

function getExtraConfig() {
  return Constants.expoConfig?.extra ?? {};
}

function requireEnv(key: string): string {
  const value = getExtraConfig()[key];
  if (!value) {
    if (__DEV__) {
      console.warn(`[Config] Missing environment variable: ${key}. Using placeholder.`);
      return `__MISSING_${key}__`;
    }
    throw new Error(`[Config] Required environment variable missing: ${key}`);
  }
  return value as string;
}

function optionalEnv(key: string): string | null {
  return (getExtraConfig()[key] as string | undefined) ?? null;
}

export const env: EnvConfig = {
  supabaseUrl: requireEnv('supabaseUrl'),
  supabaseAnonKey: requireEnv('supabaseAnonKey'),
  apiBaseUrl: requireEnv('apiBaseUrl'),
  revenueCatApiKey: optionalEnv('revenueCatApiKey'),
  environment: (requireEnv('appEnvironment') as EnvConfig['environment']) || 'development',
  aiEnabled: getExtraConfig()['aiEnabled'] !== false,
};

export const isDev = env.environment === 'development';
export const isProd = env.environment === 'production';
