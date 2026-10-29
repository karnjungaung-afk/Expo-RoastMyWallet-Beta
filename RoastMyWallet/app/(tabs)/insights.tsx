import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
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
  const desktop = windowWidth >= 900;
  const contentWidth = Math.min(windowWidth - (windowWidth >= 768 ? 64 : 32), 1060);
  const [period, setPeriod] = useState<3 | 6>(6);

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
      totalCount: purchases.length,
    };
  }, [purchases]);

  const visibleMonths = stats.monthly.slice(-period);
  const maxBar = Math.max(...visibleMonths.map(m => m.value), 1);
  const card = colors.surface;
  const subtle = colors.backgroundSubtle;
  const border = colors.borderSubtle;
  const muted = colors.textMuted;
  const primary = colors.textPrimary;
  const showEmpty = stats.totalCount === 0 && loadingState !== 'loading';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 92 }}>
        <View style={[styles.page, { width: contentWidth, paddingTop: insets.top + 20 }]}>
          <View style={styles.pageHeader}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.overline, { color: colors.textSecondary }]}>ภาพรวมการเงิน</Text>
              <Text style={[styles.pageTitle, { color: primary }]}>วิเคราะห์การใช้จ่าย</Text>
              <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>ดูรูปแบบการตัดสินใจซื้อและเงินที่คุณเลือกเก็บไว้</Text>
            </View>
            <View style={[styles.currencyPill, { backgroundColor: subtle, borderColor: colors.border }]}>
              <WalletIcon size={15} color={colors.primary} />
              <Text style={[styles.currencyText, { color: colors.textSecondary }]}>{currency}</Text>
            </View>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: card, borderColor: colors.border }]}>
            <View style={styles.summaryTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>เงินที่เลือกไม่ใช้จ่าย</Text>
                <Text style={[styles.summaryValue, { color: primary }]} adjustsFontSizeToFit numberOfLines={1}>{formatCurrency(stats.totalAvoided, currency)}</Text>
                <Text style={[styles.summaryNote, { color: muted }]}>จากรายการที่เลือกไม่ซื้อหรือหมดช่วงรอซื้อ</Text>
              </View>
              <View style={[styles.summaryIcon, { backgroundColor: colors.successSubtle }]}>
                <WalletIcon size={22} color={colors.success} />
              </View>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.summaryFoot}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryFootLabel, { color: muted }]}>รายการที่หลีกเลี่ยง</Text>
                <Text style={[styles.summaryFootValue, { color: primary }]}>{stats.avoidedCount} รายการ</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryFootLabel, { color: muted }]}>ซื้อไปแล้ว</Text>
                <Text style={[styles.summaryFootValue, { color: primary }]}>{formatCurrency(stats.totalSpent, currency, { compact: true })}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.metricGrid, desktop && styles.metricGridDesktop]}>
            <Metric label="อัตราซื้อหุนหัน" value={formatPercent(stats.impulse)} note="จากรายการที่ตัดสินใจแล้ว" accent={colors.warning} icon={<FlameIcon size={17} color={colors.warning} />} card={card} border={colors.border} primary={primary} muted={muted} />
            <Metric label="ตัดสินใจแล้ว" value={String(stats.decidedCount)} note="ซื้อหรือเลือกไม่ซื้อ" accent={colors.success} icon={<CheckMark color={colors.success} />} card={card} border={colors.border} primary={primary} muted={muted} />
            <Metric label="รอตัดสินใจ" value={String(stats.waitingCount)} note="รายการใน Waiting List" accent={colors.primary} icon={<ClockMark color={colors.primary} />} card={card} border={colors.border} primary={primary} muted={muted} />
            <Metric label="รายการทั้งหมด" value={String(stats.totalCount)} note="ข้อมูลที่บันทึกไว้" accent={colors.textSecondary} icon={<ChartIcon size={17} color={colors.textSecondary} />} card={card} border={colors.border} primary={primary} muted={muted} />
          </View>

          <View style={[styles.bodyGrid, desktop && styles.bodyGridDesktop]}>
            <View style={[styles.panel, { backgroundColor: card, borderColor: colors.border }, desktop && styles.trendPanel]}>
              <View style={styles.panelHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.panelTitle, { color: primary }]}>แนวโน้มเงินที่หลีกเลี่ยงได้</Text>
                  <Text style={[styles.panelSubtitle, { color: muted }]}>รวมมูลค่ารายเดือนจากรายการที่ไม่ซื้อ</Text>
                </View>
                <View style={[styles.panelIcon, { backgroundColor: subtle }]}>
                  <ChartIcon size={18} color={colors.primary} />
                </View>
              </View>
              <View style={[styles.periodSwitch, { backgroundColor: subtle }]}>
                {([3, 6] as const).map(value => (
                  <TouchableOpacity key={value} onPress={() => setPeriod(value)} accessibilityRole="button" accessibilityState={{ selected: period === value }} style={[styles.periodOption, period === value && { backgroundColor: colors.primary }]}>
                    <Text style={[styles.periodOptionText, { color: period === value ? colors.primaryText : colors.textSecondary }]}>{value} เดือน</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.chartWrap}>
                <Svg width="100%" height={190} viewBox={`0 0 600 190`} preserveAspectRatio="none">
                  {[0, 1, 2, 3].map(i => {
                    const y = 20 + i * 42;
                    return <Line key={i} x1="10" y1={y} x2="590" y2={y} stroke={colors.divider} strokeWidth="1" strokeDasharray="3 5" />;
                  })}
                  {visibleMonths.map((item, index) => {
                    const slot = 580 / visibleMonths.length;
                    const barWidth = Math.min(44, slot * 0.48);
                    const height = item.value > 0 ? Math.max(5, (item.value / maxBar) * 118) : 3;
                    const x = 10 + index * slot + (slot - barWidth) / 2;
                    return (
                      <G key={`${item.year}-${item.month}`}>
                        <Rect x={x} y={148 - height} width={barWidth} height={height} rx="5" fill={item.value > 0 ? colors.primary : colors.border} opacity={item.value > 0 ? 0.92 : 0.6} />
                        <SvgText x={x + barWidth / 2} y={174} fontSize="12" fill={colors.textSecondary} textAnchor="middle">{item.label}</SvgText>
                      </G>
                    );
                  })}
                  <Line x1="10" y1="149" x2="590" y2="149" stroke={colors.border} strokeWidth="1" />
                </Svg>
              </View>
              <View style={[styles.chartFooter, { borderTopColor: colors.divider }]}>
                <Text style={[styles.chartFooterLabel, { color: muted }]}>รวมช่วงที่เลือก</Text>
                <Text style={[styles.chartFooterValue, { color: primary }]}>{formatCurrency(visibleMonths.reduce((sum, month) => sum + month.value, 0), currency)}</Text>
              </View>
              <Text style={[styles.chartFootnote, { color: muted }]}>กราฟอ้างอิงวันที่สร้างรายการ ไม่ใช่วันที่ตัดสินใจ จึงใช้ดูแนวโน้มโดยประมาณ</Text>
            </View>

            <View style={[styles.panel, { backgroundColor: card, borderColor: colors.border }, desktop && styles.categoryPanel]}>
              <View style={styles.panelHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.panelTitle, { color: primary }]}>หมวดหมู่ที่สนใจ</Text>
                  <Text style={[styles.panelSubtitle, { color: muted }]}>เรียงตามจำนวนรายการที่บันทึก</Text>
                </View>
                <View style={[styles.panelIcon, { backgroundColor: subtle }]}>
                  <FlameIcon size={18} color={colors.primary} />
                </View>
              </View>
              {stats.categories.length > 0 ? (
                <View style={styles.categoryList}>
                  {stats.categories.map(([category, count], index) => {
                    const percentage = stats.totalCount ? Math.round((count / stats.totalCount) * 100) : 0;
                    const accents = [colors.primary, colors.success, colors.warning, colors.mecha, colors.danger];
                    const accent = accents[index % accents.length];
                    return (
                      <View key={category} style={styles.categoryItem}>
                        <View style={styles.categoryRow}>
                          <View style={[styles.categoryDot, { backgroundColor: accent }]} />
                          <Text style={[styles.categoryName, { color: colors.textSecondary }]} numberOfLines={1}>{formatCategoryName(category as PurchaseCategory)}</Text>
                          <Text style={[styles.categoryCount, { color: primary }]}>{count}</Text>
                        </View>
                        <View style={[styles.progressTrack, { backgroundColor: subtle }]}>
                          <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: accent }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.inlineEmpty}>
                  <Text style={[styles.inlineEmptyTitle, { color: primary }]}>ยังไม่มีข้อมูลหมวดหมู่</Text>
                  <Text style={[styles.inlineEmptyText, { color: muted }]}>เมื่อเพิ่มรายการ หมวดหมู่ที่คุณสนใจจะปรากฏตรงนี้</Text>
                </View>
              )}
              <View style={[styles.categoryFooter, { borderTopColor: colors.divider }]}>
                <Text style={[styles.chartFootnote, { color: muted }]}>เปอร์เซ็นต์เทียบกับรายการทั้งหมดที่บันทึก</Text>
              </View>
            </View>
          </View>

          <View style={[styles.explainCard, { backgroundColor: subtle, borderColor: colors.border }]}>
            <View style={[styles.explainIcon, { backgroundColor: card }]}>
              <FlameIcon size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={[styles.explainTitle, { color: primary }]}>อ่านตัวเลขอย่างไร</Text>
              <Text style={[styles.explainText, { color: colors.textSecondary }]}>“เงินที่เลือกไม่ใช้จ่าย” เป็นมูลค่าของรายการที่ทำเครื่องหมายว่าไม่ซื้อหรือหมดช่วงรอซื้อ ไม่ใช่ยอดเงินในบัญชีจริง ส่วน “อัตราซื้อหุนหัน” คำนวณจากรายการที่ระบบจัดว่าเป็นการซื้อหุนหัน</Text>
            </View>
          </View>

          {showEmpty ? (
            <View style={[styles.emptyCard, { backgroundColor: card, borderColor: colors.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: subtle }]}>
                <ChartIcon size={25} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: primary }]}>เริ่มจากบันทึกรายการแรก</Text>
              <Text style={[styles.emptyText, { color: muted }]}>เมื่อมีรายการและผลการตัดสินใจ ข้อมูลสรุปและกราฟจะช่วยให้เห็นรูปแบบการใช้จ่ายของคุณ</Text>
            </View>
          ) : null}
          {loadingState === 'loading' ? <Text style={[styles.loadingText, { color: muted }]}>กำลังโหลดข้อมูลล่าสุด…</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}

