import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { ChevronRight, ChevronLeft, X, Link, Tag, DollarSign, MessageSquare } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Input, SelectTrigger } from '@/components/ui/Input';
import { TechnicalDivider } from '@/components/ui/Badge';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { spacing, typography, radius } from '@/theme/tokens';
import type {
  PurchaseReason,
  PurchaseCategory,
  ShoppingPlatform,
  UsageFrequency,
  BudgetImpact,
  CreatePurchaseInput,
} from '@/types';

// ─── STEP DEFINITIONS ─────────────────────────────────────────────────────────

type Step = 'basics' | 'questions' | 'reviewing';

interface FormData {
  productName: string;
  priceStr: string;
  url: string;
  reason: PurchaseReason | '';
  category: PurchaseCategory | '';
  notes: string;
  // Questionnaire
  plannedBefore: boolean | null;
  hasAlternative: boolean | null;
  usageFrequency: UsageFrequency | '';
  wouldBuyAtFullPrice: boolean | null;
  budgetImpact: BudgetImpact | '';
}

const INITIAL_FORM: FormData = {
  productName: '',
  priceStr: '',
  url: '',
  reason: '',
  category: '',
  notes: '',
  plannedBefore: null,
  hasAlternative: null,
  usageFrequency: '',
  wouldBuyAtFullPrice: null,
  budgetImpact: '',
};

interface AddPurchaseSheetProps {
  onClose: () => void;
  prefillUrl?: string;
}

export function AddPurchaseSheet({ onClose, prefillUrl }: AddPurchaseSheetProps) {
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('basics');
  const [form, setForm] = useState<FormData>({ ...INITIAL_FORM, url: prefillUrl ?? '' });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const { addPurchase, addingState } = usePurchaseStore();
  const { isPro } = useSubscriptionStore();

  const isLoading = addingState === 'loading';

  // ── Form helpers ─────────────────────────────────────────────────────────

  const set = useCallback((key: keyof FormData, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
  }, []);

  // ── Step validation ───────────────────────────────────────────────────────

  const validateBasics = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.productName.trim()) newErrors.productName = 'Product name is required';
    if (!form.priceStr.trim()) newErrors.priceStr = 'Price is required';
    else if (isNaN(Number(form.priceStr)) || Number(form.priceStr) <= 0) {
      newErrors.priceStr = 'Enter a valid price';
    }
    if (!form.reason) newErrors.reason = 'Select a reason';
    if (!form.category) newErrors.category = 'Select a category';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Navigation ────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (step === 'basics') {
      if (!validateBasics()) return;
      setStep('questions');
    } else if (step === 'questions') {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step === 'questions') setStep('basics');
    else onClose();
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const input: CreatePurchaseInput = {
      productName: form.productName.trim(),
      price: Number(form.priceStr),
      currency: 'THB',
      url: form.url.trim() || null,
      imageUrl: null,
      platform: detectPlatform(form.url),
      category: (form.category as PurchaseCategory) || 'other',
      reason: (form.reason as PurchaseReason) || 'other',
      notes: form.notes.trim() || null,
      waitingHours: 0, // will be auto-calculated
      questionnaire: {
        plannedBefore: form.plannedBefore ?? false,
        hasAlternative: form.hasAlternative ?? false,
        usageFrequency: (form.usageFrequency as UsageFrequency) || 'monthly',
        wouldBuyAtFullPrice: form.wouldBuyAtFullPrice ?? (form.reason !== 'sale'),
        budgetImpact: (form.budgetImpact as BudgetImpact) || 'minor',
        emotionalState: 'unknown',
      },
    };

    const result = await addPurchase(input, isPro());

    if (result) {
      onClose();
    } else {
      Alert.alert('Something went wrong', 'Failed to add purchase. Please try again.');
    }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {step === 'basics' ? 'Pause & Think' : 'A few questions'}
          </Text>
          <View style={styles.stepDots}>
            {(['basics', 'questions'] as Step[]).map((s, i) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: step === s
                      ? colors.primary
                      : i < (['basics', 'questions'] as Step[]).indexOf(step)
                      ? colors.success
                      : colors.border,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 'basics' && (
          <BasicsStep form={form} errors={errors} set={set} colors={colors} />
        )}

        {step === 'questions' && (
          <QuestionsStep form={form} set={set} colors={colors} />
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <Button
          label={step === 'questions' ? 'Add to Pause List' : 'Next'}
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          onPress={handleNext}
          icon={<ChevronRight size={18} color="#fff" />}
          iconPosition="right"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── STEP: BASICS ─────────────────────────────────────────────────────────────

interface StepProps {
  form: FormData;
  errors: Partial<Record<keyof FormData, string>>;
  set: (key: keyof FormData, value: any) => void;
  colors: any;
}

function BasicsStep({ form, errors, set, colors }: StepProps) {
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepHint, { color: colors.textMuted }]}>
        What are you about to buy?
      </Text>

      <Input
        label="Product name"
        value={form.productName}
        onChangeText={v => set('productName', v)}
        placeholder="e.g. Mechanical Keyboard"
        error={errors.productName}
        required
        autoFocus
        returnKeyType="next"
      />

      <Input
        label="Price (฿)"
        value={form.priceStr}
        onChangeText={v => {
          // Strip commas, spaces, currency symbols so "1,500" or "฿890" parse correctly
          const cleaned = v.replace(/[^0-9.]/g, '');
          set('priceStr', cleaned);
        }}
        placeholder="0"
        error={errors.priceStr}
        keyboardType="decimal-pad"
        required
        leftIcon={<DollarSign size={16} color={colors.textMuted} />}
        returnKeyType="next"
      />

      <Input
        label="Product URL"
        value={form.url}
        onChangeText={v => set('url', v)}
        placeholder="https://..."
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        leftIcon={<Link size={16} color={colors.textMuted} />}
      />

      <TechnicalDivider label="CLASSIFY" />

      <ReasonPicker
        selected={form.reason as PurchaseReason}
        onSelect={v => set('reason', v)}
        error={errors.reason}
        colors={colors}
      />

      <CategoryPicker
        selected={form.category as PurchaseCategory}
        onSelect={v => set('category', v)}
        error={errors.category}
        colors={colors}
      />

      <Input
        label="Notes (optional)"
        value={form.notes}
        onChangeText={v => set('notes', v)}
        placeholder="Anything else to add?"
        multiline
        numberOfLines={2}
        leftIcon={<MessageSquare size={16} color={colors.textMuted} />}
      />
    </View>
  );
}

