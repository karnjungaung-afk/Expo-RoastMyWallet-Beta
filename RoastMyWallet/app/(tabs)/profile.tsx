import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, Platform, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore, selectUser, selectProfile } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { usePurchaseStore } from '@/store/purchaseStore';
import { FlameIcon, ShieldIcon, WalletIcon, BellIcon, UserIcon, ArrowRightIcon } from '@/components/icons/RmwIcons';
import { formatCurrency } from '@/utils/formatting';
import { calculateAvoidedSpending } from '@/utils/scoring';
import { spacing } from '@/theme/tokens';

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router  = useRouter();

  const user    = useAuthStore(selectUser);
  const profile = useAuthStore(selectProfile);
  const { signOut, updateProfile } = useAuthStore();
  const { isPro } = useSubscriptionStore();
  const purchases = usePurchaseStore(state => state.purchases);

  const [notifs, setNotifs] = useState(profile?.notificationsEnabled ?? true);
  const [aiOn,   setAiOn]   = useState(profile?.aiEnabled ?? true);
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState(profile?.displayName ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotifs(profile?.notificationsEnabled ?? true);
    setAiOn(profile?.aiEnabled ?? true);
    setEditName(profile?.displayName ?? '');
  }, [profile?.notificationsEnabled, profile?.aiEnabled, profile?.displayName]);

  const currency  = profile?.currency ?? 'THB';
  const isProUser = isPro();
  const avoided   = calculateAvoidedSpending(purchases);
  const avoidedCount = purchases.filter(p => p.status === 'avoided').length;
  const initials  = (profile?.displayName ?? user?.email ?? 'U').charAt(0).toUpperCase();

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const saveSetting = async (key: 'notificationsEnabled' | 'aiEnabled', value: boolean) => {
    const previous = key === 'notificationsEnabled' ? notifs : aiOn;
    if (key === 'notificationsEnabled') setNotifs(value); else setAiOn(value);
    try {
      await updateProfile({ [key]: value });
    } catch (error) {
      if (key === 'notificationsEnabled') setNotifs(previous); else setAiOn(previous);
      showMessage('บันทึกไม่สำเร็จ', error instanceof Error ? error.message : 'กรุณาลองใหม่');
    }
  };

  const saveDisplayName = async () => {
    const name = editName.trim();
    if (!name) { showMessage('ชื่อไม่ถูกต้อง', 'กรุณากรอกชื่อที่ต้องการใช้'); return; }
    setSaving(true);
    try {
      await updateProfile({ displayName: name });
      setEditVisible(false);
      showMessage('บันทึกแล้ว', 'อัปเดตชื่อโปรไฟล์เรียบร้อย');
    } catch (error) {
      showMessage('บันทึกไม่สำเร็จ', error instanceof Error ? error.message : 'กรุณาลองใหม่');
    } finally { setSaving(false); }
  };

  const saveCurrency = async (nextCurrency: 'THB' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'SGD' | 'MYR') => {
    try { await updateProfile({ currency: nextCurrency }); }
    catch (error) { showMessage('บันทึกสกุลเงินไม่สำเร็จ', error instanceof Error ? error.message : 'กรุณาลองใหม่'); }
  };

  const chooseCurrency = () => {
    const options = ['THB', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'MYR'] as const;
    if (Platform.OS === 'web') {
      const selected = window.prompt(`เลือกสกุลเงิน (ปัจจุบัน: ${currency})\nตัวเลือก: ${options.join(', ')}`, currency);
      if (!selected) return;
      const next = selected.trim().toUpperCase();
      if ((options as readonly string[]).includes(next)) {
        void saveCurrency(next as typeof options[number]);
      } else {
        showMessage('สกุลเงินไม่ถูกต้อง', `เลือกได้เฉพาะ: ${options.join(', ')}`);
      }
      return;
    }
    Alert.alert('เลือกสกุลเงิน', 'สกุลเงินที่ใช้แสดงผลในแอป', [
      ...options.map(value => ({
        text: value === currency ? `✓ ${value}` : value, onPress: () => { void saveCurrency(value); },
      })),
      { text: 'ยกเลิก', style: 'cancel' },
    ]);
  };

  // The route exists at app/paywall.tsx; cast while Expo Router's generated route types refresh in the workspace.
  const showProInfo = () => router.push('/paywall' as any);

  const handleSignOut = () => {
    const confirmSignOut = async () => {
      try {
        await signOut();
        router.replace('/(auth)/login');
      } catch (error) {
        showMessage('ออกจากระบบไม่สำเร็จ', error instanceof Error ? error.message : 'กรุณาลองใหม่');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('ยืนยันการออกจากระบบ?')) void confirmSignOut();
      return;
    }
    Alert.alert('ออกจากระบบ', 'ยืนยันการออกจากระบบ?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ออกจากระบบ', style: 'destructive', onPress: () => { void confirmSignOut(); } },
    ]);
  };

  const handleDeleteAccount = () => showMessage(
    'ลบบัญชี',
    'การลบบัญชีต้องใช้บริการฝั่งเซิร์ฟเวอร์ที่ตรวจสอบสิทธิ์อย่างปลอดภัย ซึ่งยังไม่ได้ติดตั้ง จึงยังไม่ลบบัญชีของคุณ',
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80, alignItems: 'center' }}>

        {/* ── Hero header ─────────────────────────────────── */}
        <LinearGradient
          colors={isDark ? ['#0D1F35', '#141927'] : ['#1B3557', '#22487A']}
          style={[styles.hero, { paddingTop: insets.top + 20 }]}
        >
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <LinearGradient colors={['#2F6293', '#1B3557']} style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            {isProUser && (
              <View style={styles.proBadge}>
                <FlameIcon size={10} color="#fff" />
              </View>
            )}
          </View>

          <Text style={styles.heroName}>{profile?.displayName ?? 'ผู้ใช้ RoastMyWallet'}</Text>
          <Text style={styles.heroEmail}>{user?.email ?? ''}</Text>

          {/* Stats row */}
          <View style={styles.heroStats}>
            <HeroStat value={formatCurrency(avoided, currency, { compact: true })} label="ประหยัดได้" accent="#E8A030" />
            <View style={styles.heroStatDiv} />
            <HeroStat value={String(avoidedCount)} label="ไม่ซื้อแล้ว" accent="#52B57D" />
            <View style={styles.heroStatDiv} />
            <HeroStat value={String(purchases.filter(p => p.status === 'waiting').length)} label="กำลังรอ" accent="#5A96C3" />
          </View>
        </LinearGradient>

        <View style={[styles.content, { paddingHorizontal: 16 }]}>
          {/* ── Subscription ────────────────────────────────── */}
          {isProUser ? (
            <View style={[styles.proCard, { borderColor: '#E8A030' + '30', backgroundColor: isDark ? '#1A1A0D' : '#FFFBF0' }]}>
              <FlameIcon size={22} color="#E8A030" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.proTitle, { color: colors.textPrimary }]}>RoastMyWallet Pro</Text>
                <Text style={[styles.proSub, { color: colors.textSecondary }]}>ได้รับสิทธิ์ทุกฟีเจอร์แบบไม่จำกัด</Text>
              </View>
              <TouchableOpacity onPress={showProInfo} accessibilityRole="button">
                <Text style={[styles.proManage, { color: '#E8A030' }]}>จัดการ</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <LinearGradient colors={['#1B3557', '#2F6293']} style={styles.upgradeCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.upgradeTitle}>อัพเกรดเป็น Pro</Text>
                <Text style={styles.upgradeSub}>ปลดล็อค AI roast, Squad, Insights ขั้นสูง และอีกมาก</Text>
              </View>
              <TouchableOpacity style={styles.upgradeBtn} onPress={showProInfo} accessibilityRole="button">
                <Text style={styles.upgradeBtnText}>ดูแผน</Text>
                <ArrowRightIcon size={14} color="#1B3557" />
              </TouchableOpacity>
            </LinearGradient>
          )}

          {/* ── Notifications & AI ──────────────────────────── */}
          <SettingsGroup title="การแจ้งเตือน" colors={colors} isDark={isDark}>
            <ToggleRow
              label="การแจ้งเตือนรายวัน"
              hint="Roast เตือนตอน 20:00 และ 13:15"
              icon={<BellIcon size={18} color={colors.textSecondary} />}
              value={notifs} onChange={(value: boolean) => { void saveSetting('notificationsEnabled', value); }} colors={colors}
            />
            <Divider colors={colors} />
            <ToggleRow
              label="AI วิเคราะห์"
              hint="ให้ AI ช่วยคำนวณ Need Score"
              icon={<FlameIcon size={18} color={colors.textSecondary} />}
              value={aiOn} onChange={(value: boolean) => { void saveSetting('aiEnabled', value); }} colors={colors}
            />
          </SettingsGroup>

          {/* ── Account settings ─────────────────────────────── */}
          <SettingsGroup title="บัญชีและความปลอดภัย" colors={colors} isDark={isDark}>
            <SettingsRow label="แก้ไขโปรไฟล์" icon={<UserIcon size={18} color={colors.textSecondary} />} onPress={() => { setEditName(profile?.displayName ?? ''); setEditVisible(true); }} colors={colors} />
            <Divider colors={colors} />
            <SettingsRow label="เปลี่ยนรหัสผ่าน" icon={<ShieldIcon size={18} color={colors.textSecondary} />} onPress={() => router.push('/(auth)/forgot-password')} colors={colors} />
            <Divider colors={colors} />
            <SettingsRow label="สกุลเงิน" value={currency} icon={<WalletIcon size={18} color={colors.textSecondary} />} onPress={chooseCurrency} colors={colors} />
          </SettingsGroup>

          {/* ── Danger zone ──────────────────────────────────── */}
          <SettingsGroup title="" colors={colors} isDark={isDark}>
            <TouchableOpacity style={styles.dangerRow} onPress={handleSignOut}>
              <Text style={[styles.dangerText, { color: colors.textSecondary }]}>ออกจากระบบ</Text>
            </TouchableOpacity>
            <Divider colors={colors} />
            <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteAccount}>
              <Text style={[styles.dangerText, { color: '#D46060' }]}>ลบบัญชี</Text>
            </TouchableOpacity>
          </SettingsGroup>

          {/* Version */}
          <Text style={[styles.version, { color: colors.textMuted }]}>
            RoastMyWallet v1.0.0 · SDK 57
          </Text>
        </View>
      </ScrollView>

      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKeyboard}>
            <View style={[styles.modalCard, { backgroundColor: isDark ? '#141927' : '#fff', borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>แก้ไขโปรไฟล์</Text>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>ชื่อที่แสดง</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="ชื่อของคุณ"
                placeholderTextColor={colors.textMuted}
                maxLength={60}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveDisplayName}
                style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border }]}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setEditVisible(false)} disabled={saving}>
                  <Text style={{ color: colors.textSecondary }}>ยกเลิก</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={saveDisplayName} disabled={saving}>
                  <Text style={styles.modalSaveText}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

