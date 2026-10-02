/**
 * WebSidebarLayout
 *
 * On web at desktop widths (≥768px), this replaces the bottom tab bar
 * with a left sidebar navigation. On mobile web, standard bottom tabs apply.
 *
 * The sidebar follows the same design language:
 * - Thin technical left border on the active item
 * - Mecha-style section labels
 * - System status indicator at the bottom
 *
 * This component is only rendered in the web bundle.
 * Mobile native apps use the standard Tabs navigator in (tabs)/_layout.tsx.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Home, Clock, BarChart2, Users, User, Zap } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAuthStore, selectProfile } from '@/store/authStore';
import { spacing, typography } from '@/theme/tokens';

const BREAKPOINT_TABLET = 768;
const BREAKPOINT_DESKTOP = 1024;

interface NavItem {
  label: string;
  path: string;
  Icon: React.ComponentType<any>;
  badgeKey?: 'waiting';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/(tabs)', Icon: Home },
  { label: 'Pause List', path: '/(tabs)/waiting', Icon: Clock, badgeKey: 'waiting' },
  { label: 'Insights', path: '/(tabs)/insights', Icon: BarChart2 },
  { label: 'Squad', path: '/(tabs)/squad', Icon: Users },
  { label: 'Profile', path: '/(tabs)/profile', Icon: User },
];

interface WebSidebarLayoutProps {
  children: React.ReactNode;
}

export function WebSidebarLayout({ children }: WebSidebarLayoutProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

  const waitingCount = usePurchaseStore(
    s => s.purchases.filter(p => p.status === 'waiting').length
  );
  const { isPro } = useSubscriptionStore();
  const profile = useAuthStore(selectProfile);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => sub.remove();
  }, []);

  const showSidebar = windowWidth >= BREAKPOINT_TABLET;
  const isWide = windowWidth >= BREAKPOINT_DESKTOP;

  if (!showSidebar) {
    // Let the native tab bar handle it on narrow web
    return <>{children}</>;
  }

  const getBadge = (item: NavItem): number => {
    if (item.badgeKey === 'waiting') return waitingCount;
    return 0;
  };

  const isActive = (path: string) => {
    if (path === '/(tabs)') return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
    return pathname.startsWith(path.replace('/(tabs)', ''));
  };

  return (
    <View style={styles.root}>
      {/* Sidebar */}
      <View
        style={[
          styles.sidebar,
          {
            backgroundColor: colors.surface,
            borderRightColor: colors.border,
            width: isWide ? 240 : 200,
          },
        ]}
      >
        {/* Logo */}
        <View style={[styles.sidebarLogo, { borderBottomColor: colors.border }]}>
          <View style={[styles.logoMark, { borderColor: colors.primary }]}>
            <View style={styles.pauseBars}>
              <View style={[styles.pauseBar, { backgroundColor: colors.primary }]} />
              <View style={[styles.pauseBar, { backgroundColor: colors.primary }]} />
            </View>
            <View style={[styles.cornerTL, { borderColor: colors.mecha }]} />
          </View>
          {isWide && (
            <Text style={[styles.logoText, { color: colors.textPrimary }]}>
              RoastMyWallet
            </Text>
          )}
        </View>

        {/* Navigation items */}
        <View style={styles.navItems}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.path);
            const badge = getBadge(item);

            return (
              <TouchableOpacity
                key={item.path}
                onPress={() => router.push(item.path as any)}
                accessibilityRole="link"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
                style={[
                  styles.navItem,
                  active && [styles.navItemActive, { borderLeftColor: colors.primary }],
                  { paddingLeft: isWide ? spacing[5] : spacing[4] },
                ]}
              >
                <View style={styles.navItemInner}>
                  <item.Icon
                    size={18}
                    color={active ? colors.primary : colors.textMuted}
                    strokeWidth={active ? 2.2 : 1.6}
                  />
                  {isWide && (
                    <Text
                      style={[
                        styles.navLabel,
                        { color: active ? colors.primary : colors.textSecondary },
                        active && styles.navLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  )}
                  {badge > 0 && (
                    <View style={[styles.navBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.navBadgeText}>
                        {badge > 99 ? '99+' : badge}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sidebar footer — subscription status + system info */}
        <View style={[styles.sidebarFooter, { borderTopColor: colors.border }]}>
          {isWide ? (
            <>
              <View style={styles.footerUser}>
                <View style={[styles.footerAvatar, { backgroundColor: colors.primarySubtle }]}>
                  <Text style={[styles.footerAvatarText, { color: colors.primary }]}>
                    {(profile?.displayName ?? 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[styles.footerName, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {profile?.displayName ?? 'User'}
                  </Text>
                  {isPro() && (
                    <View style={styles.proLine}>
                      <Zap size={10} color={colors.primary} />
                      <Text style={[styles.proBadgeText, { color: colors.primary }]}>Pro</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={[styles.sysStatus, { color: colors.textMuted }]}>
                SYS ▸ ACTIVE
              </Text>
            </>
          ) : (
            <View style={[styles.footerAvatar, { backgroundColor: colors.primarySubtle, marginHorizontal: 'auto' }]}>
              <Text style={[styles.footerAvatarText, { color: colors.primary }]}>
                {(profile?.displayName ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Main content area */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    flexDirection: 'column',
    borderRightWidth: 1,
  },
  sidebarLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  pauseBars: {
    flexDirection: 'row',
    gap: 4,
  },
  pauseBar: {
    width: 4,
    height: 14,
    borderRadius: 1.5,
  },
  cornerTL: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 6,
    height: 6,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  logoText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    letterSpacing: -0.5,
  },
  navItems: {
    flex: 1,
    paddingVertical: spacing[3],
  },
  navItem: {
    paddingVertical: spacing[3],
    paddingRight: spacing[3],
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
    marginBottom: 2,
  },
  navItemActive: {
    borderLeftWidth: 2,
  },
  navItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  navLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    flex: 1,
  },
  navLabelActive: {
    fontWeight: typography.weight.semibold,
  },
  navBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  navBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    padding: spacing[3],
    gap: spacing[1.5],
  },
  footerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  footerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  footerAvatarText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  footerName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  proLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  proBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  sysStatus: {
    fontSize: 9,
    fontFamily: 'Courier New',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
});
