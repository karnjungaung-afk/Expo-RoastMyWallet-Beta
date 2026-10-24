import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  StyleSheet, Modal, SafeAreaView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Svg, { Ellipse, Rect, Path, Circle } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore, selectWaitingPurchases } from '@/store/purchaseStore';
import { useAuthStore, selectProfile } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { PurchaseCard } from '@/features/purchases/PurchaseCard';
import { AddPurchaseSheet } from '@/features/purchases/AddPurchaseSheet';
import { PlatformTile, PLATFORM_NAME } from '@/components/icons/PlatformIcons';
import { BellIcon, PlusIcon, ShieldIcon, FlameIcon, ClockIcon } from '@/components/icons/RmwIcons';
import { formatCurrency } from '@/utils/formatting';
import type { ShoppingPlatform } from '@/types';

const { width: W } = Dimensions.get('window');

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { interceptUrl } = useLocalSearchParams<{ interceptUrl?: string }>();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [prefillUrl, setPrefillUrl]     = useState<string | undefined>();
  const [refreshing, setRefreshing]     = useState(false);

  const profile  = useAuthStore(selectProfile);
  const { purchases, loadPurchases, loadingState, getThisMonthAvoided, getThisMonthAvoidedCount } = usePurchaseStore();
  const waiting  = usePurchaseStore(selectWaitingPurchases);
  const { isPro } = useSubscriptionStore();

  useEffect(() => { if (interceptUrl) { setPrefillUrl(interceptUrl); setShowAddSheet(true); } }, [interceptUrl]);
  useEffect(() => { loadPurchases(); }, []);
  const onRefresh = useCallback(async () => { setRefreshing(true); await loadPurchases(); setRefreshing(false); }, []);

  const currency   = profile?.currency ?? 'THB';
  const avoided    = getThisMonthAvoided();
  const avoidedCnt = getThisMonthAvoidedCount();
  const boughtCnt  = purchases.filter(p => p.status === 'bought').length;
  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? 'อรุณสวัสดิ์' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';
  const name       = profile?.displayName?.split(' ')[0] ?? 'คุณ';

  const recentPlatforms = [...new Set(
    purchases.slice(0, 10).map(p => p.platform).filter(Boolean)
  )].slice(0, 5) as ShoppingPlatform[];

  const bg = isDark ? colors.background : '#F7F3ED';

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero header ─────────────────────────────────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
          {/* SVG blob background */}
          <View style={styles.blobWrap} pointerEvents="none">
            <Svg width={220} height={200} viewBox="0 0 220 200">
              <Ellipse cx="140" cy="80" rx="100" ry="80" fill={isDark ? 'rgba(90,150,195,0.10)' : 'rgba(232,160,48,0.12)'} />
              <Ellipse cx="160" cy="60" rx="65" ry="50" fill={isDark ? 'rgba(70,120,160,0.07)' : 'rgba(255,200,100,0.09)'} />
            </Svg>
          </View>

          {/* Top bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={[styles.greetText, { color: isDark ? colors.textMuted : '#9A7A5A' }]}>{greeting}</Text>
              <Text style={[styles.nameText, { color: colors.textPrimary }]}>{name}</Text>
            </View>
            <TouchableOpacity style={[styles.bellBtn, { backgroundColor: isDark ? colors.surface : '#fff', borderColor: colors.border }]}>
              <BellIcon size={20} color={colors.textSecondary} hasAlert={waiting.length > 0} />
            </TouchableOpacity>
          </View>

          {/* Big stat numbers — image 3 style */}
          <View style={styles.bigStats}>
            <BigStat value={waiting.length} label="รายการรอ" color={colors.textPrimary} />
            <View style={[styles.statDiv, { backgroundColor: isDark ? colors.border : '#D4B896' }]} />
            <BigStat value={avoidedCnt} label="ไม่ซื้อแล้ว" color="#2E7A4F" />
            <View style={[styles.statDiv, { backgroundColor: isDark ? colors.border : '#D4B896' }]} />
            <BigStat value={boughtCnt} label="ซื้อไป" color="#C07820" />
          </View>
        </View>

        {/* ── Savings card — floating white card (image 3) ─── */}
        <View style={styles.px}>
          <View style={[styles.savingsCard, {
            backgroundColor: isDark ? '#141927' : '#fff',
            shadowColor: isDark ? '#000' : '#7A5A30',
          }]}>
            <View style={styles.savingsContent}>
              <Text style={[styles.savingsLabel, { color: isDark ? colors.textMuted : '#9A7A5A' }]}>ประหยัดได้เดือนนี้</Text>
              <Text style={[styles.savingsAmt, { color: colors.textPrimary }]}>{formatCurrency(avoided, currency)}</Text>
              <View style={[styles.savingsBadge, { backgroundColor: '#52B57D20' }]}>
                <ShieldIcon size={11} color="#52B57D" />
                <Text style={[styles.savingsBadgeText, { color: '#2E7A4F' }]}>หยุด {avoidedCnt} รายการ ไม่ซื้อ</Text>
              </View>
            </View>
            <SavingsBlob isDark={isDark} />
          </View>
        </View>

        {/* ── Platform tiles — GoJek style (image 1) ──────── */}
        {recentPlatforms.length > 0 && (
          <View>
            <View style={[styles.px, styles.rowHeader]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>แพลตฟอร์มล่าสุด</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.platformScroll}>
              {recentPlatforms.map(p => (
                <View key={p} style={styles.platformItem}>
                  <PlatformTile platform={p} size={54} />
                  <Text style={[styles.platformLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                    {PLATFORM_NAME[p] ?? p}
                  </Text>
                </View>
              ))}
              <TouchableOpacity style={styles.platformItem} onPress={() => setShowAddSheet(true)}>
                <View style={[styles.addTile, { borderColor: colors.border, backgroundColor: isDark ? '#1E2A3A' : '#f0ebe3' }]}>
                  <PlusIcon size={22} color={colors.primary} />
                </View>
                <Text style={[styles.platformLabel, { color: colors.textSecondary }]}>เพิ่มใหม่</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* ── Colorful stat cards — image 4 horizontal scroll ─ */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.statCardScroll, { paddingLeft: 16 }]}>
          <StatCard label="ประหยัดได้" value={formatCurrency(avoided, currency, { compact: true })} grad={['#1B3557','#2F6293']} icon={<ShieldIcon size={17} color="rgba(255,255,255,0.9)" />} />
          <StatCard label="ไม่ซื้อแล้ว" value={`${avoidedCnt} รายการ`} grad={['#1A5C34','#2E8B4F']} icon={<FlameIcon size={17} color="rgba(255,255,255,0.9)" />} />
          <StatCard label="กำลังรอ" value={`${waiting.length} รายการ`} grad={['#7A4800','#C07820']} icon={<ClockIcon size={17} color="rgba(255,255,255,0.9)" />} />
        </ScrollView>

        {/* ── Waiting list ─────────────────────────────────── */}
        <View style={styles.px}>
          <View style={[styles.rowHeader, { marginBottom: 10 }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Waiting List</Text>
            {waiting.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.primarySubtle }]}>
                <Text style={[styles.countBadgeText, { color: colors.primary }]}>{waiting.length}</Text>
              </View>
            )}
          </View>

          {loadingState === 'loading' && waiting.length === 0
            ? <SkeletonList isDark={isDark} colors={colors} />
            : waiting.length === 0
            ? <EmptyState colors={colors} isDark={isDark} onAdd={() => setShowAddSheet(true)} />
            : <View style={styles.cardList}>
                {waiting.slice(0, 6).map(p => <PurchaseCard key={p.id} purchase={p} />)}
                {waiting.length > 6 && (
                  <TouchableOpacity style={[styles.moreBtn, { borderColor: colors.border }]}>
                    <Text style={[styles.moreBtnText, { color: colors.textSecondary }]}>ดูอีก {waiting.length - 6} รายการ</Text>
                  </TouchableOpacity>
                )}
              </View>
          }
        </View>
      </ScrollView>

      {/* ── FAB ─────────────────────────────────────────────── */}
      <View style={[styles.fab, { bottom: insets.bottom + 20 }]}>
        <LinearGradient colors={['#1B3557','#2A5080']} style={styles.fabGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
          <TouchableOpacity style={styles.fabBtn} onPress={() => setShowAddSheet(true)} activeOpacity={0.85}>
            <PlusIcon size={18} color="#fff" />
            <Text style={styles.fabText}>เพิ่มสิ่งที่อยากซื้อ</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <Modal visible={showAddSheet} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddSheet(false)}>
        <SafeAreaView style={[styles.modal, { backgroundColor: isDark ? '#0D1A2B' : '#F7F3ED' }]}>
          <AddPurchaseSheet onClose={() => { setShowAddSheet(false); setPrefillUrl(undefined); }} prefillUrl={prefillUrl} />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BigStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.bigStatItem}>
      <Text style={[styles.bigNum, { color }]}>{String(value).padStart(2,'0')}</Text>
      <Text style={styles.bigLabel}>{label}</Text>
    </View>
  );
}

