import React, { useCallback, useMemo, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Platform, useWindowDimensions } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useShallow } from 'zustand/react/shallow';
import { PurchaseCard } from '@/features/purchases/PurchaseCard';
import { spacing } from '@/theme/tokens';
import { FlameIcon, ClockIcon, ShieldIcon, CheckIcon } from '@/components/icons/RmwIcons';
import type { Purchase } from '@/types';

type Filter = 'all' | 'high_risk' | 'ready' | 'decided';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'high_risk', label: 'ความเสี่ยงสูง' },
  { key: 'ready', label: 'พร้อมตัดสินใจ' },
  { key: 'decided', label: 'ประวัติการตัดสินใจ' },
];

export default function WaitingScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 900;
  const params = useLocalSearchParams<{ search?: string }>();
  const searchTerm = (typeof params.search === 'string' ? params.search : '').trim();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { purchases, loadPurchases } = usePurchaseStore(useShallow(state => ({
    purchases: state.purchases,
    loadPurchases: state.loadPurchases,
  })));

  useFocusEffect(useCallback(() => {
    void loadPurchases();
  }, [loadPurchases]));

  const onRefresh = async () => {
    setRefreshing(true);
    try { await loadPurchases(true); } finally { setRefreshing(false); }
  };

  const filtered = useMemo(() => {
    let result: Purchase[];
    switch (filter) {
      case 'high_risk':
        result = purchases.filter(p => p.impulseRisk === 'high' && p.status === 'waiting');
        break;
      case 'ready':
        result = purchases.filter(p => p.status === 'waiting' && p.waitingUntil && new Date(p.waitingUntil) <= new Date());
        break;
      case 'decided':
        result = purchases.filter(p => ['bought', 'avoided', 'expired'].includes(p.status));
        break;
      default:
        result = purchases.filter(p => p.status === 'waiting');
    }
    if (!searchTerm) return result;
    const query = searchTerm.toLocaleLowerCase();
    return result.filter(p => [
      p.productName, p.platform, p.category, p.reason, p.notes ?? '',
    ].some(value => String(value).toLocaleLowerCase().includes(query)));
  }, [purchases, filter, searchTerm]);

  const waiting = purchases.filter(p => p.status === 'waiting');
  const ready = waiting.filter(p => p.waitingUntil && new Date(p.waitingUntil) <= new Date());
  const decided = purchases.filter(p => ['bought', 'avoided', 'expired'].includes(p.status));
  const totalValue = waiting.reduce((sum, item) => sum + item.price, 0);
  const pageBg = Platform.OS === 'web' && !isDark ? '#FFF4DC' : colors.background;

  return (
    <View style={[styles.root, { backgroundColor: pageBg }]}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.purchaseRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <PurchaseCard purchase={item} />
          </View>
        )}
        contentContainerStyle={[
          styles.list,
          { paddingTop: isDesktop ? 30 : insets.top + 14, paddingBottom: insets.bottom + 100 },
          filtered.length === 0 && styles.listEmpty,
          isDesktop && styles.desktopList,
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.pageContent}>
            <View style={styles.topLine}>
              <View style={styles.headingBlock}>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR PURCHASES</Text>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>รอซื้อ</Text>
                <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                  จัดการสิ่งที่อยากซื้อ คิดก่อนจ่าย และตัดสินใจอย่างมั่นใจ
                </Text>
              </View>
              <View style={[styles.waitingTotal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.totalIcon, { backgroundColor: colors.primarySubtle }]}>
                  <ClockIcon size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.totalLabel, { color: colors.textMuted }]}>มูลค่ารายการที่รอ</Text>
                  <Text style={[styles.totalValue, { color: colors.textPrimary }]}>{formatMoney(totalValue)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <SummaryCard label="กำลังรอตัดสินใจ" value={waiting.length} hint="รายการทั้งหมด" icon={<ClockIcon size={18} color={colors.primary} />} accent="#FF6B4A" colors={colors} />
              <SummaryCard label="พร้อมตัดสินใจ" value={ready.length} hint="ครบเวลาพักการซื้อแล้ว" icon={<ShieldIcon size={18} color="#218B62" />} accent="#218B62" colors={colors} />
              <SummaryCard label="ความเสี่ยงสูง" value={waiting.filter(p => p.impulseRisk === 'high').length} hint="ควรทบทวนอีกครั้ง" icon={<FlameIcon size={18} color="#D68A13" />} accent="#D68A13" colors={colors} />
              <SummaryCard label="ตัดสินใจแล้ว" value={decided.length} hint="ประวัติการซื้อและงดซื้อ" icon={<CheckIcon size={18} color="#7139D5" />} accent="#7139D5" colors={colors} />
            </View>

            <View style={[styles.listPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.listHeading}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>รายการของคุณ</Text>
                  <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                    {searchTerm ? `ผลการค้นหา “${searchTerm}”` : 'ติดตามสถานะและทบทวนก่อนตัดสินใจซื้อ'}
                  </Text>
                </View>
                <Text style={[styles.resultCount, { color: colors.textMuted }]}>{filtered.length} รายการ</Text>
              </View>
              <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
                {FILTERS.map(item => {
                  const active = filter === item.key;
                  const count = getChipCount(item.key, purchases);
                  return (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => setFilter(item.key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[styles.filterTab, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                    >
                      <Text style={[styles.filterText, { color: active ? colors.primary : colors.textSecondary, fontWeight: active ? '800' : '600' }]}>{item.label}</Text>
                      {count > 0 && <View style={[styles.filterCount, { backgroundColor: active ? colors.primarySubtle : colors.background }]}><Text style={[styles.filterCountText, { color: active ? colors.primary : colors.textMuted }]}>{count}</Text></View>}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {searchTerm ? (
                <View style={styles.searchNotice}>
                  <Text style={[styles.searchNoticeText, { color: colors.textSecondary }]}>คำค้น: {searchTerm}</Text>
                  <TouchableOpacity onPress={() => router.replace('/(tabs)/waiting' as any)} accessibilityRole="button">
                    <Text style={{ color: colors.primary, fontSize: 12, fontFamily: 'Prompt_700Bold' }}>ล้างคำค้น ×</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState filter={filter} colors={colors} searchTerm={searchTerm} />}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: isDesktop ? 12 : spacing[3] }} />}
      />
    </View>
  );
}

const SUMMARY_PASTEL: Record<string, string> = { '#FF6B4A': '#FFB9A8', '#218B62': '#7AE8B5', '#D68A13': '#FFE08A', '#7139D5': '#C9B6FF' };

function SummaryCard({ label, value, hint, icon, accent, colors }: {
  label: string; value: number; hint: string; icon: React.ReactNode; accent: string; colors: any;
}) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: SUMMARY_PASTEL[accent] ?? '#FFE08A', borderColor: '#14110F' }]}>
      <View style={[styles.summaryIcon, { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#14110F' }]}>{icon}</View>
      <Text style={[styles.summaryValue, { color: '#14110F' }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: '#14110F' }]}>{label}</Text>
      <Text style={[styles.summaryHint, { color: '#3B342F' }]}>{hint}</Text>
    </View>
  );
}

function EmptyState({ filter, colors, searchTerm }: { filter: Filter; colors: any; searchTerm: string }) {
  const messages: Record<Filter, { title: string; sub: string; icon: React.ReactNode }> = {
    all: { title: 'ยังไม่มีรายการที่รอซื้อ', sub: 'เพิ่มสิ่งที่อยากซื้อจากปุ่ม + แล้วเราจะช่วยให้คุณมีเวลาคิดก่อนจ่าย', icon: <ClockIcon size={30} color={colors.primary} /> },
    high_risk: { title: 'ไม่พบรายการความเสี่ยงสูง', sub: 'เยี่ยมเลย! ตอนนี้ไม่มีรายการที่ต้องเฝ้าระวังเป็นพิเศษ', icon: <ShieldIcon size={30} color={colors.success} /> },
    ready: { title: 'ยังไม่มีรายการที่พร้อมตัดสินใจ', sub: 'เมื่อครบเวลาพักการซื้อ รายการจะแสดงในส่วนนี้', icon: <ClockIcon size={30} color={colors.warning} /> },
    decided: { title: 'ยังไม่มีประวัติการตัดสินใจ', sub: 'รายการที่ซื้อแล้วหรือเลือกไม่ซื้อจะแสดงที่นี่', icon: <CheckIcon size={30} color={colors.success} /> },
  };
  const message = searchTerm
    ? { title: 'ไม่พบรายการที่ตรงกัน', sub: 'ลองเปลี่ยนคำค้นหรือกดล้างคำค้นเพื่อดูรายการทั้งหมด', icon: <ClockIcon size={30} color={colors.primary} /> }
    : messages[filter];
  return (
    <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primarySubtle }]}>{message.icon}</View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{message.title}</Text>
      <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{message.sub}</Text>
    </View>
  );
}

