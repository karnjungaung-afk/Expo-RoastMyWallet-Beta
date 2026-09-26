import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Mail, Lock } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { spacing, typography } from '@/theme/tokens';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { signUp, isLoading } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
  }>({});

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!displayName.trim()) e.displayName = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'At least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await signUp(email.trim(), password, displayName.trim());
      router.replace('/(tabs)');
    } catch (err: any) {
      // Email confirmation required — this is success, not a failure
      if (err?.code === 'email_confirmation_required') {
        setNeedsConfirmation(true);
        return;
      }
      const msg = err?.message ?? 'Registration failed. Please try again.';
      Alert.alert('Registration failed', msg);
    }
  };

  // Show confirmation screen if email confirmation is required
  if (needsConfirmation) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: 'center', padding: spacing[6] }]}>
        <Text style={[styles.title, { color: colors.textPrimary, marginBottom: spacing[3] }]}>
          Check your email
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: spacing[6] }]}>
          We sent a confirmation link to {email}. Click it to activate your account, then come back to sign in.
        </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={[{ color: colors.primary, fontWeight: '600', textAlign: 'center' }]}>
            Go to sign in →
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing[6], paddingBottom: insets.bottom + spacing[8] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Create account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Start saving money by pausing impulse buys.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Display name"
              value={displayName}
              onChangeText={setDisplayName}
              error={errors.displayName}
              placeholder="How should we call you?"
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              leftIcon={<User size={16} color={colors.textMuted} />}
              required
            />

            <Input
              ref={emailRef}
              label="Email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              leftIcon={<Mail size={16} color={colors.textMuted} />}
              required
            />

            <Input
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              placeholder="8+ characters"
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              leftIcon={<Lock size={16} color={colors.textMuted} />}
              hint="At least 8 characters"
              required
            />
          </View>

          <Button
            label="Create account"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            onPress={handleRegister}
          />

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="link"
            >
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                Sign in
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.legal, { color: colors.textMuted }]}>
            By creating an account, you agree to our Terms of Service and Privacy Policy. We never sell your data.
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing[6],
    gap: spacing[5],
  },
  header: {
    gap: spacing[1.5],
    marginBottom: spacing[2],
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: typography.size.base,
    lineHeight: 22,
  },
  form: {
    gap: spacing[4],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: { fontSize: typography.size.sm },
  footerLink: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  legal: {
    fontSize: typography.size.xs,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing[2],
  },
});
