import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { spacing, radius, typography } from '@/theme/tokens';

type AccentColor = 'primary' | 'success' | 'warning' | 'danger' | 'muted';

interface MechaCardProps {
  children: React.ReactNode;
  accent?: AccentColor;
  showAccentLine?: boolean;
  showCornerMark?: boolean;
  style?: ViewStyle;
  padding?: number;
}

export function MechaCard({
  children, accent = 'primary', showAccentLine = true,
  showCornerMark = false, style, padding = spacing[4],
}: MechaCardProps) {
  const { colors } = useTheme();
  const accentColors: Record<AccentColor, string> = {
    primary: colors.primary, success: colors.success,
    warning: colors.warning, danger: colors.danger, muted: colors.border,
  };
  const accentColor = accentColors[accent];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {showAccentLine && <View style={[styles.accentLine, { backgroundColor: accentColor }]} />}
      {showCornerMark && (
        <View
          style={[styles.cornerMark, { borderColor: accentColor }]}
          pointerEvents="none"
        />
      )}
      <View style={[styles.content, { padding }]}>{children}</View>
    </View>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────

export function SectionCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
// Compact metric display card. Shows value + label with optional unit line.

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  valueColor?: string;
  style?: ViewStyle;
}

export function StatCard({ label, value, unit, valueColor, style }: StatCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor ?? colors.textPrimary }]}>{value}</Text>
      {unit != null && (
        <Text style={[styles.statUnit, { color: colors.textMuted }]}>{unit}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden',
  },
  accentLine: { width: 2 },
  cornerMark: {
    position: 'absolute', top: 8, right: 8, width: 10, height: 10,
    borderTopWidth: 1.5, borderRightWidth: 1.5, borderRadius: 0,
  },
  content: { flex: 1 },
  sectionCard: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  statCard: {
    borderRadius: radius.md, borderWidth: 1, padding: spacing[3], gap: spacing[1],
  },
  statLabel: {
    fontSize: typography.size.xs, fontFamily: 'Courier New',
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  statValue: {
    fontSize: typography.size.xl, fontWeight: typography.weight.bold, letterSpacing: -0.5,
  },
  statUnit: { fontSize: typography.size.xs },
});
