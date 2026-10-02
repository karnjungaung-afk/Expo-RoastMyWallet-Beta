import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { spacing, typography } from '@/theme/tokens';

export default function LoginScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { signIn, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const passwordRef = useRef<TextInput>(null);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'At least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.message ?? 'Login failed. Please check your credentials.';
      Alert.alert('Login failed', msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing[8], paddingBottom: insets.bottom + spacing[8] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + wordmark */}
          <View style={styles.logoSection}>
            <LogoMark colors={colors} />
            <Text style={[styles.wordmark, { color: colors.textPrimary }]}>
              RoastMyWallet
            </Text>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>
              Think before you buy.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              leftIcon={<Mail size={16} color={colors.textMuted} />}
            />

            <Input
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              leftIcon={<Lock size={16} color={colors.textMuted} />}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              accessibilityRole="link"
              style={styles.forgotLink}
            >
              <Text style={[styles.forgotText, { color: colors.primary }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <Button
            label="Sign in"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            onPress={handleLogin}
          />

          {/* Register link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              accessibilityRole="link"
            >
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                Create one
              </Text>
            </TouchableOpacity>
          </View>

          {/* Legal note */}
          <Text style={[styles.legal, { color: colors.textMuted }]}>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── LOGO MARK ────────────────────────────────────────────────────────────────
// Geometric mark — no copyrighted characters, purely abstract

function LogoMark({ colors }: { colors: any }) {
  return (
    <View style={[styles.logoMark, { borderColor: colors.primary }]}>
      {/* Inner pause symbol — two rectangles */}
      <View style={styles.pauseSymbol}>
        <View style={[styles.pauseBar, { backgroundColor: colors.primary }]} />
        <View style={[styles.pauseBar, { backgroundColor: colors.primary }]} />
      </View>
      {/* Corner marks — mecha detail */}
      <View style={[styles.cornerTL, { borderColor: colors.mecha }]} />
      <View style={[styles.cornerBR, { borderColor: colors.mecha }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing[6],
    gap: spacing[5],
  },
  logoSection: {
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pauseSymbol: {
    flexDirection: 'row',
    gap: 6,
  },
  pauseBar: {
    width: 6,
    height: 22,
    borderRadius: 2,
  },
  cornerTL: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 8,
    height: 8,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 8,
    height: 8,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  wordmark: {
    fontSize: typography.size['2xl'],
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
  },
  form: {
    gap: spacing[4],
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -spacing[2],
  },
  forgotText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.size.sm,
  },
  footerLink: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  legal: {
    fontSize: typography.size.xs,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing[4],
  },
});
