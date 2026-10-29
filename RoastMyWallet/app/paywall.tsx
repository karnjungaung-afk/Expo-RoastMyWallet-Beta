import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { formatCurrency } from '@/utils/formatting';
import { ArrowRightIcon, CheckIcon, FlameIcon, ShieldIcon } from '@/components/icons/RmwIcons';

const BENEFITS = [
  'AI วิเคราะห์และคำแนะนำเชิงลึก',
  'ดูสถิติและรูปแบบการใช้จ่ายย้อนหลัง',
  'ระบบเตือนและกติกาการซื้อที่ยืดหยุ่น',
  'ประสบการณ์ Squad และเครื่องมือ Pro ที่รองรับ',
];

export default function PaywallScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const {
    status, offerings, isLoading, isPurchasing, isRestoring, error,
    initialize, purchase, restorePurchases,
  } = useSubscriptionStore();
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const packages = useMemo(() => {
    const all = offerings.flatMap(offering => offering.packages);
    return all.filter((item, index) => all.findIndex(other => other.id === item.id) === index);
  }, [offerings]);
  const isPro = status === 'pro' || status === 'trial';
  const bg = isDark ? colors.background : '#F3F7FC';

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
    <View style={[styles.root, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, maxWidth: 1060 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityRole="button">
          <Text style={{ color: colors.textSecondary }}>← กลับ</Text>
        </TouchableOpacity>

        <LinearGradient colors={isDark ? ['#102B48', '#173E65'] : ['#12345A', '#2364AC']} style={styles.hero}>
          <View style={styles.heroIcon}><FlameIcon size={24} color="#FFD27A" /></View>
          <Text style={styles.eyebrow}>ROASTMYWALLET MEMBERSHIP</Text>
          <Text style={styles.heroTitle}>ซื้ออย่างมีสติ ด้วยเครื่องมือที่ฉลาดขึ้น</Text>
          <Text style={styles.heroSub}>Pro ช่วยให้คุณเห็นรูปแบบการตัดสินใจและตั้งกติกาได้ละเอียดขึ้น ไม่ได้บังคับให้ซื้อเพิ่ม</Text>
          <View style={styles.benefitGrid}>
            {BENEFITS.map(item => (
              <View key={item} style={styles.benefit} >
                <CheckIcon size={15} color="#70E1A0" />
                <Text style={styles.benefitText}>{item}</Text>
              </View>
            ))}
          </View>
          {isPro && (
            <View style={styles.activeBadge}>
              <CheckIcon size={14} color="#0F5132" />
              <Text style={styles.activeBadgeText}>สมาชิก Pro กำลังใช้งาน</Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.sectionHeading}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>เลือกแผนสมาชิก</Text>
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>ราคาและแพ็กเกจโหลดจาก RevenueCat ไม่แสดงราคาสมมติ</Text>
          </View>
          <TouchableOpacity
            onPress={() => { setFeedback(''); void initialize(); }}
            style={[styles.refreshButton, { borderColor: colors.border }]}
            accessibilityRole="button"
          >
            <Text style={{ color: colors.textSecondary }}>↻ รีเฟรช</Text>
          </TouchableOpacity>
        </View>

        {isLoading && packages.length === 0 ? (
          <View style={[styles.stateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginTop: 12 }}>กำลังโหลดแพ็กเกจสมาชิก…</Text>
          </View>
        ) : packages.length > 0 ? (
          <View style={[styles.planGrid, { flexDirection: width >= 720 ? 'row' : 'column' }]}>
            {packages.map(pkg => {
              const yearly = pkg.period === 'year';
              return (
                <View key={pkg.id} style={[styles.planCard, { flex: 1, backgroundColor: colors.surface, borderColor: yearly ? '#3C83D8' : colors.border }]}>
                  {yearly && <View style={styles.recommended}><Text style={styles.recommendedText}>คุ้มค่าสำหรับใช้ระยะยาว</Text></View>}
                  <Text style={[styles.planName, { color: colors.textPrimary }]}>{yearly ? 'รายปี' : 'รายเดือน'}</Text>
                  <Text style={[styles.planPrice, { color: colors.textPrimary }]}>{formatCurrency(pkg.price, pkg.currency)}</Text>
                  <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>{yearly ? 'เรียกเก็บตามรอบปี' : 'เรียกเก็บทุกเดือน'}</Text>
                  <TouchableOpacity
                    style={[styles.planButton, { backgroundColor: isPro ? '#1B6A45' : '#1769E0' }, (isPurchasing || isPro) && styles.disabledButton]}
                    onPress={() => { void handlePurchase(pkg.id); }}
                    disabled={isPurchasing || isPro}
                    accessibilityRole="button"
                  >
                    {isPurchasing ? <ActivityIndicator color="#fff" /> :
                      <Text style={styles.planButtonText}>{isPro ? 'เปิดใช้งานแล้ว' : yearly ? 'เลือกแผนรายปี' : 'เลือกแผนรายเดือน'}</Text>}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.stateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.warningIcon}><ShieldIcon size={21} color="#D38A1F" /></View>
            <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>ยังโหลดแผน Pro ไม่ได้</Text>
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              {error || 'RevenueCat ยังไม่ส่ง Offering ที่พร้อมใช้งาน'}
            </Text>
            <Text style={[styles.setupHint, { color: colors.textMuted }]}>
              ตรวจสอบ API key ของแพลตฟอร์ม, Current Offering, product packages และ entitlement ID “pro” ใน RevenueCat
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => { void initialize(); }} accessibilityRole="button">
              <Text style={styles.retryText}>ลองอีกครั้ง</Text>
            </TouchableOpacity>
          </View>
        )}

        {(feedback || error) ? (
          <View style={[styles.feedback, { backgroundColor: error ? (isDark ? '#351D24' : '#FFF0F0') : (isDark ? '#143326' : '#EAF8F0') }]}>
            <Text style={{ color: error ? (isDark ? '#FFC1C1' : '#A12626') : (isDark ? '#9AE6B4' : '#17603B') }}>
              {error || feedback}
            </Text>
          </View>
        ) : null}

        {!isPro && !isLoading && packages.length > 0 && (
          <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
            การสมัครจะเกิดขึ้นผ่านผู้ให้บริการชำระเงินของแพลตฟอร์ม ควรตรวจสอบราคา รอบเรียกเก็บ และเงื่อนไขก่อนยืนยันทุกครั้ง
          </Text>
        )}

        {Platform.OS !== 'web' && (
          <TouchableOpacity onPress={() => { void handleRestore(); }} disabled={isRestoring} style={styles.restoreButton} accessibilityRole="button">
            {isRestoring ? <ActivityIndicator color={colors.primary} /> : <Text style={{ color: colors.primary, fontWeight: '600' }}>กู้คืนการซื้อเดิม</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: { width: '100%', alignSelf: 'center', paddingHorizontal: 20, gap: 18 },
  back: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4 },
  hero: { borderRadius: 24, padding: 28, gap: 12 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: '#A9CBF4', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  heroTitle: { color: '#FFFFFF', fontSize: 28, lineHeight: 34, fontWeight: '800', maxWidth: 680 },
  heroSub: { color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 22, maxWidth: 650 },
  benefitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '48%', minWidth: 220 },
  benefitText: { color: '#FFFFFF', fontSize: 13, flexShrink: 1 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 8, gap: 6, borderRadius: 999, marginTop: 4 },
  activeBadgeText: { color: '#0F5132', fontWeight: '700', fontSize: 12 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  sectionTitle: { fontSize: 22, fontWeight: '800' },
  sectionSub: { fontSize: 13, marginTop: 4, lineHeight: 19 },
  refreshButton: { paddingVertical: 9, paddingHorizontal: 12, borderWidth: 1, borderRadius: 10 },
  stateCard: { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  warningIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFF4D6', alignItems: 'center', justifyContent: 'center' },
  stateTitle: { fontSize: 17, fontWeight: '800' },
  stateText: { textAlign: 'center', lineHeight: 21, maxWidth: 620 },
  setupHint: { textAlign: 'center', fontSize: 12, lineHeight: 18, maxWidth: 620 },
  retryButton: { paddingHorizontal: 22, paddingVertical: 12, backgroundColor: '#1769E0', borderRadius: 12, marginTop: 6 },
  retryText: { color: '#fff', fontWeight: '700' },
  planGrid: { gap: 14, flexWrap: 'wrap' },
  planCard: { minWidth: 260, borderWidth: 1, borderRadius: 20, padding: 22, gap: 9 },
  recommended: { alignSelf: 'flex-start', backgroundColor: '#DCEBFF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  recommendedText: { color: '#1B5DB5', fontSize: 11, fontWeight: '700' },
  planName: { fontSize: 16, fontWeight: '800' },
  planPrice: { fontSize: 30, fontWeight: '900', marginTop: 4 },
  planPeriod: { fontSize: 12, marginBottom: 8 },
  planButton: { borderRadius: 12, padding: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  planButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  disabledButton: { opacity: 0.75 },
  feedback: { borderRadius: 12, padding: 14 },
  disclaimer: { fontSize: 12, lineHeight: 18 },
  restoreButton: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 20 },
});
