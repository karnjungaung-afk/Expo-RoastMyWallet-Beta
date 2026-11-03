import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';
import { LockIcon, CheckIcon } from '@/components/icons/RmwIcons';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { updatePassword } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const confirmRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 5, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
  ]).start();

  const validate = () => {
    const e: typeof errors = {};
    if (!password) e.password = 'กรุณาใส่รหัสผ่านใหม่';
    else if (password.length < 8) e.password = 'ต้องมีอย่างน้อย 8 ตัวอักษร';
    if (!confirm) e.confirm = 'กรุณายืนยันรหัสผ่าน';
    else if (password !== confirm) e.confirm = 'รหัสผ่านไม่ตรงกัน';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) { shake(); return; }
    setLoading(true); setErrors({});
    try { await updatePassword(password); setSuccess(true); }
    catch (err: any) { setErrors({ general: err?.message ?? 'เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่' }); shake(); }
    finally { setLoading(false); }
  };

  const checks = [
    { ok: password.length >= 8, text: 'อย่างน้อย 8 ตัวอักษร' },
    { ok: /[A-Z]/.test(password), text: 'มีตัวพิมพ์ใหญ่ (A-Z)' },
    { ok: /[0-9]/.test(password), text: 'มีตัวเลข (0-9)' },
    { ok: /[^A-Za-z0-9]/.test(password), text: 'มีอักขระพิเศษ' },
  ];
  const score = checks.filter(c => c.ok).length + (password.length >= 12 ? 1 : 0);
  const strength = [
    { label: '', color: colors.border }, { label: 'อ่อนมาก', color: colors.danger }, { label: 'อ่อน', color: colors.warning },
    { label: 'ปานกลาง', color: colors.warning }, { label: 'แข็งแรง', color: colors.success }, { label: 'แข็งแรงมาก', color: colors.success },
  ][Math.min(score, 5)];

  if (success) {
    return (
      <AuthShell backLabel="ตั้งรหัสผ่านใหม่" onBack={() => router.replace('/(tabs)')}>
        <View style={styles.centerWrap}>
          <View style={[styles.bigIcon, { backgroundColor: colors.successSubtle }]}><CheckIcon size={34} color={colors.success} /></View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>เปลี่ยนรหัสผ่านสำเร็จ</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>ใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งต่อไปได้เลย</Text>
          <TouchableOpacity style={[styles.cta, { backgroundColor: colors.primary, alignSelf: 'stretch' }]} onPress={() => router.replace('/(tabs)')} accessibilityRole="button">
            <Text style={styles.ctaText}>ไปหน้าหลัก</Text>
          </TouchableOpacity>
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell backLabel="ตั้งรหัสผ่านใหม่" onBack={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}>
      <View style={{ gap: 4 }}>
        <Text style={[styles.title, { color: colors.textPrimary, textAlign: 'left' }]}>ตั้งรหัสผ่านใหม่</Text>
        <Text style={[styles.sub, { color: colors.textMuted, textAlign: 'left' }]}>เลือกรหัสผ่านที่เดายาก และไม่ซ้ำกับที่อื่น</Text>
      </View>

      <Animated.View style={{ gap: 14, transform: [{ translateX: shakeAnim }] }}>
        {errors.general ? (
          <View style={[styles.alert, { backgroundColor: colors.dangerSubtle }]}>
            <Text style={{ color: colors.dangerText, fontSize: 13 }}>{errors.general}</Text>
          </View>
        ) : null}

        <View style={{ gap: 8 }}>
          <AuthField
            label="รหัสผ่านใหม่"
            icon={<LockIcon size={20} color={colors.textMuted} />}
            value={password}
            onChangeText={(t: string) => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
            placeholder="อย่างน้อย 8 ตัวอักษร"
            error={errors.password}
            password
            autoComplete="new-password"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={styles.bars}>
                {[1, 2, 3, 4, 5].map(i => <View key={i} style={[styles.bar, { backgroundColor: i <= score ? strength.color : colors.border }]} />)}
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}
        </View>

        <AuthField
          ref={confirmRef}
          label="ยืนยันรหัสผ่านใหม่"
          icon={<LockIcon size={20} color={colors.textMuted} />}
          value={confirm}
          onChangeText={(t: string) => { setConfirm(t); setErrors(e => ({ ...e, confirm: undefined })); }}
          placeholder="กรอกรหัสผ่านอีกครั้ง"
          error={errors.confirm}
          password
          autoComplete="new-password"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        <View style={{ gap: 6 }}>
          {checks.map(c => (
            <View key={c.text} style={styles.tipRow}>
              <View style={[styles.tipDot, { backgroundColor: c.ok ? colors.success : colors.border }]} />
              <Text style={{ fontSize: 13, color: c.ok ? colors.success : colors.textMuted }}>{c.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>{loading ? 'กำลังบันทึก…' : 'บันทึกรหัสผ่านใหม่'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center' },
  sub: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  cta: { minHeight: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  alert: { borderRadius: 10, padding: 12 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bars: { flexDirection: 'row', gap: 4, flex: 1 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '700', minWidth: 72, textAlign: 'right' },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3 },
  centerWrap: { alignItems: 'center', gap: 14, paddingVertical: 8 },
  bigIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
