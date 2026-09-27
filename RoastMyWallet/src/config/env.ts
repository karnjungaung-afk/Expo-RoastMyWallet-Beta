import Constants from 'expo-constants';

interface EnvConfig {
  supabaseUrl: string;
  supabasePublishableKey: string;

  /** @deprecated Use supabasePublishableKey. */
  supabaseAnonKey: string;

  apiBaseUrl: string;
  revenueCatApiKey: string | null;
  environment: 'development' | 'preview' | 'production';
  aiEnabled: boolean;
}

function getExtraConfig(): Record<string, unknown> {
  return (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
}

function requireString(key: string): string {
  const value = getExtraConfig()[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      '[Config] Missing required Expo config value: ' +
        key +
        '. Check app.config.js / EXPO_PUBLIC_* environment variables.',
    );
  }

  return value.trim();
}

function requireHttpUrl(key: string): string {
  const value = requireString(key);

  try {
    const url = new URL(value);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('invalid protocol');
    }

    return value;
  } catch {
    throw new Error(
      '[Config] ' +
        key +
        ' must be a valid HTTP or HTTPS URL. Received: ' +
        value,
    );
  }
}

function optionalString(key: string): string | null {
  const value = getExtraConfig()[key];

  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

export const env: EnvConfig = (() => {
  const supabaseUrl = requireHttpUrl('supabaseUrl');
  const supabasePublishableKey = requireString('supabasePublishableKey');

  return {
    supabaseUrl,
    supabasePublishableKey,

    // Compatibility with older imports
    supabaseAnonKey:
      optionalString('supabaseAnonKey') ?? supabasePublishableKey,

    apiBaseUrl: requireHttpUrl('apiBaseUrl'),

    revenueCatApiKey:
      optionalString('revenueCatApiKey'),

    environment:
      (optionalString('appEnvironment') as EnvConfig['environment'] | null) ??
      'development',

    aiEnabled:
      getExtraConfig().aiEnabled !== false,
  };
})();

export const isDev = env.environment === 'development';
export const isProd = env.environment === 'production';
