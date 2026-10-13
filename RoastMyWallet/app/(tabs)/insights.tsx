import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Path, Circle, Text as SvgText, G, Line, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useAuthStore, selectProfile } from '@/store/authStore';
import { spacing } from '@/theme/tokens';
import { FlameIcon, ShieldIcon, ChartIcon, WalletIcon } from '@/components/icons/RmwIcons';
import { formatCurrency, formatPercent, formatCategoryName } from '@/utils/formatting';
import { calculateAvoidedSpending, calculateImpulseRate } from '@/utils/scoring';
import type { PurchaseCategory } from '@/types';

const { width: W } = Dimensions.get('window');
const CHART_W = W - 64;
const CHART_H = 140;

export default function InsightsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { purchases } = usePurchaseStore();
  const profile = useAuthStore(selectProfile);
  const currency = profile?.currency ?? 'THB';

  const stats = useMemo(() => {
    const decided   = purchases.filter(p => p.status === 'bought' || p.status === 'avoided');
    const avoided   = purchases.filter(p => p.status === 'avoided' || p.status === 'expired');
    const bought    = purchases.filter(p => p.status === 'bought');
    const totalAvo  = calculateAvoidedSpending(purchases);
    const totalSp   = bought.reduce((s, p) => s + p.price, 0);
    const impulse   = calculateImpulseRate(purchases);

    const catMap = purchases.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topCats = Object.entries(catMap).sort(([,a],[,b]) => b-a).slice(0, 4);

    // Monthly avoided (last 6 months)
    const monthly: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthly[`${d.getMonth()}/${d.getFullYear()}`] = 0;
    }
    avoided.forEach(p => {
      if (!p.createdAt) return;
      const d = new Date(p.createdAt);
      const k = `${d.getMonth()}/${d.getFullYear()}`;
      if (k in monthly) monthly[k] = (monthly[k] ?? 0) + p.price;
    });
    const monthlyData = Object.entries(monthly).map(([k, v]) => {
      const [m] = k.split('/');
      const months = ['ม.ค','ก.พ','มี.ค','เม.ย','พ.ค','มิ.ย','ก.ค','ส.ค','ก.ย','ต.ค','พ.ย','ธ.ค'];
      return { label: months[parseInt(m)], value: v };
    });

    return { totalAvo, totalSp, impulse, topCats, decided, avoided, bought, monthlyData };
  }, [purchases]);

  const maxBar = Math.max(...stats.monthlyData.map(d => d.value), 1);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
      >
        {/* Header */}
        <LinearGradient
          colors={isDark ? ['#0D1F35', colors.background] : ['#1B3557', colors.background]}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <Text style={styles.headerTitle}>วิเคราะห์การใช้จ่าย</Text>
          <Text style={styles.headerSub}>ทุกตัวเลขที่คุณบันทึกไว้</Text>
        </LinearGradient>

        <View style={[styles.content, { paddingHorizontal: 16 }]}>
          {/* Hero stat */}
          <LinearGradient colors={['#1B3557', '#2F6293']} style={styles.heroStat} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.heroStatInner}>
              <View>
                <Text style={styles.heroStatLabel}>ประหยัดได้ทั้งหมด</Text>
                <Text style={styles.heroStatValue}>{formatCurrency(stats.totalAvo, currency)}</Text>
                <Text style={styles.heroStatSub}>จาก {stats.avoided.length} รายการที่ไม่ซื้อ</Text>
              </View>
              <WalletIcon size={40} color="rgba(255,255,255,0.3)" />
            </View>
          </LinearGradient>

          {/* 4-stat grid */}
          <View style={styles.grid}>
            {[
              { label: 'ซื้อไปแล้ว',    value: formatCurrency(stats.totalSp, currency, { compact: true }), icon: <WalletIcon size={16} color="#D46060" />, accent: '#D46060' },
              { label: 'อัตราหุนหัน',   value: formatPercent(stats.impulse),  icon: <FlameIcon size={16} color="#E8A030" />, accent: '#E8A030' },
              { label: 'ตัดสินใจแล้ว', value: String(stats.decided.length),   icon: <CheckIcon size={16} color="#52B57D" />, accent: '#52B57D' },
              { label: 'รอดู',          value: String(purchases.filter(p=>p.status==='waiting').length), icon: <ClockIcon size={16} color="#5A96C3" />, accent: '#5A96C3' },
            ].map((s, i) => (
              <View key={i} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.statIcon, { backgroundColor: s.accent + '18' }]}>{s.icon}</View>
                <Text style={[styles.statCardValue, { color: colors.textPrimary }]}>{s.value}</Text>
                <Text style={[styles.statCardLabel, { color: colors.textMuted }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Monthly bar chart */}
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>ประหยัดได้รายเดือน</Text>
            <Svg width={CHART_W} height={CHART_H + 28} style={{ marginTop: 12 }}>
              <Defs>
                <SvgGrad id="bar" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#5A96C3" stopOpacity="0.9" />
                  <Stop offset="1" stopColor="#1B3557" stopOpacity="0.4" />
                </SvgGrad>
              </Defs>
              {stats.monthlyData.map((d, i) => {
                const barH = maxBar > 0 ? (d.value / maxBar) * CHART_H : 4;
                const x = i * (CHART_W / 6) + 8;
                const bw = CHART_W / 6 - 16;
                return (
                  <G key={i}>
                    <Rect x={x} y={CHART_H - barH} width={bw} height={Math.max(barH, 4)} rx="5" fill={barH > 4 ? 'url(#bar)' : isDark ? '#252B35' : '#E8E5DF'} />
                    <SvgText x={x + bw / 2} y={CHART_H + 18} fontSize="9" fill={isDark ? '#50555F' : '#A8A59E'} textAnchor="middle">{d.label}</SvgText>
                  </G>
                );
              })}
              <Line x1="0" y1={CHART_H} x2={CHART_W} y2={CHART_H} stroke={isDark ? '#252B35' : '#E8E5DF'} strokeWidth="1" />
            </Svg>
          </View>

          {/* Top categories */}
          {stats.topCats.length > 0 && (
            <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>หมวดหมู่ที่ซื้อบ่อย</Text>
              <View style={{ gap: 12, marginTop: 12 }}>
                {stats.topCats.map(([cat, count], i) => {
                  const pct = count / purchases.length;
                  return (
                    <View key={cat} style={{ gap: 5 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={[styles.catLabel, { color: colors.textSecondary }]}>
                          {formatCategoryName(cat as PurchaseCategory)}
                        </Text>
                        <Text style={[styles.catCount, { color: colors.textPrimary }]}>{count} รายการ</Text>
                      </View>
                      <View style={[styles.barBg, { backgroundColor: colors.skeleton }]}>
                        <LinearGradient
                          colors={['#5A96C3', '#1B3557']}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={[styles.barFill, { width: `${pct * 100}%` }]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Empty state */}
          {purchases.length === 0 && (
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <ChartIcon size={40} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>ยังไม่มีข้อมูล</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>เพิ่มรายการใน Waiting List เพื่อเริ่มต้นวิเคราะห์</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Helper components
function CheckIcon({ size = 16, color = '#52B57D' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M5 12L10 17L19 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}
function ClockIcon({ size = 16, color = '#5A96C3' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" /><Path d="M12 7V12L15 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" /></Svg>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { gap: 0 },
  header: { paddingBottom: 20, paddingHorizontal: 20, gap: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.8 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  content: { gap: 12, paddingTop: 16 },
  heroStat: { borderRadius: 20, padding: 20 },
  heroStatInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginBottom: 4 },
  heroStatValue: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1.5 },
  heroStatSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: (W - 46) / 2, borderRadius: 16, padding: 14,
    borderWidth: 1, gap: 6,
  },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statCardValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statCardLabel: { fontSize: 12 },
  chartCard: { borderRadius: 20, padding: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  catLabel: { fontSize: 13 },
  catCount: { fontSize: 13, fontWeight: '600' },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  empty: { alignItems: 'center', gap: 10, padding: 40, borderWidth: 1.5, borderRadius: 20, borderStyle: 'dashed' },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
