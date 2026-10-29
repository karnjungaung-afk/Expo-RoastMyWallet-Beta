import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, type StyleProp, type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useAuthStore, selectProfile } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { PurchaseCard } from '@/features/purchases/PurchaseCard';
import { AddPurchaseSheet } from '@/features/purchases/AddPurchaseSheet';
import { PlatformTile, PLATFORM_NAME } from '@/components/icons/PlatformIcons';
import { ClockIcon, PlusIcon, ShieldIcon, FlameIcon, ArrowRightIcon, CheckIcon } from '@/components/icons/RmwIcons';
import { formatCurrency } from '@/utils/formatting';
import type { Purchase, PurchaseCategory, ShoppingPlatform } from '@/types';

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
    return [...totals.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [purchases]);

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
                <PlusIcon size={17} color="#fff" />
                <Text style={styles.primaryButtonText}>เพิ่มรายการ</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[styles.metricsGrid, { gap: 12 }]}>
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
          <MetricCard
            title="รอตัดสินใจ"
            value={String(waiting.length)}
            note="รายการใน Waiting List"
            icon={<ClockIcon size={18} color="#D48A18" />}
            accent="#D48A18"
            colors={colors}
            isDark={isDark}
            width={width}
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
              <View style={styles.categoryList}>
                {categoryStats.map((item, index) => {
                  const total = categoryStats.reduce((sum, current) => sum + current.amount, 0) || 1;
                  const percentage = Math.round((item.amount / total) * 100);
                  const accent = ['#3579D4', '#37A878', '#E3A43B', '#8866D5', '#D56A6A'][index % 5];
                  return (
                    <View key={item.category} style={styles.categoryItem}>
                      <View style={styles.categoryLine}>
                        <View style={[styles.categoryDot, { backgroundColor: accent }]} />
                        <Text style={[styles.categoryLabel, { color: colors.textSecondary }]} numberOfLines={1}>{CATEGORY_LABELS[item.category]}</Text>
                        <Text style={[styles.categoryPercent, { color: colors.textPrimary }]}>{percentage}%</Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: isDark ? '#233044' : '#E9EFF7' }]}>
                        <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: accent }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Panel>
        </View>

        <View style={[styles.contentRow, { flexDirection: isWide ? 'row' : 'column' }]}>
          <Panel colors={colors} isDark={isDark} style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.panelHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>รอตัดสินใจ</Text>
                <Text style={[styles.panelSubtitle, { color: colors.textMuted }]}>ให้เวลากับตัวเองก่อนกดซื้อ</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/waiting')} style={styles.textLink} accessibilityRole="link">
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>ดูทั้งหมด</Text>
                <ArrowRightIcon size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
            {loadingState === 'loading' && waiting.length === 0 ? (
              <View style={styles.cardList}>
                {[0, 1, 2].map(n => <View key={n} style={[styles.skeleton, { backgroundColor: isDark ? '#1B2737' : '#ECF1F7' }]} />)}
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
                  <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 6 }}>ลองโหลดใหม่</Text>
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
                  <View style={[styles.recentIcon, { backgroundColor: isDark ? '#20334A' : '#E9F1FC' }]}>
                    <Text style={[styles.recentInitial, { color: colors.primary }]}>{item.productName.trim().charAt(0).toUpperCase() || '•'}</Text>
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
                <LinearGradient colors={['#13375B', '#2364AC']} style={styles.proCard}>
                  <View style={styles.proIcon}><FlameIcon size={18} color="#FFD27A" /></View>
                  <Text style={styles.proTitle}>RoastMyWallet Pro</Text>
                  <Text style={styles.proSubtitle}>ปลดล็อกการวิเคราะห์เชิงลึกและเครื่องมือเพิ่มเติม</Text>
                  <View style={styles.proCta}>
                    <Text style={styles.proCtaText}>ดูแผนสมาชิก</Text>
                    <ArrowRightIcon size={14} color="#173B63" />
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
            <PlusIcon size={18} color="#fff" />
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
        <View style={[styles.modal, { backgroundColor: isDark ? '#0D1A2B' : '#F3F7FC', paddingTop: insets.top }]}>
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
  return <View style={[styles.panel, { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#E1E9F3' }, style]}>{children}</View>;
}

function MetricCard({ title, value, note, icon, accent, colors, isDark, width }: {
  title: string; value: string; note: string; icon: React.ReactNode; accent: string;
  colors: ReturnType<typeof useTheme>['colors']; isDark: boolean; width: number;
}) {
  const cardWidth = width >= 1280 ? '24%' : width >= 720 ? '48%' : '100%';
  return (
    <View style={[styles.metricCard, { width: cardWidth, backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#E1E9F3' }]}>
      <View style={[styles.metricIcon, { backgroundColor: accent + '18' }]}>{icon}</View>
      <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.metricValue, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[styles.metricNote, { color: colors.textMuted }]} numberOfLines={1}>{note}</Text>
      <View style={[styles.metricAccent, { backgroundColor: accent }]} />
    </View>
  );
}

function WeeklyBarChart({ values, currency, colors, isDark }: {
  values: { label: string; key: string; value: number }[];
  currency: string; colors: ReturnType<typeof useTheme>['colors']; isDark: boolean;
}) {
  const max = Math.max(...values.map(v => v.value), 1);
  return (
    <View style={styles.chart}>
      <View style={styles.chartBars}>
        {values.map(item => {
          const height = item.value > 0 ? Math.max(8, Math.round(item.value / max * 100)) : 3;
          return (
            <View key={item.key} style={styles.chartDay}>
              <Text style={[styles.chartAmount, { color: colors.textMuted }]} numberOfLines={1}>
                {item.value > 0 ? compactNumber(item.value, currency) : '—'}
              </Text>
              <View style={[styles.chartTrack, { backgroundColor: isDark ? '#243247' : '#EDF2F8' }]}>
                <LinearGradient colors={item.value > 0 ? ['#2C7CE2', '#67AEFF'] : ['#CDD8E7', '#CDD8E7']} style={[styles.chartBar, { height }]} />
              </View>
              <Text style={[styles.chartLabel, { color: colors.textMuted }]}>{item.label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={[styles.chartCaption, { color: colors.textMuted }]}>แสดงเฉพาะรายการที่มีสถานะ “ไม่ซื้อแล้ว” และวันที่ตัดสินใจ</Text>
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
        <PlusIcon size={15} color="#fff" />
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

function compactNumber(value: number, currency: string): string {
  if (value >= 10000) return `${currency} ${Math.round(value / 1000)}k`;
  if (value >= 1000) return `${currency} ${(value / 1000).toFixed(1)}k`;
  return `${currency} ${Math.round(value)}`;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: { width: '100%', alignSelf: 'center', paddingHorizontal: 20, gap: 18 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  pageTitle: { fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -0.8, marginTop: 2 },
  pageSubtitle: { fontSize: 13, lineHeight: 19, marginTop: 4, maxWidth: 580 },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '800' },
  primaryButton: { backgroundColor: '#1769E0', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  primaryButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricCard: { borderWidth: 1, borderRadius: 18, padding: 16, minHeight: 142, gap: 7, overflow: 'hidden', shadowColor: '#173B63', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 4 }, shadowRadius: 14, elevation: 1 },
  metricIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  metricTitle: { fontSize: 12, fontWeight: '600' },
  metricValue: { fontSize: 23, lineHeight: 28, fontWeight: '900', letterSpacing: -0.4 },
  metricNote: { fontSize: 11 },
  metricAccent: { height: 3, width: 34, borderRadius: 3, marginTop: 'auto' },
  analyticsRow: { gap: 14, alignItems: 'stretch' },
  contentRow: { gap: 14, alignItems: 'flex-start' },
  panel: { borderWidth: 1, borderRadius: 20, padding: 18, gap: 14, shadowColor: '#173B63', shadowOpacity: 0.035, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 1 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  panelTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  panelSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  panelUnit: { fontSize: 10, fontWeight: '800', backgroundColor: '#E9F1FC', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  chart: { minHeight: 184, gap: 8, justifyContent: 'flex-end' },
  chartBars: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: 142, justifyContent: 'space-between' },
  chartDay: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 5 },
  chartAmount: { fontSize: 9, minHeight: 12 },
  chartTrack: { width: '70%', height: 108, borderRadius: 8, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  chartBar: { width: '100%', borderRadius: 7 },
  chartLabel: { fontSize: 10 },
  chartCaption: { fontSize: 10, lineHeight: 15, marginTop: 4 },
  chartEmpty: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12 },
  chartEmptyIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  chartEmptyText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  categoryPanel: { gap: 18 },
  categoryList: { gap: 15 },
  categoryItem: { gap: 6 },
  categoryLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryLabel: { fontSize: 11, flex: 1 },
  categoryPercent: { fontSize: 11, fontWeight: '800' },
  progressTrack: { height: 6, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  textLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardList: { gap: 10 },
  skeleton: { height: 104, borderRadius: 16 },
  rightColumn: { gap: 14 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, paddingBottom: 11, marginBottom: 2 },
  recentIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  recentInitial: { fontSize: 14, fontWeight: '800' },
  recentName: { fontSize: 12, fontWeight: '700' },
  recentMeta: { fontSize: 10, marginTop: 2 },
  recentPrice: { fontSize: 10, fontWeight: '800', maxWidth: 88, textAlign: 'right' },
  platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  platformItem: { width: 60, alignItems: 'center', gap: 6 },
  platformLabel: { fontSize: 10, textAlign: 'center' },
  proCard: { borderRadius: 20, padding: 18, gap: 8 },
  proIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.13)', alignItems: 'center', justifyContent: 'center' },
  proTitle: { fontSize: 15, color: '#fff', fontWeight: '900' },
  proSubtitle: { fontSize: 11, lineHeight: 16, color: 'rgba(255,255,255,0.72)' },
  proCta: { marginTop: 6, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10 },
  proCtaText: { color: '#173B63', fontSize: 11, fontWeight: '800' },
  errorBox: { padding: 12, borderRadius: 12, marginTop: 6 },
  empty: { borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', padding: 24, alignItems: 'center', gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '800' },
  emptySub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: '#1769E0', marginTop: 4 },
  emptyButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  fab: { position: 'absolute', alignSelf: 'center', left: 0, right: 0, alignItems: 'center' },
  fabButton: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#1769E0', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 999, shadowColor: '#1769E0', shadowOpacity: 0.22, shadowOffset: { width: 0, height: 7 }, shadowRadius: 16, elevation: 9 },
  fabText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  modal: { flex: 1 },
});
