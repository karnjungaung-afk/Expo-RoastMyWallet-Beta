import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { MechaCard } from '@/components/ui/MechaCard';
import { RiskBadge } from '@/components/ui/Badge';
import { ScorePill } from '@/components/ui/NeedScoreRing';
import { spacing, typography } from '@/theme/tokens';
import { formatCurrency, formatCountdown, formatCategoryName, truncate } from '@/utils/formatting';
import type { Purchase } from '@/types';

interface PurchaseCardProps {
  purchase: Purchase;
  onPress?: () => void;
  showActions?: boolean;
}

/**
 * PurchaseCard
 *
 * Used in the Waiting list and purchase history.
 * Left accent color encodes risk level — supported by RiskBadge text.
 *
 * Countdown uses a segmented progress bar to show time remaining.
 * The bar depletes as time passes (visual urgency cue).
 */
export function PurchaseCard({ purchase, onPress, showActions = false }: PurchaseCardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const risk = purchase.impulseRisk ?? 'medium';
  const isWaiting = purchase.status === 'waiting';

  const accentMap = {
    high: 'danger' as const,
    medium: 'warning' as const,
    low: 'success' as const,
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/purchase/${purchase.id}`);
    }
  };

  // Calculate countdown progress (0–1, 1 = just added, 0 = ready)
  const progressValue = React.useMemo(() => {
    if (!purchase.waitingUntil || !purchase.createdAt) return 0;
    const total = new Date(purchase.waitingUntil).getTime() - new Date(purchase.createdAt).getTime();
    const remaining = new Date(purchase.waitingUntil).getTime() - Date.now();
    return Math.max(0, Math.min(1, remaining / total));
  }, [purchase.waitingUntil, purchase.createdAt]);

  const isReady = progressValue === 0;
  const countdown = formatCountdown(purchase.waitingUntil);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${purchase.productName}, ${formatCurrency(purchase.price, purchase.currency)}, ${isReady ? 'ready for decision' : `decision in ${countdown}`}`}
    >
      <MechaCard
        accent={isWaiting ? accentMap[risk] : 'muted'}
        showAccentLine={true}
        showCornerMark={false}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text
              style={[styles.productName, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {truncate(purchase.productName, 38)}
            </Text>
            <Text style={[styles.category, { color: colors.textMuted }]}>
              {formatCategoryName(purchase.category)}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={[styles.price, { color: colors.textPrimary }]}>
              {formatCurrency(purchase.price, purchase.currency)}
            </Text>
          </View>
        </View>

        {/* Score + risk row */}
        <View style={styles.metaRow}>
          {purchase.needScore !== null && purchase.impulseRisk && (
            <>
              <ScorePill score={purchase.needScore} risk={purchase.impulseRisk} />
              <RiskBadge risk={purchase.impulseRisk} />
            </>
          )}
        </View>

        {/* AI roast (if available) */}
        {purchase.aiRoast && isWaiting && (
          <Text
            style={[styles.roast, { color: colors.textSecondary, borderLeftColor: colors.border }]}
            numberOfLines={2}
          >
            {purchase.aiRoast}
          </Text>
        )}

        {/* Countdown + progress */}
        {isWaiting && (
          <View style={styles.countdownSection}>
            <SegmentedProgress value={progressValue} isReady={isReady} />
            <View style={styles.countdownRow}>
              <Clock size={12} color={colors.textMuted} strokeWidth={2} />
              <Text
                style={[
                  styles.countdownText,
                  { color: isReady ? colors.success : colors.textMuted },
                ]}
              >
                {isReady ? 'Decision ready' : `Decision in ${countdown}`}
              </Text>
            </View>
          </View>
        )}

        {/* Decided status */}
        {!isWaiting && (
          <View style={styles.decidedRow}>
            <Text style={[
              styles.decidedLabel,
              {
                color: purchase.status === 'avoided' ? colors.success
                  : purchase.status === 'bought' ? colors.danger
                  : colors.textMuted,
              },
            ]}>
              {purchase.status === 'avoided' ? '✓ Avoided'
                : purchase.status === 'bought' ? '× Bought'
                : 'Expired'}
            </Text>
          </View>
        )}
      </MechaCard>
    </TouchableOpacity>
  );
}

// ─── SEGMENTED PROGRESS BAR ───────────────────────────────────────────────────
// 12-segment bar that depletes from right to left as time passes

interface SegmentedProgressProps {
  value: number;  // 0–1
  isReady: boolean;
}

function SegmentedProgress({ value, isReady }: SegmentedProgressProps) {
  const { colors } = useTheme();
  const segments = 12;
  const filledSegments = Math.round(value * segments);

  const segmentColor = isReady
    ? colors.success
    : value > 0.66
    ? colors.warning
    : value > 0.33
    ? colors.primary
    : colors.danger;

  return (
    <View style={styles.progressBar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      {Array.from({ length: segments }, (_, i) => {
        const isActive = i < filledSegments || isReady;
        return (
          <View
            key={i}
            style={[
              styles.progressSegment,
              {
                backgroundColor: isActive ? segmentColor : colors.borderSubtle,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  productName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  category: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.regular,
    letterSpacing: typography.tracking.wide,
    textTransform: 'uppercase',
    fontFamily: 'Courier New',
  },
  price: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  roast: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
    lineHeight: 18,
    fontStyle: 'italic',
    paddingLeft: spacing[2],
    borderLeftWidth: 2,
    marginBottom: spacing[2],
  },
  countdownSection: {
    gap: spacing[1.5],
    marginTop: spacing[1],
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  countdownText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    fontFamily: 'Courier New',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 2,
    height: 3,
  },
  progressSegment: {
    flex: 1,
    borderRadius: 1,
  },
  decidedRow: {
    marginTop: spacing[1],
  },
  decidedLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.wide,
  },
});
