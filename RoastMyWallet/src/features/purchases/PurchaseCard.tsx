import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ClockIcon, ShieldIcon, FlameIcon, CheckIcon } from '@/components/icons/RmwIcons';
import { PLATFORM_META } from '@/features/intercept/InterceptService';
import { spacing } from '@/theme/tokens';
import { formatCurrency, formatCountdown, formatCategoryName, truncate } from '@/utils/formatting';
import type { Purchase, ShoppingPlatform } from '@/types';

const RISK_CONFIG = {
  high:   { color: '#D46060', label: 'เสี่ยงสูง',   icon: (c: string) => <FlameIcon size={11} color={c} /> },
  medium: { color: '#E8A030', label: 'เสี่ยงปานกลาง', icon: (c: string) => <ClockIcon size={11} color={c} /> },
  low:    { color: '#52B57D', label: 'เสี่ยงต่ำ',    icon: (c: string) => <ShieldIcon size={11} color={c} /> },
};

export const PurchaseCard = React.memo(function PurchaseCard({ purchase, onPress }: { purchase: Purchase; onPress?: () => void }) {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const risk      = purchase.impulseRisk ?? 'medium';
  const isWaiting = purchase.status === 'waiting';
  const cfg       = RISK_CONFIG[risk];
  const platform  = purchase.platform as ShoppingPlatform | undefined;
  const platMeta  = platform ? PLATFORM_META[platform] : null;

  const progressValue = React.useMemo(() => {
    if (!purchase.waitingUntil || !purchase.createdAt) return 0;
    const total     = new Date(purchase.waitingUntil).getTime() - new Date(purchase.createdAt).getTime();
    const remaining = new Date(purchase.waitingUntil).getTime() - Date.now();
    return Math.max(0, Math.min(1, remaining / total));
  }, [purchase.waitingUntil, purchase.createdAt]);

  const isReady   = isWaiting && progressValue === 0;
  const countdown = formatCountdown(purchase.waitingUntil);

  const handlePress = () => onPress ? onPress() : router.push(`/purchase/${purchase.id}`);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.82} accessibilityRole="button">
      <View style={[
        styles.card,
        { backgroundColor: isDark ? '#141927' : '#FFFFFF', borderColor: isDark ? '#1E2A3A' : '#EBEBEB' },
        isReady && styles.cardReady,
        isReady && { borderColor: '#52B57D' + '50' },
      ]}>
        {/* Left risk accent bar */}
        <View style={[styles.accentBar, { backgroundColor: cfg.color }]} />

        <View style={styles.body}>
          {/* Top row: name + price */}
          <View style={styles.topRow}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
              {truncate(purchase.productName, 34)}
            </Text>
            <Text style={[styles.price, { color: colors.textPrimary }]}>
              {formatCurrency(purchase.price, purchase.currency)}
            </Text>
          </View>

          {/* Category + platform */}
          <View style={styles.metaRow}>
            <Text style={[styles.category, { color: colors.textMuted }]}>
              {formatCategoryName(purchase.category)}
            </Text>
            {platMeta && (
              <View style={[styles.platformPill, { backgroundColor: platMeta.color + '15', borderColor: platMeta.color + '30' }]}>
                <View style={[styles.platDot, { backgroundColor: platMeta.color }]} />
                <Text style={[styles.platName, { color: platMeta.color }]}>{platMeta.name}</Text>
              </View>
            )}
          </View>

          {/* AI roast */}
          {purchase.aiRoast && isWaiting && (
            <View style={[styles.roastWrap, { backgroundColor: isDark ? '#1E2A3A' : '#F4F6F9' }]}>
              <Text style={[styles.roast, { color: colors.textSecondary }]} numberOfLines={2}>
                {purchase.aiRoast}
              </Text>
            </View>
          )}

          {/* Countdown / status */}
          {isWaiting ? (
            <View style={styles.countdownRow}>
              <TimerBar progress={progressValue} isReady={isReady} riskColor={cfg.color} />
              <View style={styles.countdownMeta}>
                {isReady
                  ? <><CheckIcon size={11} color="#52B57D" /><Text style={[styles.countdownText, { color: '#52B57D' }]}>พร้อมตัดสินใจ</Text></>
                  : <><ClockIcon size={11} color={colors.textMuted} /><Text style={[styles.countdownText, { color: colors.textMuted }]}>{countdown}</Text></>
                }
                <View style={[styles.riskPill, { backgroundColor: cfg.color + '15' }]}>
                  {cfg.icon(cfg.color)}
                  <Text style={[styles.riskText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.decidedRow}>
              {purchase.status === 'avoided'
                ? <><CheckIcon size={13} color="#52B57D" /><Text style={[styles.decidedText, { color: '#52B57D' }]}>ไม่ซื้อแล้ว</Text></>
                : purchase.status === 'bought'
                ? <><FlameIcon size={13} color="#D46060" /><Text style={[styles.decidedText, { color: '#D46060' }]}>ซื้อไปแล้ว</Text></>
                : <Text style={[styles.decidedText, { color: colors.textMuted }]}>หมดเวลา</Text>
              }
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

function TimerBar({ progress, isReady, riskColor }: { progress: number; isReady: boolean; riskColor: string }) {
  const { colors } = useTheme();
  const fillColor = isReady ? '#52B57D' : riskColor;
  return (
    <View style={[styles.timerBg, { backgroundColor: colors.skeleton }]}>
      <LinearGradient
        colors={[fillColor, fillColor + '88']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.timerFill, { width: `${isReady ? 100 : (1 - progress) * 100}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16, borderWidth: 1, flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardReady: { shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  accentBar: { width: 3.5 },
  body: { flex: 1, padding: 14, gap: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  price: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  category: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.6 },
  platformPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, borderWidth: 1 },
  platDot: { width: 5, height: 5, borderRadius: 3 },
  platName: { fontSize: 10, fontWeight: '700' },
  roastWrap: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  roast: { fontSize: 12, lineHeight: 17, fontStyle: 'italic' },
  countdownRow: { gap: 6 },
  timerBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  timerFill: { height: 4, borderRadius: 2 },
  countdownMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countdownText: { fontSize: 11, fontWeight: '500', marginLeft: 4 },
  riskPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  riskText: { fontSize: 10, fontWeight: '700' },
  decidedRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  decidedText: { fontSize: 12, fontWeight: '700' },
});
