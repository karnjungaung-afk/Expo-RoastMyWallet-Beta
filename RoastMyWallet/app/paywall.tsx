import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/services/supabase';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import type { SubscriptionPackage } from '@/types';

const WEB_PLANS: Array<{ id: SubscriptionPackage['id']; title: string; price: string; detail: string }> = [
  { id: 'pro_monthly', title: 'รายเดือน', price: '฿39', detail: 'ต่อเดือน · ยกเลิกได้ตามเงื่อนไขผู้ให้บริการ' },
  { id: 'pro_yearly', title: 'รายปี', price: '฿349', detail: 'ต่อปี · ราคาต้องตรงกับ Stripe Dashboard' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const status = useSubscriptionStore(state => state.status);
  const offerings = useSubscriptionStore(state => state.offerings);
  const isPurchasing = useSubscriptionStore(state => state.isPurchasing);
  const isRestoring = useSubscriptionStore(state => state.isRestoring);
  const error = useSubscriptionStore(state => state.error);
  const purchase = useSubscriptionStore(state => state.purchase);
  const restorePurchases = useSubscriptionStore(state => state.restorePurchases);
  const refresh = useSubscriptionStore(state => state.refresh);
  const [busyPlan, setBusyPlan] = useState<SubscriptionPackage['id'] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const plans = useMemo(() => {
    if (Platform.OS === 'android') {
      const livePackages = offerings.flatMap(item => item.packages);
      return WEB_PLANS.map(plan => {
        const live = livePackages.find(item => item.id === plan.id);
        return live ? { ...plan, price: new Intl.NumberFormat('th-TH', { style: 'currency', currency: live.currency }).format(live.price) } : plan;
      });
    }
    return WEB_PLANS;
  }, [offerings]);

  const startPurchase = async (planId: SubscriptionPackage['id']) => {
    setMessage(null);
    setBusyPlan(planId);
    try {
      if (Platform.OS === 'web') {
        const { data, error: checkoutError } = await supabase.functions.invoke('create-web-checkout', {
          body: { plan: planId === 'pro_monthly' ? 'monthly' : 'yearly' },
        });
        if (checkoutError) throw checkoutError;
        if (!data || typeof data.url !== 'string' || !data.url.startsWith('https://')) {
          throw new Error('เซิร์ฟเวอร์ไม่ได้ส่งลิงก์ชำระเงินที่ถูกต้อง');
        }
        await Linking.openURL(data.url);
        setMessage('เปิดหน้า Stripe Checkout แล้ว สิทธิ์ Pro จะเปิดเมื่อเซิร์ฟเวอร์ยืนยันการชำระเงินเท่านั้น');
      } else if (Platform.OS === 'android') {
        const success = await purchase(planId);
        if (success) setMessage('เซิร์ฟเวอร์ยืนยันสมาชิก Pro แล้ว');
      } else {
        throw new Error('ช่องทางชำระเงินนี้ยังไม่รองรับบนอุปกรณ์นี้');
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'เริ่มชำระเงินไม่สำเร็จ');
    } finally {
      setBusyPlan(null);
    }
  };

  const onRestore = async () => {
    await restorePurchases();
    await refresh();
  };

  const proActive = status === 'pro' || status === 'trial';
  const cardBackground = isDark ? '#141927' : '#FFFFFF';
  const muted = colors.textSecondary ?? '#687386';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'RoastMyWallet Pro', headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28, paddingHorizontal: 20 }}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <Text style={{ color: colors.textPrimary }}>‹ กลับ</Text>
        </Pressable>
        <View style={[styles.hero, { backgroundColor: isDark ? '#101E32' : '#1B3557' }]}>
          <Text style={styles.kicker}>ROASTMYWALLET</Text>
          <Text style={styles.title}>ตัดสินใจซื้ออย่างฉลาดขึ้น</Text>
          <Text style={styles.heroText}>ปลดล็อก AI insights และเครื่องมือ Pro ด้วยสมาชิกที่ยืนยันจากผู้ให้บริการจริง</Text>
          <View style={styles.bullet}><Text style={styles.check}>✓</Text><Text style={styles.bulletText}>Insights และการวิเคราะห์ขั้นสูง</Text></View>
          <View style={styles.bullet}><Text style={styles.check}>✓</Text><Text style={styles.bulletText}>ฟีเจอร์ Pro ตามแผนที่เปิดให้บริการ</Text></View>
        </View>

        {proActive ? (
          <View style={[styles.notice, { backgroundColor: cardBackground, borderColor: '#32966A' }]}>
            <Text style={[styles.noticeTitle, { color: colors.textPrimary }]}>สมาชิก Pro ใช้งานได้</Text>
            <Text style={{ color: muted }}>สถานะนี้มาจากข้อมูลสมาชิกที่เซิร์ฟเวอร์บันทึกไว้</Text>
            <Pressable onPress={() => void refresh()} style={styles.secondaryButton}><Text style={styles.secondaryText}>ตรวจสอบสถานะอีกครั้ง</Text></Pressable>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>เลือกแผนสมาชิก</Text>
            {plans.map(plan => (
              <View key={plan.id} style={[styles.planCard, { backgroundColor: cardBackground, borderColor: plan.id === 'pro_yearly' ? '#E8A030' : colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planTitle, { color: colors.textPrimary }]}>{plan.title}</Text>
                  <Text style={[styles.planDetail, { color: muted }]}>{plan.detail}</Text>
                  {Platform.OS === 'android' && (
                    <Text style={[styles.planDetail, { color: muted }]}>ราคาและสินค้าอ้างอิงจาก RevenueCat/Google Play เมื่อกำหนดค่าแล้ว</Text>
                  )}
                </View>
                <View style={styles.priceArea}>
                  <Text style={[styles.price, { color: colors.textPrimary }]}>{plan.price}</Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={!!busyPlan || isPurchasing}
                    onPress={() => void startPurchase(plan.id)}
                    style={[styles.buyButton, (!!busyPlan || isPurchasing) && styles.disabledButton]}
                  >
                    {busyPlan === plan.id || isPurchasing ? <ActivityIndicator color="#fff" /> : <Text style={styles.buyText}>{Platform.OS === 'web' ? 'ไปชำระเงิน' : 'สมัครผ่าน Google Play'}</Text>}
                  </Pressable>
                </View>
              </View>
            ))}
            <Text style={[styles.disclaimer, { color: muted }]}>การกดปุ่มนี้ไม่ทำให้ได้สิทธิ์ Pro ทันที ระบบจะเปิดสิทธิ์เมื่อได้รับ webhook ที่ตรวจสอบจากผู้ให้บริการและฐานข้อมูลอัปเดตแล้วเท่านั้น</Text>
          </>
        )}

        {Platform.OS === 'android' && (
          <Pressable disabled={isRestoring || !!busyPlan} onPress={() => void onRestore()} style={[styles.secondaryButton, { borderColor: colors.border }]}>
            {isRestoring ? <ActivityIndicator /> : <Text style={[styles.secondaryText, { color: colors.textPrimary }]}>กู้คืนการซื้อจาก Google Play</Text>}
          </Pressable>
        )}
        <Pressable disabled={!!busyPlan} onPress={() => void refresh()} style={[styles.secondaryButton, { borderColor: colors.border }]}>
          <Text style={[styles.secondaryText, { color: colors.textPrimary }]}>ตรวจสอบสถานะสมาชิก</Text>
        </Pressable>

        {(message || error) && (
          <View style={[styles.notice, { backgroundColor: cardBackground, borderColor: error ? '#D46060' : colors.border }]}>
            <Text style={{ color: error ? '#D46060' : colors.textPrimary }}>{message ?? error}</Text>
          </View>
        )}
        <Text style={[styles.disclaimer, { color: muted }]}>หากราคาในหน้านี้ไม่ตรงกับราคาที่ตั้งในบัญชีผู้ให้บริการ อย่ารับชำระจนกว่าจะปรับให้ตรงกัน</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 4, marginBottom: 8 },
  hero: { borderRadius: 22, padding: 22, marginBottom: 24 },
  kicker: { color: '#E8A030', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', lineHeight: 34, marginBottom: 10 },
  heroText: { color: '#D8E3EF', fontSize: 14, lineHeight: 21, marginBottom: 18 },
  bullet: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  check: { color: '#75D7A3', fontWeight: '800', fontSize: 16 },
  bulletText: { color: '#FFFFFF', fontSize: 13, flexShrink: 1 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  planCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  planTitle: { fontSize: 17, fontWeight: '800', marginBottom: 5 },
  planDetail: { fontSize: 12, lineHeight: 18, marginBottom: 3 },
  priceArea: { alignItems: 'flex-end', gap: 10 },
  price: { fontSize: 21, fontWeight: '800' },
  buyButton: { backgroundColor: '#1B3557', borderRadius: 11, minHeight: 42, minWidth: 116, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  buyText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  disabledButton: { opacity: 0.55 },
  disclaimer: { fontSize: 12, lineHeight: 18, marginVertical: 10 },
  secondaryButton: { minHeight: 44, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  secondaryText: { fontSize: 13, fontWeight: '700' },
  notice: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 12, marginBottom: 12, gap: 8 },
  noticeTitle: { fontSize: 16, fontWeight: '800' },
});
