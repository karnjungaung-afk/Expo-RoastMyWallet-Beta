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
  backLabel?: string;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'popart';
}

export function AuthShell({ title, subtitle, backLabel, onBack, children, footer, variant = 'default' }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={variant === 'popart' ? ['#FFF3D8', '#FFF8E8', '#FFE8A8'] : ['#F15B50', '#7139D5', '#31B9CE']} style={styles.root}>
      {variant === 'popart' ? <PopArtBackdrop /> : <Backdrop />}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.col}>
            {backLabel ? (
              <View style={styles.topBar}>
                <TouchableOpacity onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="ย้อนกลับ" style={styles.backBtn}>
                  <ChevronLeftIcon size={22} color={variant === 'popart' ? '#171717' : '#fff'} />
                </TouchableOpacity>
                <Text style={[styles.topTitle, variant === 'popart' && styles.popArtText]}>{backLabel}</Text>
                <View style={styles.backBtn} />
              </View>
            ) : (
              <View style={styles.brandBlock}>
                <View style={styles.brandRow}>
                  <View style={styles.logoMark}><FlameIcon size={18} color="#fff" strokeWidth={2} /></View>
                  <Text style={[styles.brandName, variant === 'popart' && styles.popArtText]}>RoastMyWallet</Text>
                </View>
                {title ? <Text style={[styles.title, variant === 'popart' && styles.popArtText]}>{title}</Text> : null}
                {subtitle ? <Text style={[styles.subtitle, variant === 'popart' && styles.popArtSub]}>{subtitle}</Text> : null}
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

const W = 1200, H = 260;
const ridge = (pts: number[][]) => 'M' + pts.map(([x, y]) => x + ' ' + y).join(' L') + ' L' + W + ' ' + H + ' L0 ' + H + ' Z';
const FAR = ridge([[0,200],[90,150],[170,185],[290,110],[390,175],[480,135],[600,190],[700,120],[800,180],[900,140],[1010,185],[1100,130],[1200,190]]);
const MID = ridge([[0,225],[110,170],[210,215],[330,160],[450,215],[560,175],[680,220],[790,165],[900,215],[1010,170],[1120,215],[1200,185]]);
const NEAR = ridge([[0,245],[140,215],[260,240],[400,210],[540,240],[680,212],[820,240],[960,214],[1090,240],[1200,222]]);
const STARS: [number, number, number][] = [[60,28,1.4],[150,70,1],[260,40,1.3],[360,92,1],[860,36,1.4],[950,82,1],[1060,30,1.5],[1150,76,1.1],[1120,124,1]];

function Backdrop() {
  return (
    <View style={styles.backdrop} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice">
        {STARS.map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.5} />)}
        <Path d={FAR} fill="#1B3A8F" opacity={0.55} />
        <Path d={MID} fill="#14307A" opacity={0.8} />
        <Path d={NEAR} fill="#0E2260" />
      </Svg>
    </View>
  );
}

const HALFTONE = Array.from({ length: 260 }, (_, i) => ({ x: 8 + (i % 26) * 15, y: 8 + Math.floor(i / 26) * 15, r: 1.1 + ((i * 7) % 5) * 0.28 }));

function PopArtBackdrop() {
  return (
    <View style={styles.popArtBackdrop} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <Path d="M0 0H400V800H0Z" fill="#FFF3D8" />
        <Path d="M0 0H270L190 150L0 105Z" fill="#F43F45" stroke="#171717" strokeWidth="5" />
        <Path d="M270 0H400V205L190 150Z" fill="#2878D5" stroke="#171717" strokeWidth="5" />
        <Path d="M0 105L190 150L400 205L400 650L205 705L0 625Z" fill="#FFF8E8" stroke="#171717" strokeWidth="5" />
        <Path d="M0 625L205 705L130 800H0Z" fill="#F7B51B" stroke="#171717" strokeWidth="5" />
        <Path d="M205 705L400 650V800H130Z" fill="#F04449" stroke="#171717" strokeWidth="5" />
        <Path d="M0 0H118C145 20 136 56 106 66C131 105 91 137 57 119C42 151 10 151 0 137Z" fill="#FFF8E8" stroke="#171717" strokeWidth="5" />
        <Path d="M400 680C365 674 350 705 365 728C327 736 326 780 365 800H400Z" fill="#FFF8E8" stroke="#171717" strokeWidth="5" />
        {HALFTONE.map((d, i) => <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#C77B16" opacity={0.32} />)}
        {Array.from({ length: 80 }, (_, i) => <Circle key={'top-' + i} cx={205 + (i % 10) * 19} cy={8 + Math.floor(i / 10) * 15} r={2.4} fill="#111" opacity={0.42} />)}
        {Array.from({ length: 70 }, (_, i) => <Circle key={'bottom-' + i} cx={12 + (i % 10) * 18} cy={690 + Math.floor(i / 10) * 15} r={2.2} fill="#111" opacity={0.36} />)}
        <Path d="M67 45L76 68L101 69L82 84L88 108L67 95L46 108L52 84L33 69L58 68Z" fill="#FFD21A" stroke="#171717" strokeWidth="4" />
        <Path d="M327 95L336 118L361 119L342 134L348 158L327 145L306 158L312 134L293 119L318 118Z" fill="#FFD21A" stroke="#171717" strokeWidth="4" />
        <Path d="M73 675L82 698L107 699L88 714L94 738L73 725L52 738L58 714L39 699L64 698Z" fill="#FFD21A" stroke="#171717" strokeWidth="4" />
        <Path d="M335 580L344 603L369 604L350 619L356 643L335 630L314 643L320 619L301 604L326 603Z" fill="#FFD21A" stroke="#171717" strokeWidth="4" />
        <Path d="M350 220L356 247L382 251L360 266L366 292L345 276L324 292L330 266L308 251L334 247Z" fill="#FFD21A" stroke="#171717" strokeWidth="4" />
        <Path d="M0 260L70 235L0 300Z" fill="#F7C542" opacity={0.45} />
        <Path d="M400 470L330 500L400 430Z" fill="#F7C542" opacity={0.45} />
        <Path d="M0 520L80 480L0 555Z" fill="#4B9BE8" opacity={0.55} />
        <Path d="M400 330L340 360L400 300Z" fill="#F7C542" opacity={0.5} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { position: 'absolute', left: 0, right: 0, top: 0, height: 330, opacity: 0.9 },
  popArtBackdrop: { ...StyleSheet.absoluteFillObject },
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
  popArtText: { color: '#171717' },
  popArtSub: { color: 'rgba(23,23,23,0.72)' },
  card: { borderRadius: 28, padding: 22, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12 },
  footer: { alignItems: 'center' },
});