function SavingsBlob({ isDark }: { isDark: boolean }) {
  return (
    <Svg width={88} height={88} viewBox="0 0 88 88">
      <Ellipse cx="44" cy="44" rx="36" ry="30" fill={isDark ? 'rgba(232,160,48,0.12)' : 'rgba(232,160,48,0.15)'} />
      <Ellipse cx="50" cy="36" rx="24" ry="19" fill={isDark ? 'rgba(90,150,195,0.12)' : 'rgba(90,150,195,0.13)'} />
      <Circle cx="44" cy="44" r="16" fill="none" stroke={isDark ? 'rgba(232,160,48,0.3)' : 'rgba(232,160,48,0.35)'} strokeWidth="1" />
    </Svg>
  );
}

function StatCard({ label, value, grad, icon }: { label: string; value: string; grad: [string,string]; icon: React.ReactNode }) {
  return (
    <LinearGradient colors={grad} style={styles.statCard} start={{x:0,y:0}} end={{x:1,y:1}}>
      <View style={styles.statCardIcon}>{icon}</View>
      <Text style={styles.statCardVal} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.statCardLbl}>{label}</Text>
    </LinearGradient>
  );
}

function EmptyState({ colors, isDark, onAdd }: any) {
  return (
    <TouchableOpacity onPress={onAdd} style={[styles.empty, { backgroundColor: isDark ? '#141927' : '#fff', borderColor: isDark ? '#1E2A3A' : '#E5DDD0' }]} activeOpacity={0.8}>
      <Svg width={72} height={72} viewBox="0 0 72 72">
        <Circle cx="36" cy="36" r="32" fill={isDark ? '#1E2A3A' : '#F0EBE3'} />
        <Rect x="20" y="26" width="32" height="24" rx="4" fill="none" stroke={isDark ? '#3A5070' : '#C8B89A'} strokeWidth="2" strokeDasharray="4 2" />
        <Path d="M28 26V22C28 20.3 29.3 19 31 19H41C42.7 19 44 20.3 44 22V26" stroke={isDark ? '#3A5070' : '#C8B89A'} strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M30 38L34 42L42 34" stroke={isDark ? '#5A96C3' : '#8B6840'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>ยังไม่มีรายการ</Text>
      <Text style={[styles.emptySub, { color: isDark ? colors.textMuted : '#9A7A5A' }]}>เห็นของอยากได้? เพิ่มไว้ก่อน{'\n'}แล้วค่อยตัดสินใจหลัง 24 ชั่วโมง</Text>
      <View style={[styles.emptyBtn, { backgroundColor: colors.primary }]}>
        <PlusIcon size={14} color="#fff" />
        <Text style={styles.emptyBtnText}>เพิ่มรายการแรก</Text>
      </View>
    </TouchableOpacity>
  );
}