function Metric({ label, value, note, accent, icon, card, border, primary, muted }: any) {
  return (
    <View style={[styles.metricCard, { backgroundColor: card, borderColor: border }]}>
      <View style={[styles.metricIcon, { backgroundColor: accent + '18' }]}>{icon}</View>
      <Text style={[styles.metricValue, { color: primary }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[styles.metricLabel, { color: primary }]}>{label}</Text>
      <Text style={[styles.metricNote, { color: muted }]} numberOfLines={2}>{note}</Text>
    </View>
  );
}

function CheckMark({ color }: { color: string }) {
  return <Svg width={17} height={17} viewBox="0 0 24 24"><Line x1="4" y1="12" x2="9" y2="17" stroke={color} strokeWidth="2.5" strokeLinecap="round" /><Line x1="9" y1="17" x2="20" y2="6" stroke={color} strokeWidth="2.5" strokeLinecap="round" /></Svg>;
}
function ClockMark({ color }: { color: string }) {
  return <Svg width={17} height={17} viewBox="0 0 24 24" fill="none"><Rect x="3" y="3" width="18" height="18" rx="9" stroke={color} strokeWidth="2" fill="none" /><Line x1="12" y1="7" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" /><Line x1="12" y1="12" x2="16" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" /></Svg>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: { alignSelf: 'center', gap: 16, paddingHorizontal: 0 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 },
  overline: { fontSize: 12, fontWeight: '700', marginBottom: 5, letterSpacing: 0.2 },
  pageTitle: { fontSize: 27, lineHeight: 34, fontWeight: '800', letterSpacing: -0.7 },
  pageSubtitle: { fontSize: 13, lineHeight: 19, marginTop: 5, maxWidth: 600 },
  currencyPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  currencyText: { fontSize: 12, fontWeight: '700' },
  summaryCard: { borderWidth: 1, borderRadius: 16, padding: 20, gap: 15 },
  summaryTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  summaryLabel: { fontSize: 13, fontWeight: '600' },
  summaryValue: { fontSize: 34, lineHeight: 42, fontWeight: '800', letterSpacing: -0.8, marginTop: 7, maxWidth: '100%' },
  summaryNote: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  summaryIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryDivider: { height: 1 },
  summaryFoot: { flexDirection: 'row', gap: 20 },
  summaryFootLabel: { fontSize: 11, marginBottom: 4 },
  summaryFootValue: { fontSize: 15, fontWeight: '800' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricGridDesktop: { flexWrap: 'nowrap' },
  metricCard: { flexBasis: '48%', flexGrow: 1, minWidth: 125, borderWidth: 1, borderRadius: 14, padding: 14, gap: 5, minHeight: 132 },
  metricIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  metricValue: { fontSize: 21, lineHeight: 27, fontWeight: '800', letterSpacing: -0.4 },
  metricLabel: { fontSize: 12, fontWeight: '700' },
  metricNote: { fontSize: 10, lineHeight: 15 },
  bodyGrid: { gap: 14 },
  bodyGridDesktop: { flexDirection: 'row', alignItems: 'stretch' },
  panel: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 14, minWidth: 0 },
  trendPanel: { flex: 1.35 },
  categoryPanel: { flex: 1, minWidth: 285 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  panelTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  panelSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  panelIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  periodSwitch: { flexDirection: 'row', alignSelf: 'flex-start', padding: 3, borderRadius: 10, gap: 3 },
  periodOption: { minWidth: 72, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 7 },
  periodOptionText: { fontSize: 11, fontWeight: '700' },
  chartWrap: { width: '100%', marginTop: 2 },
  chartFooter: { borderTopWidth: 1, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chartFooterLabel: { fontSize: 11 },
  chartFooterValue: { fontSize: 14, fontWeight: '800' },
  chartFootnote: { fontSize: 10, lineHeight: 15 },
  categoryList: { gap: 18, paddingTop: 7 },
  categoryItem: { gap: 8 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryName: { flex: 1, fontSize: 12, fontWeight: '600' },
  categoryCount: { fontSize: 12, fontWeight: '800', minWidth: 18, textAlign: 'right' },
  progressTrack: { height: 6, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 4 },
  categoryFooter: { borderTopWidth: 1, paddingTop: 12, marginTop: 'auto' },
  inlineEmpty: { paddingVertical: 24, gap: 8 },
  inlineEmptyTitle: { fontSize: 13, fontWeight: '700' },
  inlineEmptyText: { fontSize: 12, lineHeight: 18 },
  explainCard: { borderWidth: 1, borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  explainIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  explainTitle: { fontSize: 13, fontWeight: '800' },
  explainText: { fontSize: 11, lineHeight: 18 },
  emptyCard: { alignItems: 'center', padding: 26, borderRadius: 16, borderWidth: 1, gap: 10 },
  emptyIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptyText: { fontSize: 12, lineHeight: 19, textAlign: 'center', maxWidth: 520 },
  loadingText: { fontSize: 12, textAlign: 'center', paddingVertical: 8 },
});