// ─── STEP: QUESTIONS ──────────────────────────────────────────────────────────

function QuestionsStep({ form, set, colors }: Omit<StepProps, 'errors'>) {
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepHint, { color: colors.textMuted }]}>
        Help us give you a better score.
      </Text>

      <YesNoQuestion
        question="Did you plan to buy this before seeing it?"
        value={form.plannedBefore}
        onChange={v => set('plannedBefore', v)}
        colors={colors}
      />

      <YesNoQuestion
        question="Do you already own something similar?"
        value={form.hasAlternative}
        onChange={v => set('hasAlternative', v)}
        colors={colors}
      />

      <FrequencyPicker
        selected={form.usageFrequency as UsageFrequency}
        onSelect={v => set('usageFrequency', v)}
        colors={colors}
      />

      <YesNoQuestion
        question="Would you buy this at full price?"
        value={form.wouldBuyAtFullPrice}
        onChange={v => set('wouldBuyAtFullPrice', v)}
        colors={colors}
      />

      <BudgetImpactPicker
        selected={form.budgetImpact as BudgetImpact}
        onSelect={v => set('budgetImpact', v)}
        colors={colors}
      />
    </View>
  );
}

// ─── YES / NO QUESTION ────────────────────────────────────────────────────────

interface YesNoProps {
  question: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  colors: any;
}

