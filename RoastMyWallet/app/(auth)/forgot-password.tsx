import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';
import { MailIcon, CheckIcon } from '@/components/icons/RmwIcons';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { resetPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
  ]).start();

  const handleReset = async () => {
    if (!email.trim()) { setError('กรุณาใส่อีเมล'); shake(); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('รูปแบบอีเมลไม่ถูกต้อง'); shake(); return; }
    setError(''); setLoading(true);
    try { await resetPassword(email.trim()); setSent(true); }
    catch (e: any) { setError(e?.message ?? 'ส่งลิงก์รีเซ็ตไม่สำเร็จ'); shake(); }
    finally { setLoading(false); }
  };

  const goLogin = () => router.replace('/(auth)/login');
  const goBack = () => (router.canGoBack() ? router.back() : goLogin());

  return (
    <AuthShell backLabel="ลืมรหัสผ่าน" onBack={goBack}>
      {sent ? (
        <View style={styles.sentWrap}>
          <View style={[styles.sentIcon, { backgroundColor: colors.successSubtle }]}>
            <CheckIcon size={34} color={colors.success} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>ตรวจสอบอีเมลของคุณ</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            เราส่งลิงก์รีเซ็ตรหัสผ่านไปที่{'\n'}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{email}</Text>
          </Text>
          <TouchableOpacity style={[styles.cta, { backgroundColor: colors.primary, alignSelf: 'stretch' }]} onPress={goLogin} accessibilityRole="button">
            <Text style={styles.ctaText}>กลับไปเข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View style={{ gap: 14, transform: [{ translateX: shakeAnim }] }}>
          <View style={{ gap: 4 }}>
            <Text style={[styles.title, { color: colors.textPrimary, textAlign: 'left' }]}>รีเซ็ตรหัสผ่าน</Text>
            <Text style={[styles.sub, { color: colors.textMuted, textAlign: 'left' }]}>ใส่อีเมลที่ใช้สมัคร เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้</Text>
          </View>
          <AuthField
            label="อีเมล"
            icon={<MailIcon size={20} color={colors.textMuted} />}
            value={email}
            onChangeText={(t: string) => { setEmail(t); setError(''); }}
            placeholder="example@email.com"
            error={error}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleReset}
          />
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>{loading ? 'กำลังส่ง…' : 'ส่งลิงก์รีเซ็ต'}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center' },
  sub: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  cta: { minHeight: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sentWrap: { alignItems: 'center', gap: 14, paddingVertical: 8 },
  sentIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
