import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { X, Zap, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Button } from '@/components/ui/Button';
import { spacing, typography, radius } from '@/theme/tokens';
import type { ProFeature } from '@/features/subscription/SubscriptionService';

// ─── PRO GATE MODAL ───────────────────────────────────────────────────────────

interface ProGateModalProps {
  visible: boolean;
  onClose: () => void;
  featureTitle: string;
  featureDescription: string;
  highlightFeature?: ProFeature;
}

const PRO_BENEFITS = [
  'AI analysis with personal roasting',
  'Purchase pattern insights',
  'Squad Roasting with friends',
  'Auto-Intercept for shopping apps',
  'Unlimited purchase history',
  'Advanced analytics + ROI dashboard',
  'Daily / weekly / monthly limits',
  'Smart waiting period suggestions',
] as const;

export function ProGateModal({
  visible,
  onClose,
  featureTitle,
  featureDescription,
}: ProGateModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { offerings, isPurchasing, purchase } = useSubscriptionStore();

  const monthlyPackage = offerings[0]?.packages.find(p => p.id === 'pro_monthly');
  const yearlyPackage = offerings[0]?.packages.find(p => p.id === 'pro_yearly');

  const handleUpgrade = async (packageId: 'pro_monthly' | 'pro_yearly') => {
    const success = await purchase(packageId);
    if (success) onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.background, paddingBottom: insets.bottom + spacing[6] }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerSpacer} />
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={[styles.closeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={[styles.iconRing, { backgroundColor: colors.primarySubtle, borderColor: colors.primary }]}>
              <Zap size={28} color={colors.primary} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
              {featureTitle}
            </Text>
            <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
              {featureDescription}
            </Text>
          </View>

          {/* Benefits */}
          <View style={[styles.benefitsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.benefitsTitle, { color: colors.textPrimary }]}>
              Everything in Pro
            </Text>
            <View style={styles.benefitsList}>
              {PRO_BENEFITS.map((benefit, i) => (
                <View key={i} style={styles.benefitRow}>
                  <Check size={14} color={colors.success} strokeWidth={2.5} />
                  <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Value prop */}
          <View style={[styles.valueCard, { backgroundColor: colors.primarySubtle, borderColor: colors.primary }]}>
            <Text style={[styles.valueText, { color: colors.primary }]}>
              Most users avoid more than the subscription cost in their first week.
            </Text>
            <Text style={[styles.valueSub, { color: colors.textMuted }]}>
              Estimated avoided spending. Results depend on your decisions.
            </Text>
          </View>
        </ScrollView>

        {/* Pricing CTAs */}
        <View style={[styles.pricing, { borderTopColor: colors.border }]}>
          {yearlyPackage && (
            <View style={styles.pricingOption}>
              <Button
                label={`Yearly — ฿${yearlyPackage.price}/yr`}
                variant="secondary"
                size="md"
                fullWidth
                onPress={() => handleUpgrade('pro_yearly')}
                loading={isPurchasing}
              />
              <Text style={[styles.savingsLabel, { color: colors.success }]}>
                Save ~25% vs monthly
              </Text>
            </View>
          )}

          {monthlyPackage && (
            <Button
              label={`Monthly — ฿${monthlyPackage.price}/month`}
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => handleUpgrade('pro_monthly')}
              loading={isPurchasing}
            />
          )}

          <TouchableOpacity
            onPress={() => { /* navigate to restore */ }}
            accessibilityRole="button"
            style={styles.restoreLink}
          >
            <Text style={[styles.restoreText, { color: colors.textMuted }]}>
              Restore purchase
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── USE PRO GATE ─────────────────────────────────────────────────────────────
// Hook for triggering the Pro gate from any screen

export function useProGate() {
  const [state, setState] = React.useState<{
    visible: boolean;
    title: string;
    description: string;
  }>({
    visible: false,
    title: '',
    description: '',
  });

  const { isPro } = useSubscriptionStore();

  /**
   * Check if user is Pro. If not, show the gate modal.
   * Returns true if the user IS Pro and can proceed.
   */
  const requirePro = React.useCallback(
    (title: string, description: string): boolean => {
      if (isPro()) return true;
      setState({ visible: true, title, description });
      return false;
    },
    [isPro]
  );

  const closeGate = React.useCallback(() => {
    setState(s => ({ ...s, visible: false }));
  }, []);

  return {
    requirePro,
    gateProps: {
      visible: state.visible,
      onClose: closeGate,
      featureTitle: state.title,
      featureDescription: state.description,
    },
  };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
  },
  headerSpacer: { flex: 1 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
    gap: spacing[4],
  },
  hero: {
    alignItems: 'center',
    gap: spacing[3],
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  heroDesc: {
    fontSize: typography.size.base,
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing[4],
    gap: spacing[3],
  },
  benefitsTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.wide,
  },
  benefitsList: {
    gap: spacing[2.5],
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  benefitText: {
    fontSize: typography.size.sm,
    flex: 1,
    lineHeight: 20,
  },
  valueCard: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing[4],
    gap: spacing[1],
  },
  valueText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    lineHeight: 20,
  },
  valueSub: {
    fontSize: typography.size.xs,
  },
  pricing: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    gap: spacing[3],
  },
  pricingOption: {
    gap: spacing[1],
  },
  savingsLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    textAlign: 'center',
  },
  restoreLink: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  restoreText: {
    fontSize: typography.size.xs,
  },
});
