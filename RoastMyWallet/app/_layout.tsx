import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore, selectIsAuthenticated, selectIsInitialized } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useTheme } from '@/hooks/useTheme';

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
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isInitialized, segments]);
}

// ─── ROOT LAYOUT ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const { initialize: initAuth, isInitialized } = useAuthStore();
  const { initialize: initSubscription } = useSubscriptionStore();
  const { load: loadSettings } = useSettingsStore();
  const { initialize: initNotifications } = useNotificationStore();

  useProtectedRoute();

  useEffect(() => {
    const init = async () => {
      // Load persisted settings first (currency, language, theme, limits)
      await loadSettings();

      // Auth — determines which screen stack to show
      await initAuth();

      // Subscription — needed for feature gates throughout app
      await initSubscription();

      // Notifications — request permission, set up channels, load scheduled IDs
      // Non-blocking: notification failure must never prevent app startup
      initNotifications().catch(err =>
        console.warn('[RootLayout] Notification init failed (non-fatal):', err)
      );
    };
    init();
  }, []);

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
          <Stack.Screen
            name="purchase/[id]"
            options={{ presentation: 'modal', headerShown: false }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ─── SPLASH ───────────────────────────────────────────────────────────────────

function SplashLoader({ colors, isDark }: { colors: any; isDark: boolean }) {
  return (
    <View style={[styles.splash, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
