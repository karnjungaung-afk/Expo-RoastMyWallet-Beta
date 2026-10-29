import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Line, Text as SvgText, G, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useAuthStore, selectProfile } from '@/store/authStore';
import { FlameIcon, ChartIcon, WalletIcon } from '@/components/icons/RmwIcons';
import { formatCurrency, formatPercent, formatCategoryName } from '@/utils/formatting';
import { calculateAvoidedSpending, calculateImpulseRate } from '@/utils/scoring';
import type { PurchaseCategory } from '@/types';

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export default function InsightsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const purchases = usePurchaseStore(state => state.purchases);
  const loadingState = usePurchaseStore(state => state.loadingState);
  const profile = useAuthStore(selectProfile);
  const currency = profile?.currency ?? 'THB';
  const wide = windowWidth >= 900;
  const contentWidth = Math.min(windowWidth - (windowWidth >= 768 ? 64 : 32), 1160);
  const chartWidth = Math.max(260, Math.min(contentWidth - 40, wide ? 700 : 640));

  const stats = useMemo(() => {
    const decided = purchases.filter(p => p.status === 'bought' || p.status === 'avoided' || p.status === 'expired');
    const avoided = purchases.filter(p => p.status === 'avoided' || p.status === 'expired');
    const bought = purchases.filter(p => p.status === 'bought');
    const totalAvoided = calculateAvoidedSpending(purchases);
    const totalSpent = bought.reduce((sum, p) => sum + (Number.isFinite(p.price) ? p.price : 0), 0);
    const impulse = calculateImpulseRate(purchases);
    const categoryMap = purchases.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const now = new Date();
    const monthly = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return { year: date.getFullYear(), month: date.getMonth(), label: MONTHS[date.getMonth()], value: 0 };
    });
    avoided.forEach(p => {
      if (!p.createdAt) return;
      const date = new Date(p.createdAt);
      const bucket = monthly.find(m => m.year === date.getFullYear() && m.month === date.getMonth());
      if (bucket) bucket.value += Number.isFinite(p.price) ? p.price : 0;
    });
    return {
      totalAvoided, totalSpent, impulse, categories, monthly,
      decidedCount: decided.length,
      waitingCount: purchases.filter(p => p.status === 'waiting').length,
      avoidedCount: avoided.length,
      boughtCount: bought.length,
    };
  }, [purchases]);

  const maxBar = Math.max(...stats.monthly.map(m => m.value), 1);
  const cardBg = isDark ? '#141B27' : '#FFFFFF';
  const border = isDark ? '#263448' : '#E5EAF1';
  const muted = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = colors.textPrimary;
  const showEmpty = purchases.length === 0 && loadingState !== 'loading';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 96 }]}
        refreshControl={undefined}
      >
        <LinearGradient
          colors={isDark ? ['#0B1728', '#101827'] : ['#EAF3FF', '#F5F8FD']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 22 }]}
        >
          <View style={[styles.headerInner, { width: contentWidth }]}>
            <View style={styles.eyebrow}>
              <View style={styles.eyebrowDot} />
              <Text style={[styles.eyebrowText, { color: isDark ? '#91BDF6' : '#2864AE' }]}>YOUR MONEY, MADE CLEAR</Text>
            </View>
            <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : '#12233B' }]}>วิเคราะห์การใช้จ่าย</Text>
            <Text style={[styles.headerSub, { color: isDark ? '#A8B7CA' : '#64748B' }]}>
              มองเห็นพฤติกรรมการซื้อ และเงินที่คุณเลือกเก็บไว้
            </Text>
            <View style={styles.periodPill}>
              <Text style={styles.periodPillText}>ภาพรวมข้อมูลที่บันทึกไว้</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.content, { width: contentWidth }]}>
          <LinearGradient
            colors={isDark ? ['#173B64', '#205B91', '#1D4774'] : ['#1457A6', '#2878D4', '#3A8CE7']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}><WalletIcon size={21} color="#FFFFFF" /></View>
              <Text style={styles.heroOverline}>เงินที่คุณเลือกไม่ใช้จ่าย</Text>
            </View>
            <Text style={styles.heroValue} adjustsFontSizeToFit numberOfLines={1}>{formatCurrency(stats.totalAvoided, currency)}</Text>
            <Text style={styles.heroCaption}>ยอดรวมรายการที่ไม่ซื้อหรือหมดช่วงรอซื้อ</Text>
            <View style={styles.heroDivider} />
            <View style={styles.heroBottom}>
              <View>
                <Text style={styles.heroMiniLabel}>รายการที่หลีกเลี่ยง</Text>
                <Text style={styles.heroMiniValue}>{stats.avoidedCount} รายการ</Text>
              </View>
              <View style={styles.heroMiniPill}>
                <FlameIcon size={14} color="#D8EAFF" />
                <Text style={styles.heroMiniPillText}>คิดก่อนซื้อ</Text>
              </View>
            </View>
            <View pointerEvents="none" style={styles.heroOrb} />
          </LinearGradient>

          <View style={[styles.statGrid, wide && styles.statGridWide]}>
            <StatCard label="ซื้อไปแล้ว" value={formatCurrency(stats.totalSpent, currency, { compact: true })} caption={`${stats.boughtCount} รายการ`} accent="#E57B63" icon={<WalletIcon size={17} color="#E57B63" />} bg={cardBg} border={border} muted={muted} text={textPrimary} />
            <StatCard label="อัตราซื้อหุนหัน" value={formatPercent(stats.impulse)} caption="จากรายการที่ตัดสินใจแล้ว" accent="#E9A23B" icon={<FlameIcon size={17} color="#E9A23B" />} bg={cardBg} border={border} muted={muted} text={textPrimary} />
            <StatCard label="ตัดสินใจแล้ว" value={String(stats.decidedCount)} caption="ซื้อหรือเลือกไม่ซื้อ" accent="#36A879" icon={<CheckMark color="#36A879" />} bg={cardBg} border={border} muted={muted} text={textPrimary} />
            <StatCard label="กำลังรอตัดสินใจ" value={String(stats.waitingCount)} caption="รายการใน Waiting List" accent="#4B8FE2" icon={<ClockMark color="#4B8FE2" />} bg={cardBg} border={border} muted={muted} text={textPrimary} />
          </View>

          <View style={[styles.mainGrid, wide && styles.mainGridWide]}>
            <View style={[styles.panel, { backgroundColor: cardBg, borderColor: border }, wide && styles.chartPanel]}>
              <View style={styles.panelHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.panelTitle, { color: textPrimary }]}>เงินที่ประหยัดได้</Text>
                  <Text style={[styles.panelSubtitle, { color: muted }]}>ย้อนหลัง 6 เดือน · {currency}</Text>
                </View>
                <View style={[styles.panelIcon, { backgroundColor: isDark ? '#203650' : '#EAF2FE' }]}>
                  <ChartIcon size={18} color={isDark ? '#91BDF6' : '#2864AE'} />
                </View>
              </View>
              <Svg width={chartWidth} height={184} style={{ alignSelf: 'center', marginTop: 18 }}>
                <Defs>
                  <SvgGrad id="insightBar" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#4D94E8" stopOpacity="1" />
                    <Stop offset="1" stopColor="#2864AE" stopOpacity="0.62" />
                  </SvgGrad>
                </Defs>
                {[0, 1, 2, 3].map(i => {
                  const y = 12 + i * 43;
                  return <Line key={i} x1="0" y1={y} x2={chartWidth} y2={y} stroke={border} strokeWidth="1" strokeDasharray="4 5" />;
                })}
                {stats.monthly.map((item, index) => {
                  const slot = chartWidth / stats.monthly.length;
                  const barWidth = Math.min(34, slot * 0.52);
                  const height = item.value > 0 ? Math.max(5, (item.value / maxBar) * 126) : 3;
                  const x = index * slot + (slot - barWidth) / 2;
                  return (
                    <G key={`${item.year}-${item.month}`}>
                      <Rect x={x} y={142 - height} width={barWidth} height={height} rx="6" fill={item.value > 0 ? 'url(#insightBar)' : border} />
                      <SvgText x={x + barWidth / 2} y={166} fontSize="10" fill={muted} textAnchor="middle">{item.label}</SvgText>
                    </G>
                  );
                })}
                <Line x1="0" y1="143" x2={chartWidth} y2="143" stroke={border} strokeWidth="1" />
              </Svg>
              <View style={[styles.chartFooter, { borderTopColor: border }]}>
                <Text style={[styles.chartFooterLabel, { color: muted }]}>รวม 6 เดือน</Text>
                <Text style={[styles.chartFooterValue, { color: textPrimary }]}>{formatCurrency(stats.monthly.reduce((sum, m) => sum + m.value, 0), currency)}</Text>
              </View>
            </View>

            <View style={[styles.panel, { backgroundColor: cardBg, borderColor: border }, wide && styles.categoryPanel]}>
              <View style={styles.panelHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.panelTitle, { color: textPrimary }]}>หมวดหมู่ที่สนใจ</Text>
                  <Text style={[styles.panelSubtitle, { color: muted }]}>เรียงตามจำนวนรายการ</Text>
                </View>
                <View style={[styles.panelIcon, { backgroundColor: isDark ? '#24382F' : '#E9F8F0' }]}>
                  <FlameIcon size={18} color="#36A879" />
                </View>
              </View>
              {stats.categories.length > 0 ? (
                <View style={{ gap: 17, marginTop: 24 }}>
                  {stats.categories.map(([category, count], index) => {
                    const percentage = purchases.length ? Math.round((count / purchases.length) * 100) : 0;
                    const palette = ['#4D94E8', '#36A879', '#E9A23B', '#9473DB', '#E57B63'];
                    return (
                      <View key={category} style={{ gap: 8 }}>
                        <View style={styles.categoryRow}>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                            <View style={[styles.categoryDot, { backgroundColor: palette[index % palette.length] }]} />
                            <Text style={[styles.categoryName, { color: textPrimary }]} numberOfLines={1}>{formatCategoryName(category as PurchaseCategory)}</Text>
                          </View>
                          <Text style={[styles.categoryCount, { color: muted }]}>{count} รายการ</Text>
                        </View>
                        <View style={[styles.progressTrack, { backgroundColor: isDark ? '#273244' : '#EEF2F7' }]}>
                          <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: palette[index % palette.length] }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.inlineEmpty}>
                  <Text style={[styles.inlineEmptyTitle, { color: textPrimary }]}>ยังไม่มีหมวดหมู่</Text>
                  <Text style={[styles.inlineEmptyText, { color: muted }]}>เมื่อคุณเพิ่มรายการ ระบบจะแสดงหมวดหมู่ที่สนใจตรงนี้</Text>
                </View>
              )}
            </View>
          </View>

          {showEmpty ? (
            <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#203650' : '#EAF2FE' }]}>
                <ChartIcon size={26} color={isDark ? '#91BDF6' : '#2864AE'} />
              </View>
              <Text style={[styles.emptyTitle, { color: textPrimary }]}>เริ่มเห็นภาพการใช้เงินของคุณ</Text>
              <Text style={[styles.emptyText, { color: muted }]}>เพิ่มรายการใน Waiting List และบันทึกผลการตัดสินใจ เพื่อให้กราฟและสถิติสะท้อนพฤติกรรมของคุณได้แม่นยำขึ้น</Text>
            </View>
          ) : null}
          {loadingState === 'loading' ? <Text style={[styles.loadingText, { color: muted }]}>กำลังโหลดข้อมูลล่าสุด…</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, caption, accent, icon, bg, border, muted, text }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg, borderColor: border }]}>
      <View style={[styles.statCardIcon, { backgroundColor: accent + '18' }]}>{icon}</View>
      <Text style={[styles.statValue, { color: text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[styles.statLabel, { color: text }]}>{label}</Text>
      <Text style={[styles.statCaption, { color: muted }]} numberOfLines={2}>{caption}</Text>
    </View>
  );
}

