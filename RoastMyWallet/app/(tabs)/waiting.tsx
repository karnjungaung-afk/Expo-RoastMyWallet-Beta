import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
  Platform, useWindowDimensions,
} from 'react-native';
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
  const { colors } = useTheme();
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
  const pageBg = colors.background;

  return (
    <View style={[styles.root, { backgroundColor: pageBg }]}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.purchaseRow}>
            <PurchaseCard purchase={item} />
          </View>
        )}
        contentContainerStyle={[
          styles.list,
          { paddingTop: isDesktop ? 30 : insets.top + 14, paddingBottom: 28 },
          filtered.length === 0 && styles.listEmpty,
          isDesktop && styles.desktopList,
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textPrimary} />}
        ListHeaderComponent={
          <View style={styles.pageContent}>
            <View style={styles.topLine}>
              <View style={styles.headingBlock}>
                <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>รายการของคุณ</Text>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>รอซื้อ</Text>
                <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                  จัดการสิ่งที่อยากซื้อ คิดก่อนจ่าย และตัดสินใจอย่างมั่นใจ
                </Text>
              </View>
              <View style={[styles.waitingTotal, { backgroundColor: colors.blockPurple }]}>
                <View style={[styles.totalIcon, { backgroundColor: 'rgba(255,255,255,0.24)' }]}>
                  <ClockIcon size={18} color={colors.onBlockDark} />
                </View>
                <View>
                  <Text style={[styles.totalLabel, { color: colors.onBlockDark }]}>มูลค่ารายการที่รอ</Text>
                  <Text style={[styles.totalValue, { color: colors.onBlockDark }]}>{formatMoney(totalValue)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <SummaryCard label="กำลังรอตัดสินใจ" value={waiting.length} hint="รายการทั้งหมด" icon={<ClockIcon size={18} color={colors.onBlockLight} />} bg={colors.blockYellow} fg={colors.onBlockLight} />
              <SummaryCard label="พร้อมตัดสินใจ" value={ready.length} hint="ครบเวลาพักการซื้อแล้ว" icon={<ShieldIcon size={18} color={colors.onBlockDark} />} bg={colors.blockGreen} fg={colors.onBlockDark} />
              <SummaryCard label="ความเสี่ยงสูง" value={waiting.filter(p => p.impulseRisk === 'high').length} hint="ควรทบทวนอีกครั้ง" icon={<FlameIcon size={18} color={colors.onBlockDark} />} bg={colors.blockOrange} fg={colors.onBlockDark} />
              <SummaryCard label="ตัดสินใจแล้ว" value={decided.length} hint="ประวัติการซื้อและงดซื้อ" icon={<CheckIcon size={18} color={colors.onBlockLight} />} bg={colors.blockPink} fg={colors.onBlockLight} />
            </View>

            <View style={[styles.listPanel, { backgroundColor: colors.surface }]}>
              <View style={styles.listHeading}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>รายการของคุณ</Text>
                  <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                    {searchTerm ? `ผลการค้นหา “${searchTerm}”` : 'ติดตามสถานะและทบทวนก่อนตัดสินใจซื้อ'}
                  </Text>
                </View>
                <Text style={[styles.resultCount, { color: colors.textMuted }]}>{filtered.length} รายการ</Text>
              </View>
              <View style={styles.filterRow}>
                {FILTERS.map(item => {
                  const active = filter === item.key;
                  const count = getChipCount(item.key, purchases);
                  return (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => setFilter(item.key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[styles.filterTab, { backgroundColor: active ? colors.primary : colors.backgroundSubtle }]}
                    >
                      <Text style={[styles.filterText, { color: active ? colors.primaryText : colors.textSecondary, fontWeight: active ? '800' : '600' }]}>{item.label}</Text>
                      {count > 0 && <View style={[styles.filterCount, { backgroundColor: active ? colors.accent : colors.surface }]}><Text style={[styles.filterCountText, { color: active ? '#FFFFFF' : colors.textMuted }]}>{count}</Text></View>}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {searchTerm ? (
                <View style={styles.searchNotice}>
                  <Text style={[styles.searchNoticeText, { color: colors.textSecondary }]}>คำค้น: {searchTerm}</Text>
                  <TouchableOpacity onPress={() => router.replace('/(tabs)/waiting' as any)} accessibilityRole="button">
                    <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '800' }}>ล้างคำค้น ×</Text>
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

function SummaryCard({ label, value, hint, icon, bg, fg }: {
  label: string; value: number; hint: string; icon: React.ReactNode; bg: string; fg: string;
}) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: bg }]}>
      <View style={[styles.summaryIcon, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>{icon}</View>
      <Text style={[styles.summaryValue, { color: fg }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: fg }]}>{label}</Text>
      <Text style={[styles.summaryHint, { color: fg }]}>{hint}</Text>
    </View>
  );
}

function EmptyState({ filter, colors, searchTerm }: { filter: Filter; colors: any; searchTerm: string }) {
  const messages: Record<Filter, { title: string; sub: string; icon: React.ReactNode }> = {
    all: { title: 'ยังไม่มีรายการที่รอซื้อ', sub: 'เพิ่มสิ่งที่อยากซื้อจากปุ่ม + แล้วเราจะช่วยให้คุณมีเวลาคิดก่อนจ่าย', icon: <ClockIcon size={30} color={colors.onBlockLight} /> },
    high_risk: { title: 'ไม่พบรายการความเสี่ยงสูง', sub: 'เยี่ยมเลย! ตอนนี้ไม่มีรายการที่ต้องเฝ้าระวังเป็นพิเศษ', icon: <ShieldIcon size={30} color={colors.onBlockLight} /> },
    ready: { title: 'ยังไม่มีรายการที่พร้อมตัดสินใจ', sub: 'เมื่อครบเวลาพักการซื้อ รายการจะแสดงในส่วนนี้', icon: <ClockIcon size={30} color={colors.onBlockLight} /> },
    decided: { title: 'ยังไม่มีประวัติการตัดสินใจ', sub: 'รายการที่ซื้อแล้วหรือเลือกไม่ซื้อจะแสดงที่นี่', icon: <CheckIcon size={30} color={colors.onBlockLight} /> },
  };
  const message = searchTerm
    ? { title: 'ไม่พบรายการที่ตรงกัน', sub: 'ลองเปลี่ยนคำค้นหรือกดล้างคำค้นเพื่อดูรายการทั้งหมด', icon: <ClockIcon size={30} color={colors.onBlockLight} /> }
    : messages[filter];
  return (
    <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.blockSky }]}>{message.icon}</View>
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
  eyebrow: { fontSize: 12, fontWeight: '800', marginBottom: 4 },
  headerTitle: { fontSize: 40, lineHeight: 44, fontWeight: '900', letterSpacing: -1.2 },
  headerSub: { fontSize: 13, lineHeight: 19, marginTop: 5 },
  waitingTotal: { minWidth: 190, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, borderRadius: 24 },
  totalIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  totalLabel: { fontSize: 11, marginBottom: 3, fontWeight: '700', opacity: 0.9 },
  totalValue: { fontSize: 20, fontWeight: '900' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryCard: { flexGrow: 1, flexBasis: 150, minWidth: 145, borderRadius: 28, padding: 18, gap: 4 },
  summaryIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  summaryValue: { fontSize: 38, lineHeight: 42, fontWeight: '900', letterSpacing: -1.2 },
  summaryLabel: { fontSize: 12, fontWeight: '800' },
  summaryHint: { fontSize: 10, marginTop: 2, opacity: 0.8, fontWeight: '600' },
  listPanel: { borderRadius: 28, overflow: 'hidden' },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 17, paddingBottom: 13, gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  sectionSub: { fontSize: 11, marginTop: 4 },
  resultCount: { fontSize: 11, fontWeight: '600' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36, borderRadius: 18 },
  filterText: { fontSize: 12 },
  filterCount: { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  filterCountText: { fontSize: 9, fontWeight: '800' },
  searchNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10 },
  searchNoticeText: { fontSize: 11 },
  purchaseRow: { width: '100%', maxWidth: 1180, alignSelf: 'center' },
  empty: { width: '100%', maxWidth: 1180, alignSelf: 'center', alignItems: 'center', gap: 10, padding: 34, borderWidth: 2, borderStyle: 'dashed', borderRadius: 28, marginTop: 10 },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  emptySub: { fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 360 },
});
