import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, type StyleProp, type ViewStyle,
} from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { radius, shadows, blockPalette } from '@/theme/tokens';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useAuthStore, selectProfile } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { PurchaseCard } from '@/features/purchases/PurchaseCard';
import { AddPurchaseSheet } from '@/features/purchases/AddPurchaseSheet';
import { PlatformTile, PLATFORM_NAME } from '@/components/icons/PlatformIcons';
import { ClockIcon, PlusIcon, ShieldIcon, FlameIcon, ArrowRightIcon, CheckIcon, WalletIcon } from '@/components/icons/RmwIcons';
import { formatCurrency } from '@/utils/formatting';
import type { Currency, Purchase, PurchaseCategory, ShoppingPlatform } from '@/types';

const CATEGORY_LABELS: Record<PurchaseCategory, string> = {
  electronics: 'อิเล็กทรอนิกส์',
  fashion: 'แฟชั่น',
  beauty: 'ความงาม',
  home: 'ของใช้ในบ้าน',
  food: 'อาหาร',
  gaming: 'เกม',
  sports: 'กีฬา',
  books: 'หนังสือ',
  travel: 'ท่องเที่ยว',
  entertainment: 'บันเทิง',
  health: 'สุขภาพ',
  tools: 'เครื่องมือ',
  other: 'อื่น ๆ',
};

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { interceptUrl } = useLocalSearchParams<{ interceptUrl?: string }>();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [prefillUrl, setPrefillUrl] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  const profile = useAuthStore(selectProfile);
  const {
    purchases, loadPurchases, loadingState, error,
    getThisMonthAvoided, getThisMonthAvoidedCount,
  } = usePurchaseStore();
  const { isPro } = useSubscriptionStore();
  const waiting = useMemo(() => purchases.filter(p => p.status === 'waiting'), [purchases]);
  const recent = useMemo(() => [...purchases].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5), [purchases]);
  const boughtCount = useMemo(() => purchases.filter(p => p.status === 'bought').length, [purchases]);
  const avoided = getThisMonthAvoided();
  const avoidedCount = getThisMonthAvoidedCount();
  const currency = profile?.currency ?? 'THB';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'อรุณสวัสดิ์' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';
  const displayName = profile?.displayName?.split(' ')[0] ?? 'คุณ';
  const isDesktop = Platform.OS === 'web' && width >= 1024;
  const isWide = width >= 720;
  const bg = colors.background;
  // Decisions made this month (avoided + expired + bought) so the progress bar compares like with like.
  const decidedCount = useMemo(() => {
    const now = new Date();
    const inThisMonth = (p: Purchase) => {
      const d = new Date(p.decidedAt ?? p.updatedAt ?? p.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    };
    const n = purchases.filter(p => (p.status === 'avoided' || p.status === 'expired' || p.status === 'bought') && inThisMonth(p)).length;
    return Math.max(n, avoidedCount);
  }, [purchases, avoidedCount]);
  const savedRatio = decidedCount > 0 ? Math.min(1, avoidedCount / decidedCount) : 0;

  const recentPlatforms = useMemo(() => [...new Set(
    purchases.slice(0, 20).map(p => p.platform).filter(Boolean),
  )].slice(0, 5) as ShoppingPlatform[], [purchases]);

  const categoryStats = useMemo(() => {
    const totals = new Map<PurchaseCategory, number>();
    purchases.forEach(p => totals.set(p.category, (totals.get(p.category) ?? 0) + p.price));

    // Keep a small, stable set of categories visible, including 0% categories.
    const categoryOrder: PurchaseCategory[] = [
      'fashion', 'electronics', 'beauty', 'food', 'home', 'gaming',
      'sports', 'books', 'travel', 'entertainment', 'health', 'tools', 'other',
    ];

    return categoryOrder
      .map(category => ({ category, amount: totals.get(category) ?? 0 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [purchases]);
  const categoryTotal = useMemo(
    () => purchases.reduce((sum, purchase) => sum + purchase.price, 0),
    [purchases],
  );

  const weeklySavings = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(now);
      day.setHours(0, 0, 0, 0);
      day.setDate(now.getDate() - (6 - index));
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      const value = purchases
        .filter(p => p.status === 'avoided')
        .filter(p => {
          const timestamp = new Date(p.decidedAt ?? p.updatedAt ?? p.createdAt).getTime();
          return timestamp >= day.getTime() && timestamp < nextDay.getTime();
        })
        .reduce((sum, p) => sum + p.price, 0);
      return {
        label: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][day.getDay()],
        key: day.toISOString().slice(0, 10),
        value,
      };
    });
  }, [purchases]);

  useEffect(() => {
    if (interceptUrl) {
      setPrefillUrl(interceptUrl);
      setShowAddSheet(true);
    }
  }, [interceptUrl]);

  useEffect(() => { void loadPurchases(); }, [loadPurchases]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await loadPurchases(true); }
    finally { setRefreshing(false); }
  }, [loadPurchases]);

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.page,
          { maxWidth: isDesktop ? 1380 : 1060, paddingTop: Platform.OS === 'web' ? 22 : insets.top + 12, paddingBottom: 130 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textPrimary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.pageHeader}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>{greeting}, {displayName} 👋</Text>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>พร้อมประหยัด{'\n'}หรือยัง?</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => !isPro() && router.push('/paywall' as any)}
              style={[styles.statusPill, { backgroundColor: colors.surfaceRaised }, shadows.sm]}
              accessibilityRole="button"
            >
              <FlameIcon size={16} color={isPro() ? colors.success : colors.accent} />
              <Text style={[styles.statusText, { color: colors.textPrimary }]}>{isPro() ? 'Pro' : 'Free'}</Text>
            </TouchableOpacity>
            {isDesktop && (
              <TouchableOpacity style={[styles.inkButton, { backgroundColor: colors.primary }]} onPress={() => setShowAddSheet(true)} accessibilityRole="button">
                <PlusIcon size={17} color={colors.primaryText} />
                <Text style={[styles.inkButtonText, { color: colors.primaryText }]}>เพิ่มรายการ</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Hero: savings this month (purple block) ─────────────── */}
        <View style={[styles.hero, { backgroundColor: colors.blockPurple }]}>
          {/* playful collage shapes */}
          <View pointerEvents="none" style={[styles.shape, { width: 150, height: 150, borderRadius: 75, right: -40, top: -50, backgroundColor: colors.blockOrange }]} />
          <View pointerEvents="none" style={[styles.shape, { width: 70, height: 70, borderRadius: 18, right: 34, bottom: -22, backgroundColor: colors.blockYellow, transform: [{ rotate: '18deg' }] }]} />
          <View pointerEvents="none" style={[styles.shape, { width: 26, height: 26, borderRadius: 13, right: 128, top: 74, backgroundColor: colors.blockPink }]} />

          <View style={styles.heroLabelRow}>
            <View style={[styles.heroIcon, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
              <WalletIcon size={18} color={colors.onBlockDark} />
            </View>
            <Text style={[styles.heroLabel, { color: colors.onBlockDark }]}>ประหยัดได้เดือนนี้</Text>
          </View>
          <Text style={[styles.heroAmount, { color: colors.onBlockDark }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(avoided, currency)}
          </Text>
          <Text style={[styles.heroNote, { color: colors.onBlockDark }]}>
            หลีกเลี่ยงแล้ว {avoidedCount} รายการ{decidedCount > 0 ? ` · จาก ${decidedCount} รายการที่ตัดสินใจเดือนนี้` : ''}
          </Text>
          <View style={styles.heroProgressRow}>
            <View style={styles.heroTrack}>
              <View style={[styles.heroFill, { width: `${Math.max(savedRatio * 100, avoidedCount > 0 ? 8 : 0)}%` }]} />
            </View>
            <Text style={[styles.heroProgressText, { color: colors.onBlockDark }]}>{avoidedCount}/{decidedCount}</Text>
          </View>
          <TouchableOpacity
            style={[styles.heroCta, { backgroundColor: '#16130F' }]}
            onPress={() => setShowAddSheet(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.heroCtaText}>เพิ่มสิ่งที่อยากซื้อ</Text>
          </TouchableOpacity>
        </View>

        {/* ── Colour tiles ─────────────────────────────────────────── */}
        <View style={styles.tilesRow}>
          <StatTile
            title="รอตัดสินใจ" value={String(waiting.length)} note="ใน Waiting List"
            bg={colors.blockYellow} fg={colors.onBlockLight}
            icon={<ClockIcon size={18} color={colors.onBlockLight} />}
            onPress={() => router.push('/(tabs)/waiting')}
          />
          <StatTile
            title="ซื้อไปแล้ว" value={String(boughtCount)} note="ตัดสินใจซื้อ"
            bg={colors.blockOrange} fg={colors.onBlockDark}
            icon={<CheckIcon size={18} color={colors.onBlockDark} />}
          />
          <StatTile
            title="ทั้งหมด" value={String(purchases.length)} note="ที่บันทึกไว้"
            bg={colors.blockGreen} fg={colors.onBlockDark}
            icon={<ShieldIcon size={18} color={colors.onBlockDark} />}
          />
        </View>

        {/* ── Assistant nudge (pink block) ─────────────────────────── */}
        <View style={[styles.nudge, { backgroundColor: colors.blockPink }]}>
          <View style={{ flex: 1, gap: 10 }}>
            <Text style={[styles.nudgeEyebrow, { color: colors.onBlockLight }]}>ผู้ช่วย RoastMyWallet</Text>
            <Text style={[styles.nudgeText, { color: colors.onBlockLight }]}>
              {waiting.length > 0
                ? `คุณมี ${waiting.length} รายการที่กำลังรอตัดสินใจ ลองกลับไปถามตัวเองอีกรอบ`
                : 'ยังไม่มีรายการที่รอซื้อ เริ่มบันทึกของที่อยากได้แล้วให้เวลาช่วยตัดสินใจ'}
            </Text>
            <TouchableOpacity
              style={[styles.nudgeCta, { backgroundColor: '#16130F' }]}
              onPress={() => (waiting.length > 0 ? router.push('/(tabs)/waiting') : setShowAddSheet(true))}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.nudgeCtaText}>{waiting.length > 0 ? 'ไปดูรายการ' : 'เริ่มเลย'}</Text>
            </TouchableOpacity>
          </View>
          <View pointerEvents="none" style={styles.nudgeHeart}>
            <FlameIcon size={44} color={colors.accent} />
          </View>
        </View>

        {/* ── Analytics ────────────────────────────────────────────── */}
        <View style={[styles.analyticsRow, { flexDirection: isWide ? 'row' : 'column' }]}>
          <Panel colors={colors} style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.panelHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>เงินที่หลีกเลี่ยงได้</Text>
                <Text style={[styles.panelSubtitle, { color: colors.textMuted }]}>มูลค่ารายการที่เปลี่ยนใจใน 7 วันล่าสุด</Text>
              </View>
              <View style={[styles.unitChip, { backgroundColor: colors.backgroundSubtle }]}>
                <Text style={[styles.unitChipText, { color: colors.textPrimary }]}>{currency}</Text>
              </View>
            </View>
            {purchases.length === 0 ? (
              <ChartEmpty colors={colors} message="เริ่มบันทึกรายการเพื่อดูแนวโน้มของคุณ" />
            ) : (
              <WeeklyBarChart values={weeklySavings} currency={currency} colors={colors} />
            )}
          </Panel>

          <Panel colors={colors} style={[styles.categoryPanel, { width: isWide ? 340 : '100%' }]}>
            <View>
              <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>หมวดหมู่ที่สนใจ</Text>
              <Text style={[styles.panelSubtitle, { color: colors.textMuted }]}>มูลค่ารวมของรายการที่บันทึก</Text>
            </View>
            {categoryStats.length === 0 ? (
              <ChartEmpty colors={colors} message="หมวดหมู่จะปรากฏหลังเพิ่มรายการ" />
            ) : (
              <CategoryDonut categories={categoryStats} total={categoryTotal} currency={currency} colors={colors} />
            )}
          </Panel>
        </View>

        {/* ── Waiting + side column ───────────────────────────────── */}
        <View style={[
          styles.contentRow,
          { flexDirection: isWide ? 'row' : 'column', alignItems: isWide ? 'flex-start' : 'stretch' },
        ]}>
          <View style={{ flex: 1, minWidth: 0, gap: 14 }}>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>รอตัดสินใจ</Text>
                <Text style={[styles.panelSubtitle, { color: colors.textSecondary }]}>ให้เวลากับตัวเองก่อนกดซื้อ</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/waiting')} style={styles.textLink} accessibilityRole="link">
                <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 12 }}>ดูทั้งหมด</Text>
                <ArrowRightIcon size={14} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {loadingState === 'loading' && waiting.length === 0 ? (
              <View style={styles.cardList}>
                {[0, 1, 2].map(n => <View key={n} style={[styles.skeleton, { backgroundColor: colors.skeleton }]} />)}
              </View>
            ) : waiting.length === 0 ? (
              <EmptyState colors={colors} onAdd={() => setShowAddSheet(true)} />
            ) : (
              <View style={styles.cardList}>
                {waiting.slice(0, isDesktop ? 4 : 3).map(p => <PurchaseCard key={p.id} purchase={p} />)}
              </View>
            )}
            {error && (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerSubtle }]}>
                <Text style={{ color: colors.dangerText, fontSize: 12 }}>{error}</Text>
                <TouchableOpacity onPress={() => { void loadPurchases(true); }} accessibilityRole="button">
                  <Text style={{ color: colors.textPrimary, fontWeight: '800', marginTop: 6 }}>ลองโหลดใหม่</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={[styles.rightColumn, { width: isWide ? 340 : '100%' }]}>
            <Panel colors={colors}>
              <View style={styles.panelHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>รายการล่าสุด</Text>
                  <Text style={[styles.panelSubtitle, { color: colors.textMuted }]}>รายการที่คุณเพิ่งบันทึก</Text>
                </View>
              </View>
              {recent.length === 0 ? (
                <ChartEmpty colors={colors} message="รายการใหม่จะแสดงที่นี่" />
              ) : recent.slice(0, 4).map((item, idx, arr) => {
                const tone = blockPalette(colors)[idx % 7];
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.recentRow, idx < arr.length - 1 && { borderBottomColor: colors.divider, borderBottomWidth: 1 }]}
                    onPress={() => router.push({ pathname: '/purchase/[id]', params: { id: item.id } } as any)}
                    accessibilityRole="link"
                  >
                    <View style={[styles.recentIcon, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.recentInitial, { color: tone.fg }]}>{item.productName.trim().charAt(0).toUpperCase() || '•'}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.recentName, { color: colors.textPrimary }]} numberOfLines={1}>{item.productName}</Text>
                      <Text style={[styles.recentMeta, { color: colors.textMuted }]} numberOfLines={1}>{CATEGORY_LABELS[item.category]} · {statusLabel(item)}</Text>
                    </View>
                    <View style={[styles.pricePill, { backgroundColor: colors.backgroundSubtle }]}>
                      <Text style={[styles.recentPrice, { color: colors.textPrimary }]} numberOfLines={1}>{formatCurrency(item.price, item.currency)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Panel>

            {recentPlatforms.length > 0 && (
              <Panel colors={colors}>
                <View style={styles.panelHeader}>
                  <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>แพลตฟอร์มที่ใช้</Text>
                </View>
                <View style={styles.platformGrid}>
                  {recentPlatforms.slice(0, 4).map(p => (
                    <View key={p} style={styles.platformItem}>
                      <PlatformTile platform={p} size={44} />
                      <Text style={[styles.platformLabel, { color: colors.textSecondary }]} numberOfLines={1}>{PLATFORM_NAME[p] ?? p}</Text>
                    </View>
                  ))}
                </View>
              </Panel>
            )}

            {!isPro() && (
              <TouchableOpacity onPress={() => router.push('/paywall' as any)} activeOpacity={0.9} accessibilityRole="link">
                <View style={[styles.proCard, { backgroundColor: colors.blockBlue }]}>
                  <View style={[styles.proIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <FlameIcon size={20} color={colors.blockYellow} />
                  </View>
                  <Text style={[styles.proTitle, { color: colors.onBlockDark }]}>RoastMyWallet Pro</Text>
                  <Text style={[styles.proSubtitle, { color: colors.onBlockDark }]}>ปลดล็อกการวิเคราะห์เชิงลึกและเครื่องมือเพิ่มเติม</Text>
                  <View style={[styles.proCta, { backgroundColor: colors.blockYellow }]}>
                    <Text style={[styles.proCtaText, { color: colors.onBlockLight }]}>ดูแผนสมาชิก</Text>
                    <ArrowRightIcon size={14} color={colors.onBlockLight} />
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {!isDesktop && (
        <View style={styles.fab} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.fabButton, shadows.float, { backgroundColor: colors.accent }]}
            onPress={() => setShowAddSheet(true)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="เพิ่มสิ่งที่อยากซื้อ"
          >
            <PlusIcon size={26} color="#FFFFFF" strokeWidth={2.6} />
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showAddSheet}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={() => setShowAddSheet(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <AddPurchaseSheet
            onClose={() => { setShowAddSheet(false); setPrefillUrl(undefined); }}
            prefillUrl={prefillUrl}
          />
        </View>
      </Modal>
    </View>
  );
}

type Colors = ReturnType<typeof useTheme>['colors'];

function Panel({ children, colors, style }: { children: React.ReactNode; colors: Colors; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.panel, shadows.sm, { backgroundColor: colors.surface }, style]}>{children}</View>;
}

function StatTile({ title, value, note, bg, fg, icon, onPress }: {
  title: string; value: string; note: string; bg: string; fg: string; icon: React.ReactNode; onPress?: () => void;
}) {
  const inner = (
    <View style={[styles.tile, { backgroundColor: bg }]}>
      <View style={[styles.tileIcon, { backgroundColor: 'rgba(255,255,255,0.28)' }]}>{icon}</View>
      <Text style={[styles.tileValue, { color: fg }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <View>
        <Text style={[styles.tileTitle, { color: fg }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.tileNote, { color: fg }]} numberOfLines={1}>{note}</Text>
      </View>
    </View>
  );
  return onPress
    ? <TouchableOpacity style={styles.tileWrap} onPress={onPress} activeOpacity={0.88} accessibilityRole="button">{inner}</TouchableOpacity>
    : <View style={styles.tileWrap}>{inner}</View>;
}

function WeeklyBarChart({ values, currency, colors }: {
  values: { label: string; key: string; value: number }[]; currency: string; colors: Colors;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const availableWidth = windowWidth >= 1024 ? windowWidth - 650 : windowWidth >= 768 ? windowWidth - 420 : windowWidth - 80;
  const chartWidth = Math.max(220, Math.min(availableWidth, 620));
  const max = Math.max(...values.map(item => item.value), 1);
  const todayIndex = values.length - 1;
  const barGap = 10;
  const barWidth = (chartWidth - barGap * (values.length - 1)) / values.length;
  const chartHeight = 120;

  return (
    <View style={styles.chart}>
      <View style={styles.chartLine}>
        <Svg width={chartWidth} height={chartHeight + 4} viewBox={`0 0 ${chartWidth} ${chartHeight + 4}`}>
          {values.map((item, index) => {
            const h = Math.max(10, (item.value / max) * chartHeight);
            const isToday = index === todayIndex;
            const x = index * (barWidth + barGap);
            return (
              <Rect
                key={item.key}
                x={x}
                y={chartHeight - h + 2}
                width={barWidth}
                height={h}
                rx={Math.min(barWidth / 2, 14)}
                fill={item.value > 0 ? (isToday ? colors.blockPurple : colors.blockYellow) : colors.backgroundSubtle}
              />
            );
          })}
        </Svg>
      </View>
      <View style={styles.chartLabels}>
        {values.map((point, index) => (
          <View key={point.key} style={styles.chartLabelCell}>
            <Text style={[styles.chartLabel, { color: index === todayIndex ? colors.textPrimary : colors.textMuted, fontWeight: index === todayIndex ? '900' : '600' }]}>
              {point.label}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[styles.chartCaption, { color: colors.textMuted }]}>
        เงินที่ประหยัดได้จากรายการที่เลือก “ไม่ซื้อแล้ว” · {currency}
      </Text>
    </View>
  );
}

function CategoryDonut({ categories, total, currency, colors }: {
  categories: { category: PurchaseCategory; amount: number }[]; total: number; currency: Currency; colors: Colors;
}) {
  const palette = [colors.blockPurple, colors.blockYellow, colors.blockOrange, colors.blockGreen];
  const radiusPx = 48;
  const circumference = 2 * Math.PI * radiusPx;
  let offset = 0;

  return (
    <View style={styles.donutLayout}>
      <View style={styles.donutWrap}>
        <Svg width={132} height={132} viewBox="0 0 132 132">
          <Circle cx="66" cy="66" r={radiusPx} fill="none" stroke={colors.backgroundSubtle} strokeWidth="18" />
          {total > 0 && categories.map((item, index) => {
            const fraction = item.amount / total;
            const segment = fraction * circumference;
            const dashOffset = -offset;
            offset += segment;
            return (
              <Circle key={item.category} cx="66" cy="66" r={radiusPx} fill="none"
                stroke={palette[index % palette.length]} strokeWidth="18"
                strokeDasharray={`${segment} ${circumference - segment}`}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 66 66)" />
            );
          })}
        </Svg>
        <View style={styles.donutCenter}>
          <Text style={[styles.donutCaption, { color: colors.textMuted }]}>มูลค่ารวม</Text>
          <Text style={[styles.donutTotal, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(total, currency, { compact: true })}
          </Text>
        </View>
      </View>
      <View style={styles.donutLegend}>
        {categories.map((item, index) => {
          const percentage = total > 0 ? Math.round((item.amount / total) * 100) : 0;
          return (
            <View key={item.category} style={styles.donutLegendRow}>
              <View style={[styles.categoryDot, { backgroundColor: palette[index % palette.length] }]} />
              <Text style={[styles.categoryLabel, { color: colors.textSecondary }]} numberOfLines={1}>{CATEGORY_LABELS[item.category]}</Text>
              <Text style={[styles.categoryPercent, { color: colors.textPrimary }]}>{percentage}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ChartEmpty({ colors, message }: { colors: Colors; message: string }) {
  return (
    <View style={styles.chartEmpty}>
      <View style={[styles.chartEmptyIcon, { backgroundColor: colors.blockYellow }]}>
        <ShieldIcon size={24} color={colors.onBlockLight} />
      </View>
      <Text style={[styles.chartEmptyText, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

function EmptyState({ colors, onAdd }: { colors: Colors; onAdd: () => void }) {
  return (
    <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.blockSky }]}>
        <ClockIcon size={32} color={colors.onBlockLight} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>ยังไม่มีรายการที่รอซื้อ</Text>
      <Text style={[styles.emptySub, { color: colors.textSecondary }]}>เก็บของที่อยากได้ไว้ก่อน แล้วค่อยตัดสินใจเมื่อพร้อม</Text>
      <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.primary }]} onPress={onAdd} accessibilityRole="button">
        <PlusIcon size={15} color={colors.primaryText} />
        <Text style={[styles.emptyButtonText, { color: colors.primaryText }]}>เพิ่มรายการแรก</Text>
      </TouchableOpacity>
    </View>
  );
}

function statusLabel(purchase: Purchase): string {
  switch (purchase.status) {
    case 'waiting': return 'รอตัดสินใจ';
    case 'bought': return 'ซื้อแล้ว';
    case 'avoided': return 'ไม่ซื้อแล้ว';
    case 'expired': return 'หมดเวลา';
    case 'reconsidering': return 'กลับมาคิดใหม่';
    default: return 'ไม่ทราบสถานะ';
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: { width: '100%', alignSelf: 'center', paddingHorizontal: 20, gap: 18 },

  // header
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  eyebrow: { fontSize: 13, fontWeight: '700' },
  pageTitle: { fontSize: 34, lineHeight: 40, fontWeight: '900', letterSpacing: -1, marginTop: 6 },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 14, height: 40 },
  statusText: { fontSize: 13, fontWeight: '900' },
  inkButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, height: 44, borderRadius: 999 },
  inkButtonText: { fontSize: 13, fontWeight: '800' },

  // hero
  hero: { borderRadius: radius['3xl'], padding: 24, gap: 10, overflow: 'hidden' },
  shape: { position: 'absolute' },
  heroLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  heroLabel: { fontSize: 14, fontWeight: '800', opacity: 0.92 },
  heroAmount: { fontSize: 48, lineHeight: 54, fontWeight: '900', letterSpacing: -1.8, maxWidth: '78%', marginTop: 4 },
  heroNote: { fontSize: 12, fontWeight: '600', opacity: 0.85 },
  heroProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, maxWidth: '82%' },
  heroTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.28)', overflow: 'hidden' },
  heroFill: { height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },
  heroProgressText: { fontSize: 12, fontWeight: '900' },
  heroCta: { alignSelf: 'flex-start', paddingHorizontal: 22, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  heroCtaText: { color: '#FFFBF3', fontSize: 13, fontWeight: '800' },

  // tiles
  tilesRow: { flexDirection: 'row', gap: 12 },
  tileWrap: { flex: 1, minWidth: 0 },
  tile: { borderRadius: radius.xl, padding: 14, minHeight: 138, justifyContent: 'space-between', gap: 8 },
  tileIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  tileValue: { fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1 },
  tileTitle: { fontSize: 13, fontWeight: '800' },
  tileNote: { fontSize: 10, fontWeight: '600', opacity: 0.8, marginTop: 1 },

  // assistant nudge
  nudge: { borderRadius: radius['2xl'], padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' },
  nudgeEyebrow: { fontSize: 11, fontWeight: '800', opacity: 0.7 },
  nudgeText: { fontSize: 15, lineHeight: 22, fontWeight: '800' },
  nudgeCta: { alignSelf: 'flex-start', paddingHorizontal: 20, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  nudgeCtaText: { color: '#FFFBF3', fontSize: 13, fontWeight: '800' },
  nudgeHeart: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center' },

  // panels
  analyticsRow: { gap: 14, alignItems: 'stretch' },
  contentRow: { gap: 14 },
  panel: { borderRadius: radius['2xl'], padding: 20, gap: 16 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  panelTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  panelSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  unitChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  unitChipText: { fontSize: 10, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.6 },

  // chart
  chart: { minHeight: 184, gap: 8, justifyContent: 'flex-end' },
  chartLine: { minHeight: 126, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  chartLabelCell: { flex: 1, alignItems: 'center' },
  chartLabel: { fontSize: 10 },
  chartCaption: { fontSize: 10, lineHeight: 15, marginTop: 2 },
  chartEmpty: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 12 },
  chartEmptyIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  chartEmptyText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },

  // donut
  categoryPanel: { gap: 18 },
  donutLayout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' },
  donutWrap: { width: 132, height: 132, alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center', width: 84 },
  donutCaption: { fontSize: 9, fontWeight: '700' },
  donutTotal: { fontSize: 15, fontWeight: '900', maxWidth: 84 },
  donutLegend: { flex: 1, minWidth: 125, gap: 13 },
  donutLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryLabel: { fontSize: 12, flex: 1 },
  categoryPercent: { fontSize: 12, fontWeight: '900' },

  // lists
  textLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardList: { gap: 12 },
  skeleton: { height: 110, borderRadius: radius['2xl'] },
  rightColumn: { gap: 14 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 2 },
  recentIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  recentInitial: { fontSize: 16, fontWeight: '900' },
  recentName: { fontSize: 13, fontWeight: '800' },
  recentMeta: { fontSize: 10, marginTop: 2 },
  pricePill: { paddingHorizontal: 10, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', maxWidth: 104 },
  recentPrice: { fontSize: 11, fontWeight: '900' },
  platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  platformItem: { width: 60, alignItems: 'center', gap: 6 },
  platformLabel: { fontSize: 10, textAlign: 'center' },

  // pro
  proCard: { borderRadius: radius['2xl'], padding: 20, gap: 8 },
  proIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  proTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  proSubtitle: { fontSize: 12, lineHeight: 18, opacity: 0.85 },
  proCta: { marginTop: 6, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, height: 38, borderRadius: 999 },
  proCtaText: { fontSize: 12, fontWeight: '900' },

  errorBox: { padding: 12, borderRadius: radius.md, marginTop: 6 },

  // empty
  empty: { borderRadius: radius['2xl'], borderWidth: 2, borderStyle: 'dashed', padding: 26, alignItems: 'center', gap: 10 },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '900' },
  emptySub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, height: 44, borderRadius: 999, marginTop: 6 },
  emptyButtonText: { fontSize: 13, fontWeight: '800' },

  // fab + modal
  fab: { position: 'absolute', right: 20, bottom: 14 },
  fabButton: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  modal: { flex: 1 },
});