function SkeletonList({ isDark, colors }: any) {
  return (
    <View style={styles.cardList}>
      {[0,1].map(i => <View key={i} style={[styles.skeleton, { backgroundColor: isDark ? colors.surface : '#EDE8DF' }]} />)}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:{ flex:1 },
  scroll:{ gap:16 },
  px:{ paddingHorizontal:16 },
  hero:{ paddingHorizontal:22, paddingBottom:16, position:'relative', overflow:'hidden' },
  blobWrap:{ position:'absolute', right:-10, top:0 },
  topBar:{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
  greetText:{ fontSize:13, fontWeight:'500', marginBottom:2 },
  nameText:{ fontSize:32, fontWeight:'900', letterSpacing:-1.2, lineHeight:36 },
  bellBtn:{ width:42, height:42, borderRadius:14, borderWidth:1, alignItems:'center', justifyContent:'center' },
  bigStats:{ flexDirection:'row', alignItems:'center' },
  bigStatItem:{ flex:1, alignItems:'center' },
  bigNum:{ fontSize:46, fontWeight:'900', letterSpacing:-2, lineHeight:50 },
  bigLabel:{ fontSize:11, fontWeight:'600', color:'#9A7A5A', marginTop:2 },
  statDiv:{ width:1, height:42, marginHorizontal:4 },
  savingsCard:{ borderRadius:22, padding:20, flexDirection:'row', alignItems:'center', shadowOffset:{width:0,height:4}, shadowOpacity:0.09, shadowRadius:18, elevation:5 },
  savingsContent:{ flex:1, gap:6 },
  savingsLabel:{ fontSize:12, fontWeight:'600' },
  savingsAmt:{ fontSize:30, fontWeight:'900', letterSpacing:-1 },
  savingsBadge:{ flexDirection:'row', alignItems:'center', gap:5, alignSelf:'flex-start', paddingHorizontal:10, paddingVertical:4, borderRadius:100 },
  savingsBadgeText:{ fontSize:12, fontWeight:'600' },
  rowHeader:{ flexDirection:'row', alignItems:'center', gap:8 },
  sectionTitle:{ fontSize:18, fontWeight:'800', letterSpacing:-0.3 },
  countBadge:{ paddingHorizontal:9, paddingVertical:2, borderRadius:100 },
  countBadgeText:{ fontSize:12, fontWeight:'700' },
  platformScroll:{ gap:18, paddingHorizontal:16, paddingBottom:4 },
  platformItem:{ alignItems:'center', gap:7, width:64 },
  platformLabel:{ fontSize:11, fontWeight:'600', textAlign:'center' },
  addTile:{ width:54, height:54, borderRadius:27, alignItems:'center', justifyContent:'center', borderWidth:1.5, borderStyle:'dashed' },
  statCardScroll:{ gap:10, paddingBottom:4, paddingRight:16 },
  statCard:{ borderRadius:18, padding:16, width:W*0.42, gap:7, minHeight:110 },
  statCardIcon:{ width:34, height:34, borderRadius:10, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center' },
  statCardVal:{ fontSize:20, fontWeight:'800', color:'#fff', letterSpacing:-0.5 },
  statCardLbl:{ fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:'600' },
  cardList:{ gap:10 },
  skeleton:{ height:108, borderRadius:18 },
  moreBtn:{ paddingVertical:13, borderRadius:14, borderWidth:1.5, alignItems:'center', borderStyle:'dashed' },
  moreBtnText:{ fontSize:13, fontWeight:'600' },
  empty:{ borderRadius:22, borderWidth:1.5, padding:28, alignItems:'center', gap:10, borderStyle:'dashed' },
  emptyTitle:{ fontSize:16, fontWeight:'700' },
  emptySub:{ fontSize:13, textAlign:'center', lineHeight:20 },
  emptyBtn:{ flexDirection:'row', alignItems:'center', gap:7, paddingHorizontal:20, paddingVertical:11, borderRadius:100, marginTop:4 },
  emptyBtnText:{ color:'#fff', fontSize:14, fontWeight:'700' },
  fab:{ position:'absolute', alignSelf:'center' },
  fabGrad:{ borderRadius:100, shadowColor:'#1B3557', shadowOffset:{width:0,height:8}, shadowOpacity:0.3, shadowRadius:20, elevation:12 },
  fabBtn:{ flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:28, paddingVertical:15 },
  fabText:{ color:'#fff', fontSize:15, fontWeight:'700' },
  modal:{ flex:1 },
});
