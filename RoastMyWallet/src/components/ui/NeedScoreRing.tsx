import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
  strokeWidth = 16,
  showLabel = true,
  animate = true,
}: NeedScoreRingProps) {
  const { colors } = useTheme();
  const animatedScore = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = React.useState(0);

  const center = size / 2;
  const innerRadius = center - strokeWidth - 2;
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

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

  // Five chunky pill-shaped segments (20 points each), each with its own colour.
  const SEGMENTS = 5;
  const GAP_DEG = 16;
  const SPAN = 360 / SEGMENTS - GAP_DEG;
  const segColors = [colors.blockYellow, colors.blockGreen, colors.blockPink, colors.blockSky, colors.blockPurple];
  const polar = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: center + innerRadius * Math.cos(rad), y: center + innerRadius * Math.sin(rad) };
  };
  const arc = (fromDeg: number, toDeg: number) => {
    const s0 = polar(fromDeg);
    const e0 = polar(toDeg);
    const large = toDeg - fromDeg > 180 ? 1 : 0;
    return `M ${s0.x.toFixed(2)} ${s0.y.toFixed(2)} A ${innerRadius} ${innerRadius} 0 ${large} 1 ${e0.x.toFixed(2)} ${e0.y.toFixed(2)}`;
  };
  const segments = Array.from({ length: SEGMENTS }, (_, i) => {
    const start = i * (360 / SEGMENTS) + GAP_DEG / 2;
    const frac = Math.max(0, Math.min(1, (clampedScore - i * 20) / 20));
    return { start, frac, color: segColors[i] };
  });

  return (
    <View style={[styles.container, { width: size, height: size + (showLabel ? 28 : 0) }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} accessibilityLabel={`Need score ${clampedScore} out of 100`}>
        {segments.map((seg, i) => (
          <React.Fragment key={i}>
            {/* Soft track */}
            <Path
              d={arc(seg.start, seg.start + SPAN)}
              stroke={seg.color} strokeOpacity={0.28} strokeWidth={strokeWidth}
              strokeLinecap="round" fill="none"
            />
            {/* Filled part */}
            {seg.frac > 0 && (
              <Path
                d={arc(seg.start, seg.start + SPAN * seg.frac)}
                stroke={seg.color} strokeWidth={strokeWidth}
                strokeLinecap="round" fill="none"
              />
            )}
          </React.Fragment>
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
    fontSize: typography.size['3xl'], fontWeight: typography.weight.black,
    includeFontPadding: false, letterSpacing: -1.5,
  },
  scoreMax: { fontSize: typography.size.sm, fontWeight: typography.weight.regular, marginTop: 6 },
  labelContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginTop: spacing[1.5] },
  riskDot: { width: 8, height: 8, borderRadius: 4 },
  riskLabel: { fontSize: typography.size.xs, fontWeight: typography.weight.black, letterSpacing: typography.tracking.wide },
  pill: { paddingHorizontal: spacing[2.5], paddingVertical: spacing[0.5], borderRadius: 999 },
  pillText: { fontSize: typography.size.xs, fontWeight: typography.weight.black, letterSpacing: 0.3 },
});
