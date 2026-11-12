import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { formatCurrency } from '@/utils/formatting';
import { CheckIcon, CrownIcon, ShieldIcon, ChevronLeftIcon } from '@/components/icons/RmwIcons';

const BENEFITS = [
  'AI วิเคราะห์และคำแนะนำเชิงลึก',
  'ดูสถิติและรูปแบบการใช้จ่ายย้อนหลัง',
  'ระบบเตือนและกติกาการซื้อที่ยืดหยุ่น',
  'ประสบการณ์ Squad และเครื่องมือ Pro ที่รองรับ',
];

type Period = 'month' | 'year';

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const {
    status, offerings, isLoading, isPurchasing, isRestoring, error,
    initialize, purchase, restorePurchases,
  } = useSubscriptionStore();
  const [feedback, setFeedback] = useState('');
  const [selected, setSelected] = useState<Period | null>(null);

  useEffect(() => { void initialize(); }, [initialize]);

  const packages = useMemo(() => {
    const all = offerings.flatMap(offering => offering.packages);
    return all.filter((item, index) => all.findIndex(other => other.id === item.id) === index);
  }, [offerings]);

  const monthly = packages.find(p => p.period === 'month');
  const yearly = packages.find(p => p.period === 'year');
  const active: Period | null = selected && packages.some(p => p.period === selected)
    ? selected : (yearly ? 'year' : monthly ? 'month' : null);

  // Only computed from the two real prices (same currency); never invented.
  const savingsPct = monthly && yearly && monthly.currency === yearly.currency && monthly.price > 0
    ? Math.round((1 - yearly.price / (monthly.price * 12)) * 100) : 0;

  const isPro = status === 'pro' || status === 'trial';
  const wide = width >= 720;

  const handlePurchase = async (packageId: 'pro_monthly' | 'pro_yearly') => {
    setFeedback('');
    const ok = await purchase(packageId);
    setFeedback(ok ? 'เปิดใช้งาน RoastMyWallet Pro แล้ว' : 'ยังเปิดใช้งานไม่ได้ ตรวจสอบรายละเอียดด้านล่างแล้วลองอีกครั้ง');
  };

  const handleRestore = async () => {
    setFeedback('');
    await restorePurchases();
    setFeedback(useSubscriptionStore.getState().error ? 'กู้คืนสมาชิกไม่สำเร็จ' : 'ตรวจสอบรายการซื้อเรียบร้อย');
  };

  return (
    <LinearGradient colors={['#F15B50', '#7139D5', '#31B9CE']} style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={styles.back} accessibilityRole="button" accessibilityLabel="กลับ">
          <ChevronLeftIcon size={22} color="#fff" />
          <Text style={styles.backText}>กลับ</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.crown}><CrownIcon size={34} color="#F59E0B" /></View>
          <Text style={styles.title}>RoastMyWallet Pro</Text>
          <Text style={styles.sub}>ปลดล็อกเครื่องมือเต็มรูปแบบ เพื่อเห็นรูปแบบการตัดสินใจซื้อของคุณชัดขึ้น ไม่ได้บังคับให้ซื้อเพิ่ม</Text>
          {isPro && (
            <View style={styles.activeBadge}>
              <CheckIcon size={14} color="#0F5132" />
              <Text style={styles.activeBadgeText}>สมาชิก Pro กำลังใช้งาน</Text>
            </View>
          )}
        </View>

        {monthly && yearly && (
          <View style={styles.toggle} accessibilityRole="tablist">
            {([['month', 'รายเดือน'], ['year', 'รายปี']] as [Period, string][]).map(([key, label]) => (
              <TouchableOpacity key={key} style={[styles.toggleBtn, active === key && styles.toggleOn]} onPress={() => setSelected(key)} accessibilityRole="tab" accessibilityState={{ selected: active === key }}>
                <Text style={[styles.toggleText, active === key && styles.toggleTextOn]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isLoading && packages.length === 0 ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#93C5FD" />
            <Text style={styles.stateText}>กำลังโหลดแพ็กเกจสมาชิก…</Text>
          </View>
        ) : packages.length > 0 ? (
          <View style={[styles.planGrid, { flexDirection: wide ? 'row' : 'column' }]}>
            {packages.map(pkg => {
              const isYear = pkg.period === 'year';
              const on = active === pkg.period;
              return (
                <TouchableOpacity key={pkg.id} activeOpacity={0.9} onPress={() => setSelected(pkg.period)} style={[styles.planCard, on && styles.planCardOn, wide && { flex: 1 }]} accessibilityRole="button" accessibilityLabel={isYear ? 'แผนรายปี' : 'แผนรายเดือน'}>
                  {isYear && savingsPct > 0 && (
                    <View style={styles.saveBadge}><Text style={styles.saveBadgeText}>ประหยัด {savingsPct}%</Text></View>
                  )}
                  <Text style={styles.planName}>{isYear ? 'รายปี' : 'รายเดือน'}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.planPrice}>{formatCurrency(pkg.price, pkg.currency)}</Text>
                    <Text style={styles.planUnit}>{isYear ? '/ปี' : '/เดือน'}</Text>
                  </View>
                  <Text style={styles.planPeriod}>{isYear ? 'เรียกเก็บตามรอบปี' : 'เรียกเก็บทุกเดือน'}</Text>
                  <TouchableOpacity
                    style={[styles.planButton, isPro && { backgroundColor: '#15803D' }, (isPurchasing || isPro) && styles.disabledButton]}
                    onPress={() => { void handlePurchase(pkg.id); }}
                    disabled={isPurchasing || isPro}
                    accessibilityRole="button"
                  >
                    {isPurchasing ? <ActivityIndicator color="#fff" /> :
                      <Text style={styles.planButtonText}>{isPro ? 'เปิดใช้งานแล้ว' : isYear ? 'เลือกแผนรายปี' : 'เลือกแผนรายเดือน'}</Text>}
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.stateCard}>
            <View style={styles.warningIcon}><ShieldIcon size={21} color="#F59E0B" /></View>
            <Text style={styles.stateTitle}>ยังโหลดแผน Pro ไม่ได้</Text>
            <Text style={styles.stateText}>{error || 'RevenueCat ยังไม่ส่ง Offering ที่พร้อมใช้งาน'}</Text>
            <Text style={styles.setupHint}>
              ตรวจสอบ API key ของแพลตฟอร์ม, Current Offering, product packages และ entitlement ID “pro” ใน RevenueCat
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => { void initialize(); }} accessibilityRole="button">
              <Text style={styles.retryText}>ลองอีกครั้ง</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.benefits}>
          {BENEFITS.map(item => (
            <View key={item} style={styles.benefit}>
              <View style={styles.benefitCheck}><CheckIcon size={12} color="#4ADE80" /></View>
              <Text style={styles.benefitText}>{item}</Text>
            </View>
          ))}
        </View>

        {(feedback || error) ? (
          <View style={[styles.feedback, { backgroundColor: error ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)' }]}>
            <Text style={{ color: error ? '#FCA5A5' : '#86EFAC' }}>{error || feedback}</Text>
          </View>
        ) : null}

        {!isPro && !isLoading && packages.length > 0 && (
          <Text style={styles.disclaimer}>
            การสมัครจะเกิดขึ้นผ่านผู้ให้บริการชำระเงินของแพลตฟอร์ม ควรตรวจสอบราคา รอบเรียกเก็บ และเงื่อนไขก่อนยืนยันทุกครั้ง
          </Text>
        )}

        {Platform.OS !== 'web' && (
          <TouchableOpacity onPress={() => { void handleRestore(); }} disabled={isRestoring} style={styles.restoreButton} accessibilityRole="button">
            {isRestoring ? <ActivityIndicator color="#93C5FD" /> : <Text style={styles.restoreText}>กู้คืนการซื้อเดิม</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const glass = { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.14)', borderWidth: 1 } as const;

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: { width: '100%', maxWidth: 820, alignSelf: 'center', paddingHorizontal: 20, gap: 18 },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 8, gap: 2 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  hero: { alignItems: 'center', gap: 10, paddingTop: 4 },
  crown: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.8, textAlign: 'center' },
  sub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 460 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 8, gap: 6, borderRadius: 999, marginTop: 4 },
  activeBadgeText: { color: '#0F5132', fontWeight: '700', fontSize: 12 },
  toggle: { flexDirection: 'row', alignSelf: 'center', width: '100%', maxWidth: 360, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 4 },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 },
  toggleOn: { backgroundColor: '#F15B50' },
  toggleText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  toggleTextOn: { color: '#fff', fontWeight: '800' },
  planGrid: { gap: 14, alignItems: 'stretch' },
  planCard: { ...glass, borderRadius: 24, padding: 22, gap: 8, borderWidth: 1.5 },
  planCardOn: { borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.16)' },
  saveBadge: { position: 'absolute', top: -11, right: 14, backgroundColor: '#22C55E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  saveBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  planName: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  planPrice: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  planUnit: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 6 },
  planPeriod: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 8 },
  planButton: { backgroundColor: '#F15B50', borderRadius: 16, padding: 15, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  planButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  disabledButton: { opacity: 0.75 },
  stateCard: { ...glass, borderRadius: 24, padding: 24, alignItems: 'center', gap: 8 },
  warningIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center' },
  stateTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  stateText: { color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 21, maxWidth: 560 },
  setupHint: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 12, lineHeight: 18, maxWidth: 560 },
  retryButton: { paddingHorizontal: 22, paddingVertical: 12, backgroundColor: '#2563EB', borderRadius: 12, marginTop: 6 },
  retryText: { color: '#fff', fontWeight: '700' },
  benefits: { gap: 10, alignSelf: 'center', width: '100%', maxWidth: 420, marginTop: 4 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(34,197,94,0.18)', alignItems: 'center', justifyContent: 'center' },
  benefitText: { color: 'rgba(255,255,255,0.88)', fontSize: 14, flexShrink: 1 },
  feedback: { borderRadius: 12, padding: 14 },
  disclaimer: { color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  restoreButton: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 20 },
  restoreText: { color: '#93C5FD', fontWeight: '600' },
});
