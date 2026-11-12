import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import {
  signInWithOAuthProvider, oauthErrorMessage, OAuthCancelled, type OAuthProvider,
} from '@/features/auth/oauth';

/** "หรือ" divider + Google / Apple buttons. Apple is shown on iOS and web only. */
export function SocialAuthButtons() {
  const { colors } = useTheme();
  const [busy, setBusy] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (provider: OAuthProvider) => {
    if (busy) return;
    setError(null); setBusy(provider);
    try { await signInWithOAuthProvider(provider); }
    catch (e) { if (!(e instanceof OAuthCancelled)) setError(oauthErrorMessage(e, provider)); }
    finally { setBusy(null); }
  };

  const showApple = Platform.OS === 'ios' || Platform.OS === 'web';

  return (
    <View style={styles.wrap}>
      <View style={styles.orRow}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <Text style={[styles.or, { color: colors.textMuted }]}>หรือ</Text>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.row}>
        <Btn label="Google" a11y="ดำเนินการต่อด้วย Google" colors={colors} loading={busy === 'google'} disabled={!!busy} onPress={() => run('google')}>
          <GoogleG />
        </Btn>
        {showApple && (
          <Btn label="Apple" a11y="ดำเนินการต่อด้วย Apple" colors={colors} loading={busy === 'apple'} disabled={!!busy} onPress={() => run('apple')}>
            <AppleLogo color={colors.textPrimary} />
          </Btn>
        )}
      </View>

      {error && <Text style={[styles.error, { color: colors.danger }]} accessibilityLiveRegion="polite">{error}</Text>}
    </View>
  );
}

function Btn({ label, a11y, colors, loading, disabled, onPress, children }: any) {
  return (
    <TouchableOpacity style={[styles.btn, { borderColor: colors.border, backgroundColor: colors.surface }, disabled && { opacity: 0.6 }]} onPress={onPress} disabled={disabled} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={a11y}>
      {loading ? <ActivityIndicator size="small" color={colors.primary} /> : children}
      <Text style={[styles.btnText, { color: colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function GoogleG() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
    </Svg>
  );
}
function AppleLogo({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill={color} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, marginTop: 2 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: 1 },
  or: { fontSize: 12 },
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50, borderRadius: 14, borderWidth: 2.5, boxShadow: '3px 3px 0px 0px #14110F' },
  btnText: { fontSize: 14, fontFamily: 'Prompt_600SemiBold' },
  error: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
