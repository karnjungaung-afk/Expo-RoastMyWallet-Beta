import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { spacing, typography } from '@/theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  visual: React.ReactNode;
  accent: string;
}

function useSlides() {
  const { colors } = useTheme();

  const slides: OnboardingSlide[] = [
    {
      id: '1',
      title: 'Pause before you buy.',
      subtitle:
        'See something on TikTok Shop, Shopee, or Instagram? Add it here first. Give yourself time to decide.',
      visual: <SlideVisual1 colors={colors} />,
      accent: colors.primary,
    },
    {
      id: '2',
      title: 'The AI scores your decision.',
      subtitle:
        'PauseBuy calculates a Need Score based on your answers. It gives you an honest, slightly sarcastic verdict.',
      visual: <SlideVisual2 colors={colors} />,
      accent: colors.success,
    },
    {
      id: '3',
      title: 'Wait. Then decide.',
      subtitle:
        'After the waiting period ends, you choose: buy, skip, or wait longer. Most impulse buys never make it to "buy".',
      visual: <SlideVisual3 colors={colors} />,
      accent: colors.warning,
    },
    {
      id: '4',
      title: 'See what you saved.',
      subtitle:
        'Your insights screen tracks exactly how much impulse spending you avoided. The math speaks for itself.',
      visual: <SlideVisual4 colors={colors} />,
      accent: colors.primary,
    },
  ];

  return slides;
}

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const slides = useSlides();

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  const isLast = currentIndex === slides.length - 1;

  const goNext = () => {
    if (isLast) {
      router.replace('/(tabs)');
      return;
    }
    const next = currentIndex + 1;
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrentIndex(next);
  };

  const skip = () => {
    router.replace('/(tabs)');
  };

  const renderSlide: ListRenderItem<OnboardingSlide> = ({ item }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.visualContainer}>{item.visual}</View>
      <View style={styles.textBlock}>
        <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>
          {item.title}
        </Text>
        <Text style={[styles.slideSubtitle, { color: colors.textSecondary }]}>
          {item.subtitle}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Skip button */}
      <View style={[styles.skipRow, { paddingTop: insets.top + spacing[3] }]}>
        <TouchableOpacity
          onPress={skip}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          style={styles.skipButton}
        >
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false} // Controlled navigation only
        style={styles.flatList}
      />

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[6] }]}>
        {/* Page dots */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === currentIndex ? colors.primary : colors.border,
                  width: i === currentIndex ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>

        <Button
          label={isLast ? 'Start saving money' : 'Next'}
          variant="primary"
          size="lg"
          fullWidth
          onPress={goNext}
        />
      </View>
    </View>
  );
}

// ─── SLIDE VISUALS ────────────────────────────────────────────────────────────
// Abstract geometric visuals — no copyrighted characters