function getChipCount(key: Filter, purchases: Purchase[]): number {
  switch (key) {
    case 'all': return purchases.filter(p => p.status === 'waiting').length;
    case 'high_risk': return purchases.filter(p => p.impulseRisk === 'high' && p.status === 'waiting').length;
    case 'ready': return purchases.filter(p => p.status === 'waiting' && p.waitingUntil && new Date(p.waitingUntil) <= new Date()).length;
    case 'decided': return purchases.filter(p => ['bought', 'avoided', 'expired'].includes(p.status)).length;
    default: return 0;
  }
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(value);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingHorizontal: 18, paddingTop: 18, flexGrow: 1 },
  desktopList: { paddingHorizontal: 32, paddingTop: 30 },
  listEmpty: { flexGrow: 1 },
  pageContent: { width: '100%', maxWidth: 1280, alignSelf: 'center', gap: 20, marginBottom: 18 },
  topLine: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' },
  headingBlock: { flex: 1, minWidth: 220 },
  eyebrow: { fontSize: 10, fontFamily: 'Prompt_800ExtraBold', letterSpacing: 1.5, marginBottom: 7 },
  headerTitle: { fontSize: 30, fontFamily: 'Prompt_800ExtraBold', letterSpacing: -0.8 },
  headerSub: { fontSize: 13, lineHeight: 19, marginTop: 5 },
  waitingTotal: { minWidth: 190, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderWidth: 2.5, borderRadius: 18, boxShadow: '4px 4px 0px 0px #14110F' },
  totalIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  totalLabel: { fontSize: 11, marginBottom: 3 },
  totalValue: { fontSize: 18, fontFamily: 'Prompt_800ExtraBold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryCard: { flexGrow: 1, flexBasis: 180, minWidth: 145, borderWidth: 2.5, borderRadius: 21, padding: 17, gap: 4, boxShadow: '4px 4px 0px 0px #14110F' },
  summaryIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  summaryValue: { fontSize: 25, fontFamily: 'Prompt_800ExtraBold', letterSpacing: -0.5 },
  summaryLabel: { fontSize: 12, fontFamily: 'Prompt_700Bold' },
  summaryHint: { fontSize: 10, marginTop: 2 },
  listPanel: { borderWidth: 2.5, borderRadius: 16, overflow: 'hidden', boxShadow: '4px 4px 0px 0px #14110F' },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 17, paddingBottom: 13, gap: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'Prompt_800ExtraBold' },
  sectionSub: { fontSize: 11, marginTop: 4 },
  resultCount: { fontSize: 11, fontFamily: 'Prompt_600SemiBold' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, borderBottomWidth: 1 },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterText: { fontSize: 11 },
  filterCount: { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  filterCountText: { fontSize: 9, fontFamily: 'Prompt_800ExtraBold' },
  searchNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10 },
  searchNoticeText: { fontSize: 11 },
  purchaseRow: { width: '100%', maxWidth: 1180, alignSelf: 'center', borderWidth: Platform.OS === 'web' ? 1 : 0, borderRadius: 14, overflow: 'hidden' },
  empty: { width: '100%', maxWidth: 1180, alignSelf: 'center', alignItems: 'center', gap: 10, padding: 34, borderWidth: 2.5, borderRadius: 16, marginTop: 10, boxShadow: '4px 4px 0px 0px #14110F' },
  emptyIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 15, fontFamily: 'Prompt_800ExtraBold', textAlign: 'center' },
  emptySub: { fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 360 },
});
