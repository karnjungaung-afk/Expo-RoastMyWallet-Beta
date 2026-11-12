import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ColorValue } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { HomeIcon, ClockIcon, ChartIcon, SquadIcon, UserIcon } from '@/components/icons/RmwIcons';

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: isDark ? '#FFF8E8' : '#14110F',
          borderTopWidth: 3,
          height: 68 + bottom,
          paddingBottom: bottom,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarActiveTintColor: '#14110F',
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 10, lineHeight: 14, fontFamily: 'Prompt_700Bold', marginTop: 1 },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'หน้าหลัก',
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrap focused={focused} color={colors.primary}>
              <HomeIcon size={22} color={String(color)} strokeWidth={focused ? 2.2 : 1.7} />
            </TabIconWrap>
          ),
        }}
      />
      <Tabs.Screen
        name="waiting"
        options={{
          title: 'รอซื้อ',
          tabBarIcon: ({ color, focused }) => <WaitingTabIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'วิเคราะห์',
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrap focused={focused} color={colors.primary}>
              <ChartIcon size={22} color={String(color)} strokeWidth={focused ? 2.2 : 1.7} />
            </TabIconWrap>
          ),
        }}
      />
      <Tabs.Screen
        name="squad"
        options={{
          title: 'สควอด',
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrap focused={focused} color={colors.primary}>
              <SquadIcon size={22} color={String(color)} strokeWidth={focused ? 2.2 : 1.7} />
            </TabIconWrap>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'โปรไฟล์',
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrap focused={focused} color={colors.primary}>
              <UserIcon size={22} color={String(color)} strokeWidth={focused ? 2.2 : 1.7} />
            </TabIconWrap>
          ),
        }}
      />
    </Tabs>
  );
}

function TabIconWrap({ children, focused }: { children: React.ReactNode; focused: boolean; color?: string }) {
  const { isDark } = useTheme();
  if (!focused) return <>{children}</>;
  const ink = isDark ? '#FFF8E8' : '#14110F';
  return (
    <View style={[styles.activeWrap, { backgroundColor: '#D6F73C', borderColor: ink, boxShadow: `2px 2px 0px 0px ${ink}` }]}>
      {children}
    </View>
  );
}

function WaitingTabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
  const waitingCount = usePurchaseStore(s => s.purchases.filter(p => p.status === 'waiting').length);
  const { colors } = useTheme();

  return (
    <TabIconWrap focused={focused} color={colors.primary}>
      <View style={styles.badgeWrap}>
        <ClockIcon size={22} color={String(color)} strokeWidth={focused ? 2.2 : 1.7} />
        {waitingCount > 0 && (
          <View style={[styles.badge, { backgroundColor: '#FF6B4A', borderWidth: 2, borderColor: '#14110F' }]}>
            <Text style={styles.badgeText}>{waitingCount > 99 ? '99+' : waitingCount}</Text>
          </View>
        )}
      </View>
    </TabIconWrap>
  );
}

const styles = StyleSheet.create({
  activeWrap: { width: 46, height: 34, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  badgeWrap: { position: 'relative', width: 28, height: 24, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: -4, right: -6,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: 'Prompt_800ExtraBold' },
});
