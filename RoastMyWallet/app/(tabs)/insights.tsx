import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAuthStore, selectProfile } from '@/store/authStore';
import { MechaCard } from '@/components/ui/MechaCard';
import { TechnicalDivider, ProGateBadge } from '@/components/ui/Badge';
import { spacing, typography } from '@/theme/tokens';
import {
  formatCurrency,
  formatPercent,
  formatCategoryName,
  formatReasonName,
} from '@/utils/formatting';
import { calculateAvoidedSpending, calculateImpulseRate } from '@/utils/scoring';
import type { Purchase, PurchaseCategory, PurchaseReason } from '@/types';

export default function InsightsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { purchases } = usePurchaseStore();
  const profile = useAuthStore(selectProfile);
  const { isPro } = useSubscriptionStore();

  const currency = profile?.currency ?? 'THB';

  // ── Computed stats ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const decided = purchases.filter(p => p.status === 'bought' || p.status === 'avoided');
    const avoided = purchases.filter(p => p.status === 'avoided' || p.status === 'expired');
    const bought = purchases.filter(p => p.status === 'bought');

    const totalAvoided = calculateAvoidedSpending(purchases);
    const totalSpent = bought.reduce((sum, p) => sum + p.price, 0);
    const impulseRate = calculateImpulseRate(purchases);
    const avgWaiting = decided.length > 0
      ? decided.filter(p => p.decidedAt && p.createdAt).reduce((sum, p) => {
          const waited = (new Date(p.decidedAt!).getTime() - new Date(p.createdAt).getTime()) / 3_600_000;
          return sum + waited;
        }, 0) / decided.length
      : 0;

    // Top category
    const categoryCounts = purchases.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topCategory = Object.entries(categoryCounts).sort(([,a],[,b]) => b - a)[0]?.[0] as PurchaseCategory | undefined;

    // Top reason (for avoided purchases — tells you what triggered them)
    const reasonCounts = avoided.reduce((acc, p) => {
      acc[p.reason] = (acc[p.reason] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topReason = Object.entries(reasonCounts).sort(([,a],[,b]) => b - a)[0]?.[0] as PurchaseReason | undefined;

    // Monthly trend (last 6 months)
    const monthlyData = getMonthlyTrend(purchases);

    return {
      totalAvoided,
      totalSpent,
      avoidedCount: avoided.length,
      boughtCount: bought.length,
      impulseRate,
      avgWaitingHours: Math.round(avgWaiting),
      topCategory,
      topReason,
      monthlyData,
    };
  }, [purchases]);

  const subCost = 39;
  const proROI = stats.totalAvoided - subCost;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing[4], paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Insights</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Your spending patterns at a glance
          </Text>
        </View>

        {/* ── Top stats ────────────────────────────────────────────── */}
        <TechnicalDivider label="OVERVIEW" />

        <View style={styles.overviewGrid}>
          <OverviewCard
            label="Total avoided"
            value={formatCurrency(stats.totalAvoided, currency as any)}
            accent="success"
            note="Est. impulse spending avoided"
            colors={colors}
          />
          <OverviewCard
            label="Total spent"
            value={formatCurrency(stats.totalSpent, currency as any)}
            accent="danger"
            note="Purchases you went through with"
            colors={colors}
          />
        </View>

        <View style={styles.statsRow}>
          <InlineStatCard
            label="Avoided"
            value={String(stats.avoidedCount)}
            unit="purchases"
            colors={colors}
          />
          <InlineStatCard
            label="Impulse rate"
            value={formatPercent(stats.impulseRate)}
            unit="of buys were impulse"
            colors={colors}
          />
          <InlineStatCard
            label="Avg. wait"
            value={`${stats.avgWaitingHours}h`}
            unit="before deciding"
            colors={colors}
          />
        </View>

        {/* ── Monthly trend ─────────────────────────────────────────── */}
        <TechnicalDivider label="MONTHLY TREND" />

        {stats.monthlyData.length > 0 ? (
          <MechaCard accent="primary" showAccentLine>
            <Text style={[styles.chartTitle, { color: colors.textSecondary }]}>
              Avoided vs spent per month
            </Text>
            <MonthlyBarChart data={stats.monthlyData} colors={colors} />
            <View style={styles.chartLegend}>
              <LegendItem color={colors.success} label="Avoided" />
              <LegendItem color={colors.danger} label="Spent" />
            </View>
          </MechaCard>
        ) : (
          <EmptyChart colors={colors} />
        )}

        {/* ── Patterns ──────────────────────────────────────────────── */}
        <TechnicalDivider label="PATTERNS" />

        <View style={styles.patternsGrid}>
          {stats.topCategory && (
            <PatternCard
              label="Most tempting category"
              value={formatCategoryName(stats.topCategory)}
              colors={colors}
            />
          )}
          {stats.topReason && (
            <PatternCard
              label="Most common trigger"
              value={formatReasonName(stats.topReason)}
              colors={colors}
            />
          )}
        </View>

        {/* ── Pro ROI (Pro only) ────────────────────────────────────── */}
        <View>
          <View style={styles.proLabelRow}>
            <TechnicalDivider label="SUBSCRIPTION ROI" />
            {!isPro() && <ProGateBadge />}
          </View>

          {isPro() ? (
            <MechaCard accent="success" showAccentLine showCornerMark>
              <Text style={[styles.roiTitle, { color: colors.textPrimary }]}>
                Your PauseBuy return
              </Text>
              <View style={styles.roiRow}>
                <View style={styles.roiItem}>
                  <Text style={[styles.roiValue, { color: colors.textMuted }]}>
                    {formatCurrency(subCost, currency as any)}
                  </Text>
                  <Text style={[styles.roiLabel, { color: colors.textMuted }]}>
                    Subscription
                  </Text>
                </View>
                <Text style={[styles.roiArrow, { color: colors.textMuted }]}>→</Text>
                <View style={styles.roiItem}>
                  <Text style={[styles.roiValue, { color: colors.success }]}>
                    {formatCurrency(Math.max(0, proROI), currency as any)}
                  </Text>
                  <Text style={[styles.roiLabel, { color: colors.textMuted }]}>
                    Estimated net gain
                  </Text>
                </View>
              </View>
              <Text style={[styles.roiDisclaimer, { color: colors.textMuted }]}>
                Based on estimated avoided spending. Actual results depend on your decisions.
              </Text>
            </MechaCard>
          ) : (
            <MechaCard accent="muted" showAccentLine style={styles.proGateCard}>
              <Text style={[styles.proGateText, { color: colors.textSecondary }]}>
                Upgrade to Pro to see your subscription ROI and detailed spending analysis.
              </Text>
            </MechaCard>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── OVERVIEW CARD ────────────────────────────────────────────────────────────

function OverviewCard({ label, value, accent, note, colors }: any) {
  const accentColors: Record<string, string> = {
    success: colors.success,
    danger: colors.danger,
    primary: colors.primary,
  };

  return (
    <View style={[styles.overviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.overviewAccent, { backgroundColor: accentColors[accent] }]} />
      <View style={styles.overviewContent}>
        <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>{value}</Text>
        <Text style={[styles.overviewNote, { color: colors.textMuted }]}>{note}</Text>
      </View>
    </View>
  );
}

// ─── INLINE STAT CARD ─────────────────────────────────────────────────────────

function InlineStatCard({ label, value, unit, colors }: any) {
  return (
    <View style={[styles.inlineStat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.inlineValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.inlineLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.inlineUnit, { color: colors.textMuted }]}>{unit}</Text>
    </View>
  );
}

// ─── MONTHLY BAR CHART ────────────────────────────────────────────────────────

interface MonthData {
  label: string;
  avoided: number;
  spent: number;
}

function MonthlyBarChart({ data, colors }: { data: MonthData[]; colors: any }) {
  const chartWidth = 300;
  const chartHeight = 120;
  const barWidth = Math.min(20, (chartWidth / data.length) * 0.4);
  const gap = (chartWidth - data.length * barWidth * 2) / (data.length + 1);
  const maxVal = Math.max(...data.map(d => Math.max(d.avoided, d.spent)), 1);

  return (
    <Svg width="100%" height={chartHeight + 28} viewBox={`0 0 ${chartWidth} ${chartHeight + 28}`}>
      {data.map((d, i) => {
        const x = gap + i * (barWidth * 2 + gap);
        const avoidedH = (d.avoided / maxVal) * chartHeight;
        const spentH = (d.spent / maxVal) * chartHeight;

        return (
          <G key={i}>
            {/* Avoided bar */}
            <Rect
              x={x}
              y={chartHeight - avoidedH}
              width={barWidth}
              height={Math.max(avoidedH, 2)}
              fill={colors.success}
              opacity={0.75}
              rx={2}
            />
            {/* Spent bar */}
            <Rect
              x={x + barWidth + 2}
              y={chartHeight - spentH}
              width={barWidth}
              height={Math.max(spentH, 2)}
              fill={colors.danger}
              opacity={0.65}
              rx={2}
            />
            {/* Baseline */}
            <Line
              x1={x}
              y1={chartHeight}
              x2={x + barWidth * 2 + 2}
              y2={chartHeight}
              stroke={colors.border}
              strokeWidth={1}
            />
            {/* Label */}
            <SvgText
              x={x + barWidth}
              y={chartHeight + 18}
              textAnchor="middle"
              fill={colors.textMuted}
              fontSize={9}
            >
              {d.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── CHART LEGEND ─────────────────────────────────────────────────────────────

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={{ fontSize: typography.size.xs, color: '#888' }}>{label}</Text>
    </View>
  );
}

// ─── PATTERN CARD ─────────────────────────────────────────────────────────────

function PatternCard({ label, value, colors }: any) {
  return (
    <View style={[styles.patternCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.patternLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.patternValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

function EmptyChart({ colors }: { colors: any }) {
  return (
    <View style={[styles.emptyChart, { borderColor: colors.border }]}>
      <Text style={[styles.emptyChartText, { color: colors.textMuted }]}>
        Add a few purchases to see your trends here.
      </Text>
    </View>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getMonthlyTrend(purchases: Purchase[]): MonthData[] {
  const months: Record<string, { avoided: number; spent: number }> = {};
  const now = new Date();

  // Last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short' });
    months[key] = { avoided: 0, spent: 0 };
  }

  for (const p of purchases) {
    const d = new Date(p.updatedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!months[key]) continue;

    if (p.status === 'avoided' || p.status === 'expired') {
      months[key].avoided += p.price;
    } else if (p.status === 'bought') {
      months[key].spent += p.price;
    }
  }

  return Object.entries(months).map(([key, val]) => ({
    label: new Date(key + '-01').toLocaleString('default', { month: 'short' }),
    ...val,
  }));
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing[4],
    gap: spacing[4],
  },
  header: {
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: typography.size.sm,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  overviewCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  overviewAccent: {
    width: 3,
  },
  overviewContent: {
    flex: 1,
    padding: spacing[3],
    gap: 2,
  },
  overviewLabel: {
    fontSize: typography.size.xs,
    fontFamily: 'Courier New',
    letterSpacing: 0.5,
  },
  overviewValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    letterSpacing: -0.5,
  },
  overviewNote: {
    fontSize: typography.size['2xs'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  inlineStat: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: spacing[3],
    gap: 2,
    alignItems: 'center',
  },
  inlineValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    letterSpacing: -0.5,
  },
  inlineLabel: {
    fontSize: typography.size['2xs'],
    fontWeight: typography.weight.medium,
    textAlign: 'center',
  },
  inlineUnit: {
    fontSize: typography.size['2xs'],
    textAlign: 'center',
  },
  chartTitle: {
    fontSize: typography.size.xs,
    marginBottom: spacing[2],
    letterSpacing: 0.3,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: spacing[4],
    marginTop: spacing[1],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  proLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roiTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[3],
  },
  roiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[3],
  },
  roiItem: { gap: 3 },
  roiValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  roiLabel: {
    fontSize: typography.size.xs,
  },
  roiArrow: {
    fontSize: typography.size.xl,
  },
  roiDisclaimer: {
    fontSize: typography.size['2xs'],
    lineHeight: 14,
    fontStyle: 'italic',
  },
  proGateCard: {},
  proGateText: {
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  patternsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  patternCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: spacing[3],
    gap: spacing[1],
  },
  patternLabel: {
    fontSize: typography.size.xs,
    letterSpacing: 0.3,
  },
  patternValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  emptyChart: {
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  emptyChartText: {
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
});