function SlideVisual1({ colors }: { colors: any }) {
  return (
    <View style={[visualStyles.container, { backgroundColor: colors.primarySubtle }]}>
      {/* Shopping cart with pause symbol overlay */}
      <View style={[visualStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[visualStyles.cardPrice, { color: colors.textPrimary }]}>฿890</Text>
        <Text style={[visualStyles.cardName, { color: colors.textSecondary }]}>Gaming Mouse</Text>
        <View style={[visualStyles.cardBar, { backgroundColor: colors.border }]}>
          <View style={[visualStyles.cardBarFill, { backgroundColor: colors.warning, width: '45%' }]} />
        </View>
        <Text style={[visualStyles.cardTimer, { color: colors.textMuted }]}>18h 24m remaining</Text>
      </View>
      <View style={[visualStyles.pauseBadge, { backgroundColor: colors.primary }]}>
        <Text style={visualStyles.pauseBadgeText}>⏸ PAUSED</Text>
      </View>
    </View>
  );
}

function SlideVisual2({ colors }: { colors: any }) {
  return (
    <View style={[visualStyles.container, { backgroundColor: colors.successSubtle }]}>
      <View style={[visualStyles.scoreCircle, { borderColor: colors.success }]}>
        <Text style={[visualStyles.scoreNum, { color: colors.success }]}>72</Text>
        <Text style={[visualStyles.scoreLabel, { color: colors.textMuted }]}>/100</Text>
      </View>
      <View style={[visualStyles.riskBadge, { backgroundColor: colors.successSubtle, borderColor: colors.success }]}>
        <Text style={[visualStyles.riskText, { color: colors.success }]}>◆◇◇ LOW RISK</Text>
      </View>
    </View>
  );
}

function SlideVisual3({ colors }: { colors: any }) {
  return (
    <View style={[visualStyles.container, { backgroundColor: colors.warningSubtle }]}>
      <View style={visualStyles.decisionRow}>
        {[
          { label: 'Skip', icon: '✕', bg: colors.surface, border: colors.border, textColor: colors.textSecondary },
          { label: 'Buy', icon: '✓', bg: colors.danger, border: colors.danger, textColor: '#fff' },
        ].map(btn => (
          <View
            key={btn.label}
            style={[visualStyles.decisionBtn, { backgroundColor: btn.bg, borderColor: btn.border }]}
          >
            <Text style={[visualStyles.decisionIcon, { color: btn.textColor }]}>{btn.icon}</Text>
            <Text style={[visualStyles.decisionLabel, { color: btn.textColor }]}>{btn.label}</Text>
          </View>
        ))}
      </View>
      <Text style={[visualStyles.decisionPrompt, { color: colors.textSecondary }]}>
        Still want it after 24h?
      </Text>
    </View>
  );
}

function SlideVisual4({ colors }: { colors: any }) {
  return (
    <View style={[visualStyles.container, { backgroundColor: colors.primarySubtle }]}>
      <View style={[visualStyles.savingsCard, { backgroundColor: colors.primary }]}>
        <Text style={[visualStyles.savingsLabel, { color: 'rgba(255,255,255,0.6)' }]}>
          AVOIDED THIS MONTH
        </Text>
        <Text style={visualStyles.savingsAmount}>฿2,450</Text>
        <Text style={[visualStyles.savingsSub, { color: 'rgba(255,255,255,0.5)' }]}>
          8 purchases paused
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  skipRow: {
    paddingHorizontal: spacing[5],
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  skipButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[1],
  },
  skipText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: spacing[6],
    gap: spacing[6],
    justifyContent: 'center',
  },
  visualContainer: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    gap: spacing[3],
  },
  slideTitle: {
    fontSize: typography.size['2xl'],
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  slideSubtitle: {
    fontSize: typography.size.base,
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: spacing[6],
    gap: spacing[5],
    paddingTop: spacing[4],
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[1.5],
    alignItems: 'center',
  },
  dot: {
    // width is set inline per-dot via style prop on each <View>
    // RN does not support CSS transitions; animated width requires Animated.Value
    height: 6,
    borderRadius: 3,
  },
});

const visualStyles = StyleSheet.create({
  container: {
    width: 260,
    height: 200,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  card: {
    width: 200,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing[3],
    gap: spacing[1.5],
  },
  cardPrice: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  cardName: { fontSize: typography.size.sm },
  cardBar: { height: 3, borderRadius: 2, overflow: 'hidden' },
  cardBarFill: { height: '100%', borderRadius: 2 },
  cardTimer: {
    fontSize: typography.size.xs,
    fontFamily: 'Courier New',
  },
  pauseBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 6,
  },
  pauseBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  scoreNum: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: 'Courier New',
  },
  scoreLabel: { fontSize: 12, marginTop: 10 },
  riskBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: 6,
    borderWidth: 1.5,
  },
  riskText: {
    fontFamily: 'Courier New',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  decisionRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  decisionBtn: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
  },
  decisionIcon: { fontSize: 24, fontWeight: '700' },
  decisionLabel: { fontSize: 12, fontWeight: '600' },
  decisionPrompt: { fontSize: 13 },
  savingsCard: {
    width: 220,
    borderRadius: 16,
    padding: spacing[4],
    gap: spacing[1.5],
  },
  savingsLabel: {
    fontSize: 10,
    fontFamily: 'Courier New',
    letterSpacing: 1,
  },
  savingsAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  savingsSub: { fontSize: 12 },
});
