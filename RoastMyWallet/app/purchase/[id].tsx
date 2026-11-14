import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { NeedScoreRing } from '@/components/ui/NeedScoreRing';
import { FlameIcon, ShieldIcon, ClockIcon, CheckIcon, WalletIcon, ArrowRightIcon } from '@/components/icons/RmwIcons';
import { PLATFORM_META } from '@/features/intercept/InterceptService';
import { formatCurrency, formatCountdown, formatCategoryName, formatPlatformName } from '@/utils/formatting';
import type { ShoppingPlatform } from '@/types';

const RISK_LABEL: Record<string, { label: string; color: string }> = {
  high:   { label: 'ความเสี่ยงสูง',     color: '#D46060' },
  medium: { label: 'ความเสี่ยงปานกลาง', color: '#E8A030' },
  low:    { label: 'ความเสี่ยงต่ำ',     color: '#52B57D' },
};

export default function PurchaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { colors } = useTheme();
  const { purchases, updatePurchaseStatus, extendWaiting, loadPurchases, loadingState } = usePurchaseStore();

  const purchase = purchases.find(p => p.id === id);
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    if (purchases.length === 0 && loadingState === 'idle') loadPurchases();
  }, []);

  if (!purchase && loadingState === 'loading') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!purchase) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <Text style={[styles.notFoundText, { color: colors.textMuted }]}>ไม่พบรายการ</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>กลับ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const risk     = purchase.impulseRisk ?? 'medium';
  const riskCfg  = RISK_LABEL[risk];
  const isWaiting = purchase.status === 'waiting';
  const platform = purchase.platform as ShoppingPlatform | undefined;
  const platMeta = platform ? PLATFORM_META[platform] : null;
  const progressValue = (() => {
    if (!purchase.waitingUntil || !purchase.createdAt) return 0;
    const total     = new Date(purchase.waitingUntil).getTime() - new Date(purchase.createdAt).getTime();
    const remaining = new Date(purchase.waitingUntil).getTime() - Date.now();
    return Math.max(0, Math.min(1, remaining / total));
  })();
  const isReady = isWaiting && progressValue === 0;

  const decide = async (status: 'bought' | 'avoided') => {
    setDeciding(true);
    try { await updatePurchaseStatus(purchase.id, status); router.back(); }
    catch { Alert.alert('เกิดข้อผิดพลาด', 'กรุณาลองใหม่'); }
    finally { setDeciding(false); }
  };

  const handleExtend = async () => {
    try { await extendWaiting(purchase.id, 24); Alert.alert('', 'เพิ่มเวลาอีก 24 ชั่วโมงแล้ว'); }
    catch { Alert.alert('เกิดข้อผิดพลาด', 'กรุณาลองใหม่'); }
  };

  // Hero is a flat colour block keyed to the risk level.
  const heroBg = risk === 'high' ? colors.blockOrange : risk === 'low' ? colors.blockGreen : colors.blockPurple;
  const gradColors: [string, string] = [heroBg, heroBg];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 130 }}>

        {/* Hero */}
        <LinearGradient colors={gradColors} style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          {/* Close btn */}
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {platMeta && (
            <View style={[styles.platformBadge, { backgroundColor: platMeta.color + '20', borderColor: platMeta.color + '40' }]}>
              <View style={[styles.platDot, { backgroundColor: platMeta.color }]} />
              <Text style={[styles.platName, { color: platMeta.color }]}>{platMeta.name}</Text>
            </View>
          )}

          <Text style={styles.heroName}>{purchase.productName}</Text>
          <Text style={styles.heroPrice}>{formatCurrency(purchase.price, purchase.currency)}</Text>

          {/* Score ring */}
          {purchase.needScore !== null && (
            <View style={[styles.scoreWrap, { backgroundColor: colors.surface }]}>
              <NeedScoreRing score={purchase.needScore} risk={risk} size={104} strokeWidth={13} />
            </View>
          )}

          {/* Risk badge */}
          <View style={[styles.riskBadge, { backgroundColor: riskCfg.color + '20', borderColor: riskCfg.color + '40' }]}>
            <View style={[styles.riskDot, { backgroundColor: riskCfg.color }]} />
            <Text style={[styles.riskLabel, { color: riskCfg.color }]}>{riskCfg.label}</Text>
          </View>
        </LinearGradient>

        <View style={[styles.content, { paddingHorizontal: 16 }]}>

          {/* AI Roast */}
          {purchase.aiRoast && (
            <View style={[styles.roastCard, { backgroundColor: colors.backgroundSubtle, borderColor: colors.border }]}>
              <FlameIcon size={16} color="#E8A030" />
              <Text style={[styles.roastText, { color: colors.textPrimary }]}>{purchase.aiRoast}</Text>
            </View>
          )}

          {/* Details */}
          <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <DetailRow icon={<WalletIcon size={16} color={colors.textSecondary} />} label="หมวดหมู่" value={formatCategoryName(purchase.category)} colors={colors} />
            {purchase.platform && purchase.platform !== 'unknown' && (
              <><Divider colors={colors} /><DetailRow icon={<ShieldIcon size={16} color={colors.textSecondary} />} label="แพลตฟอร์ม" value={formatPlatformName(purchase.platform)} colors={colors} /></>
            )}
            {purchase.reason && (
              <><Divider colors={colors} /><DetailRow icon={<ClockIcon size={16} color={colors.textSecondary} />} label="เหตุผลที่อยากได้" value={purchase.reason} colors={colors} /></>
            )}
            {purchase.waitingUntil && isWaiting && (
              <><Divider colors={colors} /><DetailRow icon={<ClockIcon size={16} color={isReady ? '#52B57D' : colors.textSecondary} />}
                label="เวลาที่เหลือ"
                value={isReady ? 'พร้อมตัดสินใจ!' : formatCountdown(purchase.waitingUntil)}
                valueColor={isReady ? '#52B57D' : undefined}
                colors={colors} /></>
            )}
          </View>

          {/* Notes */}
          {purchase.notes && (
            <View style={[styles.notesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.notesLabel, { color: colors.textMuted }]}>บันทึกเพิ่มเติม</Text>
              <Text style={[styles.notesText, { color: colors.textPrimary }]}>{purchase.notes}</Text>
            </View>
          )}

          {/* URL */}
          {purchase.url && (
            <TouchableOpacity
              style={[styles.urlCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => Linking.openURL(purchase.url!)}
            >
              <Text style={[styles.urlText, { color: colors.primary }]} numberOfLines={1}>{purchase.url}</Text>
              <ArrowRightIcon size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Action buttons */}
      {isWaiting && (
        <View style={[styles.actions, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background }]}>
          {isReady ? (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.avoidBtn]}
                onPress={() => decide('avoided')} disabled={deciding}
              >
                <ShieldIcon size={18} color="#fff" />
                <Text style={styles.actionBtnText}>ไม่ซื้อแล้ว</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.buyBtn]}
                onPress={() => decide('bought')} disabled={deciding}
              >
                <WalletIcon size={18} color="#fff" />
                <Text style={styles.actionBtnText}>ซื้อเลย</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionBtnSm, { backgroundColor: colors.backgroundSubtle, borderColor: colors.border }]}
                onPress={handleExtend}
              >
                <ClockIcon size={16} color={colors.textSecondary} />
                <Text style={[styles.actionBtnSmText, { color: colors.textSecondary }]}>รอเพิ่มอีก 24 ชม.</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtnSm, { backgroundColor: colors.dangerSubtle, borderColor: 'transparent' }]}
                onPress={() => decide('avoided')}
              >
                <CheckIcon size={16} color="#D46060" />
                <Text style={[styles.actionBtnSmText, { color: '#D46060' }]}>เลิกซื้อเลย</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

