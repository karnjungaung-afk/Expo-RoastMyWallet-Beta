import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Line, Circle, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useAuthStore, selectProfile } from '@/store/authStore';
import { PlatformTile, PLATFORM_NAME } from '@/components/icons/PlatformIcons';
import { ShieldIcon, FlameIcon, ClockIcon, ChartIcon } from '@/components/icons/RmwIcons';
import { formatCurrency } from '@/utils/formatting';
import type { Purchase, ShoppingPlatform } from '@/types';

// SVG text does not inherit the page font on web.
const SVG_FONT = Platform.OS === 'web' ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' : undefined;
const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const SLOTS = [
  { key: 'morning', label: 'เช้า', hint: '05–11 น.', test: (h: number) => h >= 5 && h < 11 },
  { key: 'afternoon', label: 'บ่าย', hint: '11–17 น.', test: (h: number) => h >= 11 && h < 17 },
  { key: 'evening', label: 'เย็น', hint: '17–22 น.', test: (h: number) => h >= 17 && h < 22 },
  { key: 'night', label: 'ดึก', hint: '22–05 น.', test: (h: number) => h >= 22 || h < 5 },
] as const;

type Months = 3 | 6;
const isAvoided = (p: Purchase) => p.status === 'avoided' || p.status === 'expired';
const isDecided = (p: Purchase) => isAvoided(p) || p.status === 'bought';
const price = (p: Purchase) => (Number.isFinite(p.price) ? p.price : 0);

/** Width of the container as actually laid out (never derived from the window). */
function useWidth() {
  const [w, setW] = useState(0);
  return [w, (e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width))] as const;
}

function windowStart(monthsBack: number) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1).getTime();
}

