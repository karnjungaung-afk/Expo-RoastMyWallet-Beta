import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Rect, G, Line, Text as SvgText } from 'react-native-svg';
import { spacing } from '@/theme/tokens';

const { width: W } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'เห็นของอยากได้?\nหยุดก่อนสักแป๊บ',
    sub: 'แค่เพิ่มสินค้าไว้ที่นี่ก่อนกด Order แอพจะช่วยให้คุณตัดสินใจได้ดีขึ้น',
    grad: ['#0D1F35', '#1B3557'] as [string, string],
    accent: '#5A96C3',
    Visual: Visual1,
  },
  {
    id: '2',
    title: 'AI วิเคราะห์ให้\nตรงไปตรงมา',
    sub: 'ระบบคำนวณ Need Score จากคำตอบของคุณ แล้วบอกตรงๆ ว่าซื้อควรไหม',
    grad: ['#1A3A28', '#235E3B'] as [string, string],
    accent: '#52B57D',
    Visual: Visual2,
  },
  {
    id: '3',
    title: 'รอแล้วค่อยตัดสินใจ\nไม่รีบ ไม่เสียใจ',
    sub: 'หลังจากรอครบเวลา เลือกได้เลย: ซื้อ, ไม่ซื้อ หรือรออีก ส่วนใหญ่จะไม่ซื้อแล้ว',
    grad: ['#3D2A10', '#7A3E0A'] as [string, string],
    accent: '#DFA53C',
    Visual: Visual3,
  },
  {
    id: '4',
    title: 'เห็นเงินที่ประหยัดได้\nทุกบาท ทุกเดือน',
    sub: 'หน้า Insights บอกชัดเจนว่าคุณหยุดใช้เงินไปเท่าไหร่ ตัวเลขพูดแทนทุกอย่าง',
    grad: ['#1A1A3A', '#2A2060'] as [string, string],
    accent: '#88B8D9',
    Visual: Visual4,
  },
] as const;

// ── SVG Visuals ───────────────────────────────────────────────────────────────

function Visual1({ accent }: { accent: string }) {
  return (
    <Svg width={200} height={180} viewBox="0 0 200 180">
      {/* Phone frame */}
      <Rect x="60" y="10" width="80" height="140" rx="14" fill="rgba(255,255,255,0.06)" stroke={accent} strokeWidth="1.5" />
      <Rect x="72" y="24" width="56" height="8" rx="4" fill={accent} opacity="0.5" />
      <Rect x="72" y="40" width="56" height="30" rx="6" fill={accent} opacity="0.15" />
      <Rect x="78" y="46" width="20" height="4" rx="2" fill={accent} opacity="0.6" />
      <Rect x="78" y="54" width="32" height="3" rx="1.5" fill="rgba(255,255,255,0.25)" />
      {/* Shopping bag */}
      <Rect x="72" y="78" width="24" height="20" rx="4" fill={accent} opacity="0.3" stroke={accent} strokeWidth="1.2" />
      <Path d="M76 78 C76 74 84 74 84 78" stroke={accent} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Pause icon overlay */}
      <Circle cx="145" cy="85" r="18" fill="#E8A030" opacity="0.9" />
      <Rect x="138" y="78" width="5" height="14" rx="2.5" fill="#fff" />
      <Rect x="146" y="78" width="5" height="14" rx="2.5" fill="#fff" />
    </Svg>
  );
}

function Visual2({ accent }: { accent: string }) {
  const bars = [60, 90, 45, 75, 100, 55, 80];
  return (
    <Svg width={200} height={180} viewBox="0 0 200 180">
      {/* Chart bars */}
      {bars.map((h, i) => (
        <G key={i}>
          <Rect x={20 + i * 24} y={140 - h} width="16" height={h} rx="5"
            fill={i === 4 ? accent : 'rgba(255,255,255,0.12)'} />
        </G>
      ))}
      <Line x1="14" y1="141" x2="186" y2="141" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Score badge */}
      <Rect x="60" y="20" width="80" height="36" rx="12" fill={accent} opacity="0.2" stroke={accent} strokeWidth="1.5" />
      <SvgText fill={accent} x="100" y="44" fontSize="22" fontWeight="800" textAnchor="middle">78</SvgText>
    </Svg>
  );
}