function DetailRow({ icon, label, value, valueColor, colors }: any) {
  return (
    <View style={styles.detailRow}>
      {icon}
      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: valueColor ?? colors.textPrimary }]}>{value}</Text>
    </View>
  );
}
function Divider({ colors }: any) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 32, alignItems: 'center', gap: 10, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' },
  closeBtn: { alignSelf: 'flex-end', width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  closeBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  platformBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  platDot: { width: 6, height: 6, borderRadius: 3 },
  platName: { fontSize: 12, fontWeight: '700' },
  heroName: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5, textAlign: 'center', lineHeight: 28 },
  heroPrice: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -2 },
  scoreWrap: { marginVertical: 6, padding: 14, paddingBottom: 6, borderRadius: 32 },
  riskBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, borderWidth: 1 },
  riskDot: { width: 7, height: 7, borderRadius: 4 },
  riskLabel: { fontSize: 13, fontWeight: '700' },
  content: { gap: 10, paddingTop: 16 },
  roastCard: { flexDirection: 'row', gap: 10, padding: 16, borderRadius: 28, borderWidth: 0, alignItems: 'flex-start' },
  roastText: { flex: 1, fontSize: 14, lineHeight: 21, fontStyle: 'italic' },
  detailCard: { borderRadius: 28, borderWidth: 0, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13 },
  detailLabel: { fontSize: 13, flex: 1 },
  detailValue: { fontSize: 14, fontWeight: '600', textAlign: 'right', maxWidth: '55%' },
  divider: { height: 1, marginLeft: 16 },
  notesCard: { borderRadius: 28, borderWidth: 0, padding: 18, gap: 6 },
  notesLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  notesText: { fontSize: 14, lineHeight: 20 },
  urlCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, borderWidth: 0, paddingHorizontal: 20, paddingVertical: 14 },
  urlText: { flex: 1, fontSize: 13 },
  actions: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 17, borderRadius: 999 },
  avoidBtn: { backgroundColor: '#218B62' },
  buyBtn: { backgroundColor: '#D94343' },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  actionBtnSm: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 15, borderRadius: 999, borderWidth: 0 },
  actionBtnSmText: { fontSize: 13, fontWeight: '800' },
  notFoundText: { fontSize: 16, marginBottom: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  backBtnText: { fontSize: 14 },
});
