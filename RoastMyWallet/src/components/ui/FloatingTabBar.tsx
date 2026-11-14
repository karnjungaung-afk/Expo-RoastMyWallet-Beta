import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { HomeIcon, ClockIcon, ChartIcon, SquadIcon, UserIcon } from '@/components/icons/RmwIcons';
import { radius, shadows } from '@/theme/tokens';

type IconCmp = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const ICONS: Record<string, IconCmp> = {
  index: HomeIcon,
  waiting: ClockIcon,
  insights: ChartIcon,
  squad: SquadIcon,
  profile: UserIcon,
};

/**
 * Floating ink-black pill tab bar.
 * The active tab expands into a cream pill with its label; others are icon-only.
 */
export function FloatingTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const waitingCount = usePurchaseStore(s => s.purchases.filter(p => p.status === 'waiting').length);

  return (
    <View style={[styles.dock, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.pill, shadows.float, { backgroundColor: colors.tabBar }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = typeof options.title === 'string' ? options.title : route.name;
          const focused = state.index === index;
          const Icon = ICONS[route.name];
          if (!Icon) return null;

          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };

          const showBadge = route.name === 'waiting' && waitingCount > 0;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              style={[
                styles.item,
                focused
                  ? { backgroundColor: colors.tabBarActiveBg, paddingHorizontal: 16 }
                  : { width: 46 },
              ]}
            >
              <View>
                <Icon
                  size={22}
                  color={focused ? colors.tabBarActiveIcon : colors.tabBarIdleIcon}
                  strokeWidth={focused ? 2.3 : 1.8}
                />
                {showBadge && (
                  <View style={[styles.badge, { backgroundColor: colors.accent, borderColor: colors.tabBar }]}>
                    <Text style={styles.badgeText}>{waitingCount > 99 ? '99+' : waitingCount}</Text>
                  </View>
                )}
              </View>
              {focused && (
                <Text style={[styles.label, { color: colors.tabBarActiveIcon }]} numberOfLines={1}>
                  {label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: { paddingHorizontal: 20, paddingTop: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: radius.full, padding: 8, height: 64,
  },
  item: {
    height: 48, borderRadius: radius.full, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  label: { fontSize: 13, fontWeight: '800', includeFontPadding: false },
  badge: {
    position: 'absolute', top: -7, right: -9, minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
});
