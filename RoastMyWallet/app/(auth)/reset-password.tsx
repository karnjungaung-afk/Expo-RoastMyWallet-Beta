import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { CheckIcon, ShieldIcon } from '@/components/icons/RmwIcons';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { updatePassword } = useAuthStore();

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [errors, setErrors]       = useState<{ password?: string; confirm?: string; general?: string }>({});
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [focused, setFocused]     = useState<string | null>(null);
  const confirmRef = useRef<TextInput>(null);
  const shakeAnim  = useRef(new Animated.Value(0)).current;

  const shake = () => Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 8,  duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 5,  duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
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
    setLoading(true);
    setErrors({});
    try {
      await updatePassword(password);
      setSuccess(true);
    } catch (err: any) {
      setErrors({ general: err?.message ?? 'เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่' });
      shake();
    } finally {
      setLoading(false);
    }
  };

  const strengthScore = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8)  score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ['', 'อ่อนมาก', 'อ่อน', 'ปานกลาง', 'แข็งแกร่ง', 'แข็งแกร่งมาก'][strengthScore];
  const strengthColor = ['', '#D45050', '#E8A030', '#C07820', '#2E7A4F', '#1A5C34'][strengthScore];

  if (success) {
    return (
      <LinearGradient colors={['#070D1A', '#0D1F35', '#111827']} style={styles.root}>
        <View style={[styles.successWrap, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
          <View style={styles.successIcon}>
            <CheckIcon size={40} color="#52B57D" />
          </View>
          <Text style={styles.successTitle}>เปลี่ยนรหัสผ่านสำเร็จ!</Text>
          <Text style={styles.successSub}>
            รหัสผ่านของคุณถูกอัปเดตแล้ว{'\n'}สามารถใช้รหัสใหม่ในการเข้าสู่ระบบได้เลย
          </Text>
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.successBtnText}>ไปหน้าหลัก</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#070D1A', '#0D1F35', '#111827']} style={styles.root}>
      <View style={[styles.blob, { backgroundColor: 'rgba(90,150,195,0.1)' }]} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inner, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>

          {/* Icon + title */}
          <View style={styles.topSection}>
            <View style={styles.iconWrap}>
              <ShieldIcon size={32} color="#5A96C3" />
            </View>
            <Text style={styles.title}>ตั้งรหัสผ่านใหม่</Text>
            <Text style={styles.sub}>ใส่รหัสผ่านใหม่ที่ต้องการตั้ง{'\n'}อย่างน้อย 8 ตัวอักษร</Text>
          </View>

          {/* Form */}
          <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>
            {/* General error */}
            {errors.general && (
              <View style={styles.generalError}>
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            )}

            {/* New password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>รหัสผ่านใหม่</Text>
              <View style={[styles.inputRow, {
                borderColor: errors.password ? '#D45050' : focused === 'password' ? '#5A96C3' : 'rgba(255,255,255,0.12)',
              }]}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
                  placeholder="รหัสผ่านใหม่"
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  secureTextEntry={!showPass}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                />
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                  <Text style={styles.eyeText}>{showPass ? 'ซ่อน' : 'แสดง'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}

              {/* Strength bar */}
              {password.length > 0 && (
                <View style={styles.strengthWrap}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <View
                        key={i}
                        style={[styles.strengthBar, {
                          backgroundColor: i <= strengthScore ? strengthColor : 'rgba(255,255,255,0.1)',
                        }]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                    {strengthLabel}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>ยืนยันรหัสผ่าน</Text>
              <View style={[styles.inputRow, {
                borderColor: errors.confirm ? '#D45050' : confirm && confirm === password ? '#52B57D' : focused === 'confirm' ? '#5A96C3' : 'rgba(255,255,255,0.12)',
              }]}>
                <TextInput
                  ref={confirmRef}
                  style={styles.input}
                  value={confirm}
                  onChangeText={t => { setConfirm(t); setErrors(e => ({ ...e, confirm: undefined })); }}
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  secureTextEntry={!showConf}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  onFocus={() => setFocused('confirm')}
                  onBlur={() => setFocused(null)}
                />
                <TouchableOpacity onPress={() => setShowConf(v => !v)} style={styles.eyeBtn}>
                  <Text style={styles.eyeText}>{showConf ? 'ซ่อน' : 'แสดง'}</Text>
                </TouchableOpacity>
              </View>
              {errors.confirm
                ? <Text style={styles.fieldError}>{errors.confirm}</Text>
                : confirm && confirm === password
                ? <Text style={styles.fieldMatch}>รหัสผ่านตรงกัน</Text>
                : null
              }
            </View>

            {/* Password tips */}
            <View style={styles.tips}>
              {[
                { ok: password.length >= 8, text: 'อย่างน้อย 8 ตัวอักษร' },
                { ok: /[A-Z]/.test(password), text: 'มีตัวพิมพ์ใหญ่ (A-Z)' },
                { ok: /[0-9]/.test(password), text: 'มีตัวเลข (0-9)' },
                { ok: /[^A-Za-z0-9]/.test(password), text: 'มีอักขระพิเศษ (!@#$...)' },
              ].map(tip => (
                <View key={tip.text} style={styles.tipRow}>
                  <View style={[styles.tipDot, { backgroundColor: tip.ok ? '#52B57D' : 'rgba(255,255,255,0.2)' }]} />
                  <Text style={[styles.tipText, { color: tip.ok ? '#52B57D' : 'rgba(255,255,255,0.4)' }]}>
                    {tip.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Submit */}
            <LinearGradient
              colors={strengthScore >= 3 ? ['#1B3557', '#2F6293'] : ['#1A2030', '#252B38']}
              style={styles.submitGrad}
            >
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={loading || strengthScore < 1}
                activeOpacity={0.85}
              >
                {loading
                  ? <Text style={styles.submitText}>กำลังบันทึก...</Text>
                  : <><ShieldIcon size={18} color="#fff" /><Text style={styles.submitText}>บันทึกรหัสผ่านใหม่</Text></>
                }
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  blob: { position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: 110 },
  inner: { flex: 1, paddingHorizontal: 26, gap: 28 },
  topSection: { alignItems: 'center', gap: 10 },
  iconWrap: { width: 68, height: 68, borderRadius: 22, backgroundColor: 'rgba(90,150,195,0.12)', borderWidth: 1, borderColor: 'rgba(90,150,195,0.25)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.6, textAlign: 'center' },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 21 },
  form: { gap: 18 },
  generalError: { backgroundColor: 'rgba(212,80,80,0.15)', borderWidth: 1, borderColor: 'rgba(212,80,80,0.3)', borderRadius: 12, padding: 12 },
  generalErrorText: { color: '#D45050', fontSize: 14, textAlign: 'center' },
  fieldWrap: { gap: 7 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', paddingRight: 12 },
  input: { flex: 1, height: 54, paddingHorizontal: 16, fontSize: 16, color: '#fff' },
  eyeBtn: { paddingLeft: 8 },
  eyeText: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  fieldError: { fontSize: 12, color: '#D45050', marginLeft: 4 },
  fieldMatch: { fontSize: 12, color: '#52B57D', marginLeft: 4 },
  strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600', minWidth: 80, textAlign: 'right' },
  tips: { gap: 7, paddingLeft: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3 },
  tipText: { fontSize: 13 },
  submitGrad: { borderRadius: 14 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 32 },
  successIcon: { width: 88, height: 88, borderRadius: 28, backgroundColor: 'rgba(82,181,125,0.12)', borderWidth: 1, borderColor: 'rgba(82,181,125,0.25)', alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.6, textAlign: 'center' },
  successSub: { fontSize: 15, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 23 },
  successBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  successBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