function CheckMark({ color }: { color: string }) {
  return <Svg width={17} height={17} viewBox="0 0 24 24"><Line x1="4" y1="12" x2="9" y2="17" stroke={color} strokeWidth="2.5" strokeLinecap="round" /><Line x1="9" y1="17" x2="20" y2="6" stroke={color} strokeWidth="2.5" strokeLinecap="round" /></Svg>;
}
function ClockMark({ color }: { color: string }) {
  return <Svg width={17} height={17} viewBox="0 0 24 24" fill="none"><CircleMark /><Line x1="12" y1="7" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" /><Line x1="12" y1="12" x2="16" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" /></Svg>;
}
function CircleMark() { return <Rect x="3" y="3" width="18" height="18" rx="9" stroke="#4B8FE2" strokeWidth="2" fill="none" />; }

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { alignItems: 'center' },
  header: { width: '100%', paddingHorizontal: 16, paddingBottom: 30 },
  headerInner: { alignSelf: 'center', gap: 9 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  eyebrowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3987E0' },
  eyebrowText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  headerTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.9 },
  headerSub: { fontSize: 14, lineHeight: 21, maxWidth: 560 },
  periodPill: { alignSelf: 'flex-start', marginTop: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(69,137,218,0.14)' },
  periodPillText: { color: '#4387D8', fontSize: 11, fontWeight: '700' },
  content: { paddingTop: 22, paddingHorizontal: 0, gap: 16, alignSelf: 'center' },
  heroCard: { width: '100%', borderRadius: 24, padding: 24, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroOverline: { color: 'rgba(255,255,255,0.78)', fontSize: 13, fontWeight: '600' },
  heroValue: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', letterSpacing: -1, marginTop: 14, maxWidth: '100%' },
  heroCaption: { color: 'rgba(255,255,255,0.68)', fontSize: 12, marginTop: 6 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.22)', marginVertical: 18 },
  heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heroMiniLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  heroMiniValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 4 },
  heroMiniPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.13)', paddingHorizontal: 12, paddingVertical: 9 },
  heroMiniPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  heroOrb: { position: 'absolute', width: 190, height: 190, borderRadius: 95, borderWidth: 30, borderColor: 'rgba(255,255,255,0.045)', right: -68, top: -75 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statGridWide: { flexWrap: 'nowrap' },
  statCard: { flexBasis: '48%', flexGrow: 1, minWidth: 130, borderRadius: 18, padding: 16, borderWidth: 1, gap: 6, minHeight: 146 },
  statCardIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.6 },
  statLabel: { fontSize: 12, fontWeight: '700' },
  statCaption: { fontSize: 10, lineHeight: 15 },
  mainGrid: { gap: 16 },
  mainGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  panel: { borderRadius: 20, borderWidth: 1, padding: 20, overflow: 'hidden' },
  chartPanel: { flex: 1.4, minWidth: 0 },
  categoryPanel: { flex: 1, minWidth: 280 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  panelTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  panelSubtitle: { fontSize: 11, marginTop: 5 },
  panelIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chartFooter: { marginTop: 4, paddingTop: 14, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  chartFooterLabel: { fontSize: 11 },
  chartFooterValue: { fontSize: 15, fontWeight: '800' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryName: { fontSize: 12, fontWeight: '600' },
  categoryCount: { fontSize: 11 },
  progressTrack: { height: 7, borderRadius: 9, overflow: 'hidden' },
  progressFill: { height: 7, borderRadius: 9 },
  inlineEmpty: { paddingVertical: 36, gap: 8 },
  inlineEmptyTitle: { fontSize: 14, fontWeight: '700' },
  inlineEmptyText: { fontSize: 12, lineHeight: 19 },
  emptyCard: { alignItems: 'center', padding: 28, borderRadius: 20, borderWidth: 1, gap: 10 },
  emptyIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyText: { fontSize: 13, lineHeight: 21, textAlign: 'center', maxWidth: 520 },
  loadingText: { fontSize: 12, textAlign: 'center', paddingVertical: 8 },
});