function HeroStat({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <View style={styles.heroStatItem}>
      <Text style={[styles.heroStatValue, { color: accent }]}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function SettingsGroup({ title, children, colors, isDark }: any) {
  return (
    <View style={styles.group}>
      {title ? <Text style={[styles.groupTitle, { color: colors.textMuted }]}>{title}</Text> : null}
      <View style={[styles.groupCard, { backgroundColor: isDark ? '#141927' : '#fff', borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function SettingsRow({ label, hint, icon, value, onPress, colors }: any) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {icon && <View style={styles.rowIcon}>{icon}</View>}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
        {hint && <Text style={[styles.rowHint, { color: colors.textMuted }]}>{hint}</Text>}
      </View>
      <View style={styles.rowRight}>
        {value && <Text style={[styles.rowValue, { color: colors.textMuted }]}>{value}</Text>}
        <ArrowRightIcon size={14} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function ToggleRow({ label, hint, icon, value, onChange, colors }: any) {
  return (
    <View style={styles.row}>
      {icon && <View style={styles.rowIcon}>{icon}</View>}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
        {hint && <Text style={[styles.rowHint, { color: colors.textMuted }]}>{hint}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff" />
    </View>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 20, alignItems: 'center', gap: 8, width: '100%', maxWidth: 900 },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatar: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  proBadge: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: '#E8A030', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0D1F35' },
  heroName: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  heroEmail: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  heroStats: { flexDirection: 'row', marginTop: 12, width: '100%', maxWidth: 520, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  heroStatItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  heroStatValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  heroStatDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 },
  content: { gap: 12, paddingTop: 16, paddingHorizontal: 16, width: '100%', maxWidth: 720, alignSelf: 'center' },
  proCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 16, borderWidth: 1 },
  proTitle: { fontSize: 15, fontWeight: '700' },
  proSub: { fontSize: 12, marginTop: 2 },
  proManage: { fontSize: 13, fontWeight: '600' },
  upgradeCard: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  upgradeTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  upgradeSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3, lineHeight: 17 },
  upgradeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  upgradeBtnText: { color: '#1B3557', fontSize: 13, fontWeight: '700' },
  group: { gap: 6 },
  groupTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', paddingLeft: 4 },
  groupCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, minHeight: 52 },
  rowIcon: {},
  rowLabel: { fontSize: 15 },
  rowHint: { fontSize: 11, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 13 },
  divider: { height: 1, marginLeft: 16 },
  dangerRow: { paddingHorizontal: 16, paddingVertical: 14, minHeight: 52, justifyContent: 'center' },
  dangerText: { fontSize: 15 },
  version: { textAlign: 'center', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', paddingVertical: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 24 },
  modalKeyboard: { width: '100%' },
  modalCard: { borderRadius: 20, padding: 20, borderWidth: 1, gap: 12 },
  modalTitle: { fontSize: 19, fontWeight: '800' },
  modalLabel: { fontSize: 13 },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  modalCancel: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 },
  modalSave: { backgroundColor: '#2F6293', paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10 },
  modalSaveText: { color: '#fff', fontWeight: '700' },
});
