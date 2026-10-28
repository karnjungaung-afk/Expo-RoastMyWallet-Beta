import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
  type TextInputProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { RoastMascot } from '@/components/icons/RoastMascot';
import { FlameIcon, ShieldIcon } from '@/components/icons/RmwIcons';
import { spacing } from '@/theme/tokens';

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
    <LinearGradient
      colors={isDark ? ['#070D1A', '#0D1F35', '#111827'] : ['#0D1F35', '#1B3557', '#22487A']}
      style={styles.root}
    >
      {/* Glow blobs */}
      <View style={[styles.blob1, { backgroundColor: 'rgba(90,150,195,0.15)' }]} />
      <View style={[styles.blob2, { backgroundColor: 'rgba(232,160,48,0.08)' }]} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Mascot + Brand */}
          <View style={styles.brand}>
            <RoastMascot size={88} mode="neutral" />
            <Text style={styles.brandName}>RoastMyWallet</Text>
            <Text style={styles.brandTagline}>คิดก่อนซื้อ — จ่ายน้อยลง</Text>
          </View>

          {/* Form Card */}
          <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.cardTitle}>เข้าสู่ระบบ</Text>

            {/* Email */}
            <FloatInput
              label="อีเมล"
              value={email}
              onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              isFocused={focusedField === 'email'}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />

            {/* Password */}
            <FloatInput
              ref={passwordRef}
              label="รหัสผ่าน"
              value={password}
              onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
              error={errors.password}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              isFocused={focusedField === 'password'}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />

            {/* Forgot password */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotWrap}
            >
              <Text style={styles.forgotText}>ลืมรหัสผ่าน?</Text>
            </TouchableOpacity>

            {/* Login button */}
            <LinearGradient colors={['#1B3557', '#2F6293']} style={styles.loginGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
                {isLoading
                  ? <Text style={styles.loginBtnText}>กำลังเข้าสู่ระบบ...</Text>
                  : <>
                      <ShieldIcon size={18} color="#fff" />
                      <Text style={styles.loginBtnText}>เข้าสู่ระบบ</Text>
                    </>
                }
              </TouchableOpacity>
            </LinearGradient>

            {/* Register link */}
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.switchWrap}>
              <Text style={styles.switchText}>ยังไม่มีบัญชี? </Text>
              <Text style={[styles.switchText, styles.switchLink]}>สมัครสมาชิก</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Value props */}
          <View style={styles.valueProps}>
            {[
              { icon: <FlameIcon size={14} color="#E8A030" />, label: 'ช่วยหยุดซื้อของแบบหุนหันพลันแล่น' },
              { icon: <ShieldIcon size={14} color="#5A96C3" />, label: 'บันทึกเงินที่ประหยัดได้ทุกเดือน' },
            ].map((v, i) => (
              <View key={i} style={styles.valuePropRow}>
                {v.icon}
                <Text style={styles.valuePropText}>{v.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ── Float-label Input ─────────────────────────────────────────────────────────
interface FloatInputProps extends Omit<TextInputProps, 'value' | 'onFocus' | 'onBlur' | 'onChangeText'> {
  label: string;
  value: string;
  error?: string;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChangeText: (text: string) => void;
}
const FloatInput = React.forwardRef<React.ComponentRef<typeof TextInput>, FloatInputProps>(
  ({ label, value, error, isFocused, onFocus, onBlur, ...rest }, ref) => {
    const hasValue = value.length > 0;
    const active = isFocused || hasValue;
    const labelScale = useRef(new Animated.Value(active ? 0 : 1)).current;
    const labelY = useRef(new Animated.Value(active ? -22 : 0)).current;

    React.useEffect(() => {
      Animated.parallel([
        Animated.timing(labelScale, { toValue: active ? 0.78 : 1, duration: 160, useNativeDriver: true }),
        Animated.timing(labelY, { toValue: active ? -22 : 0, duration: 160, useNativeDriver: true }),
      ]).start();
    }, [active]);

    const borderColor = error ? '#D46060' : isFocused ? '#5A96C3' : 'rgba(255,255,255,0.12)';

    return (
      <View style={floatStyles.wrap}>
        <Animated.Text
          style={[floatStyles.floatLabel, {
            transform: [{ scale: labelScale }, { translateY: labelY }],
            color: error ? '#D46060' : isFocused ? '#88B8D9' : 'rgba(255,255,255,0.4)',
          }]}
        >
          {label}
        </Animated.Text>
        <TextInput
          ref={ref}
          style={[floatStyles.input, { borderColor }]}
          value={value}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholderTextColor="transparent"
          {...rest}
        />
        {error && <Text style={floatStyles.error}>{error}</Text>}
      </View>
    );
  }
);

const floatStyles = StyleSheet.create({
  wrap: { marginBottom: 20, position: 'relative' },
  floatLabel: {
    position: 'absolute', top: 18, left: 16,
    fontSize: 15, zIndex: 1, transformOrigin: 'left center' as any,
  },
  input: {
    height: 56, borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6,
    fontSize: 16, color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  error: { marginTop: 4, fontSize: 12, color: '#D46060', marginLeft: 4 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  blob1: { position: 'absolute', top: -60, right: -80, width: 260, height: 260, borderRadius: 130 },
  blob2: { position: 'absolute', bottom: 100, left: -60, width: 200, height: 200, borderRadius: 100 },
  scroll: { paddingHorizontal: 20, gap: 24, alignItems: 'center', width: '100%' },
  brand: { alignItems: 'center', gap: 10, width: '100%', maxWidth: 460 },
  brandName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.8 },
  brandTagline: { fontSize: 14, color: 'rgba(255,255,255,0.45)' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24, padding: 24, width: '100%', maxWidth: 460,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 20, letterSpacing: -0.4 },
  forgotWrap: { alignItems: 'flex-end', marginTop: -8, marginBottom: 20 },
  forgotText: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  loginGradient: { borderRadius: 14, overflow: 'hidden' },
  loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchWrap: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  switchText: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  switchLink: { color: '#88B8D9', fontWeight: '600' },
  valueProps: { gap: 10, paddingHorizontal: 8, width: '100%', maxWidth: 460 },
  valuePropRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  valuePropText: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
});
