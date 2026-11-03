import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

/** Segmented switch on top of the auth card (login ⇄ register). */
export function AuthTabs({ active }: { active: 'login' | 'register' }) {
  const router = useRouter();
  const { colors } = useTheme();
  const items = [
    { key: 'login' as const, label: 'เข้าสู่ระบบ', href: '/(auth)/login' as const },
    { key: 'register' as const, label: 'สมัครสมาชิก', href: '/(auth)/register' as const },
  ];
  return (
    <View style={[styles.track, { backgroundColor: colors.backgroundSubtle }]} accessibilityRole="tablist">
      {items.map(i => {
        const on = i.key === active;
        return (
          <TouchableOpacity
            key={i.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.tab, on && [styles.tabOn, { backgroundColor: colors.surface, borderColor: colors.border }]]}
            onPress={() => { if (!on) router.replace(i.href); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, { color: on ? colors.primary : colors.textMuted }, on && styles.labelOn]}>{i.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9, borderWidth: 1, borderColor: 'transparent' },
  tabOn: { shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  label: { fontSize: 14, fontWeight: '600' },
  labelOn: { fontWeight: '700' },
});
