/**
 * Web-specific tab layout.
 * On desktop (≥768px): left sidebar navigation replaces bottom tabs.
 * On mobile web (<768px): standard bottom tabs (same as native).
 *
 * Metro resolves _layout.web.tsx over _layout.tsx on web platform.
 */

import React, { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Clock, BarChart2, Users, User } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { WebSidebarLayout } from '@/components/shared/WebSidebarLayout';
import { View, Text, StyleSheet } from 'react-native';

const SIDEBAR_BREAKPOINT = 768;

function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 375
  );

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setWidth(window.width));
    return () => sub.remove();
  }, []);

  return width;
}

export default function TabLayoutWeb() {
  const { colors } = useTheme();
  const windowWidth = useWindowWidth();
  const showSidebar = windowWidth >= SIDEBAR_BREAKPOINT;

  const tabBarStyle = showSidebar
    ? { display: 'none' as const }   // Hide bottom tabs when sidebar is visible
    : {
        backgroundColor: colors.tabBar,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        height: 64,
        paddingBottom: 8,
        paddingTop: 8,
      };

  const tabs = (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500', marginTop: 2 },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Home',     tabBarIcon: ({ color, focused }) => <Home     size={22} color={color} strokeWidth={focused ? 2.2 : 1.7} /> }} />
      <Tabs.Screen name="waiting"  options={{ title: 'Waiting',  tabBarIcon: ({ color, focused }) => <WaitingTabIcon color={color} focused={focused} /> }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: ({ color, focused }) => <BarChart2 size={22} color={color} strokeWidth={focused ? 2.2 : 1.7} /> }} />
      <Tabs.Screen name="squad"    options={{ title: 'Squad',    tabBarIcon: ({ color, focused }) => <Users    size={22} color={color} strokeWidth={focused ? 2.2 : 1.7} /> }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile',  tabBarIcon: ({ color, focused }) => <User     size={22} color={color} strokeWidth={focused ? 2.2 : 1.7} /> }} />
    </Tabs>
  );

  if (showSidebar) {
    return <WebSidebarLayout>{tabs}</WebSidebarLayout>;
  }

  return tabs;
}

function WaitingTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const waitingCount = usePurchaseStore(s => s.purchases.filter(p => p.status === 'waiting').length);
  const { colors } = useTheme();
  return (
    <View style={styles.iconWrapper}>
      <Clock size={22} color={color} strokeWidth={focused ? 2.2 : 1.7} />
      {waitingCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>{waitingCount > 99 ? '99+' : waitingCount}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrapper: { position: 'relative', width: 28, height: 24, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -3, right: -6, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
