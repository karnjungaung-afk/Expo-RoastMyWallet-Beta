import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  ExternalLink,
  Clock,
  ShoppingBag,
  Ban,
  RefreshCw,
  ChevronDown,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { MechaCard } from '@/components/ui/MechaCard';
import { NeedScoreRing } from '@/components/ui/NeedScoreRing';
import { RiskBadge, StatusBadge, TechnicalDivider, SystemLabel } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { spacing, typography } from '@/theme/tokens';
import {
  formatCurrency,
  formatCountdown,
  formatRelativeTime,
  formatCategoryName,
  formatReasonName,
  formatPlatformName,
} from '@/utils/formatting';

export default function PurchaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const { purchases, updatePurchaseStatus, extendWaiting, loadPurchases, loadingState } = usePurchaseStore();
  const purchase = purchases.find(p => p.id === id);

  const [isDeciding, setIsDeciding] = useState(false);
  const [showFactors, setShowFactors] = useState(false);

  // If the store is empty (e.g. app restarted and navigated directly via notification),
  // trigger a load. Show a loading state rather than immediately showing "not found".
  useEffect(() => {
    if (purchases.length === 0 && loadingState === 'idle') {
      loadPurchases();
    }
  }, []);

  // While loading, show a spinner instead of "not found"
  if (!purchase && loadingState === 'loading') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!purchase) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.textMuted }]}>
            Purchase not found.
          </Text>
          <Button label="Go back" variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const isWaiting = purchase.status === 'waiting';
  const isReady = isWaiting && purchase.waitingUntil && new Date(purchase.waitingUntil) <= new Date();
  const risk = purchase.impulseRisk ?? 'medium';

  const handleDecision = async (decision: 'bought' | 'avoided') => {
    setIsDeciding(true);
    try {
      await updatePurchaseStatus(purchase.id, decision);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to update. Please try again.');
    } finally {
      setIsDeciding(false);
    }
  };

  const handleExtend = async () => {
    Alert.alert(
      'Wait longer',
      'How many more hours would you like to wait?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '+12h', onPress: () => extendWaiting(purchase.id, 12) },
        { text: '+24h', onPress: () => extendWaiting(purchase.id, 24) },
        { text: '+48h', onPress: () => extendWaiting(purchase.id, 48) },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + spacing[2], borderBottomColor: colors.border },
        ]}
      >
        <SystemLabel text={`SYS ▸ ${purchase.id.slice(-6).toUpperCase()}`} />
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={[styles.closeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <X size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Product header ─────────────────────────────────────────── */}
        <View style={styles.productHeader}>
          <View style={styles.productMeta}>
            <StatusBadge
              variant={purchase.status as any}
              label={purchase.status === 'waiting' ? 'Waiting' : purchase.status === 'bought' ? 'Bought' : 'Avoided'}
            />
            <Text style={[styles.platform, { color: colors.textMuted }]}>
              {formatPlatformName(purchase.platform)}
            </Text>
          </View>
          <Text style={[styles.productName, { color: colors.textPrimary }]}>
            {purchase.productName}
          </Text>
          <Text style={[styles.price, { color: colors.textPrimary }]}>
            {formatCurrency(purchase.price, purchase.currency)}
          </Text>
          <Text style={[styles.addedAt, { color: colors.textMuted }]}>
            Added {formatRelativeTime(purchase.createdAt)}
          </Text>
        </View>

        {/* URL link */}
        {purchase.url && (
          <TouchableOpacity
            style={[styles.urlRow, { borderColor: colors.border }]}
            onPress={() => Linking.openURL(purchase.url!)}
            accessibilityRole="link"
            accessibilityLabel="View product"
          >
            <ExternalLink size={14} color={colors.primary} />
            <Text style={[styles.urlText, { color: colors.primary }]} numberOfLines={1}>
              View product
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Need Score ─────────────────────────────────────────────── */}
        {purchase.needScore !== null && (
          <>
            <TechnicalDivider label="NEED SCORE" />
            <View style={styles.scoreSection}>
              <NeedScoreRing
                score={purchase.needScore}
                risk={risk}
                size={140}
                showLabel
                animate
              />
              <View style={styles.scoreDetails}>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaKey, { color: colors.textMuted }]}>Category</Text>
                  <Text style={[styles.metaVal, { color: colors.textPrimary }]}>
                    {formatCategoryName(purchase.category)}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaKey, { color: colors.textMuted }]}>Reason</Text>
                  <Text style={[styles.metaVal, { color: colors.textPrimary }]}>
                    {formatReasonName(purchase.reason)}
                  </Text>
                </View>
                {isWaiting && (
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaKey, { color: colors.textMuted }]}>Wait</Text>
                    <Text style={[
                      styles.metaVal,
                      { color: isReady ? colors.success : colors.textPrimary },
                    ]}>
                      {isReady ? 'Ready' : formatCountdown(purchase.waitingUntil)}
                    </Text>
                  </View>
                )}
                <View style={styles.metaRow}>
                  <Text style={[styles.metaKey, { color: colors.textMuted }]}>Risk</Text>
                  <RiskBadge risk={risk} />
                </View>
              </View>
            </View>
          </>
        )}

        {/* ── AI Roast ───────────────────────────────────────────────── */}
        {purchase.aiRoast && (
          <>
            <TechnicalDivider label="AI ANALYSIS" />
            <MechaCard
              accent={risk === 'high' ? 'danger' : risk === 'medium' ? 'warning' : 'success'}
              showAccentLine
            >
              <Text style={[styles.roastText, { color: colors.textPrimary }]}>
                {purchase.aiRoast}
              </Text>
              {purchase.aiReason && (
                <Text style={[styles.roastReason, { color: colors.textSecondary }]}>
                  {purchase.aiReason}
                </Text>
              )}
            </MechaCard>
          </>
        )}

        {/* ── Notes ──────────────────────────────────────────────────── */}
        {purchase.notes && (
          <>
            <TechnicalDivider label="NOTES" />
            <Text style={[styles.notes, { color: colors.textSecondary, borderLeftColor: colors.border }]}>
              {purchase.notes}
            </Text>
          </>
        )}

        {/* ── Questionnaire summary ──────────────────────────────────── */}
        {purchase.questionnaire && (
          <>
            <TouchableOpacity
              onPress={() => setShowFactors(v => !v)}
              style={styles.factorsToggle}
              accessibilityRole="button"
            >
              <TechnicalDivider label="SCORING FACTORS" />
              <ChevronDown
                size={14}
                color={colors.textMuted}
                style={{ transform: [{ rotate: showFactors ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {showFactors && (
              <View style={[styles.factorsList, { borderColor: colors.border }]}>
                {[
                  { key: 'Planned purchase', val: purchase.questionnaire.plannedBefore ? 'Yes' : 'No' },
                  { key: 'Own alternative', val: purchase.questionnaire.hasAlternative ? 'Yes' : 'No' },
                  { key: 'Usage frequency', val: purchase.questionnaire.usageFrequency },
                  { key: 'Buy at full price', val: purchase.questionnaire.wouldBuyAtFullPrice ? 'Yes' : 'No' },
                  { key: 'Budget impact', val: purchase.questionnaire.budgetImpact },
                ].map(({ key, val }) => (
                  <View key={key} style={[styles.factorRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.factorKey, { color: colors.textMuted }]}>{key}</Text>
                    <Text style={[styles.factorVal, { color: colors.textPrimary }]}>
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Decision buttons (sticky footer) ──────────────────────────── */}
      {isWaiting && (
        <View
          style={[
            styles.decisionFooter,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + spacing[3],
            },
          ]}
        >
          {isReady ? (
            <>
              <Text style={[styles.decisionPrompt, { color: colors.textSecondary }]}>
                Time's up. What did you decide?
              </Text>
              <View style={styles.decisionButtons}>
                <Button
                  label="I'll skip it"
                  variant="secondary"
                  size="md"
                  style={{ flex: 1 }}
                  icon={<Ban size={16} color={colors.textSecondary} />}
                  loading={isDeciding}
                  onPress={() => handleDecision('avoided')}
                />
                <Button
                  label="I bought it"
                  variant="danger"
                  size="md"
                  style={{ flex: 1 }}
                  icon={<ShoppingBag size={16} color="#fff" />}
                  loading={isDeciding}
                  onPress={() => handleDecision('bought')}
                />
              </View>
              <Button
                label="Wait longer"
                variant="ghost"
                size="sm"
                fullWidth
                icon={<RefreshCw size={14} color={colors.primary} />}
                onPress={handleExtend}
              />
            </>
          ) : (
            <>
              <View style={[styles.countdownFooter, { borderColor: colors.border }]}>
                <Clock size={14} color={colors.textMuted} />
                <Text style={[styles.countdownFooterText, { color: colors.textMuted }]}>
                  {formatCountdown(purchase.waitingUntil)} until decision time
                </Text>
              </View>
              <View style={styles.earlyDecisionButtons}>
                <Button
                  label="I've decided: Skip"
                  variant="secondary"
                  size="md"
                  style={{ flex: 1 }}
                  loading={isDeciding}
                  onPress={() => {
                    Alert.alert(
                      'Skip early?',
                      'You still have time on the timer. Decide now?',
                      [
                        { text: 'Keep waiting', style: 'cancel' },
                        { text: 'Skip it', onPress: () => handleDecision('avoided') },
                      ]
                    );
                  }}
                />
                <Button
                  label="Extend wait"
                  variant="ghost"
                  size="md"
                  style={{ flex: 1 }}
                  onPress={handleExtend}
                />
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  notFoundText: {
    fontSize: typography.size.base,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    gap: spacing[4],
  },

  productHeader: {
    gap: spacing[1.5],
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  platform: {
    fontSize: typography.size.xs,
    fontFamily: 'Courier New',
  },
  productName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  price: {
    fontSize: typography.size['2xl'],
    fontWeight: '800',
    letterSpacing: -1,
  },
  addedAt: {
    fontSize: typography.size.xs,
    fontFamily: 'Courier New',
  },

  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  urlText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[5],
  },
  scoreDetails: {
    flex: 1,
    gap: spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
  },
  metaKey: {
    fontSize: typography.size.xs,
    fontFamily: 'Courier New',
    letterSpacing: 0.3,
  },
  metaVal: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  roastText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: spacing[2],
  },
  roastReason: {
    fontSize: typography.size.sm,
    lineHeight: 20,
  },

  notes: {
    fontSize: typography.size.base,
    lineHeight: 24,
    paddingLeft: spacing[3],
    borderLeftWidth: 2,
    fontStyle: 'italic',
  },

  factorsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  factorsList: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    borderBottomWidth: 1,
  },
  factorKey: {
    fontSize: typography.size.xs,
    fontFamily: 'Courier New',
  },
  factorVal: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Decision footer
  decisionFooter: {
    padding: spacing[4],
    borderTopWidth: 1,
    gap: spacing[3],
  },
  decisionPrompt: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    fontWeight: typography.weight.medium,
  },
  decisionButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  countdownFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    justifyContent: 'center',
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderRadius: 8,
  },
  countdownFooterText: {
    fontSize: typography.size.sm,
    fontFamily: 'Courier New',
  },
  earlyDecisionButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
});
