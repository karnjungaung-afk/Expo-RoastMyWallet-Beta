import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { blockPalette, radius, shadows } from '@/theme/tokens';
import { PlatformTile } from '@/components/icons/PlatformIcons';
import { ClockIcon, ShieldIcon, FlameIcon, CheckIcon } from '@/components/icons/RmwIcons';
import { formatCurrency, formatCountdown, formatCategoryName } from '@/utils/formatting';
import type { Purchase, ShoppingPlatform } from '@/types';

const RISK_LABEL = { high: 'เสี่ยงสูง', medium: 'ปานกลาง', low: 'เสี่ยงต่ำ' } as const;

/** Stable colour per category so the same category always gets the same block colour. */
function categoryIndex(category: string): number {
  let h = 0;
  for (let i = 0; i < category.length; i++) h = (h * 31 + category.charCodeAt(i)) >>> 0;
  return h % 7;
}

export function PurchaseCard({ purchase, onPress }: { purchase: Purchase; onPress?: () => void }) {
  const { colors } = useTheme();
  const router = useRouter();

  const risk = purchase.impulseRisk ?? 'medium';
  const riskColor = { high: colors.riskHigh, medium: colors.riskMedium, low: colors.riskLow }[risk];
  const riskSubtle = { high: colors.riskHighSubtle, medium: colors.riskMediumSubtle, low: colors.riskLowSubtle }[risk];
  const isWait = purchase.status === 'waiting';
  const plat = purchase.platform as ShoppingPlatform | undefined;
  const tone = blockPalette(colors)[categoryIndex(purchase.category)];

  const progress = useMemo(() => {
    if (!purchase.waitingUntil || !purchase.createdAt) return 0;
    const total = new Date(purchase.waitingUntil).getTime() - new Date(purchase.createdAt).getTime();
    const rem = new Date(purchase.waitingUntil).getTime() - Date.now();
    return Math.max(0, Math.min(1, rem / total));
  }, [purchase.waitingUntil, purchase.createdAt]);

  const isReady = isWait && progress === 0;
  const pct = isReady ? 100 : (1 - progress) * 100;
  const handle = () => (onPress ? onPress() : router.push(`/purchase/${purchase.id}`));
  const RiskIcon = risk === 'high' ? FlameIcon : risk === 'low' ? ShieldIcon : ClockIcon;

  return (
    <TouchableOpacity onPress={handle} activeOpacity={0.88} accessibilityRole="button">
      <View style={[styles.card, shadows.sm, { backgroundColor: colors.surface }]}>
        {/* Colour block with platform / initial */}
        <View style={[styles.colorBlock, { backgroundColor: tone.bg }]}>
          {plat && plat !== 'unknown' ? (
            <PlatformTile platform={plat} size={40} />
          ) : (
            <Text style={[styles.catLetter, { color: tone.fg }]}>
              {formatCategoryName(purchase.category).charAt(0)}
            </Text>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{purchase.productName}</Text>
            <Text style={[styles.price, { color: colors.textPrimary }]}>{formatCurrency(purchase.price, purchase.currency)}</Text>
          </View>

          <Text style={[styles.cat, { color: colors.textMuted }]}>{formatCategoryName(purchase.category)}</Text>

          {purchase.aiRoast && isWait && (
            <Text style={[styles.roast, { color: colors.textSecondary }]} numberOfLines={1}>“{purchase.aiRoast}”</Text>
          )}

          {isWait ? (
            <View style={styles.timerBlock}>
              <View style={[styles.timerBg, { backgroundColor: colors.backgroundSubtle }]}>
                <View style={[styles.timerFill, { width: `${pct}%`, backgroundColor: isReady ? colors.success : riskColor }]} />
              </View>
              <View style={styles.timerRow}>
                <View style={[styles.riskPill, { backgroundColor: riskSubtle }]}>
                  <RiskIcon size={11} color={riskColor} />
                  <Text style={[styles.riskTxt, { color: riskColor }]}>{RISK_LABEL[risk]}</Text>
                </View>
                <View style={styles.countdownRow}>
                  {isReady ? (
                    <>
                      <CheckIcon size={11} color={colors.success} />
                      <Text style={[styles.countdownTxt, { color: colors.success, fontWeight: '800' }]}>พร้อมตัดสินใจ</Text>
                    </>
                  ) : (
                    <>
                      <ClockIcon size={11} color={colors.textMuted} />
                      <Text style={[styles.countdownTxt, { color: colors.textMuted }]}>{formatCountdown(purchase.waitingUntil)}</Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.decidedRow}>
              {purchase.status === 'avoided' ? (
                <>
                  <CheckIcon size={13} color={colors.success} />
                  <Text style={[styles.decidedTxt, { color: colors.success }]}>ไม่ซื้อแล้ว — ประหยัด {formatCurrency(purchase.price, purchase.currency)}</Text>
                </>
              ) : purchase.status === 'bought' ? (
                <>
                  <FlameIcon size={13} color={colors.danger} />
                  <Text style={[styles.decidedTxt, { color: colors.danger }]}>ซื้อไปแล้ว</Text>
                </>
              ) : (
                <Text style={[styles.decidedTxt, { color: colors.textMuted }]}>หมดเวลา</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius['2xl'], flexDirection: 'row', padding: 10, gap: 12 },
  colorBlock: { width: 72, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', minHeight: 72 },
  catLetter: { fontSize: 26, fontWeight: '900' },
  body: { flex: 1, paddingVertical: 4, paddingRight: 6, gap: 5 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  price: { fontSize: 15, fontWeight: '900', letterSpacing: -0.4 },
  cat: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  roast: { fontSize: 11, lineHeight: 16, fontStyle: 'italic' },
  timerBlock: { gap: 7, marginTop: 3 },
  timerBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  timerFill: { height: 8, borderRadius: 4 },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  riskPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, height: 22, borderRadius: 11 },
  riskTxt: { fontSize: 10, fontWeight: '800' },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countdownTxt: { fontSize: 11, fontWeight: '600' },
  decidedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  decidedTxt: { fontSize: 12, fontWeight: '700' },
});
