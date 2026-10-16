import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { RoastMascot } from '@/components/icons/RoastMascot';
import { ShieldIcon, CheckIcon, ArrowRightIcon } from '@/components/icons/RmwIcons';
import { spacing } from '@/theme/tokens';

export default function RegisterScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [errors, setErrors] = useState<{ displayName?: string; email?: string; password?: string }>({});
  const [focused, setFocused] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const emailRef    = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const shakeAnim   = useRef(new Animated.Value(0)).current;

  const shake = () => Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 8,  duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 5,  duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
  ]).start();

  const validate = () => {
    const e: typeof errors = {};
    if (!displayName.trim()) e.displayName = 'กรุณาใส่ชื่อ';
    if (!email.trim()) e.email = 'กรุณาใส่อีเมล';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (!password) e.password = 'กรุณาใส่รหัสผ่าน';
    else if (password.length < 8) e.password = 'ต้องมีอย่างน้อย 8 ตัวอักษร';
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

  if (needsConfirmation) {
    return (
      <LinearGradient colors={['#0D1F35', '#1B3557', '#22487A']} style={styles.root}>
        <View style={[styles.confirmWrap, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
          <View style={[styles.confirmIcon, { backgroundColor: 'rgba(82,181,125,0.15)', borderColor: 'rgba(82,181,125,0.3)' }]}>
            <CheckIcon size={36} color="#52B57D" />
          </View>
          <Text style={styles.confirmTitle}>ยืนยันอีเมลของคุณ</Text>
          <Text style={styles.confirmSub}>เราส่งลิงก์ยืนยันไปที่{'\n'}<Text style={{ color: '#88B8D9', fontWeight: '700' }}>{email}</Text>{'\n'}คลิกลิงก์เพื่อเปิดใช้งานบัญชี</Text>
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            style={styles.confirmBtn}
          >
            <Text style={styles.confirmBtnText}>กลับไปเข้าสู่ระบบ</Text>
            <ArrowRightIcon size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#070D1A', '#0D1F35', '#111827']} style={styles.root}>
      <View style={[styles.blob1, { backgroundColor: 'rgba(82,181,125,0.1)' }]} />
      <View style={[styles.blob2, { backgroundColor: 'rgba(90,150,195,0.08)' }]} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <RoastMascot size={72} mode="neutral" />
            <Text style={styles.brandTitle}>สร้างบัญชีใหม่</Text>
            <Text style={styles.brandSub}>เริ่มประหยัดเงินด้วยการหยุดคิดก่อนซื้อ</Text>
          </View>

          <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
            <DarkFloatInput label="ชื่อที่ใช้แสดง" value={displayName}
              onChangeText={t => { setDisplayName(t); setErrors(e => ({ ...e, displayName: undefined })); }}
              error={errors.displayName} isFocused={focused === 'name'}
              onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
              autoCapitalize="words" returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()} />

            <DarkFloatInput ref={emailRef} label="อีเมล" value={email}
              onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
              error={errors.email} isFocused={focused === 'email'}
              onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
              keyboardType="email-address" autoCapitalize="none" returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()} />

            <DarkFloatInput ref={passwordRef} label="รหัสผ่าน (8 ตัวขึ้นไป)" value={password}
              onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
              error={errors.password} isFocused={focused === 'password'}
              onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
              secureTextEntry returnKeyType="done" onSubmitEditing={handleRegister} />

            <LinearGradient colors={['#235E3B', '#3A9960']} style={styles.submitGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={isLoading} activeOpacity={0.85}>
                {isLoading
                  ? <Text style={styles.submitText}>กำลังสร้างบัญชี...</Text>
                  : <><ShieldIcon size={18} color="#fff" /><Text style={styles.submitText}>สร้างบัญชี</Text></>}
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity onPress={() => router.back()} style={styles.switchWrap}>
              <Text style={styles.switchText}>มีบัญชีแล้ว? </Text>
              <Text style={[styles.switchText, styles.switchLink]}>เข้าสู่ระบบ</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.legal}>การสร้างบัญชีหมายความว่าคุณยอมรับเงื่อนไขการใช้งาน เราไม่เคยขายข้อมูลของคุณ</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

interface DFIProps { label: string; value: string; error?: string; isFocused: boolean; onFocus: () => void; onBlur: () => void; [k: string]: any; }
const DarkFloatInput = React.forwardRef<TextInput, DFIProps>(({ label, value, error, isFocused, onFocus, onBlur, ...rest }, ref) => {
  const active = isFocused || value.length > 0;
  const labelY = useRef(new Animated.Value(active ? -22 : 0)).current;
  const labelScale = useRef(new Animated.Value(active ? 0.78 : 1)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(labelY,     { toValue: active ? -22 : 0, duration: 150, useNativeDriver: true }),
      Animated.timing(labelScale, { toValue: active ? 0.78 : 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [active]);
  return (
    <View style={{ marginBottom: 18, position: 'relative' }}>
      <Animated.Text style={[fiStyles.label, { transform: [{ translateY: labelY }, { scale: labelScale }], color: error ? '#D46060' : isFocused ? '#88B8D9' : 'rgba(255,255,255,0.38)' }]}>{label}</Animated.Text>
      <TextInput ref={ref} style={[fiStyles.input, { borderColor: error ? '#D46060' : isFocused ? '#5A96C3' : 'rgba(255,255,255,0.1)' }]} value={value} onFocus={onFocus} onBlur={onBlur} placeholderTextColor="transparent" {...rest} />
      {error && <Text style={fiStyles.error}>{error}</Text>}
    </View>
  );
});
const fiStyles = StyleSheet.create({
  label: { position: 'absolute', top: 18, left: 16, fontSize: 15, zIndex: 1, transformOrigin: 'left center' as any },
  input: { height: 56, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6, fontSize: 16, color: '#fff', backgroundColor: 'rgba(255,255,255,0.05)' },
  error: { marginTop: 4, fontSize: 12, color: '#D46060', marginLeft: 4 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  blob1: { position: 'absolute', top: -40, right: -80, width: 200, height: 200, borderRadius: 100 },
  blob2: { position: 'absolute', bottom: 80, left: -60, width: 180, height: 180, borderRadius: 90 },
  scroll: { paddingHorizontal: 24, gap: 24 },
  brand: { alignItems: 'center', gap: 8 },
  brandTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.6 },
  brandSub: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  submitGrad: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchWrap: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  switchText: { fontSize: 14, color: 'rgba(255,255,255,0.38)' },
  switchLink: { color: '#88B8D9', fontWeight: '600' },
  legal: { fontSize: 12, color: 'rgba(255,255,255,0.22)', textAlign: 'center', lineHeight: 18 },
  confirmWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 32 },
  confirmIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  confirmTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.6, textAlign: 'center' },
  confirmSub: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 24 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginTop: 8 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
