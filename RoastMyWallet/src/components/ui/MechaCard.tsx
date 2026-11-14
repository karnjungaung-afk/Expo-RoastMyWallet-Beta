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
  children, accent = 'primary', showAccentLine: _showAccentLine = true,
  showCornerMark: _showCornerMark = false, style, padding = spacing[4],
}: MechaCardProps) {
  const { colors } = useTheme();
  const accentColors: Record<AccentColor, string> = {
    primary: colors.primary, success: colors.success,
    warning: colors.warning, danger: colors.danger, muted: colors.border,
  };
  void accentColors[accent];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }, style]}>
      {/* `accent` / `showAccentLine` / `showCornerMark` kept for API compatibility; the new look uses plain rounded surfaces. */}
      <View style={[styles.content, { padding }]}>{children}</View>
    </View>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────

export function SectionCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface }, style]}>
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
    <View style={[styles.statCard, { backgroundColor: colors.surfaceRaised }, style]}>
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
    flexDirection: 'row', borderRadius: radius['2xl'], overflow: 'hidden',
    shadowColor: '#6B4E2B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 2,
  },
  content: { flex: 1 },
  sectionCard: { borderRadius: radius['2xl'], overflow: 'hidden' },
  statCard: {
    borderRadius: radius.xl, padding: spacing[4], gap: spacing[1],
    shadowColor: '#6B4E2B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 1,
  },
  statLabel: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.4 },
  statValue: { fontSize: typography.size['2xl'], fontWeight: typography.weight.black, letterSpacing: typography.tracking.tight },
  statUnit: { fontSize: typography.size.xs },
});
