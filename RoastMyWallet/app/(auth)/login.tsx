import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';
import { AuthTabs } from '@/components/ui/AuthTabs';
import { SocialAuthButtons } from '@/components/ui/SocialAuthButtons';
import { MailIcon, LockIcon } from '@/components/icons/RmwIcons';

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'กรุณาใส่อีเมล';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (!password) e.password = 'กรุณาใส่รหัสผ่าน';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) { shake(); return; }
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch {
      setErrors({ password: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      shake();
    }
  };

  return (
    <AuthShell
      title="จัดการการเงินให้เป็นเรื่องง่าย"
      subtitle="หยุดคิดก่อนซื้อ แล้วเก็บเงินได้มากขึ้น"
      footer={
        <Text style={styles.footerText}>
          ยังไม่มีบัญชี?{' '}
          <Text style={styles.footerLink} onPress={() => router.replace('/(auth)/register')} accessibilityRole="link">สมัครสมาชิก</Text>
        </Text>
      }
    >
      <AuthTabs active="login" />

      <Animated.View style={{ gap: 14, transform: [{ translateX: shakeAnim }] }}>
        <AuthField
          label="อีเมล"
          icon={<MailIcon size={20} color={colors.textMuted} />}
          value={email}
          onChangeText={(t: string) => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
          placeholder="example@email.com"
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <AuthField
          ref={passwordRef}
          label="รหัสผ่าน"
          icon={<LockIcon size={20} color={colors.textMuted} />}
          value={password}
          onChangeText={(t: string) => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
          placeholder="กรอกรหัสผ่าน"
          error={errors.password}
          password
          autoComplete="current-password"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.primary }, isLoading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>{isLoading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgot} accessibilityRole="link">
          <Text style={[styles.forgotText, { color: colors.primary }]}>ลืมรหัสผ่าน?</Text>
        </TouchableOpacity>

        <SocialAuthButtons />
      </Animated.View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  cta: { minHeight: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  forgot: { alignSelf: 'center', paddingVertical: 2 },
  forgotText: { fontSize: 13, fontWeight: '600' },
  footerText: { color: 'rgba(255,255,255,0.72)', fontSize: 14 },
  footerLink: { color: '#93C5FD', fontWeight: '700' },
});