function YesNoQuestion({ question, value, onChange, colors }: YesNoProps) {
  return (
    <View style={styles.questionBlock}>
      <Text style={[styles.questionText, { color: colors.textPrimary }]}>
        {question}
      </Text>
      <View style={styles.yesNoRow}>
        {([true, false] as const).map(bool => (
          <TouchableOpacity
            key={String(bool)}
            onPress={() => onChange(bool)}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === bool }}
            style={[
              styles.yesNoButton,
              {
                borderColor: value === bool ? colors.primary : colors.border,
                backgroundColor: value === bool ? colors.primarySubtle : colors.surface,
              },
            ]}
          >
            <Text style={[
              styles.yesNoLabel,
              { color: value === bool ? colors.primary : colors.textSecondary },
            ]}>
              {bool ? 'Yes' : 'No'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── REASON PICKER ────────────────────────────────────────────────────────────

const REASONS: Array<{ value: PurchaseReason; label: string }> = [
  { value: 'need', label: 'Need' },
  { value: 'want', label: 'Want' },
  { value: 'sale', label: 'On Sale' },
  { value: 'influencer', label: 'Influencer' },
  { value: 'fomo', label: 'FOMO' },
  { value: 'bored', label: 'Bored' },
  { value: 'replacement', label: 'Replacement' },
  { value: 'other', label: 'Other' },
];

function ReasonPicker({ selected, onSelect, error, colors }: { selected: PurchaseReason | ''; onSelect: (v: PurchaseReason) => void; error?: string; colors: any }) {
  return (
    <View style={styles.pickerBlock}>
      <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>
        Why are you buying this? *
      </Text>
      <View style={styles.chipGrid}>
        {REASONS.map(({ value, label }) => (
          <TouchableOpacity
            key={value}
            onPress={() => onSelect(value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === value }}
            style={[
              styles.chip,
              {
                borderColor: selected === value ? colors.primary : colors.border,
                backgroundColor: selected === value ? colors.primarySubtle : colors.surface,
              },
            ]}
          >
            <Text style={[
              styles.chipText,
              { color: selected === value ? colors.primary : colors.textSecondary },
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={[styles.fieldError, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

// ─── CATEGORY PICKER ──────────────────────────────────────────────────────────

const CATEGORIES: Array<{ value: PurchaseCategory; label: string }> = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'home', label: 'Home' },
  { value: 'food', label: 'Food' },
  { value: 'sports', label: 'Sports' },
  { value: 'health', label: 'Health' },
  { value: 'books', label: 'Books' },
  { value: 'travel', label: 'Travel' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'tools', label: 'Tools' },
  { value: 'other', label: 'Other' },
];

function CategoryPicker({ selected, onSelect, error, colors }: { selected: PurchaseCategory | ''; onSelect: (v: PurchaseCategory) => void; error?: string; colors: any }) {
  return (
    <View style={styles.pickerBlock}>
      <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>
        Category *
      </Text>
      <View style={styles.chipGrid}>
        {CATEGORIES.map(({ value, label }) => (
          <TouchableOpacity
            key={value}
            onPress={() => onSelect(value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === value }}
            style={[
              styles.chip,
              {
                borderColor: selected === value ? colors.primary : colors.border,
                backgroundColor: selected === value ? colors.primarySubtle : colors.surface,
              },
            ]}
          >
            <Text style={[
              styles.chipText,
              { color: selected === value ? colors.primary : colors.textSecondary },
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={[styles.fieldError, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

// ─── FREQUENCY PICKER ────────────────────────────────────────────────────────

const FREQUENCIES: Array<{ value: UsageFrequency; label: string; sub: string }> = [
  { value: 'daily', label: 'Daily', sub: 'Every day' },
  { value: 'weekly', label: 'Weekly', sub: 'A few times a week' },
  { value: 'monthly', label: 'Monthly', sub: 'A few times a month' },
  { value: 'rarely', label: 'Rarely', sub: 'Once in a while' },
  { value: 'never', label: 'Never', sub: 'Honestly, never' },
];

function FrequencyPicker({ selected, onSelect, colors }: { selected: UsageFrequency | ''; onSelect: (v: UsageFrequency) => void; colors: any }) {
  return (
    <View style={styles.questionBlock}>
      <Text style={[styles.questionText, { color: colors.textPrimary }]}>
        How often will you realistically use this?
      </Text>
      <View style={styles.verticalOptions}>
        {FREQUENCIES.map(({ value, label, sub }) => (
          <TouchableOpacity
            key={value}
            onPress={() => onSelect(value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === value }}
            style={[
              styles.optionRow,
              {
                borderColor: selected === value ? colors.primary : colors.border,
                backgroundColor: selected === value ? colors.primarySubtle : colors.surface,
              },
            ]}
          >
            <View style={[
              styles.radioOuter,
              { borderColor: selected === value ? colors.primary : colors.border },
            ]}>
              {selected === value && (
                <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{label}</Text>
              <Text style={[styles.optionSub, { color: colors.textMuted }]}>{sub}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── BUDGET IMPACT PICKER ────────────────────────────────────────────────────

const BUDGET_IMPACTS: Array<{ value: BudgetImpact; label: string }> = [
  { value: 'none', label: 'No impact' },
  { value: 'minor', label: 'Minor' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'significant', label: 'Significant' },
];

function BudgetImpactPicker({ selected, onSelect, colors }: { selected: BudgetImpact | ''; onSelect: (v: BudgetImpact) => void; colors: any }) {
  return (
    <View style={styles.questionBlock}>
      <Text style={[styles.questionText, { color: colors.textPrimary }]}>
        How does this affect your budget this month?
      </Text>
      <View style={styles.chipGrid}>
        {BUDGET_IMPACTS.map(({ value, label }) => (
          <TouchableOpacity
            key={value}
            onPress={() => onSelect(value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === value }}
            style={[
              styles.chip,
              {
                borderColor: selected === value ? colors.primary : colors.border,
                backgroundColor: selected === value ? colors.primarySubtle : colors.surface,
              },
            ]}
          >
            <Text style={[
              styles.chipText,
              { color: selected === value ? colors.primary : colors.textSecondary },
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function detectPlatform(url: string): ShoppingPlatform {
  if (!url) return 'unknown';
  const lower = url.toLowerCase();
  if (lower.includes('shopee')) return 'shopee';
  if (lower.includes('lazada')) return 'lazada';
  if (lower.includes('tiktok')) return 'tiktok_shop';
  if (lower.includes('instagram')) return 'instagram';
  if (lower.includes('facebook')) return 'facebook';
  if (lower.includes('amazon')) return 'amazon';
  return 'other_website';
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
  },
  headerCenter: {
    alignItems: 'center',
    gap: spacing[1.5],
  },
  headerTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  stepDots: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  stepDot: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[6],
  },
  footer: {
    padding: spacing[4],
    borderTopWidth: 1,
  },
  stepContainer: {
    padding: spacing[4],
    gap: spacing[4],
  },
  stepHint: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
  },
  questionBlock: {
    gap: spacing[2],
  },
  questionText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    lineHeight: 22,
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderWidth: 1.5,
    borderRadius: radius.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  yesNoLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  pickerBlock: {
    gap: spacing[2],
  },
  pickerLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1.5,
    borderRadius: radius.full,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  verticalOptions: {
    gap: spacing[2],
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderWidth: 1.5,
    borderRadius: radius.md,
  },
  optionLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
  optionSub: {
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fieldError: {
    fontSize: typography.size.xs,
  },
});
