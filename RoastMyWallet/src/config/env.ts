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
      `[Config] Missing required config value: "${key}". ` +
        'Check app.config.js and EXPO_PUBLIC_* environment variables.',
    );
  }

  return value.trim();
}

function requireHttpUrl(key: string): string {
  const value = requireString(key);

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Must be http or https');
    }
    return value;
  } catch (err) {
    // Re-throw with the original inner error for easier debugging
    throw new Error(
      `[Config] "${key}" must be a valid HTTP/HTTPS URL. ` +
        `Received: "${value}". Inner: ${(err as Error).message}`,
    );
  }
}

function optionalString(key: string): string | null {
  const value = getExtraConfig()[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function buildEnvConfig(): EnvConfig {
  const supabaseUrl = requireHttpUrl('supabaseUrl');
  const supabasePublishableKey = requireString('supabasePublishableKey');

  return {
    supabaseUrl,
    supabasePublishableKey,
    supabaseAnonKey: optionalString('supabaseAnonKey') ?? supabasePublishableKey,
    apiBaseUrl: optionalString('apiBaseUrl') !== null
      ? requireHttpUrl('apiBaseUrl')
      : supabaseUrl,
    revenueCatApiKey: optionalString('revenueCatApiKey'),
    environment:
      (optionalString('appEnvironment') as EnvConfig['environment'] | null) ?? 'development',
    aiEnabled: getExtraConfig().aiEnabled !== false,
  };
}

let _env: EnvConfig | null = null;
let _envError: Error | null = null;

try {
  _env = buildEnvConfig();
} catch (err) {
  _envError = err as Error;
  // Log immediately so the error appears in Metro terminal and Expo Go console
  console.error('[Config] Failed to initialise env config:', (err as Error).message);
  console.error('[Config] Constants.expoConfig?.extra:', JSON.stringify(Constants.expoConfig?.extra, null, 2));
}

// Re-throw at access time so the error boundary can catch it
export const env: EnvConfig = new Proxy({} as EnvConfig, {
  get(_target, prop: string) {
    if (_envError && !_env) {
      throw new Error(`[Config] Cannot read env.${prop}: config initialisation failed. ${_envError.message}`);
    }
    return (_env as EnvConfig)[prop as keyof EnvConfig];
  },
});

export const isDev = (env.environment ?? 'development') === 'development';
export const isProd = (env.environment ?? 'development') === 'production';
