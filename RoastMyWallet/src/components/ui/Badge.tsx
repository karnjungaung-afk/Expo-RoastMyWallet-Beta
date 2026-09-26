import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { spacing, radius, typography } from '@/theme/tokens';
import type { ImpulseRisk } from '@/types';

// ─── RISK BADGE ───────────────────────────────────────────────────────────────
//
// Displays risk level using dot indicators + text.
// Never relies on color alone — the dots count is redundant information.
// ◆◆◆ HIGH  |  ◆◆◇ MEDIUM  |  ◆◇◇ LOW

interface RiskBadgeProps {
  risk: ImpulseRisk;
  style?: ViewStyle;
}

export function RiskBadge({ risk, style }: RiskBadgeProps) {
  const { colors } = useTheme();

  const config = {
    high: {
      dots: 3,
      label: 'HIGH',
      color: colors.riskHigh,
      bg: colors.riskHighSubtle,
    },
    medium: {
      dots: 2,
      label: 'MED',
      color: colors.riskMedium,
      bg: colors.riskMediumSubtle,
    },
    low: {
      dots: 1,
      label: 'LOW',
      color: colors.riskLow,
      bg: colors.riskLowSubtle,
    },
  }[risk];

  return (
    <View
      style={[
        styles.riskBadge,
        { backgroundColor: config.bg },
        style,
      ]}
      accessibilityLabel={`Impulse risk: ${risk}`}
    >
      {/* Dot indicators */}
      <View style={styles.dots}>
        {[0, 1, 2].map(i => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < config.dots ? config.color : 'transparent',
                borderColor: config.color,
              },
            ]}
          />
        ))}
      </View>

      <Text style={[styles.riskLabel, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

type StatusBadgeVariant = 'waiting' | 'bought' | 'avoided' | 'expired' | 'pro' | 'free' | 'new';

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  label?: string;
  style?: ViewStyle;
}

export function StatusBadge({ variant, label, style }: StatusBadgeProps) {
  const { colors } = useTheme();

  const config: Record<StatusBadgeVariant, { color: string; bg: string; defaultLabel: string }> = {
    waiting: {
      color: colors.warning,
      bg: colors.warningSubtle,
      defaultLabel: 'Waiting',
    },
    bought: {
      color: colors.danger,
      bg: colors.dangerSubtle,
      defaultLabel: 'Bought',
    },
    avoided: {
      color: colors.success,
      bg: colors.successSubtle,
      defaultLabel: 'Avoided',
    },
    expired: {
      color: colors.textMuted,
      bg: colors.borderSubtle,
      defaultLabel: 'Expired',
    },
    pro: {
      color: colors.primary,
      bg: colors.primarySubtle,
      defaultLabel: 'PRO',
    },
    free: {
      color: colors.textSecondary,
      bg: colors.borderSubtle,
      defaultLabel: 'Free',
    },
    new: {
      color: colors.success,
      bg: colors.successSubtle,
      defaultLabel: 'New',
    },
  };

  const c = config[variant];

  return (
    <View style={[styles.statusBadge, { backgroundColor: c.bg }, style]}>
      <Text style={[styles.statusLabel, { color: c.color }]}>
        {label ?? c.defaultLabel}
      </Text>
    </View>
  );
}

// ─── TECHNICAL DIVIDER ────────────────────────────────────────────────────────
//
// ──── LABEL ──────────────────────── ◈
// Mecha-inspired section dividers with optional label and status dot.

interface TechnicalDividerProps {
  label?: string;
  style?: ViewStyle;
  showStatusDot?: boolean;
}

export function TechnicalDivider({ label, style, showStatusDot = false }: TechnicalDividerProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.divider, style]}>
      {/* Left line */}
      <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

      {label && (
        <Text style={[styles.dividerLabel, { color: colors.textMuted }]}>
          {label}
        </Text>
      )}

      {/* Right line */}
      <View style={[styles.dividerLine, styles.dividerLineRight, { backgroundColor: colors.border }]} />

      {/* Status dot */}
      {showStatusDot && (
        <View style={[styles.statusDot, { backgroundColor: colors.mecha }]} />
      )}
    </View>
  );
}

// ─── PRO GATE BADGE ───────────────────────────────────────────────────────────

interface ProGateBadgeProps {
  style?: ViewStyle;
}

export function ProGateBadge({ style }: ProGateBadgeProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.proGateBadge,
        { backgroundColor: colors.primarySubtle, borderColor: colors.primary },
        style,
      ]}
    >
      <Text style={[styles.proGateText, { color: colors.primary }]}>
        PRO
      </Text>
    </View>
  );
}

// ─── SYSTEM LABEL ─────────────────────────────────────────────────────────────
// [SYS ▸ 001] style monospace labels — used very sparingly

interface SystemLabelProps {
  text: string;
  style?: ViewStyle;
}

export function SystemLabel({ text, style }: SystemLabelProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.systemLabel, { borderColor: colors.mechaLine }, style]}>
      <Text style={[styles.systemLabelText, { color: colors.textMuted }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Risk badge
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.sm,
    gap: spacing[1.5],
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 1,
    borderWidth: 1.5,
  },
  riskLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    fontFamily: 'Courier New',
    letterSpacing: typography.tracking.wide,
  },

  // Status badge
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.sm,
  },
  statusLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.wide,
  },

  // Technical divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  dividerLine: {
    height: 1,
    width: 16,
  },
  dividerLineRight: {
    flex: 1,
  },
  dividerLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    letterSpacing: typography.tracking.wider,
    fontFamily: 'Courier New',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 1.5,
  },

  // Pro gate
  proGateBadge: {
    paddingHorizontal: spacing[1.5],
    paddingVertical: spacing[0.5],
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  proGateText: {
    fontSize: typography.size['2xs'],
    fontWeight: typography.weight.bold,
    letterSpacing: typography.tracking.widest,
    fontFamily: 'Courier New',
  },

  // System label
  systemLabel: {
    paddingHorizontal: spacing[1.5],
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: radius.xs,
  },
  systemLabelText: {
    fontSize: typography.size['2xs'],
    fontFamily: 'Courier New',
    letterSpacing: 0.5,
  },
});
