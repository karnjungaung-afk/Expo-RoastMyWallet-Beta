import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { PlatformTile, CATEGORY_GRADIENT } from '@/components/icons/PlatformIcons';
import { ClockIcon, ShieldIcon, FlameIcon, CheckIcon } from '@/components/icons/RmwIcons';
import { formatCurrency, formatCountdown, formatCategoryName } from '@/utils/formatting';
import type { Purchase, ShoppingPlatform } from '@/types';

const RISK = {
  high:   { color:'#D45050', bg:'#FAE8E8', label:'เสี่ยงสูง',     darkBg:'#2D1010' },
  medium: { color:'#C07820', bg:'#FDF3E0', label:'ปานกลาง',        darkBg:'#2A1E08' },
  low:    { color:'#2E7A4F', bg:'#E3F5EC', label:'เสี่ยงต่ำ',     darkBg:'#0D2016' },
};

export function PurchaseCard({ purchase, onPress }: { purchase: Purchase; onPress?: () => void }) {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const risk    = purchase.impulseRisk ?? 'medium';
  const cfg     = RISK[risk];
  const isWait  = purchase.status === 'waiting';
  const plat    = purchase.platform as ShoppingPlatform | undefined;
  const catGrad = CATEGORY_GRADIENT[purchase.category] ?? CATEGORY_GRADIENT.other;

  const progress = useMemo(() => {
    if (!purchase.waitingUntil || !purchase.createdAt) return 0;
    const total = new Date(purchase.waitingUntil).getTime() - new Date(purchase.createdAt).getTime();
    const rem   = new Date(purchase.waitingUntil).getTime() - Date.now();
    return Math.max(0, Math.min(1, rem / total));
  }, [purchase.waitingUntil, purchase.createdAt]);

  const isReady = isWait && progress === 0;
  const pct     = isReady ? 100 : (1 - progress) * 100;
  const handle  = () => onPress ? onPress() : router.push(`/purchase/${purchase.id}`);

  return (
    <TouchableOpacity onPress={handle} activeOpacity={0.8}>
      <View style={[styles.card, {
        backgroundColor: isDark ? '#141927' : '#fff',
        borderColor: isDark ? '#1E2A3A' : '#EDE8DF',
        shadowColor: isDark ? '#000' : '#7A5A30',
      }]}>
        {/* Left: category color block */}
        <LinearGradient colors={catGrad} style={styles.colorBlock} start={{x:0,y:0}} end={{x:1,y:1}}>
          {plat && plat !== 'unknown'
            ? <PlatformTile platform={plat} size={38} />
            : <View style={styles.catBubble}><Text style={styles.catLetter}>{formatCategoryName(purchase.category).charAt(0)}</Text></View>
          }
        </LinearGradient>

        {/* Right: content */}
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{purchase.productName}</Text>
            <Text style={[styles.price, { color: colors.textPrimary }]}>{formatCurrency(purchase.price, purchase.currency)}</Text>
          </View>

          <Text style={[styles.cat, { color: isDark ? colors.textMuted : '#9A7A5A' }]}>
            {formatCategoryName(purchase.category)}
          </Text>

          {purchase.aiRoast && isWait && (
            <Text style={[styles.roast, { color: colors.textMuted }]} numberOfLines={1}>"{purchase.aiRoast}"</Text>
          )}

          {isWait ? (
            <View style={styles.timerBlock}>
              <View style={[styles.timerBg, { backgroundColor: isDark ? '#252B38' : '#EDE8DF' }]}>
                <LinearGradient
                  colors={isReady ? ['#2E7A4F','#52B57D'] : [cfg.color, cfg.color+'88']}
                  start={{x:0,y:0}} end={{x:1,y:0}}
                  style={[styles.timerFill, { width:`${pct}%` as any }]}
                />
              </View>
              <View style={styles.timerRow}>
                <View style={[styles.riskPill, { backgroundColor: isDark ? cfg.darkBg : cfg.bg }]}>
                  {risk==='high' ? <FlameIcon size={10} color={cfg.color}/> : risk==='low' ? <ShieldIcon size={10} color={cfg.color}/> : <ClockIcon size={10} color={cfg.color}/>}
                  <Text style={[styles.riskTxt, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                <View style={styles.countdownRow}>
                  {isReady
                    ? <><CheckIcon size={10} color="#2E7A4F"/><Text style={[styles.countdownTxt,{color:'#2E7A4F'}]}>พร้อมตัดสินใจ</Text></>
                    : <><ClockIcon size={10} color={colors.textMuted}/><Text style={[styles.countdownTxt,{color:colors.textMuted}]}>{formatCountdown(purchase.waitingUntil)}</Text></>
                  }
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.decidedRow}>
              {purchase.status==='avoided'
                ? <><CheckIcon size={12} color="#2E7A4F"/><Text style={[styles.decidedTxt,{color:'#2E7A4F'}]}>ไม่ซื้อแล้ว — ประหยัด {formatCurrency(purchase.price,purchase.currency)}</Text></>
                : purchase.status==='bought'
                ? <><FlameIcon size={12} color="#D45050"/><Text style={[styles.decidedTxt,{color:'#D45050'}]}>ซื้อไปแล้ว</Text></>
                : <Text style={[styles.decidedTxt,{color:colors.textMuted}]}>หมดเวลา</Text>
              }
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:{ borderRadius:18, borderWidth:1, flexDirection:'row', overflow:'hidden', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:10, elevation:2 },
  colorBlock:{ width:76, alignItems:'center', justifyContent:'center' },
  catBubble:{ width:38, height:38, borderRadius:12, backgroundColor:'rgba(255,255,255,0.25)', alignItems:'center', justifyContent:'center' },
  catLetter:{ fontSize:18, fontWeight:'800', color:'#fff' },
  body:{ flex:1, padding:12, gap:5 },
  topRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', gap:8 },
  name:{ flex:1, fontSize:15, fontWeight:'700', letterSpacing:-0.2 },
  price:{ fontSize:15, fontWeight:'800', letterSpacing:-0.5 },
  cat:{ fontSize:11, fontWeight:'600', textTransform:'uppercase', letterSpacing:0.5 },
  roast:{ fontSize:11, lineHeight:16, fontStyle:'italic' },
  timerBlock:{ gap:5, marginTop:2 },
  timerBg:{ height:5, borderRadius:3, overflow:'hidden' },
  timerFill:{ height:5, borderRadius:3 },
  timerRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  riskPill:{ flexDirection:'row', alignItems:'center', gap:3, paddingHorizontal:7, paddingVertical:3, borderRadius:100 },
  riskTxt:{ fontSize:10, fontWeight:'700' },
  countdownRow:{ flexDirection:'row', alignItems:'center', gap:3 },
  countdownTxt:{ fontSize:11, fontWeight:'500' },
  decidedRow:{ flexDirection:'row', alignItems:'center', gap:5, marginTop:3 },
  decidedTxt:{ fontSize:12, fontWeight:'600' },
});
