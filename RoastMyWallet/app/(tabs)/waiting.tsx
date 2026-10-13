import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { PurchaseCard } from '@/features/purchases/PurchaseCard';
import { spacing } from '@/theme/tokens';
import { FlameIcon, ClockIcon, ShieldIcon, CheckIcon } from '@/components/icons/RmwIcons';
import type { Purchase } from '@/types';

type Filter = 'all' | 'high_risk' | 'ready' | 'decided';
const FILTERS: { key: Filter; label: string; icon: React.ReactNode }[] = [
  { key: 'all',       label: 'ทั้งหมด',    icon: <ClockIcon size={13} color="currentColor" /> },
  { key: 'high_risk', label: 'ความเสี่ยงสูง', icon: <FlameIcon size={13} color="currentColor" /> },
  { key: 'ready',     label: 'พร้อมตัดสินใจ', icon: <ShieldIcon size={13} color="currentColor" /> },
  { key: 'decided',   label: 'ตัดสินใจแล้ว',  icon: <CheckIcon size={13} color="currentColor" /> },
];

export default function WaitingScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { purchases, loadPurchases, loadingState } = usePurchaseStore();

  useEffect(() => { loadPurchases(); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadPurchases(); setRefreshing(false); };

  const filtered = useMemo(() => {
    switch (filter) {
      case 'high_risk': return purchases.filter(p => p.impulseRisk === 'high' && p.status === 'waiting');
      case 'ready':     return purchases.filter(p => p.status === 'waiting' && p.waitingUntil && new Date(p.waitingUntil) <= new Date());
      case 'decided':   return purchases.filter(p => p.status === 'bought' || p.status === 'avoided' || p.status === 'expired');
      default:          return purchases;
    }
  }, [purchases, filter]);

  const waiting = purchases.filter(p => p.status === 'waiting');
  const ready = purchases.filter(p => p.status === 'waiting' && p.waitingUntil && new Date(p.waitingUntil) <= new Date());

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#0D1F35', colors.background] : ['#1B3557', colors.background]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Waiting List</Text>
            <Text style={styles.headerSub}>รายการที่รอตัดสินใจ</Text>
          </View>
          <View style={styles.headerStats}>
            <StatBubble value={waiting.length} label="รอ" color="#5A96C3" />
            {ready.length > 0 && <StatBubble value={ready.length} label="พร้อม" color="#E8A030" />}
          </View>
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {FILTERS.map(f => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, active && styles.chipActive, { backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', borderColor: active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)' }]}
              >
                <Text style={[styles.chipText, { color: active ? '#fff' : 'rgba(255,255,255,0.5)' }]}>
                  {f.label}
                </Text>
                {f.key !== 'all' && filter !== f.key && getChipCount(f.key, purchases) > 0 && (
                  <View style={styles.chipBadge}>
                    <Text style={styles.chipBadgeText}>{getChipCount(f.key, purchases)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <PurchaseCard purchase={item} />
          </View>
        )}
        contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState filter={filter} colors={colors} />}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
      />
    </View>
  );
}

function StatBubble({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={[styles.statBubble, { backgroundColor: color + '25', borderColor: color + '40' }]}>
      <Text style={[styles.statBubbleValue, { color }]}>{value}</Text>
      <Text style={[styles.statBubbleLabel, { color: color + 'CC' }]}>{label}</Text>
    </View>
  );
}

function EmptyState({ filter, colors }: { filter: Filter; colors: any }) {
  const msgs: Record<Filter, { title: string; sub: string; icon: React.ReactNode }> = {
    all:       { title: 'ยังไม่มีรายการ', sub: 'กดปุ่ม + เพื่อเพิ่มสิ่งที่อยากซื้อ', icon: <ClockIcon size={36} color={colors.primary} /> },
    high_risk: { title: 'ไม่มีรายการความเสี่ยงสูง', sub: 'ดีมาก! คุณไม่มีการซื้อที่เสี่ยงเกินไป', icon: <ShieldIcon size={36} color={colors.success} /> },
    ready:     { title: 'ยังไม่มีรายการที่พร้อมตัดสินใจ', sub: 'รอให้ครบเวลาก่อนนะ', icon: <ClockIcon size={36} color={colors.warning} /> },
    decided:   { title: 'ยังไม่มีประวัติการตัดสินใจ', sub: 'รอให้ Waiting List ครบเวลาก่อน', icon: <CheckIcon size={36} color={colors.success} /> },
  };
  const m = msgs[filter];
  return (
    <View style={[styles.empty, { borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primarySubtle }]}>{m.icon}</View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{m.title}</Text>
      <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{m.sub}</Text>
    </View>
  );
}

function getChipCount(key: Filter, purchases: Purchase[]): number {
  switch (key) {
    case 'high_risk': return purchases.filter(p => p.impulseRisk === 'high' && p.status === 'waiting').length;
    case 'ready': return purchases.filter(p => p.status === 'waiting' && p.waitingUntil && new Date(p.waitingUntil) <= new Date()).length;
    case 'decided': return purchases.filter(p => ['bought','avoided','expired'].includes(p.status)).length;
    default: return 0;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 16, paddingHorizontal: 20, gap: 14 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.8 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  headerStats: { flexDirection: 'row', gap: 8 },
  statBubble: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', borderWidth: 1 },
  statBubbleValue: { fontSize: 18, fontWeight: '800' },
  statBubbleLabel: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  filterRow: { flexDirection: 'row', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipActive: {},
  chipText: { fontSize: 12, fontWeight: '600' },
  chipBadge: { backgroundColor: '#E8A030', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  chipBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  list: { paddingHorizontal: 16, paddingTop: 16 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  cardWrap: {},
  empty: { alignItems: 'center', gap: 12, padding: 40, borderWidth: 1.5, borderRadius: 20, borderStyle: 'dashed', margin: 20 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
