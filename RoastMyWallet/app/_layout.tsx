// ─── URL Polyfill ─────────────────────────────────────────────────────────────
// Must be the very first import to ensure URL is available for supabase and
// env.ts before any other module initialises.
import 'react-native-url-polyfill/auto';

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore, selectIsAuthenticated, selectIsInitialized } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useTheme } from '@/hooks/useTheme';
import { useDeepLinkHandler } from '@/features/auth/DeepLinkHandler';
import { useInterceptListener } from '@/features/intercept/useInterceptListener';
import { useScheduledRoastNotifications } from '@/features/intercept/useScheduledRoastNotifications';
import { InterceptRoastModal } from '@/features/intercept/InterceptRoastModal';

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
// Logs every unhandled JS error to the Metro terminal so "Something went wrong"
// always has a traceable cause — even if it happens before React renders.
if (typeof ErrorUtils !== 'undefined') {
  const prevHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    console.error(
      `[GlobalError] ${isFatal ? '💥 FATAL' : '⚠️  non-fatal'}: ${error.message}`,
    );
    if (error.stack) console.error('[GlobalError] Stack:', error.stack);
    prevHandler(error, isFatal);
  });
}

// ─── PROTECTED ROUTE GUARD ────────────────────────────────────────────────────

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isInitialized = useAuthStore(selectIsInitialized);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup && !inOnboarding) {
      router.replace('/(auth)/login');
    } else if (
      isAuthenticated &&
      inAuthGroup &&
      segments[1] !== 'reset-password'
    ) {
      // Supabase recovery links create an authenticated session before the
      // user chooses a new password. Keep that route accessible until done.
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isInitialized, segments]);
}

// ─── ROOT LAYOUT ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const { initialize: initAuth, isInitialized } = useAuthStore();
  const authUser = useAuthStore(state => state.user);
  const { initialize: initSubscription } = useSubscriptionStore();
  const { load: loadSettings } = useSettingsStore();
  const { initialize: initNotifications } = useNotificationStore();

  useProtectedRoute();
  useDeepLinkHandler();
  useInterceptListener();
  useScheduledRoastNotifications(true);

  useEffect(() => {
    const init = async () => {
      try {
        await loadSettings();
        await initAuth();
        initNotifications().catch(err =>
          console.warn('[RootLayout] Notification init failed (non-fatal):', err),
        );
      } catch (err) {
        console.error('[RootLayout] Init failed:', err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (authUser?.id) {
      initSubscription().catch(err => {
        console.warn('[RootLayout] Subscription init failed:', err);
      });
    } else {
      useSubscriptionStore.getState().clearForSignedOut();
    }
  }, [isInitialized, authUser?.id, initSubscription]);

  if (!isInitialized) {
    return <SplashLoader colors={colors} isDark={isDark} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="paywall" options={{ headerShown: false }} />
          <Stack.Screen
            name="purchase/[id]"
            options={{ presentation: 'modal', headerShown: false }}
          />
        </Stack>
        <InterceptRoastModal />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ─── SPLASH ───────────────────────────────────────────────────────────────────

function SplashLoader({ colors, isDark }: { colors: any; isDark: boolean }) {
  return (
    <View style={[styles.splash, { backgroundColor: colors?.background ?? '#F2F0EB' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ActivityIndicator size="small" color={colors?.primary ?? '#1B3557'} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
