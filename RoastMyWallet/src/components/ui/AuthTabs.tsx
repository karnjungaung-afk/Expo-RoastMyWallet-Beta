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
    <View style={[styles.track, { backgroundColor: '#FFE9B8', borderColor: '#14110F' }]} accessibilityRole="tablist">
      {items.map(i => {
        const on = i.key === active;
        return (
          <TouchableOpacity
            key={i.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.tab, on && [styles.tabOn, { backgroundColor: '#D6F73C', borderColor: '#14110F' }]]}
            onPress={() => { if (!on) router.replace(i.href); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, { color: on ? '#14110F' : colors.textMuted }, on && styles.labelOn]}>{i.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: 16, padding: 4, borderWidth: 2.5 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 2.5, borderColor: 'transparent' },
  tabOn: { boxShadow: '2px 2px 0px 0px #14110F' },
  label: { fontSize: 14, fontFamily: 'Prompt_600SemiBold' },
  labelOn: { fontFamily: 'Prompt_700Bold' },
});
