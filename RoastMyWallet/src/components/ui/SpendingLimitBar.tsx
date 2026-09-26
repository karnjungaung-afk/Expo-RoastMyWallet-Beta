import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useSpendingProgress } from '@/hooks/useSpendingProgress';
import { spacing, typography } from '@/theme/tokens';
import { formatCurrency } from '@/utils/formatting';
import type { Currency } from '@/types';

interface SpendingLimitBarProps {
  period: 'daily' | 'weekly' | 'monthly';
  currency?: Currency;
  compact?: boolean;
}

/**
 * SpendingLimitBar
 *
 * Shows current spending vs limit for a given period.
 * Uses a segmented progress bar — consistent with PurchaseCard countdown.
 * Color shifts: safe → warning (80%) → exceeded (100%+).
 */
export function SpendingLimitBar({
  period,
  currency = 'THB',
  compact = false,
}: SpendingLimitBarProps) {
  const { colors } = useTheme();
  const progress = useSpendingProgress();
  const data = progress[period];

  if (!data) return null;

  const { limit, spent, remaining, percentUsed, isExceeded } = data;

  const barColor = isExceeded
    ? colors.danger
    : percentUsed >= 80
    ? colors.warning
    : colors.primary;

  const segments = 20;
  const filledSegments = Math.min(segments, Math.round((percentUsed / 100) * segments));

  const periodLabel = { daily: 'Today', weekly: 'This week', monthly: 'This month' }[period];

  if (compact) {
    return (
      <View style={styles.compact}>
        <View style={styles.compactHeader}>
          <Text style={[styles.compactPeriod, { color: colors.textMuted }]}>
            {periodLabel}
          </Text>
          <Text style={[
            styles.compactValue,
            { color: isExceeded ? colors.danger : colors.textPrimary },
          ]}>
            {formatCurrency(spent, currency)} / {formatCurrency(limit, currency)}
          </Text>
        </View>
        <View style={styles.progressBar}>
          {Array.from({ length: segments }, (_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                { backgroundColor: i < filledSegments ? barColor : colors.borderSubtle },
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.periodLabel, { color: colors.textMuted }]}>
            {periodLabel}
          </Text>
          <Text style={[
            styles.spentAmount,
            { color: isExceeded ? colors.danger : colors.textPrimary },
          ]}>
            {formatCurrency(spent, currency)}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.limitLabel, { color: colors.textMuted }]}>of</Text>
          <Text style={[styles.limitAmount, { color: colors.textSecondary }]}>
            {formatCurrency(limit, currency)}
          </Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        {Array.from({ length: segments }, (_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              { backgroundColor: i < filledSegments ? barColor : colors.borderSubtle },
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[
          styles.statusText,
          { color: isExceeded ? colors.danger : percentUsed >= 80 ? colors.warning : colors.textMuted },
        ]}>
          {isExceeded
            ? `Exceeded by ${formatCurrency(spent - limit, currency)}`
            : percentUsed >= 80
            ? `${formatCurrency(remaining, currency)} remaining — getting close`
            : `${formatCurrency(remaining, currency)} remaining`}
        </Text>
        <Text style={[styles.percentText, { color: barColor }]}>
          {Math.round(percentUsed)}%
        </Text>
      </View>
    </View>
  );
}

// ─── ALL LIMITS OVERVIEW ──────────────────────────────────────────────────────

interface SpendingOverviewProps {
  currency?: Currency;
}

export function SpendingOverview({ currency = 'THB' }: SpendingOverviewProps) {
  const { colors } = useTheme();
  const progress = useSpendingProgress();

  const hasAnyLimit =
    progress.daily !== null || progress.weekly !== null || progress.monthly !== null;

  if (!hasAnyLimit) {
    return (
      <View style={[styles.emptyLimits, { borderColor: colors.border }]}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No spending limits set.{' '}
          <Text style={{ color: colors.primary }}>Configure in Profile →</Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing[3] }}>
      {progress.daily && (
        <SpendingLimitBar period="daily" currency={currency} />
      )}
      {progress.weekly && (
        <SpendingLimitBar period="weekly" currency={currency} />
      )}
      {progress.monthly && (
        <SpendingLimitBar period="monthly" currency={currency} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1,
    padding: spacing[3],
    gap: spacing[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  periodLabel: {
    fontSize: typography.size.xs,
    fontFamily: 'Courier New',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  spentAmount: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    letterSpacing: -0.5,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  limitLabel: {
    fontSize: typography.size.xs,
  },
  limitAmount: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 2,
    height: 4,
  },
  segment: {
    flex: 1,
    borderRadius: 1.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: typography.size.xs,
    flex: 1,
  },
  percentText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    fontFamily: 'Courier New',
  },

  // Compact
  compact: {
    gap: spacing[1.5],
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactPeriod: {
    fontSize: typography.size.xs,
    fontFamily: 'Courier New',
  },
  compactValue: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },

  // Empty
  emptyLimits: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing[3],
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
});
