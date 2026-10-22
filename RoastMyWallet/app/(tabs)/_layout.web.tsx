import React, { useState, useEffect } from 'react';
import { Dimensions, View, Text, StyleSheet } from 'react-native';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { WebSidebarLayout } from '@/components/shared/WebSidebarLayout';
import { HomeIcon, ClockIcon, ChartIcon, SquadIcon, UserIcon } from '@/components/icons/RmwIcons';

const SIDEBAR_BREAKPOINT = 768;

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setWidth(window.width));
    return () => sub.remove();
  }, []);
  return width;
}

export default function TabLayoutWeb() {
  const { colors, isDark } = useTheme();
  const windowWidth = useWindowWidth();
  const showSidebar = windowWidth >= SIDEBAR_BREAKPOINT;

  const tabBarStyle = showSidebar
    ? { display: 'none' as const }
    : {
        backgroundColor: isDark ? '#141927' : '#FFFFFF',
        borderTopColor: colors.border,
        borderTopWidth: 1,
        height: 64,
        paddingBottom: 8,
        paddingTop: 8,
      };

  const screenOpts = {
    headerShown: false,
    tabBarStyle,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.tabInactive,
    tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const, marginTop: 2 },
  };

  const tabs = (
    <Tabs screenOptions={screenOpts}>
      <Tabs.Screen name="index"    options={{ title: 'หน้าหลัก', tabBarIcon: ({ color, focused }) => <HomeIcon  size={22} color={String(color)} strokeWidth={focused ? 2.2 : 1.7} /> }} />
      <Tabs.Screen name="waiting"  options={{ title: 'รอซื้อ',   tabBarIcon: ({ color, focused }) => <WaitingIcon color={color} focused={focused} /> }} />
      <Tabs.Screen name="insights" options={{ title: 'วิเคราะห์', tabBarIcon: ({ color, focused }) => <ChartIcon  size={22} color={String(color)} strokeWidth={focused ? 2.2 : 1.7} /> }} />
      <Tabs.Screen name="squad"    options={{ title: 'สควอด',   tabBarIcon: ({ color, focused }) => <SquadIcon  size={22} color={String(color)} strokeWidth={focused ? 2.2 : 1.7} /> }} />
      <Tabs.Screen name="profile"  options={{ title: 'โปรไฟล์', tabBarIcon: ({ color, focused }) => <UserIcon   size={22} color={String(color)} strokeWidth={focused ? 2.2 : 1.7} /> }} />
    </Tabs>
  );

  return showSidebar ? <WebSidebarLayout>{tabs}</WebSidebarLayout> : tabs;
}

function WaitingIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
  const count = usePurchaseStore(s => s.purchases.filter(p => p.status === 'waiting').length);
  return (
    <View style={styles.wrap}>
      <ClockIcon size={22} color={String(color)} strokeWidth={focused ? 2.2 : 1.7} />
      {count > 0 && (
        <View style={[styles.badge, { backgroundColor: '#E8A030' }]}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', width: 28, height: 24, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -3, right: -6, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
