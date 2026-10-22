import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, StyleSheet, Modal, SafeAreaView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore, selectWaitingPurchases } from '@/store/purchaseStore';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore, selectProfile } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { PurchaseCard } from '@/features/purchases/PurchaseCard';
import { AddPurchaseSheet } from '@/features/purchases/AddPurchaseSheet';
import { MechaCard } from '@/components/ui/MechaCard';
import { spacing, typography } from '@/theme/tokens';
import { formatCurrency, formatPercent } from '@/utils/formatting';
import {
  BellIcon, PlusIcon, ShieldIcon, FlameIcon, ClockIcon, CornerMark,
} from '@/components/icons/RmwIcons';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { interceptUrl } = useLocalSearchParams<{ interceptUrl?: string }>();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [prefillUrl, setPrefillUrl] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const profile = useAuthStore(selectProfile);
  const { purchases, loadPurchases, loadingState, getThisMonthAvoided, getThisMonthAvoidedCount } =
    usePurchaseStore(useShallow(state => ({
      purchases: state.purchases,
      loadPurchases: state.loadPurchases,
      loadingState: state.loadingState,
      getThisMonthAvoided: state.getThisMonthAvoided,
      getThisMonthAvoidedCount: state.getThisMonthAvoidedCount,
    })));
  const waitingPurchases = usePurchaseStore(useShallow(selectWaitingPurchases));
  const { isPro } = useSubscriptionStore();

  useEffect(() => {
    if (interceptUrl && typeof interceptUrl === 'string') {
      setPrefillUrl(interceptUrl);
      setShowAddSheet(true);
    }
  }, [interceptUrl]);

  useEffect(() => { loadPurchases(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPurchases();
    setRefreshing(false);
  }, []);

  const currency      = profile?.currency ?? 'THB';
  const monthlyAvoided = getThisMonthAvoided();
  const avoidedCount  = getThisMonthAvoidedCount();
  const thisMonthDecided = purchases.filter(p => p.status === 'bought' || p.status === 'avoided');
  const impulseRate = thisMonthDecided.length > 0
    ? Math.round((thisMonthDecided.filter(p => p.status === 'bought' && p.impulseRisk === 'high').length / thisMonthDecided.length) * 100)
    : 0;

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'ยังไม่นอนเลยเหรอ' : hour < 12 ? 'อรุณสวัสดิ์' : hour < 17 ? 'สวัสดีตอนบ่าย' : hour < 21 ? 'สวัสดีตอนเย็น' : 'กลางคืนแล้วนะ';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
          <View>
            <Text style={[styles.headerGreeting, { color: colors.textSecondary }]}>{greeting}</Text>
            <Text style={[styles.headerName, { color: colors.textPrimary }]}>
              {profile?.displayName ?? 'Welcome back'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <BellIcon size={20} color={colors.textSecondary} hasAlert={waitingPurchases.length > 0} />
          </TouchableOpacity>
        </View>

        {/* ── Hero Card ───────────────────────────────────── */}
        <HeroCard
          monthlyAvoided={monthlyAvoided}
          currency={currency}
          avoidedCount={avoidedCount}
          isDark={isDark}
          colors={colors}
        />

        {/* ── Stats Row ───────────────────────────────────── */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <StatItem
            value={String(avoidedCount)}
            label="Avoided"
            icon={<ShieldIcon size={16} color={colors.primary} />}
            colors={colors}
          />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatItem
            value={formatCurrency(monthlyAvoided, currency, { compact: true })}
            label="Saved"
            icon={<FlameIcon size={16} color="#E8A030" />}
            highlight
            colors={colors}
          />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatItem
            value={formatPercent(impulseRate)}
            label="Impulse"
            icon={<ClockIcon size={16} color={colors.textMuted} />}
            colors={colors}
          />
        </View>

        {/* ── Waiting List ────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Waiting List
            </Text>
            {waitingPurchases.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.primarySubtle }]}>
                <Text style={[styles.countBadgeText, { color: colors.primary }]}>
                  {waitingPurchases.length}
                </Text>
              </View>
            )}
          </View>

          {loadingState === 'loading' && waitingPurchases.length === 0 ? (
            <SkeletonCards count={2} colors={colors} />
          ) : waitingPurchases.length === 0 ? (
            <EmptyWaiting colors={colors} isDark={isDark} onAdd={() => setShowAddSheet(true)} />
          ) : (
            <View style={styles.cardList}>
              {waitingPurchases.slice(0, 5).map(p => <PurchaseCard key={p.id} purchase={p} />)}
              {waitingPurchases.length > 5 && (
                <TouchableOpacity style={[styles.viewMoreBtn, { borderColor: colors.border }]}>
                  <Text style={[styles.viewMoreText, { color: colors.textSecondary }]}>
                    ดูอีก {waitingPurchases.length - 5} รายการ
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ── Pro callout ─────────────────────────────────── */}
        {!isPro() && monthlyAvoided > 500 && (
          <MechaCard accent="primary" showAccentLine showCornerMark style={styles.proCallout}>
            <Text style={[styles.proTitle, { color: colors.textPrimary }]}>
              ประหยัดไปแล้ว {formatCurrency(monthlyAvoided, currency as any)} เดือนนี้
            </Text>
            <Text style={[styles.proSub, { color: colors.textSecondary }]}>
              Pro ราคาแค่ {formatCurrency(39, currency as any)}/เดือน
            </Text>
            <Text style={[styles.proCta, { color: colors.primary }]}>อัพเกรด Pro →</Text>
          </MechaCard>
        )}
      </ScrollView>

      {/* ── FAB ────────────────────────────────────────────── */}
      <View style={[styles.fab, { bottom: insets.bottom + spacing[6] }]}>
        <TouchableOpacity
          onPress={() => setShowAddSheet(true)}
          style={[styles.fabButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add purchase"
        >
          <PlusIcon size={20} color="#fff" />
          <Text style={styles.fabLabel}>เพิ่มสิ่งที่อยากซื้อ</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showAddSheet} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddSheet(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <AddPurchaseSheet
            onClose={() => { setShowAddSheet(false); setPrefillUrl(undefined); }}
            prefillUrl={prefillUrl}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ── Hero Card ─────────────────────────────────────────────────────────────────

function HeroCard({ monthlyAvoided, currency, avoidedCount, isDark, colors }: any) {
  const gradStart = isDark ? '#0D1F35' : '#1B3557';
  const gradEnd   = isDark ? '#1A2D42' : '#22487A';
  const gradMid   = isDark ? '#162235' : '#1E3D6B';

  return (
    <LinearGradient
      colors={[gradStart, gradMid, gradEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroCard}
    >
      {/* Corner marks */}
      <View style={styles.cornerTL}><CornerMark size={14} color="rgba(255,255,255,0.2)" position="tl" /></View>
      <View style={styles.cornerTR}><CornerMark size={14} color="rgba(255,255,255,0.15)" position="tr" /></View>
      <View style={styles.cornerBR}><CornerMark size={14} color="rgba(255,255,255,0.1)" position="br" /></View>

      {/* Glow blob */}
      <View style={styles.heroGlow} />

      <View style={styles.heroContent}>
        <Text style={styles.heroEyebrow}>ประหยัดได้เดือนนี้</Text>
        <Text style={styles.heroAmount}>{formatCurrency(monthlyAvoided, currency)}</Text>
        <View style={styles.heroMeta}>
          <View style={[styles.heroPill, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <ShieldIcon size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroPillText}>
              {avoidedCount} รายการ หยุดไว้ก่อน
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.heroSysLabel}>
        <View style={[styles.heroSysDot, { backgroundColor: '#00D4A0' }]} />
        <Text style={styles.heroSysText}>SHIELD · ACTIVE</Text>
      </View>
    </LinearGradient>
  );
}

// ── Stat Item ─────────────────────────────────────────────────────────────────

function StatItem({ value, label, icon, highlight, colors }: any) {
  return (
    <View style={styles.statItem}>
      {icon}
      <Text style={[styles.statValue, { color: highlight ? '#E8A030' : colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyWaiting({ colors, isDark, onAdd }: any) {
  return (
    <TouchableOpacity
      onPress={onAdd}
      style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: isDark ? colors.surface : '#FAFAF8' }]}
      activeOpacity={0.7}
    >
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.primarySubtle }]}>
        <ClockIcon size={28} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>ยังไม่มีรายการ</Text>
      <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
        เห็นอะไรอยากซื้อ? เพิ่มไว้ที่นี่ก่อน แล้วค่อยตัดสินใจ
      </Text>
      <View style={[styles.emptyAction, { backgroundColor: colors.primary }]}>
        <PlusIcon size={14} color="#fff" />
        <Text style={styles.emptyActionText}>เพิ่มรายการแรก</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCards({ count, colors }: any) {
  return (
    <View style={styles.cardList}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.skeleton, { backgroundColor: colors.skeleton, borderColor: colors.border }]} />
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { gap: spacing[4], paddingHorizontal: spacing[4] },

  // Header
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: spacing[1] },
  headerGreeting: { fontSize: 13, fontWeight: '400', marginBottom: 2 },
  headerName: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8 },
  iconButton: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Hero
  heroCard: { borderRadius: 20, padding: spacing[5], overflow: 'hidden', position: 'relative', minHeight: 160 },
  cornerTL: { position: 'absolute', top: 14, left: 14 },
  cornerTR: { position: 'absolute', top: 14, right: 14 },
  cornerBR: { position: 'absolute', bottom: 14, right: 14 },
  heroGlow: {
    position: 'absolute', right: -20, top: -20, width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(90,150,195,0.18)',
  },
  heroContent: { gap: spacing[2] },
  heroEyebrow: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroAmount: { fontSize: 44, fontWeight: '800', color: '#fff', letterSpacing: -2, lineHeight: 48 },
  heroMeta: { marginTop: 4 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  heroPillText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  heroSysLabel: { position: 'absolute', bottom: 14, right: 16, flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroSysDot: { width: 5, height: 5, borderRadius: 3 },
  heroSysText: { fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  // Stats
  statsRow: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: spacing[3], gap: 3 },
  statValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, lineHeight: 24 },
  statLabel: { fontSize: 11, fontWeight: '500' },
  statDivider: { width: 1, marginVertical: spacing[3] },

  // Section
  section: { gap: spacing[3] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  countBadgeText: { fontSize: 12, fontWeight: '700' },
  cardList: { gap: spacing[3] },
  viewMoreBtn: { paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', borderStyle: 'dashed' },
  viewMoreText: { fontSize: 13, fontWeight: '500' },

  // Empty
  emptyCard: { borderWidth: 1.5, borderRadius: 20, borderStyle: 'dashed', padding: spacing[6], alignItems: 'center', gap: spacing[3] },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyHint: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyAction: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, marginTop: 4 },
  emptyActionText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Pro
  proCallout: {},
  proTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  proSub: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  proCta: { fontSize: 13, fontWeight: '600' },

  // Skeleton
  skeleton: { height: 110, borderRadius: 16, borderWidth: 1 },

  // FAB
  fab: { position: 'absolute', alignSelf: 'center' },
  fabButton: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    paddingHorizontal: spacing[6], paddingVertical: 14,
    borderRadius: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
  },
  fabLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalContainer: { flex: 1 },
});