export default function InsightsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const purchases = usePurchaseStore(s => s.purchases);
  const loadingState = usePurchaseStore(s => s.loadingState);
  const loadPurchases = usePurchaseStore(s => s.loadPurchases);
  const currency = useAuthStore(selectProfile)?.currency ?? 'THB';
  const [months, setMonths] = useState<Months>(6);

  useEffect(() => { void loadPurchases(); }, [loadPurchases]);

  const d = useMemo(() => {
    const start = windowStart(months);
    const prevStart = windowStart(months * 2);
    const inWin = purchases.filter(p => p.createdAt && new Date(p.createdAt).getTime() >= start);
    const inPrev = purchases.filter(p => {
      const t = p.createdAt ? new Date(p.createdAt).getTime() : 0;
      return t >= prevStart && t < start;
    });

    const decided = inWin.filter(isDecided);
    const avoided = inWin.filter(isAvoided);
    const bought = inWin.filter(p => p.status === 'bought');
    const score = decided.length ? Math.round((avoided.length / decided.length) * 100) : null;
    const prevDecided = inPrev.filter(isDecided);
    const prevScore = prevDecided.length ? Math.round((inPrev.filter(isAvoided).length / prevDecided.length) * 100) : null;

    const now = new Date();
    const series = Array.from({ length: months }, (_, i) => {
      const dt = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      return { y: dt.getFullYear(), m: dt.getMonth(), label: MONTHS[dt.getMonth()], avoided: 0, bought: 0 };
    });
    decided.forEach(p => {
      const dt = new Date(p.createdAt);
      const b = series.find(s => s.y === dt.getFullYear() && s.m === dt.getMonth());
      if (!b) return;
      if (isAvoided(p)) b.avoided += price(p); else b.bought += price(p);
    });

    const dayCount = Array(7).fill(0) as number[];
    const slotCount = SLOTS.map(() => 0);
    inWin.forEach(p => {
      const dt = new Date(p.createdAt);
      dayCount[dt.getDay()] += 1;
      const i = SLOTS.findIndex(s => s.test(dt.getHours()));
      if (i >= 0) slotCount[i] += 1;
    });

    const platMap = new Map<string, { count: number; sum: number }>();
    inWin.forEach(p => {
      const k = p.platform && p.platform !== 'unknown' ? p.platform : 'other_website';
      const cur = platMap.get(k) ?? { count: 0, sum: 0 };
      platMap.set(k, { count: cur.count + 1, sum: cur.sum + price(p) });
    });
    const platforms = [...platMap.entries()].sort((a, b) => b[1].count - a[1].count || b[1].sum - a[1].sum).slice(0, 5);

    const topAvoided = [...avoided].sort((a, b) => price(b) - price(a)).slice(0, 3);
    return {
      total: inWin.length, decided: decided.length, avoidedN: avoided.length, boughtN: bought.length,
      avoidedSum: avoided.reduce((s, p) => s + price(p), 0), boughtSum: bought.reduce((s, p) => s + price(p), 0),
      score, delta: score !== null && prevScore !== null ? score - prevScore : null,
      series, dayCount, slotCount, platforms, topAvoided,
    };
  }, [purchases, months]);

  const empty = purchases.length === 0 && loadingState !== 'loading';
  const tier = d.score === null ? null : d.score >= 70 ? { t: 'ยอดเยี่ยม', c: colors.success } : d.score >= 50 ? { t: 'ดี', c: colors.primary } : d.score >= 30 ? { t: 'พอใช้', c: colors.warning } : { t: 'ต้องระวัง', c: colors.danger };

  const peakDay = d.dayCount.some(n => n > 0) ? d.dayCount.indexOf(Math.max(...d.dayCount)) : -1;
  const peakSlot = d.slotCount.some(n => n > 0) ? d.slotCount.indexOf(Math.max(...d.slotCount)) : -1;
  const slotTotal = d.slotCount.reduce((a, b) => a + b, 0) || 1;

  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 96, alignItems: 'center' }}>
        <View style={[styles.page, { paddingTop: insets.top + 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>วิเคราะห์</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {d.decided > 0
                  ? `ใน ${months} เดือนที่ผ่านมา คุณเลือกไม่ซื้อ ${d.avoidedN} จาก ${d.decided} รายการที่ตัดสินใจแล้ว`
                  : 'รูปแบบการตัดสินใจซื้อของคุณจะปรากฏที่นี่'}
              </Text>
            </View>
            <View style={[styles.seg, { backgroundColor: colors.backgroundSubtle }]} accessibilityRole="tablist">
              {([3, 6] as const).map(v => (
                <TouchableOpacity key={v} onPress={() => setMonths(v)} accessibilityRole="tab" accessibilityState={{ selected: months === v }}
                  style={[styles.segBtn, months === v && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.segText, { color: months === v ? '#fff' : colors.textSecondary }]}>{v} เดือน</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {empty ? (
            <View style={[...card, styles.emptyCard]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primarySubtle }]}><ChartIcon size={30} color={colors.primary} /></View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>ยังไม่มีข้อมูลให้วิเคราะห์</Text>
              <Text style={[styles.note, { color: colors.textMuted, textAlign: 'center' }]}>เพิ่มรายการที่อยากซื้อสัก 2–3 รายการ แล้วกลับมาดูรูปแบบของคุณที่นี่</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {/* 1. Discipline score */}
              <View style={[...card, styles.cell]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>คะแนนวินัยการเงิน</Text>
                <Text style={[styles.note, { color: colors.textMuted }]}>สัดส่วนรายการที่คุณเลือกไม่ซื้อ เมื่อเทียบกับที่ตัดสินใจแล้ว</Text>
                <View style={styles.scoreRow}>
                  <Gauge value={d.score} color={tier?.c ?? colors.border} track={colors.skeleton} text={colors.textPrimary} />
                  <View style={{ flex: 1, gap: 8, minWidth: 0 }}>
                    {tier ? <View style={[styles.tier, { backgroundColor: tier.c + '1F' }]}><Text style={[styles.tierText, { color: tier.c }]}>{tier.t}</Text></View> : <Text style={[styles.note, { color: colors.textMuted }]}>ยังไม่มีรายการที่ตัดสินใจ</Text>}
                    {d.delta !== null && (
                      <Text style={[styles.deltaText, { color: d.delta >= 0 ? colors.success : colors.danger }]}>
                        {d.delta === 0 ? 'เท่ากับช่วงก่อนหน้า' : `${d.delta > 0 ? '▲' : '▼'} ${Math.abs(d.delta)} จุด จากช่วงก่อนหน้า`}
                      </Text>
                    )}
                    <Text style={[styles.note, { color: colors.textMuted }]}>เลี่ยงได้ {formatCurrency(d.avoidedSum, currency, { compact: true })} · ซื้อไป {formatCurrency(d.boughtSum, currency, { compact: true })}</Text>
                  </View>
                </View>
              </View>

              {/* 2. Avoided vs bought per month */}
              <View style={[...card, styles.cell]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>เลี่ยงได้ เทียบกับ ซื้อจริง</Text>
                <Text style={[styles.note, { color: colors.textMuted }]}>มูลค่ารายเดือนของรายการที่ตัดสินใจแล้ว</Text>
                <PairBars series={d.series} colors={colors} currency={currency} />
                <View style={styles.legend}>
                  <Legend color={colors.primary} label="เลี่ยงได้" text={colors.textSecondary} />
                  <Legend color={colors.warning} label="ซื้อจริง" text={colors.textSecondary} />
                </View>
              </View>

              {/* 3. When do you want to buy */}
              <View style={[...card, styles.cell]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>ช่วงเวลาที่คุณอยากซื้อ</Text>
                <Text style={[styles.note, { color: colors.textMuted }]}>นับจากเวลาที่คุณบันทึกรายการ</Text>
                <DayBars counts={d.dayCount} peak={peakDay} colors={colors} />
                <View style={styles.slotBar}>
                  {SLOTS.map((s, i) => (
                    <View key={s.key} style={{ flex: Math.max(d.slotCount[i], 0.0001), backgroundColor: i === peakSlot ? colors.primary : colors.primarySubtle, height: 10 }} />
                  ))}
                </View>
                <View style={styles.slotLegend}>
                  {SLOTS.map((s, i) => (
                    <View key={s.key} style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={[styles.slotLabel, { color: i === peakSlot ? colors.primary : colors.textSecondary, fontWeight: i === peakSlot ? '800' : '600' }]}>{s.label}</Text>
                      <Text style={[styles.slotPct, { color: colors.textMuted }]}>{Math.round((d.slotCount[i] / slotTotal) * 100)}%</Text>
                    </View>
                  ))}
                </View>
                {peakDay >= 0 && peakSlot >= 0 && (
                  <View style={[styles.callout, { backgroundColor: colors.warningSubtle }]}>
                    <ClockIcon size={15} color={colors.warning} />
                    <Text style={[styles.calloutText, { color: colors.warningText }]}>คุณมักอยากซื้อวัน{DAYS[peakDay].replace('.', '')} ช่วง{SLOTS[peakSlot].label} ({SLOTS[peakSlot].hint}) ลองรอก่อนกดสั่ง</Text>
                  </View>
                )}
              </View>

              {/* 4. Platforms */}
              <View style={[...card, styles.cell]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>แพลตฟอร์มที่ล่อใจคุณ</Text>
                <Text style={[styles.note, { color: colors.textMuted }]}>เรียงตามจำนวนรายการที่บันทึก</Text>
                <View style={{ gap: 12, marginTop: 4 }}>
                  {d.platforms.map(([key, v]) => {
                    const top = d.platforms[0][1].count || 1;
                    return (
                      <View key={key} style={styles.platRow}>
                        <PlatformTile platform={key as ShoppingPlatform} size={36} />
                        <View style={{ flex: 1, gap: 5, minWidth: 0 }}>
                          <View style={styles.platTop}>
                            <Text style={[styles.platName, { color: colors.textPrimary }]} numberOfLines={1}>{PLATFORM_NAME[key] ?? 'อื่นๆ'}</Text>
                            <Text style={[styles.platMeta, { color: colors.textMuted }]}>{v.count} รายการ · {formatCurrency(v.sum, currency, { compact: true })}</Text>
                          </View>
                          <View style={[styles.platTrack, { backgroundColor: colors.skeleton }]}>
                            <View style={[styles.platFill, { width: `${(v.count / top) * 100}%`, backgroundColor: colors.primary }]} />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* 5. Biggest wins */}
              {d.topAvoided.length > 0 && (
                <View style={[...card, styles.cell]}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>ที่เลี่ยงได้แพงที่สุด</Text>
                  <Text style={[styles.note, { color: colors.textMuted }]}>ชัยชนะที่ใหญ่ที่สุดของคุณในช่วงนี้</Text>
                  <View style={{ gap: 10, marginTop: 4 }}>
                    {d.topAvoided.map((p, i) => (
                      <View key={p.id} style={[styles.winRow, { backgroundColor: colors.backgroundSubtle }]}>
                        <View style={[styles.rank, { backgroundColor: i === 0 ? '#F59E0B' : colors.border }]}><Text style={[styles.rankText, { color: i === 0 ? '#111827' : colors.textSecondary }]}>{i + 1}</Text></View>
                        <Text style={[styles.winName, { color: colors.textPrimary }]} numberOfLines={1}>{p.productName}</Text>
                        <Text style={[styles.winPrice, { color: colors.success }]}>{formatCurrency(p.price, currency)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 6. Impulse takeaway */}
              <LinearGradient colors={['#1E3A8A', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.tip, styles.cell]}>
                <FlameIcon size={22} color="#FCD34D" />
                <Text style={styles.tipTitle}>สรุปสำหรับคุณ</Text>
                <Text style={styles.tipText}>
                  {d.boughtN === 0 && d.avoidedN > 0
                    ? `ช่วง ${months} เดือนนี้คุณไม่ได้ซื้อรายการที่บันทึกไว้เลย และเก็บเงินไว้ได้ ${formatCurrency(d.avoidedSum, currency)}`
                    : d.decided === 0
                    ? 'ยังไม่มีรายการที่ตัดสินใจ ลองรอให้ครบเวลาแล้วเลือกซื้อหรือไม่ซื้อ ข้อมูลจะเริ่มมีความหมาย'
                    : `คุณซื้อ ${d.boughtN} รายการ มูลค่า ${formatCurrency(d.boughtSum, currency)} และเลี่ยงไว้ ${d.avoidedN} รายการ มูลค่า ${formatCurrency(d.avoidedSum, currency)}`}
                </Text>
                <View style={styles.tipPill}><ShieldIcon size={13} color="#BBF7D0" /><Text style={styles.tipPillText}>ยิ่งรอ ยิ่งตัดสินใจได้ดี</Text></View>
              </LinearGradient>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Charts (drawn at the measured container width) ───────────────────────────

function Gauge({ value, color, track, text }: { value: number | null; color: string; track: string; text: string }) {
  const R = 46, C = 2 * Math.PI * R, pct = value ?? 0;
  return (
    <Svg width={116} height={116} viewBox="0 0 116 116">
      <Circle cx="58" cy="58" r={R} stroke={track} strokeWidth="11" fill="none" />
      {value !== null && (
        <Circle cx="58" cy="58" r={R} stroke={color} strokeWidth="11" fill="none" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * C} ${C}`} transform="rotate(-90 58 58)" />
      )}
      <SvgText x="58" y="64" fontSize="26" fontWeight="800" fontFamily={SVG_FONT} fill={text} textAnchor="middle">{value === null ? '–' : value}</SvgText>
    </Svg>
  );
}

function PairBars({ series, colors }: { series: { label: string; avoided: number; bought: number }[]; colors: any }) {
  const [w, onLayout] = useWidth();
  const H = 170, padB = 22, padT = 18;
  const max = Math.max(...series.flatMap(s => [s.avoided, s.bought]), 1);
  const slot = w / series.length;
  const bw = Math.max(Math.min(slot * 0.3, 26), 6);
  const h = (v: number) => (v / max) * (H - padB - padT);
  return (
    <View onLayout={onLayout} style={{ width: '100%', height: H, marginTop: 6 }}>
      {w > 0 && (
        <Svg width={w} height={H}>
          {[0.5, 1].map(f => <Line key={f} x1={0} x2={w} y1={H - padB - f * (H - padB - padT)} y2={H - padB - f * (H - padB - padT)} stroke={colors.divider} strokeDasharray="3 5" />)}
          {series.map((s, i) => {
            const cx = slot * i + slot / 2;
            return (
              <React.Fragment key={s.label + i}>
                <Rect x={cx - bw - 2} y={H - padB - h(s.avoided)} width={bw} height={Math.max(h(s.avoided), s.avoided > 0 ? 3 : 0)} rx={4} fill={colors.primary} />
                <Rect x={cx + 2} y={H - padB - h(s.bought)} width={bw} height={Math.max(h(s.bought), s.bought > 0 ? 3 : 0)} rx={4} fill={colors.warning} />
                <SvgText x={cx} y={H - 6} fontSize="10" fontFamily={SVG_FONT} fill={colors.textMuted} textAnchor="middle">{s.label}</SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      )}
    </View>
  );
}

function DayBars({ counts, peak, colors }: { counts: number[]; peak: number; colors: any }) {
  const max = Math.max(...counts, 1);
  return (
    <View style={styles.dayRow}>
      {counts.map((n, i) => (
        <View key={i} style={styles.dayCol}>
          <View style={[styles.dayTrack, { backgroundColor: colors.skeleton }]}>
            <View style={{ height: `${(n / max) * 100}%`, minHeight: n > 0 ? 4 : 0, backgroundColor: i === peak ? colors.primary : colors.primarySubtle, borderRadius: 6 }} />
          </View>
          <Text style={[styles.dayLabel, { color: i === peak ? colors.primary : colors.textMuted, fontWeight: i === peak ? '800' : '500' }]}>{DAYS[i]}</Text>
        </View>
      ))}
    </View>
  );
}

function Legend({ color, label, text }: { color: string; label: string; text: string }) {
  return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={{ color: text, fontSize: 12 }}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: { width: '100%', maxWidth: 1160, paddingHorizontal: 20, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  seg: { flexDirection: 'row', borderRadius: 13, padding: 4 },
  segBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  segText: { fontSize: 13, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'stretch' },
  cell: { flexGrow: 1, flexShrink: 1, flexBasis: 370, minWidth: 0, maxWidth: '100%' },
  card: { borderRadius: 17, borderWidth: 1, padding: 20, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  note: { fontSize: 12, lineHeight: 17 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  tier: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  tierText: { fontSize: 13, fontWeight: '800' },
  deltaText: { fontSize: 13, fontWeight: '700' },
  legend: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  dayRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  dayCol: { flex: 1, alignItems: 'center', gap: 6 },
  dayTrack: { width: '100%', height: 70, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  dayLabel: { fontSize: 11 },
  slotBar: { flexDirection: 'row', borderRadius: 6, overflow: 'hidden', marginTop: 10, gap: 2 },
  slotLegend: { flexDirection: 'row', marginTop: 2 },
  slotLabel: { fontSize: 12 },
  slotPct: { fontSize: 11 },
  callout: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, marginTop: 8 },
  calloutText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  platRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  platTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  platName: { flexShrink: 1, fontSize: 14, fontWeight: '700' },
  platMeta: { fontSize: 11 },
  platTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  platFill: { height: 6, borderRadius: 3 },
  winRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14 },
  rank: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '800' },
  winName: { flex: 1, fontSize: 14, fontWeight: '600' },
  winPrice: { fontSize: 14, fontWeight: '800' },
  tip: { borderRadius: 18, padding: 22, gap: 11, justifyContent: 'center' },
  tipTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  tipText: { color: 'rgba(255,255,255,0.88)', fontSize: 14, lineHeight: 21 },
  tipPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginTop: 4 },
  tipPillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  emptyCard: { alignItems: 'center', padding: 32, gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
