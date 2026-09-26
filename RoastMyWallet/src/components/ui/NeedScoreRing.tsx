import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { typography, spacing } from '@/theme/tokens';
import type { ImpulseRisk } from '@/types';

interface NeedScoreRingProps {
  score: number;           // 0–100
  risk: ImpulseRisk;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  animate?: boolean;
}

/**
 * NeedScoreRing — circular gauge for 0–100 Need Score.
 *
 * Animation note: We animate the score number via React Native's Animated API,
 * but the SVG ring is drawn at the final value immediately. Animating SVG
 * strokeDashoffset with react-native-svg's Animated integration requires
 * createAnimatedComponent, which adds complexity. The number count-up
 * is the primary animation signal; the ring is a static visual indicator.
 *
 * To add ring animation later: use react-native-reanimated's
 * useAnimatedProps + Animated.createAnimatedComponent(Circle).
 */
export function NeedScoreRing({
  score,
  risk,
  size = 120,
  strokeWidth = 8,
  showLabel = true,
  animate = true,
}: NeedScoreRingProps) {
  const { colors } = useTheme();
  const animatedScore = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = React.useState(0);

  const center = size / 2;
  const innerRadius = center - strokeWidth - 2;
  const circumference = 2 * Math.PI * innerRadius;
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const strokeDashoffset = circumference * (1 - clampedScore / 100);

  useEffect(() => {
    if (animate) {
      animatedScore.setValue(0);
      Animated.timing(animatedScore, {
        toValue: clampedScore,
        duration: 800,
        useNativeDriver: false,
      }).start();
      const listener = animatedScore.addListener(({ value }) => {
        setDisplayScore(Math.round(value));
      });
      return () => { animatedScore.removeListener(listener); };
    } else {
      setDisplayScore(clampedScore);
    }
  }, [clampedScore, animate]);

  const riskColor = {
    high: colors.riskHigh,
    medium: colors.riskMedium,
    low: colors.riskLow,
  }[risk];

  const riskLabel = { high: 'HIGH RISK', medium: 'MED RISK', low: 'USEFUL' }[risk];

  // Tick marks at every 10 points along the ring
  const ticks = Array.from({ length: 10 }, (_, i) => {
    const angle = ((i * 36 - 90) * Math.PI) / 180;
    const isActive = (i + 1) * 10 <= clampedScore;
    const r = innerRadius + strokeWidth + 4;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle), isActive };
  });

  return (
    <View style={[styles.container, { width: size, height: size + (showLabel ? 28 : 0) }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} accessibilityLabel={`Need score ${clampedScore} out of 100`}>
        {/* Track */}
        <Circle
          cx={center} cy={center} r={innerRadius}
          stroke={colors.border} strokeWidth={strokeWidth} fill="none"
        />
        {/* Progress ring — static at final score value */}
        <G rotation="-90" origin={`${center}, ${center}`}>
          <Circle
            cx={center} cy={center} r={innerRadius}
            stroke={riskColor} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            opacity={0.9}
          />
        </G>
        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <Circle
            key={i} cx={tick.x} cy={tick.y} r={1.5}
            fill={tick.isActive ? riskColor : colors.borderSubtle}
          />
        ))}
      </Svg>

      {/* Animated score number — centered over the ring */}
      <View style={[styles.scoreOverlay, { width: size, height: size }]}>
        <Text style={[styles.scoreNumber, { color: colors.textPrimary }]}>
          {displayScore}
        </Text>
        <Text style={[styles.scoreMax, { color: colors.textMuted }]}>/100</Text>
      </View>

      {showLabel && (
        <View style={styles.labelContainer}>
          <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
          <Text style={[styles.riskLabel, { color: riskColor }]}>{riskLabel}</Text>
        </View>
      )}
    </View>
  );
}

// ─── SCORE PILL ───────────────────────────────────────────────────────────────

export function ScorePill({ score, risk }: { score: number; risk: ImpulseRisk }) {
  const { colors } = useTheme();
  const riskColor = { high: colors.riskHigh, medium: colors.riskMedium, low: colors.riskLow }[risk];
  const riskSubtle = { high: colors.riskHighSubtle, medium: colors.riskMediumSubtle, low: colors.riskLowSubtle }[risk];

  return (
    <View style={[styles.pill, { backgroundColor: riskSubtle }]}>
      <Text style={[styles.pillText, { color: riskColor }]}>{Math.round(score)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  scoreOverlay: {
    position: 'absolute', top: 0, left: 0,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 1,
  },
  scoreNumber: {
    fontSize: typography.size['2xl'], fontWeight: typography.weight.bold,
    fontFamily: 'Courier New', includeFontPadding: false, letterSpacing: -1,
  },
  scoreMax: { fontSize: typography.size.sm, fontWeight: typography.weight.regular, marginTop: 6 },
  labelContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginTop: spacing[1.5] },
  riskDot: { width: 5, height: 5, borderRadius: 2.5 },
  riskLabel: {
    fontSize: typography.size.xs, fontWeight: typography.weight.bold,
    letterSpacing: typography.tracking.wider, fontFamily: 'Courier New',
  },
  pill: { paddingHorizontal: spacing[2], paddingVertical: spacing[0.5], borderRadius: 4 },
  pillText: {
    fontSize: typography.size.xs, fontWeight: typography.weight.bold,
    fontFamily: 'Courier New', letterSpacing: 0.5,
  },
});
