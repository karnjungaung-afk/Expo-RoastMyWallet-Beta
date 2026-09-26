import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Bell, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore, selectWaitingPurchases } from '@/store/purchaseStore';
import { useAuthStore, selectProfile } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { PurchaseCard } from '@/features/purchases/PurchaseCard';
import { AddPurchaseSheet } from '@/features/purchases/AddPurchaseSheet';
import { MechaCard } from '@/components/ui/MechaCard';
import { TechnicalDivider } from '@/components/ui/Badge';
import { spacing, typography } from '@/theme/tokens';
import { formatCurrency, formatPercent } from '@/utils/formatting';

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const profile = useAuthStore(selectProfile);
  const { purchases, loadPurchases, loadingState, getThisMonthAvoided, getThisMonthAvoidedCount } = usePurchaseStore();
  const waitingPurchases = usePurchaseStore(selectWaitingPurchases);
  const { isPro } = useSubscriptionStore();

  useEffect(() => {
    loadPurchases();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPurchases();
    setRefreshing(false);
  }, []);

  const currency = profile?.currency ?? 'THB';
  const monthlyAvoided = getThisMonthAvoided();
  const avoidedCount = getThisMonthAvoidedCount();

  // Calculate impulse rate from this month's decided purchases
  const thisMonthDecided = purchases.filter(p =>
    p.status === 'bought' || p.status === 'avoided'
  );
  const impulseRate = thisMonthDecided.length > 0
    ? Math.round(
        (thisMonthDecided.filter(p => p.status === 'bought' && p.impulseRisk === 'high').length
         / thisMonthDecided.length) * 100
      )
    : 0;

  const greeting = getGreeting();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + spacing[4] },
          ]}
        >
          <View>
            <Text style={[styles.headerGreeting, { color: colors.textMuted }]}>
              {greeting}
            </Text>
            <Text style={[styles.headerName, { color: colors.textPrimary }]}>
              {profile?.displayName ?? 'Welcome back'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {/* Navigate to notifications */}}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Bell size={20} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {/* ── Savings Hero Card ───────────────────────────────────────── */}
        <SavingsHeroCard
          monthlyAvoided={monthlyAvoided}
          currency={currency}
          avoidedCount={avoidedCount}
          impulseRate={impulseRate}
          isPro={isPro()}
          colors={colors}
        />

        {/* ── Waiting List ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <TechnicalDivider
            label={`WAITING${waitingPurchases.length > 0 ? ` · ${waitingPurchases.length}` : ''}`}
            showStatusDot={waitingPurchases.length > 0}
          />

          {loadingState === 'loading' && waitingPurchases.length === 0 ? (
            <SkeletonCards count={2} colors={colors} />
          ) : waitingPurchases.length === 0 ? (
            <EmptyWaiting colors={colors} onAdd={() => setShowAddSheet(true)} />
          ) : (
            <View style={styles.cardList}>
              {waitingPurchases.slice(0, 5).map(purchase => (
                <PurchaseCard key={purchase.id} purchase={purchase} />
              ))}
              {waitingPurchases.length > 5 && (
                <TouchableOpacity
                  style={[styles.viewMoreButton, { borderColor: colors.border }]}
                  onPress={() => {/* navigate to waiting tab */}}
                >
                  <Text style={[styles.viewMoreText, { color: colors.textSecondary }]}>
                    View {waitingPurchases.length - 5} more
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ── Monthly Stats Row ────────────────────────────────────────── */}
        <View style={styles.section}>
          <TechnicalDivider label="THIS MONTH" />
          <View style={styles.statsRow}>
            <MiniStat
              value={String(avoidedCount)}
              label="Avoided"
              colors={colors}
            />
            <StatDivider colors={colors} />
            <MiniStat
              value={formatCurrency(monthlyAvoided, currency, { compact: true })}
              label="Saved"
              colors={colors}
              highlight
            />
            <StatDivider colors={colors} />
            <MiniStat
              value={formatPercent(impulseRate)}
              label="Impulse rate"
              colors={colors}
            />
          </View>
        </View>

        {/* ── Pro value callout (for free users) ─────────────────────── */}
        {!isPro() && monthlyAvoided > 0 && (
          <ProValueCallout
            monthlyAvoided={monthlyAvoided}
            currency={currency}
            colors={colors}
          />
        )}
      </ScrollView>

      {/* ── FAB ─────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.fab,
          { bottom: insets.bottom + spacing[6] },
        ]}
      >
        <TouchableOpacity
          onPress={() => setShowAddSheet(true)}
          accessibilityRole="button"
          accessibilityLabel="Add purchase"
          style={[styles.fabButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Plus size={24} color="#fff" strokeWidth={2.5} />
          <Text style={styles.fabLabel}>Add Purchase</Text>
        </TouchableOpacity>
      </View>

      {/* ── Add Purchase Modal ──────────────────────────────────────── */}
      <Modal
        visible={showAddSheet}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddSheet(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <AddPurchaseSheet onClose={() => setShowAddSheet(false)} />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ─── SAVINGS HERO CARD ────────────────────────────────────────────────────────

interface HeroCardProps {
  monthlyAvoided: number;
  currency: string;
  avoidedCount: number;
  impulseRate: number;
  isPro: boolean;
  colors: any;
}

function SavingsHeroCard({ monthlyAvoided, currency, avoidedCount, colors }: HeroCardProps) {
  return (
    <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
      {/* Corner decoration — mecha detail */}
      <View style={[styles.heroCornerTL, { borderColor: 'rgba(255,255,255,0.15)' }]} />
      <View style={[styles.heroCornerBR, { borderColor: 'rgba(255,255,255,0.1)' }]} />

      <View style={styles.heroContent}>
        <Text style={[styles.heroLabel, { color: 'rgba(255,255,255,0.55)' }]}>
          Est. avoided this month
        </Text>
        <Text style={styles.heroAmount}>
          {formatCurrency(monthlyAvoided, currency as any)}
        </Text>

        <View style={styles.heroMeta}>
          <View style={styles.heroMetaItem}>
            <View style={[styles.heroDot, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
            <Text style={[styles.heroMetaText, { color: 'rgba(255,255,255,0.65)' }]}>
              {avoidedCount} purchase{avoidedCount !== 1 ? 's' : ''} paused
            </Text>
          </View>
        </View>
      </View>

      {/* System label — mecha detail */}
      <View style={styles.heroSysLabel}>
        <Text style={[styles.heroSysLabelText, { color: 'rgba(255,255,255,0.25)' }]}>
          SYS ▸ SHIELD
        </Text>
      </View>
    </View>
  );
}

// ─── MINI STAT ────────────────────────────────────────────────────────────────

interface MiniStatProps {
  value: string;
  label: string;
  highlight?: boolean;
  colors: any;
}

function MiniStat({ value, label, highlight, colors }: MiniStatProps) {
  return (
    <View style={styles.miniStat}>
      <Text
        style={[
          styles.miniStatValue,
          { color: highlight ? colors.primary : colors.textPrimary },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={[styles.miniStatLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

function StatDivider({ colors }: { colors: any }) {
  return <View style={[styles.statDivider, { backgroundColor: colors.border }]} />;
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyWaiting({ colors, onAdd }: { colors: any; onAdd: () => void }) {
  return (
    <View style={[styles.emptyState, { borderColor: colors.border, borderStyle: 'dashed' }]}>
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
        Nothing waiting
      </Text>
      <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
        See something you want? Add it here before you buy it.
      </Text>
      <TouchableOpacity onPress={onAdd} accessibilityRole="button">
        <Text style={[styles.emptyAction, { color: colors.primary }]}>
          Add your first purchase →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── PRO VALUE CALLOUT ────────────────────────────────────────────────────────

function ProValueCallout({ monthlyAvoided, currency, colors }: { monthlyAvoided: number; currency: string; colors: any }) {
  const subCost = 39; // ฿39/month
  const netSavings = monthlyAvoided - subCost;
  if (netSavings <= 0) return null;

  return (
    <MechaCard accent="primary" showAccentLine showCornerMark style={styles.proCallout}>
      <Text style={[styles.proCalloutTitle, { color: colors.textPrimary }]}>
        You've avoided {formatCurrency(monthlyAvoided, currency as any)} this month
      </Text>
      <Text style={[styles.proCalloutSub, { color: colors.textSecondary }]}>
        Pro costs {formatCurrency(subCost, currency as any)}/month. That's a{' '}
        <Text style={{ color: colors.success, fontWeight: typography.weight.semibold }}>
          {formatCurrency(netSavings, currency as any)} net gain
        </Text>{' '}
        on your first month alone.
      </Text>
      <Text style={[styles.proCalloutCta, { color: colors.primary }]}>
        Upgrade to Pro →
      </Text>
    </MechaCard>
  );
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────

function SkeletonCards({ count, colors }: { count: number; colors: any }) {
  return (
    <View style={styles.cardList}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[styles.skeletonCard, { backgroundColor: colors.skeleton, borderColor: colors.border }]}
        />
      ))}
    </View>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up?';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing[5],
    paddingHorizontal: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: spacing[2],
  },
  headerGreeting: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
    marginBottom: 2,
  },
  headerName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero card
  heroCard: {
    borderRadius: 16,
    padding: spacing[5],
    overflow: 'hidden',
    position: 'relative',
  },
  heroCornerTL: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 16,
    height: 16,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  heroCornerBR: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 16,
    height: 16,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  heroContent: {
    gap: spacing[2],
  },
  heroLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    letterSpacing: typography.tracking.wider,
    fontFamily: 'Courier New',
    textTransform: 'uppercase',
  },
  heroAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -2,
    includeFontPadding: false,
    lineHeight: 44,
  },
  heroMeta: {
    marginTop: spacing[1],
    gap: spacing[1],
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  heroDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  heroMetaText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
  },
  heroSysLabel: {
    position: 'absolute',
    bottom: spacing[3],
    right: spacing[4],
  },
  heroSysLabelText: {
    fontSize: 9,
    fontFamily: 'Courier New',
    letterSpacing: 1,
  },

  // Sections
  section: {
    gap: spacing[3],
  },
  cardList: {
    gap: spacing[3],
  },
  viewMoreButton: {
    paddingVertical: spacing[3],
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  viewMoreText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 0,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: spacing[3],
  },
  miniStatValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  miniStatLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.regular,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
  },

  // Empty state
  emptyState: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing[6],
    gap: spacing[2],
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  emptyHint: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginTop: spacing[1],
  },

  // Pro callout
  proCallout: {
    marginBottom: spacing[2],
  },
  proCalloutTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[1],
  },
  proCalloutSub: {
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginBottom: spacing[2],
  },
  proCalloutCta: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },

  // Skeleton
  skeletonCard: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
  },

  // FAB
  fab: {
    position: 'absolute',
    alignSelf: 'center',
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3.5],
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  fabLabel: {
    color: '#fff',
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
});
