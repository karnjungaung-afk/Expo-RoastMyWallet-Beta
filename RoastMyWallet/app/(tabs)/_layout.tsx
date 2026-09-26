import { Tabs } from 'expo-router';
import { Platform, View, Text, StyleSheet } from 'react-native';
import type { ColorValue } from 'react-native';
import { Home, Clock, BarChart2, Users, User } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500', marginTop: 2 },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <Home size={22} color={color} strokeWidth={focused ? 2.2 : 1.7} /> }} />
      <Tabs.Screen name="waiting" options={{ title: 'Waiting', tabBarIcon: ({ color, focused }) => <WaitingTabIcon color={color} focused={focused} /> }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: ({ color, focused }) => <BarChart2 size={22} color={color} strokeWidth={focused ? 2.2 : 1.7} /> }} />
      <Tabs.Screen name="squad" options={{ title: 'Squad', tabBarIcon: ({ color, focused }) => <Users size={22} color={color} strokeWidth={focused ? 2.2 : 1.7} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, focused }) => <User size={22} color={color} strokeWidth={focused ? 2.2 : 1.7} /> }} />
    </Tabs>
  );
}

function WaitingTabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
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
