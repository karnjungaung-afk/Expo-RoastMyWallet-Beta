import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, type StyleProp, type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { neoShadow, neo } from '@/theme/tokens';
import { useTheme } from '@/hooks/useTheme';
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
  const { colors, isDark } = useTheme();
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
  const bg = Platform.OS === 'web' && !isDark ? '#F2F6FC' : isDark ? colors.background : '#F7F9FC';

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
          { maxWidth: isDesktop ? 1380 : 1060, paddingTop: Platform.OS === 'web' ? 22 : insets.top + 12, paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.eyebrow, { color: isDark ? colors.textMuted : '#64748B' }]}>{greeting} 👋</Text>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>{displayName}</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>ภาพรวมการตัดสินใจซื้อและเงินที่คุณช่วยตัวเองไว้</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={[styles.statusPill, { backgroundColor: isPro() ? '#D9FBE8' : (isDark ? '#202A39' : '#E5EEF9') }]}>
              <View style={[styles.statusDot, { backgroundColor: isPro() ? '#20A464' : '#4D84C7' }]} />
              <Text style={[styles.statusText, { color: isPro() ? '#12613D' : (isDark ? '#C9D7E9' : '#315A89') }]}>{isPro() ? 'Pro' : 'Free plan'}</Text>
            </View>
            {isDesktop && (
              <TouchableOpacity style={styles.primaryButton} onPress={() => setShowAddSheet(true)} accessibilityRole="button">
                <PlusIcon size={17} color="#14110F" />
                <Text style={styles.primaryButtonText}>เพิ่มรายการ</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!isWide && (
          <LinearGradient colors={['#FFC62E', '#FF9F43', '#FF6B4A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
            <View style={styles.heroSticker1} pointerEvents="none" />
            <View style={styles.heroSticker2} pointerEvents="none" />
            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>ประหยัดได้เดือนนี้</Text>
              <View style={styles.heroIcon}><WalletIcon size={18} color="#14110F" /></View>
            </View>
            <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(avoided, currency)}</Text>
            <View style={styles.heroPill}>
              <ShieldIcon size={12} color="#14110F" />
              <Text style={styles.heroPillText}>หลีกเลี่ยงแล้ว {avoidedCount} รายการ</Text>
            </View>
          </LinearGradient>
        )}

        <View style={[styles.metricsGrid, { gap: isWide ? 12 : 10 }, !isWide && { flexWrap: 'nowrap' }]}>
          {isWide && (
          <MetricCard
            title="ประหยัดได้เดือนนี้"
            value={formatCurrency(avoided, currency)}
            note={`หลีกเลี่ยงแล้ว ${avoidedCount} รายการ`}
            icon={<ShieldIcon size={18} color="#1F9D68" />}
            accent="#1F9D68"
            colors={colors}
            isDark={isDark}
            width={width}
          />
          )}
          <MetricCard
            title="รอตัดสินใจ"
            value={String(waiting.length)}
            note="รายการใน Waiting List"
            icon={<ClockIcon size={18} color="#D48A18" />}
            accent="#D48A18"
            colors={colors}
            isDark={isDark}
            width={width}
            compact={!isWide}
          />
          <MetricCard
            title="ซื้อไปแล้ว"
            value={String(boughtCount)}
            note="รายการที่ตัดสินใจซื้อ"
            icon={<CheckIcon size={18} color="#3878D7" />}
            accent="#3878D7"
            colors={colors}
            isDark={isDark}
            width={width}
            compact={!isWide}
          />
          <MetricCard
            title="ทั้งหมด"
            value={String(purchases.length)}
            note="รายการที่บันทึกไว้"
            icon={<FlameIcon size={18} color="#8B6AD9" />}
            accent="#8B6AD9"
            colors={colors}
            isDark={isDark}
            width={width}
            compact={!isWide}
          />
        </View>

        <View style={[styles.analyticsRow, { flexDirection: isWide ? 'row' : 'column' }]}>
          <Panel colors={colors} isDark={isDark} style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.panelHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>เงินที่หลีกเลี่ยงได้</Text>
                <Text style={[styles.panelSubtitle, { color: colors.textMuted }]}>มูลค่ารายการที่เปลี่ยนใจใน 7 วันล่าสุด</Text>
              </View>
              <Text style={[styles.panelUnit, { color: colors.textMuted }]}>{currency}</Text>
            </View>
            {purchases.length === 0 ? (
              <ChartEmpty colors={colors} message="เริ่มบันทึกรายการเพื่อดูแนวโน้มของคุณ" />
            ) : (
              <WeeklyBarChart values={weeklySavings} currency={currency} colors={colors} isDark={isDark} />
            )}
          </Panel>

          <Panel colors={colors} isDark={isDark} style={[styles.categoryPanel, { width: isWide ? 340 : '100%' }]}>
            <View>
              <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>หมวดหมู่ที่สนใจ</Text>
              <Text style={[styles.panelSubtitle, { color: colors.textMuted }]}>มูลค่ารวมของรายการที่บันทึก</Text>
            </View>
            {categoryStats.length === 0 ? (
              <ChartEmpty colors={colors} message="หมวดหมู่จะปรากฏหลังเพิ่มรายการ" />
            ) : (
              <CategoryDonut
                categories={categoryStats}
                total={categoryTotal}
                currency={currency}
                colors={colors}
                isDark={isDark}
              />
            )}
          </Panel>
        </View>

        <View style={[
          styles.contentRow,
          {
            flexDirection: isWide ? 'row' : 'column',
            // In the mobile column layout, stretch panels to the same full width.
            alignItems: isWide ? 'flex-start' : 'stretch',
          },
        ]}>
          <Panel colors={colors} isDark={isDark} style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.panelHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>รอตัดสินใจ</Text>
                <Text style={[styles.panelSubtitle, { color: colors.textMuted }]}>ให้เวลากับตัวเองก่อนกดซื้อ</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/waiting')} style={styles.textLink} accessibilityRole="link">
                <Text style={{ color: colors.primary, fontFamily: 'Prompt_700Bold', fontSize: 12 }}>ดูทั้งหมด</Text>
                <ArrowRightIcon size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
            {loadingState === 'loading' && waiting.length === 0 ? (
              <View style={styles.cardList}>
                {[0, 1, 2].map(n => <View key={n} style={[styles.skeleton, { backgroundColor: isDark ? '#1B2737' : '#F2E2BD' }]} />)}
              </View>
            ) : waiting.length === 0 ? (
              <EmptyState colors={colors} isDark={isDark} onAdd={() => setShowAddSheet(true)} />
            ) : (
              <View style={styles.cardList}>
                {waiting.slice(0, isDesktop ? 4 : 3).map(p => <PurchaseCard key={p.id} purchase={p} />)}
              </View>
            )}
            {error && (
              <View style={[styles.errorBox, { backgroundColor: isDark ? '#351E26' : '#FFF0F0' }]}>
                <Text style={{ color: isDark ? '#FFC2C2' : '#A52A2A', fontSize: 12 }}>{error}</Text>
                <TouchableOpacity onPress={() => { void loadPurchases(true); }} accessibilityRole="button">
                  <Text style={{ color: colors.primary, fontFamily: 'Prompt_700Bold', marginTop: 6 }}>ลองโหลดใหม่</Text>
                </TouchableOpacity>
              </View>
            )}
          </Panel>

          <View style={[styles.rightColumn, { width: isWide ? 340 : '100%' }]}>
            <Panel colors={colors} isDark={isDark}>
              <View style={styles.panelHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>รายการล่าสุด</Text>
                  <Text style={[styles.panelSubtitle, { color: colors.textMuted }]}>รายการที่คุณเพิ่งบันทึก</Text>
                </View>
              </View>
              {recent.length === 0 ? (
                <ChartEmpty colors={colors} message="รายการใหม่จะแสดงที่นี่" />
              ) : recent.slice(0, 4).map(item => (
                <TouchableOpacity key={item.id} style={[styles.recentRow, { borderBottomColor: colors.border }]} onPress={() => router.push({ pathname: '/purchase/[id]', params: { id: item.id } } as any)} accessibilityRole="link">
                  <View style={[styles.recentIcon, { backgroundColor: '#FFC62E' }]}>
                    <Text style={[styles.recentInitial, { color: '#14110F' }]}>{item.productName.trim().charAt(0).toUpperCase() || '•'}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.recentName, { color: colors.textPrimary }]} numberOfLines={1}>{item.productName}</Text>
                    <Text style={[styles.recentMeta, { color: colors.textMuted }]} numberOfLines={1}>{CATEGORY_LABELS[item.category]} · {statusLabel(item)}</Text>
                  </View>
                  <Text style={[styles.recentPrice, { color: colors.textPrimary }]} numberOfLines={1}>{formatCurrency(item.price, item.currency)}</Text>
                </TouchableOpacity>
              ))}
            </Panel>

            {recentPlatforms.length > 0 && (
              <Panel colors={colors} isDark={isDark}>
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
              <TouchableOpacity onPress={() => router.push('/paywall' as any)} accessibilityRole="link">
                <LinearGradient colors={['#7139D5', '#A77BFF']} style={styles.proCard}>
                  <View style={styles.proIcon}><FlameIcon size={18} color="#FFD27A" /></View>
                  <Text style={styles.proTitle}>RoastMyWallet Pro</Text>
                  <Text style={styles.proSubtitle}>ปลดล็อกการวิเคราะห์เชิงลึกและเครื่องมือเพิ่มเติม</Text>
                  <View style={styles.proCta}>
                    <Text style={styles.proCtaText}>ดูแผนสมาชิก</Text>
                    <ArrowRightIcon size={14} color="#14110F" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {!isDesktop && (
        <View style={[styles.fab, { bottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.fabButton} onPress={() => setShowAddSheet(true)} activeOpacity={0.86} accessibilityRole="button">
            <PlusIcon size={18} color="#14110F" />
            <Text style={styles.fabText}>เพิ่มสิ่งที่อยากซื้อ</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showAddSheet}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={() => setShowAddSheet(false)}
      >
        <View style={[styles.modal, { backgroundColor: isDark ? '#14110F' : '#F3F7FC', paddingTop: insets.top }]}>
          <AddPurchaseSheet
            onClose={() => { setShowAddSheet(false); setPrefillUrl(undefined); }}
            prefillUrl={prefillUrl}
          />
        </View>
      </Modal>
    </View>
  );
}

function Panel({ children, colors, isDark, style }: {
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>['colors'];
  isDark: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border, ...neoShadow(colors.border, 5) }, style]}>{children}</View>;
}

const INK = '#14110F';
const PASTEL: Record<string, string> = { '#1F9D68': '#7AE8B5', '#D48A18': '#FFE08A', '#3878D7': '#7CD4FF', '#8B6AD9': '#C9B6FF' };
const pastel = (accent: string) => PASTEL[accent] ?? '#FFE08A';

function MetricCard({ title, value, note, icon, accent, colors, isDark, width, compact }: {
  title: string; value: string; note: string; icon: React.ReactNode; accent: string;
  colors: ReturnType<typeof useTheme>['colors']; isDark: boolean; width: number; compact?: boolean;
}) {
  const cardWidth = width >= 1280 ? '24%' : width >= 720 ? '48%' : '100%';
  if (compact) {
    return (
      <View style={[styles.miniCard, { backgroundColor: pastel(accent), borderColor: INK, ...neoShadow(INK, 3) }]}>
        <View style={[styles.miniIcon, { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: INK }]}>{icon}</View>
        <Text style={[styles.miniTitle, { color: INK }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.miniValue, { color: INK }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.metricCard, { width: cardWidth, backgroundColor: pastel(accent), borderColor: INK, ...neoShadow(INK, 4) }]}>
      <View style={[styles.metricIcon, { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: INK }]}>{icon}</View>
      <Text style={[styles.metricTitle, { color: INK }]}>{title}</Text>
      <Text style={[styles.metricValue, { color: INK }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[styles.metricNote, { color: '#3B342F' }]} numberOfLines={1}>{note}</Text>
      <View style={[styles.metricAccent, { backgroundColor: INK }]} />
    </View>
  );
}

function WeeklyBarChart({ values, currency, colors, isDark }: {
  values: { label: string; key: string; value: number }[];
  currency: string; colors: ReturnType<typeof useTheme>['colors']; isDark: boolean;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const availableWidth = windowWidth >= 1024 ? windowWidth - 650 : windowWidth >= 768 ? windowWidth - 420 : windowWidth - 48;
  const chartWidth = Math.max(220, Math.min(availableWidth, 620));
  const max = Math.max(...values.map(item => item.value), 1);
  const points = values.map((item, index) => ({
    ...item,
    x: 12 + (index * (chartWidth - 24)) / Math.max(values.length - 1, 1),
    y: 112 - (item.value / max) * 82,
  }));
  const linePath = points.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
  ).join(' ');
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} 120 L ${points[0].x.toFixed(1)} 120 Z`
    : '';

  return (
    <View style={styles.chart}>
      <View style={styles.chartLine}>
        <Svg width={chartWidth} height={132} viewBox={`0 0 ${chartWidth} 132`}>
          {[30, 72, 114].map(y => (
            <Line key={y} x1="8" x2={chartWidth - 8} y1={y} y2={y}
              stroke={isDark ? '#334155' : '#E8EEF6'} strokeWidth="1" strokeDasharray="3 5" />
          ))}
          {points.length > 1 && (
            <>
              <Path d={areaPath} fill={isDark ? '#8B5CF6' : '#DCEBFF'} opacity={isDark ? 0.2 : 0.8} />
              <Path d={linePath} fill="none" stroke="#2878E2" strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          {points.map(point => (
            <Circle key={point.key} cx={point.x} cy={point.y} r="4"
              fill={isDark ? '#172B49' : '#FFFFFF'} stroke="#2878E2" strokeWidth="2.5" />
          ))}
        </Svg>
      </View>
      <View style={styles.chartLabels}>
        {points.map(point => (
          <View key={point.key} style={styles.chartLabelCell}>
            <Text style={[styles.chartLabel, { color: colors.textMuted }]}>{point.label}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.chartCaption, { color: colors.textMuted }]}>
        เงินที่ประหยัดได้จากรายการที่เลือก “ไม่ซื้อแล้ว” · {currency}
      </Text>
    </View>
  );
}

function CategoryDonut({ categories, total, currency, colors, isDark }: {
  categories: { category: PurchaseCategory; amount: number }[];
  total: number;
  currency: Currency;
  colors: ReturnType<typeof useTheme>['colors'];
  isDark: boolean;
}) {
  const palette = ['#3579D4', '#37A878', '#E3A43B', '#8866D5'];
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <View style={styles.donutLayout}>
      <View style={styles.donutWrap}>
        <Svg width={132} height={132} viewBox="0 0 132 132">
          <Circle cx="66" cy="66" r={radius} fill="none"
            stroke={isDark ? '#26364C' : '#EAF0F7'} strokeWidth="15" />
          {total > 0 && categories.map((item, index) => {
            const fraction = item.amount / total;
            const segment = fraction * circumference;
            const dashOffset = -offset;
            offset += segment;
            return (
              <Circle key={item.category} cx="66" cy="66" r={radius} fill="none"
                stroke={palette[index % palette.length]} strokeWidth="15"
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
              <Text style={[styles.categoryLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                {CATEGORY_LABELS[item.category]}
              </Text>
              <Text style={[styles.categoryPercent, { color: colors.textPrimary }]}>{percentage}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ChartEmpty({ colors, message }: { colors: ReturnType<typeof useTheme>['colors']; message: string }) {
  return (
    <View style={styles.chartEmpty}>
      <View style={[styles.chartEmptyIcon, { backgroundColor: colors.primarySubtle }]}>
        <ShieldIcon size={22} color={colors.primary} />
      </View>
      <Text style={[styles.chartEmptyText, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

function EmptyState({ colors, isDark, onAdd }: {
  colors: ReturnType<typeof useTheme>['colors']; isDark: boolean; onAdd: () => void;
}) {
  return (
    <View style={[styles.empty, { backgroundColor: isDark ? '#162133' : '#F8FAFD', borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#243247' : '#E5EEF9' }]}>
        <ClockIcon size={30} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>ยังไม่มีรายการที่รอซื้อ</Text>
      <Text style={[styles.emptySub, { color: colors.textSecondary }]}>เก็บของที่อยากได้ไว้ก่อน แล้วค่อยตัดสินใจเมื่อพร้อม</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onAdd} accessibilityRole="button">
        <PlusIcon size={15} color="#14110F" />
        <Text style={styles.emptyButtonText}>เพิ่มรายการแรก</Text>
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
  heroCard: { borderRadius: 28, padding: 22, gap: 9, borderWidth: 3, borderColor: '#14110F', overflow: 'hidden', boxShadow: '6px 6px 0px 0px #14110F' },
  heroSticker1: { position: 'absolute', right: -22, top: -22, width: 92, height: 92, borderRadius: 46, backgroundColor: '#D6F73C', borderWidth: 3, borderColor: '#14110F' },
  heroSticker2: { position: 'absolute', right: 52, bottom: -18, width: 44, height: 44, borderRadius: 12, backgroundColor: '#FF9ECF', borderWidth: 3, borderColor: '#14110F', transform: [{ rotate: '18deg' }] },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontSize: 14, color: '#14110F', fontFamily: 'Prompt_600SemiBold' },
  heroIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 2.5, borderColor: '#14110F', alignItems: 'center', justifyContent: 'center' },
  heroAmount: { fontSize: 40, fontFamily: 'Prompt_800ExtraBold', color: '#14110F', letterSpacing: -1.2 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 2.5, borderColor: '#14110F', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  heroPillText: { fontSize: 12, fontFamily: 'Prompt_700Bold', color: '#14110F' },
  miniCard: { flex: 1, minWidth: 0, borderRadius: 16, borderWidth: 2.5, padding: 12, gap: 4 },
  miniIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  miniTitle: { fontSize: 11, fontFamily: 'Prompt_500Medium' },
  miniValue: { fontSize: 20, fontFamily: 'Prompt_800ExtraBold', letterSpacing: -0.4 },
  root: { flex: 1 },
  page: { width: '100%', alignSelf: 'center', paddingHorizontal: 22, gap: 20 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' },
  eyebrow: { fontSize: 12, fontFamily: 'Prompt_700Bold', letterSpacing: 0.3 },
  pageTitle: { fontSize: 30, lineHeight: 36, fontFamily: 'Prompt_800ExtraBold', letterSpacing: -0.8, marginTop: 2 },
  pageSubtitle: { fontSize: 13, lineHeight: 19, marginTop: 4, maxWidth: 580 },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontFamily: 'Prompt_800ExtraBold' },
  primaryButton: { backgroundColor: '#D6F73C', borderWidth: 2.5, borderColor: '#14110F', boxShadow: '3px 3px 0px 0px #14110F', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  primaryButtonText: { color: '#14110F', fontSize: 13, fontFamily: 'Prompt_800ExtraBold' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricCard: { borderWidth: 2.5, borderRadius: 20, padding: 17, minHeight: 142, gap: 7 },
  metricIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  metricTitle: { fontSize: 12, fontFamily: 'Prompt_600SemiBold' },
  metricValue: { fontSize: 23, lineHeight: 28, fontFamily: 'Prompt_800ExtraBold', letterSpacing: -0.4 },
  metricNote: { fontSize: 11 },
  metricAccent: { height: 5, width: 34, borderRadius: 3, marginTop: 'auto' },
  analyticsRow: { gap: 14, alignItems: 'stretch' },
  contentRow: { gap: 14, alignItems: 'flex-start' },
  panel: { borderWidth: 2.5, borderRadius: 24, padding: 20, gap: 15 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  panelTitle: { fontSize: 16, fontFamily: 'Prompt_800ExtraBold', letterSpacing: -0.2 },
  panelSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  panelUnit: { fontSize: 10, fontFamily: 'Prompt_800ExtraBold', backgroundColor: '#D6F73C', color: '#14110F', borderWidth: 2, borderColor: '#14110F', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },







  chart: { minHeight: 184, gap: 8, justifyContent: 'flex-end' },
  chartLine: { minHeight: 136, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  chartLabelCell: { flex: 1, alignItems: 'center' },
  chartLabel: { fontSize: 10, fontFamily: 'Prompt_600SemiBold' },
  chartCaption: { fontSize: 10, lineHeight: 15, marginTop: 2 },
  chartEmpty: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12 },
  chartEmptyIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  chartEmptyText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  categoryPanel: { gap: 18 },
  donutLayout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' },
  donutWrap: { width: 132, height: 132, alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center', width: 90 },
  donutCaption: { fontSize: 9, fontFamily: 'Prompt_600SemiBold' },
  donutTotal: { fontSize: 14, fontFamily: 'Prompt_800ExtraBold', maxWidth: 90 },
  donutLegend: { flex: 1, minWidth: 125, gap: 13 },
  donutLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  categoryList: { gap: 15 },
  categoryItem: { gap: 6 },
  categoryLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryLabel: { fontSize: 11, flex: 1 },
  categoryPercent: { fontSize: 11, fontFamily: 'Prompt_800ExtraBold' },
  progressTrack: { height: 6, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  textLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardList: { gap: 10 },
  skeleton: { height: 104, borderRadius: 16 },
  rightColumn: { gap: 14 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 2, borderStyle: 'dashed', paddingBottom: 11, marginBottom: 2 },
  recentIcon: { width: 36, height: 36, borderRadius: 12, borderWidth: 2, borderColor: '#14110F', alignItems: 'center', justifyContent: 'center' },
  recentInitial: { fontSize: 14, fontFamily: 'Prompt_800ExtraBold' },
  recentName: { fontSize: 12, fontFamily: 'Prompt_700Bold' },
  recentMeta: { fontSize: 10, marginTop: 2 },
  recentPrice: { fontSize: 10, fontFamily: 'Prompt_800ExtraBold', maxWidth: 88, textAlign: 'right' },
  platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  platformItem: { width: 60, alignItems: 'center', gap: 6 },
  platformLabel: { fontSize: 10, textAlign: 'center' },
  proCard: { borderRadius: 20, padding: 18, gap: 8 },
  proIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.13)', alignItems: 'center', justifyContent: 'center' },
  proTitle: { fontSize: 15, color: '#fff', fontFamily: 'Prompt_800ExtraBold' },
  proSubtitle: { fontSize: 11, lineHeight: 16, color: 'rgba(255,255,255,0.72)' },
  proCta: { marginTop: 6, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10 },
  proCtaText: { color: '#14110F', fontSize: 11, fontFamily: 'Prompt_800ExtraBold' },
  errorBox: { padding: 12, borderRadius: 12, marginTop: 6 },
  empty: { borderRadius: 20, borderWidth: 2.5, borderStyle: 'dashed', padding: 24, alignItems: 'center', gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 15, fontFamily: 'Prompt_800ExtraBold' },
  emptySub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: '#D6F73C', borderWidth: 2.5, borderColor: '#14110F', boxShadow: '3px 3px 0px 0px #14110F', marginTop: 4 },
  emptyButtonText: { color: '#14110F', fontSize: 12, fontFamily: 'Prompt_800ExtraBold' },
  fab: { position: 'absolute', alignSelf: 'center', left: 0, right: 0, alignItems: 'center' },
  fabButton: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#D6F73C', borderWidth: 3, borderColor: '#14110F', boxShadow: '4px 4px 0px 0px #14110F', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 999 },
  fabText: { color: '#14110F', fontSize: 13, fontFamily: 'Prompt_800ExtraBold' },
  modal: { flex: 1 },
});
