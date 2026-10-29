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
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { HomeIcon, ClockIcon, ChartIcon, SquadIcon, UserIcon, FlameIcon } from '@/components/icons/RmwIcons';
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
  { label: 'หน้าหลัก', path: '/(tabs)', Icon: HomeIcon },
  { label: 'รอซื้อ', path: '/(tabs)/waiting', Icon: ClockIcon, badgeKey: 'waiting' },
  { label: 'วิเคราะห์', path: '/(tabs)/insights', Icon: ChartIcon },
  { label: 'สควอด', path: '/(tabs)/squad', Icon: SquadIcon },
  { label: 'โปรไฟล์', path: '/(tabs)/profile', Icon: UserIcon },
];

interface WebSidebarLayoutProps {
  children: React.ReactNode;
}

export function WebSidebarLayout({ children }: WebSidebarLayoutProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [searchText, setSearchText] = useState('');

  const waitingCount = usePurchaseStore(
    s => s.purchases.filter(p => p.status === 'waiting').length
  );
  const { isPro } = useSubscriptionStore();
  const profile = useAuthStore(selectProfile);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }: { window: { width: number } }) => {
      setWindowWidth(window.width);
    });
    return () => sub.remove();
  }, []);

  const showSidebar = windowWidth >= BREAKPOINT_TABLET;
  const isWide = windowWidth >= BREAKPOINT_DESKTOP;
  const showLabels = windowWidth >= BREAKPOINT_TABLET;

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
            backgroundColor: '#102B48',
            borderRightColor: '#254461',
            width: isWide ? 240 : 200,
          },
        ]}
      >
        {/* Logo */}
        <View style={[styles.sidebarLogo, { borderBottomColor: '#254461' }]}>
          <View style={[styles.logoMark, { borderColor: '#75B5FF' }]}>
            <View style={styles.pauseBars}>
              <View style={[styles.pauseBar, { backgroundColor: '#75B5FF' }]} />
              <View style={[styles.pauseBar, { backgroundColor: '#397DD6' }]} />
            </View>
            <View style={[styles.cornerTL, { borderColor: '#75B5FF' }]} />
          </View>
          {showLabels && (
            <Text style={[styles.logoText, { color: '#FFFFFF' }]}>
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
                  active && [styles.navItemActive, { borderLeftColor: '#72B0FF', backgroundColor: '#1C4D80' }],
                  { paddingLeft: isWide ? spacing[5] : spacing[4] },
                ]}
              >
                <View style={styles.navItemInner}>
                  <item.Icon
                    size={18}
                    color={active ? '#FFFFFF' : '#A9BED5'}
                    strokeWidth={active ? 2.2 : 1.6}
                  />
                  {showLabels && (
                    <Text
                      style={[
                        styles.navLabel,
                        { color: active ? '#FFFFFF' : '#D0DCE9' },
                        active && styles.navLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  )}
                  {badge > 0 && (
                    <View style={[styles.navBadge, { backgroundColor: '#397DD6' }]}>
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
        <View style={[styles.sidebarFooter, { borderTopColor: '#254461' }]}>
          {isWide ? (
            <>
              <View style={styles.footerUser}>
                <View style={[styles.footerAvatar, { backgroundColor: '#1C4D80' }]}>
                  <Text style={[styles.footerAvatarText, { color: '#B9D9FF' }]}>
                    {(profile?.displayName ?? 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[styles.footerName, { color: '#FFFFFF' }]}
                    numberOfLines={1}
                  >
                    {profile?.displayName ?? 'User'}
                  </Text>
                  {isPro() && (
                    <View style={styles.proLine}>
                      <FlameIcon size={10} color="#B9D9FF" />
                      <Text style={[styles.proBadgeText, { color: '#B9D9FF' }]}>Pro</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={[styles.sysStatus, { color: '#8FAAC6' }]}>
                SYS ▸ ACTIVE
              </Text>
            </>
          ) : (
            <View style={[styles.footerAvatar, { backgroundColor: '#1C4D80', marginHorizontal: 'auto' }]}>
              <Text style={[styles.footerAvatarText, { color: '#B9D9FF' }]}>
                {(profile?.displayName ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Main content area */}
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        <View style={[styles.topbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border, maxWidth: isWide ? 520 : 320 }]}>
            <Text style={[styles.searchGlyph, { color: colors.textMuted }]}>⌕</Text>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="ค้นหารายการที่อยากซื้อ…"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              returnKeyType="search"
              accessibilityLabel="ค้นหารายการซื้อ"
              onSubmitEditing={() => {
                const term = searchText.trim();
                router.push((term
                  ? { pathname: '/(tabs)/waiting', params: { search: term } }
                  : '/(tabs)/waiting') as any);
              }}
            />
            <TouchableOpacity
              onPress={() => {
                const term = searchText.trim();
                router.push((term
                  ? { pathname: '/(tabs)/waiting', params: { search: term } }
                  : '/(tabs)/waiting') as any);
              }}
              accessibilityRole="button"
              accessibilityLabel="ค้นหา"
              style={styles.searchAction}
            >
              <Text style={styles.searchActionText}>ค้นหา</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.topbarUser, { borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/profile' as any)}
            accessibilityRole="link"
            accessibilityLabel="เปิดโปรไฟล์"
          >
            <View style={styles.topbarAvatar}>
              <Text style={styles.topbarAvatarText}>{(profile?.displayName ?? 'U').charAt(0).toUpperCase()}</Text>
            </View>
            {isWide && <Text numberOfLines={1} style={[styles.topbarUserName, { color: colors.textSecondary }]}>{profile?.displayName ?? 'บัญชีของฉัน'}</Text>}
          </TouchableOpacity>
        </View>
        <View style={styles.screenContent}>
          {children}
        </View>
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
    minWidth: 0,
  },
  topbar: {
    minHeight: 66,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  searchBox: {
    height: 42,
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchGlyph: { fontSize: 24, lineHeight: 26 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 8, fontSize: 13 },
  searchAction: { backgroundColor: '#1769E0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  searchActionText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  topbarUser: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 5, paddingHorizontal: 7, maxWidth: 200 },
  topbarAvatar: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#DCEBFF', alignItems: 'center', justifyContent: 'center' },
  topbarAvatarText: { color: '#1B5DB5', fontWeight: '900', fontSize: 13 },
  topbarUserName: { fontSize: 12, fontWeight: '700', maxWidth: 145 },
  screenContent: { flex: 1, minHeight: 0 },
});
