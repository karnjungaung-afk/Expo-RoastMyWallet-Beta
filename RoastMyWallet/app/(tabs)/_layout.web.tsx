import React, { useState, useEffect } from 'react';
import { Dimensions, View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/AppText';
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
    const sub = Dimensions.addEventListener('change', ({ window }: { window: { width: number } }) => setWidth(window.width));
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
        backgroundColor: colors.tabBar,
        borderTopColor: isDark ? '#FFF8E8' : '#14110F',
        borderTopWidth: 3,
        height: 76,
        paddingBottom: 8,
        paddingTop: 8,
      };

  const screenOpts = {
    headerShown: false,
    tabBarStyle,
    tabBarActiveTintColor: '#14110F',
    tabBarActiveBackgroundColor: 'transparent',
    tabBarInactiveTintColor: colors.tabInactive,
    tabBarLabelStyle: { fontSize: 10, lineHeight: 14, fontFamily: 'Prompt_600SemiBold', marginTop: 2 },
  };

  const tabs = (
    <Tabs screenOptions={screenOpts}>
      <Tabs.Screen name="index"    options={{ title: 'หน้าหลัก', tabBarIcon: ({ color, focused }) => <Pill focused={focused}><HomeIcon  size={22} color={String(color)} strokeWidth={focused ? 2.2 : 1.7} /></Pill> }} />
      <Tabs.Screen name="waiting"  options={{ title: 'รอซื้อ',   tabBarIcon: ({ color, focused }) => <WaitingIcon color={color} focused={focused} /> }} />
      <Tabs.Screen name="insights" options={{ title: 'วิเคราะห์', tabBarIcon: ({ color, focused }) => <Pill focused={focused}><ChartIcon  size={22} color={String(color)} strokeWidth={focused ? 2.2 : 1.7} /></Pill> }} />
      <Tabs.Screen name="squad"    options={{ title: 'สควอด',   tabBarIcon: ({ color, focused }) => <Pill focused={focused}><SquadIcon  size={22} color={String(color)} strokeWidth={focused ? 2.2 : 1.7} /></Pill> }} />
      <Tabs.Screen name="profile"  options={{ title: 'โปรไฟล์', tabBarIcon: ({ color, focused }) => <Pill focused={focused}><UserIcon   size={22} color={String(color)} strokeWidth={focused ? 2.2 : 1.7} /></Pill> }} />
    </Tabs>
  );

  return showSidebar ? <WebSidebarLayout>{tabs}</WebSidebarLayout> : tabs;
}

function Pill({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  if (!focused) return <>{children}</>;
  return (
    <View style={{ width: 46, height: 34, borderRadius: 12, borderWidth: 2, borderColor: '#14110F', backgroundColor: '#D6F73C', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 0px 0px #14110F' }}>
      {children}
    </View>
  );
}

function WaitingIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
  const count = usePurchaseStore(s => s.purchases.filter(p => p.status === 'waiting').length);
  return (
    <View style={styles.wrap}>
      <Pill focused={focused}><ClockIcon size={22} color={String(color)} strokeWidth={focused ? 2.2 : 1.7} /></Pill>
      {count > 0 && (
        <View style={[styles.badge, { backgroundColor: '#FF6B4A', borderWidth: 2, borderColor: '#14110F' }]}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', width: 46, height: 34, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -3, right: -6, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: 'Prompt_800ExtraBold' },
});
