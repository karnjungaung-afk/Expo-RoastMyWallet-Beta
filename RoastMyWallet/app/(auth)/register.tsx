import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';
import { SocialAuthButtons } from '@/components/ui/SocialAuthButtons';
import { UserIcon, MailIcon, LockIcon, CheckIcon } from '@/components/icons/RmwIcons';

type Errors = { displayName?: string; email?: string; password?: string; confirm?: string };

export default function RegisterScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const emailRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const confirmRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 5, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
  ]).start();

  const clear = (k: keyof Errors) => setErrors(e => ({ ...e, [k]: undefined }));

  const validate = () => {
    const e: Errors = {};
    if (!displayName.trim()) e.displayName = 'กรุณาใส่ชื่อ';
    if (!email.trim()) e.email = 'กรุณาใส่อีเมล';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (!password) e.password = 'กรุณาใส่รหัสผ่าน';
    else if (password.length < 8) e.password = 'ต้องมีอย่างน้อย 8 ตัวอักษร';
    if (!confirm) e.confirm = 'กรุณายืนยันรหัสผ่าน';
    else if (confirm !== password) e.confirm = 'รหัสผ่านไม่ตรงกัน';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) { shake(); return; }
    try {
      await signUp(email.trim(), password, displayName.trim());
      router.replace('/(tabs)');
    } catch (err: any) {
      if (err?.code === 'email_confirmation_required') { setNeedsConfirmation(true); return; }
      setErrors({ email: err?.message ?? 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่' });
      shake();
    }
  };

  const goLogin = () => router.replace('/(auth)/login');
  const goBack = () => (router.canGoBack() ? router.back() : goLogin());

  if (needsConfirmation) {
    return (
      <AuthShell backLabel="สมัครสมาชิก" onBack={goLogin}>
        <View style={styles.confirmWrap}>
          <View style={[styles.confirmIcon, { backgroundColor: colors.successSubtle }]}>
            <CheckIcon size={34} color={colors.success} />
          </View>
          <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>ยืนยันอีเมลของคุณ</Text>
          <Text style={[styles.confirmSub, { color: colors.textSecondary }]}>
            เราส่งลิงก์ยืนยันไปที่{'\n'}
            <Text style={{ color: colors.primary, fontFamily: 'Prompt_700Bold' }}>{email}</Text>
            {'\n'}กดลิงก์ในอีเมลเพื่อเปิดใช้งานบัญชี
          </Text>
          <TouchableOpacity style={[styles.cta, { backgroundColor: '#D6F73C', alignSelf: 'stretch' }]} onPress={goLogin} accessibilityRole="button">
            <Text style={styles.ctaText}>กลับไปเข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      backLabel="สมัครสมาชิก"
      onBack={goBack}
      footer={
        <Text style={styles.footerText}>
          มีบัญชีอยู่แล้ว?{' '}
          <Text style={styles.footerLink} onPress={goLogin} accessibilityRole="link">เข้าสู่ระบบ</Text>
        </Text>
      }
    >
      <View style={{ gap: 4 }}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>สร้างบัญชีของคุณ</Text>
        <Text style={[styles.cardSub, { color: colors.textMuted }]}>เริ่มต้นหยุดซื้อของที่ไม่จำเป็นได้ในไม่กี่นาที</Text>
      </View>

      <Animated.View style={{ gap: 14, transform: [{ translateX: shakeAnim }] }}>
        <AuthField
          label="ชื่อผู้ใช้"
          icon={<UserIcon size={20} color={colors.textMuted} />}
          value={displayName}
          onChangeText={(t: string) => { setDisplayName(t); clear('displayName'); }}
          placeholder="ชื่อที่ใช้แสดง"
          error={errors.displayName}
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <AuthField
          ref={emailRef}
          label="อีเมล"
          icon={<MailIcon size={20} color={colors.textMuted} />}
          value={email}
          onChangeText={(t: string) => { setEmail(t); clear('email'); }}
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
          onChangeText={(t: string) => { setPassword(t); clear('password'); }}
          placeholder="อย่างน้อย 8 ตัวอักษร"
          error={errors.password}
          password
          autoComplete="new-password"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <AuthField
          ref={confirmRef}
          label="ยืนยันรหัสผ่าน"
          icon={<LockIcon size={20} color={colors.textMuted} />}
          value={confirm}
          onChangeText={(t: string) => { setConfirm(t); clear('confirm'); }}
          placeholder="กรอกรหัสผ่านอีกครั้ง"
          error={errors.confirm}
          password
          autoComplete="new-password"
          returnKeyType="done"
          onSubmitEditing={handleRegister}
        />

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: '#D6F73C' }, isLoading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={isLoading}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>{isLoading ? 'กำลังสร้างบัญชี…' : 'สร้างบัญชี'}</Text>
        </TouchableOpacity>

        <SocialAuthButtons />
      </Animated.View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 20, fontFamily: 'Prompt_800ExtraBold', letterSpacing: -0.4 },
  cardSub: { fontSize: 13 },
  cta: { minHeight: 52, borderRadius: 14, borderWidth: 2.5, borderColor: '#14110F', boxShadow: '4px 4px 0px 0px #14110F', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  ctaText: { color: '#14110F', fontSize: 16, fontFamily: 'Prompt_700Bold' },
  footerText: { color: '#14110F', fontSize: 14 },
  footerLink: { color: '#14110F', fontFamily: 'Prompt_800ExtraBold', textDecorationLine: 'underline' },
  confirmWrap: { alignItems: 'center', gap: 14, paddingVertical: 12 },
  confirmIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  confirmTitle: { fontSize: 22, fontFamily: 'Prompt_800ExtraBold', textAlign: 'center' },
  confirmSub: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