function Visual3({ accent }: { accent: string }) {
  return (
    <Svg width={200} height={180} viewBox="0 0 200 180">
      {/* Clock face */}
      <Circle cx="100" cy="90" r="60" fill="rgba(255,255,255,0.04)" stroke={accent} strokeWidth="1.5" />
      <Circle cx="100" cy="90" r="4" fill={accent} />
      <Path d="M100 90 L100 50" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M100 90 L125 90" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
      {/* Tick marks */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
        const r = i % 3 === 0 ? 50 : 54;
        const rad = (deg - 90) * Math.PI / 180;
        const x1 = 100 + 58 * Math.cos(rad); const y1 = 90 + 58 * Math.sin(rad);
        const x2 = 100 + r * Math.cos(rad); const y2 = 90 + r * Math.sin(rad);
        return <Line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth="1.5" opacity="0.5" />;
      })}
      {/* "24h" label */}
      <Rect x="70" y="130" width="60" height="22" rx="11" fill={accent} opacity="0.25" />
      <SvgText fill={accent} x="100" y="146" fontSize="11" fontWeight="700" textAnchor="middle">24 ชั่วโมง</SvgText>
    </Svg>
  );
}

function Visual4({ accent }: { accent: string }) {
  return (
    <Svg width={200} height={180} viewBox="0 0 200 180">
      {/* Wallet */}
      <Rect x="30" y="60" width="140" height="80" rx="16" fill="rgba(255,255,255,0.06)" stroke={accent} strokeWidth="1.5" />
      <Rect x="30" y="78" width="140" height="2" fill={accent} opacity="0.3" />
      {/* Coin stack */}
      <Circle cx="150" cy="100" r="16" fill={accent} opacity="0.3" />
      <Circle cx="150" cy="100" r="10" fill={accent} opacity="0.6" />
      {/* Amount text */}
      <SvgText fill="#fff" x="70" y="104" fontSize="20" fontWeight="800">฿2,340</SvgText>
      <SvgText fill={accent} x="70" y="120" fontSize="10" opacity={0.7}>ประหยัดได้เดือนนี้</SvgText>
      {/* Upward arrow */}
      <Path d="M110 48 L120 35 L130 48" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Line x1="120" y1="35" x2="120" y2="58" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      router.replace('/(auth)/register');
    }
  };

  const current = SLIDES[activeIndex];

  return (
    <LinearGradient colors={current.grad} style={styles.root}>
      <View style={[styles.blob, { backgroundColor: current.accent + '18' }]} />

      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={s => s.id}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        onMomentumScrollEnd={e => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / W))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: W }]}>
            <View style={styles.visual}><item.Visual accent={item.accent} /></View>
            <View style={styles.copy}>
              <Text style={[styles.title]}>{item.title}</Text>
              <Text style={[styles.sub]}>{item.sub}</Text>
            </View>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * W, i * W, (i + 1) * W];
          const scale = scrollX.interpolate({ inputRange, outputRange: [0.7, 1, 0.7], extrapolate: 'clamp' });
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
          return (
            <Animated.View key={i} style={[styles.dot, { backgroundColor: current.accent, transform: [{ scale }], opacity }]} />
          );
        })}
      </View>

      {/* Buttons */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity onPress={goNext} style={[styles.nextBtn, { backgroundColor: current.accent }]} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>
            {activeIndex < SLIDES.length - 1 ? 'ถัดไป' : 'เริ่มต้นใช้งาน'}
          </Text>
        </TouchableOpacity>
        {activeIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={() => router.replace('/(auth)/register')} style={styles.skipBtn}>
            <Text style={styles.skipText}>ข้ามไปเลย</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  blob: { position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: 150 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32, paddingHorizontal: 32 },
  visual: { width: 200, height: 180 },
  copy: { gap: 14, alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.8, lineHeight: 38 },
  sub: { fontSize: 16, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 24, gap: 12 },
  nextBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: 'rgba(255,255,255,0.35)', fontSize: 14 },
});
