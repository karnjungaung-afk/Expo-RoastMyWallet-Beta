import React from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { FlameIcon, ChevronLeftIcon } from '@/components/icons/RmwIcons';

interface Props {
  title?: string;
  subtitle?: string;
  /** Shows a back arrow with this label in the top bar (register-style header). */
  backLabel?: string;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Dark dusk hero + white form card, shared by login / register / forgot / reset. */
export function AuthShell({ title, subtitle, backLabel, onBack, children, footer }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={['#F15B50', '#7139D5', '#31B9CE']} style={styles.root}>
      <Backdrop />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.col}>
            {backLabel ? (
              <View style={styles.topBar}>
                <TouchableOpacity onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="ย้อนกลับ" style={styles.backBtn}>
                  <ChevronLeftIcon size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.topTitle}>{backLabel}</Text>
                <View style={styles.backBtn} />
              </View>
            ) : (
              <View style={styles.brandBlock}>
                <View style={styles.brandRow}>
                  <View style={styles.logoMark}><FlameIcon size={18} color="#fff" strokeWidth={2} /></View>
                  <Text style={styles.brandName}>RoastMyWallet</Text>
                </View>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
            )}

            <View style={[styles.card, { backgroundColor: colors.surface }]}>{children}</View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

/** Layered dusk mountains + a few stars, drawn in SVG (no image assets). */
const W = 1200, H = 260;
const ridge = (pts: number[][]) => `M${pts.map(([x, y]) => `${x} ${y}`).join(' L')} L${W} ${H} L0 ${H} Z`;
const FAR  = ridge([[0,200],[90,150],[170,185],[290,110],[390,175],[480,135],[600,190],[700,120],[800,180],[900,140],[1010,185],[1100,130],[1200,190]]);
const MID  = ridge([[0,225],[110,170],[210,215],[330,160],[450,215],[560,175],[680,220],[790,165],[900,215],[1010,170],[1120,215],[1200,185]]);
const NEAR = ridge([[0,245],[140,215],[260,240],[400,210],[540,240],[680,212],[820,240],[960,214],[1090,240],[1200,222]]);
const STARS: [number, number, number][] = [[60,28,1.4],[150,70,1],[260,40,1.3],[360,92,1],[860,36,1.4],[950,82,1],[1060,30,1.5],[1150,76,1.1],[1120,124,1]];

function Backdrop() {
  return (
    <View style={styles.backdrop} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
        {STARS.map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.5} />)}
        <Path d={FAR} fill="#1B3A8F" opacity={0.55} />
        <Path d={MID} fill="#14307A" opacity={0.8} />
        <Path d={NEAR} fill="#0E2260" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { position: 'absolute', left: 0, right: 0, top: 0, height: 330, opacity: 0.9 },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20 },
  col: { width: '100%', maxWidth: 440, gap: 18 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  brandBlock: { alignItems: 'center', gap: 10, paddingTop: 8, paddingBottom: 6 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  brandName: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 6, letterSpacing: -0.4 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center' },
  card: {
    borderRadius: 28, padding: 22, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
  },
  footer: { alignItems: 'center' },
});
