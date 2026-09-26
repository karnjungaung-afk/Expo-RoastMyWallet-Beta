import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { spacing, typography } from '@/theme/tokens';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resetPassword } = useAuthStore();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to send reset email.');
    } finally {
      setLoading(false);
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
            { paddingTop: insets.top + spacing[4], paddingBottom: insets.bottom + spacing[8] },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {sent ? (
            <View style={styles.successState}>
              <CheckCircle size={52} color={colors.success} strokeWidth={1.5} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Check your email
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                We sent a password reset link to{' '}
                <Text style={{ fontWeight: typography.weight.semibold }}>{email}</Text>.
                Check your inbox and follow the link.
              </Text>
              <Button
                label="Back to login"
                variant="primary"
                size="lg"
                fullWidth
                style={{ marginTop: spacing[4] }}
                onPress={() => router.replace('/(auth)/login')}
              />
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Reset password
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Enter your email and we'll send you a reset link.
                </Text>
              </View>

              <Input
                label="Email"
                value={email}
                onChangeText={v => { setEmail(v); setError(''); }}
                error={error}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleReset}
                leftIcon={<Mail size={16} color={colors.textMuted} />}
              />

              <Button
                label="Send reset link"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onPress={handleReset}
              />
            </>
          )}
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
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing[2],
    marginBottom: spacing[2],
  },
  header: { gap: spacing[1.5] },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: typography.size.base,
    lineHeight: 24,
  },
  successState: {
    alignItems: 'center',
    gap: spacing[3],
    paddingTop: spacing[8],
  },
});
