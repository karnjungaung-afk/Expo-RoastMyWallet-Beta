import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { CheckIcon, ArrowRightIcon, ShieldIcon } from '@/components/icons/RmwIcons';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resetPassword } = useAuthStore();
  const [email, setEmail]   = useState('');
  const [error, setError]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 8,  duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
  ]).start();

  const handleReset = async () => {
    if (!email.trim()) { setError('กรุณาใส่อีเมล'); shake(); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('รูปแบบอีเมลไม่ถูกต้อง'); shake(); return; }
    setError(''); setLoading(true);
    try { await resetPassword(email.trim()); setSent(true); }
    catch (e: any) { setError(e?.message ?? 'ส่งลิงก์รีเซ็ตไม่สำเร็จ'); shake(); }
    finally { setLoading(false); }
  };

  return (
    <LinearGradient colors={['#070D1A', '#0D1F35', '#111827']} style={styles.root}>
      <View style={[styles.blob, { backgroundColor: 'rgba(90,150,195,0.1)' }]} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}>

          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← กลับ</Text>
          </TouchableOpacity>

          {sent ? (
            /* ── Success state ── */
            <View style={styles.successWrap}>
              <View style={styles.successIcon}>
                <CheckIcon size={40} color="#52B57D" />
              </View>
              <Text style={styles.title}>ตรวจสอบอีเมล</Text>
              <Text style={styles.sub}>เราส่งลิงก์รีเซ็ตรหัสผ่านไปที่{'\n'}<Text style={{ color: '#88B8D9', fontWeight: '700' }}>{email}</Text></Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.backToLogin}>
                <Text style={styles.backToLoginText}>กลับไปเข้าสู่ระบบ</Text>
                <ArrowRightIcon size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Form ── */
            <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>
              <View style={styles.iconWrap}>
                <ShieldIcon size={32} color="#5A96C3" />
              </View>
              <Text style={styles.title}>ลืมรหัสผ่าน?</Text>
              <Text style={styles.sub}>ใส่อีเมลที่สมัครไว้ เราจะส่งลิงก์รีเซ็ตให้</Text>

              <View style={styles.inputWrap}>
                <TextInput
                  style={[styles.input, {
                    borderColor: error ? '#D46060' : focused ? '#5A96C3' : 'rgba(255,255,255,0.12)',
                    color: '#fff',
                  }]}
                  value={email}
                  onChangeText={t => { setEmail(t); setError(''); }}
                  placeholder="อีเมลของคุณ"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleReset}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>

              <LinearGradient colors={['#1B3557', '#2F6293']} style={styles.submitGrad}>
                <TouchableOpacity style={styles.submitBtn} onPress={handleReset} disabled={loading} activeOpacity={0.85}>
                  <Text style={styles.submitText}>{loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ต'}</Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  blob: { position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: 110 },
  inner: { flex: 1, paddingHorizontal: 28 },
  backBtn: { paddingVertical: 8, alignSelf: 'flex-start', marginBottom: 12 },
  backText: { color: 'rgba(255,255,255,0.4)', fontSize: 15 },
  iconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(90,150,195,0.12)', borderWidth: 1, borderColor: 'rgba(90,150,195,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  form: { flex: 1, justifyContent: 'center', gap: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.8 },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 22 },
  inputWrap: { gap: 6, marginTop: 8 },
  input: { height: 56, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, backgroundColor: 'rgba(255,255,255,0.05)' },
  errorText: { fontSize: 12, color: '#D46060', marginLeft: 4 },
  submitGrad: { borderRadius: 14, overflow: 'hidden' },
  submitBtn: { paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  successIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(82,181,125,0.12)', borderWidth: 1, borderColor: 'rgba(82,181,125,0.25)', alignItems: 'center', justifyContent: 'center' },
  backToLogin: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginTop: 8 },
  backToLoginText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
