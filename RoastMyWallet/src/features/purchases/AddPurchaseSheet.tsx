import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet,
  TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useShallow } from 'zustand/react/shallow';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { spacing, radius } from '@/theme/tokens';
import { detectPlatformFromUrl } from '@/features/intercept/intercept.utils';
import { ArrowRightIcon, CheckIcon, FlameIcon, ShieldIcon, WalletIcon, ClockIcon } from '@/components/icons/RmwIcons';
import type {
  PurchaseReason, PurchaseCategory, ShoppingPlatform,
  UsageFrequency, BudgetImpact, CreatePurchaseInput,
} from '@/types';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Step = 'basics' | 'questions' | 'reviewing';

interface FormData {
  productName: string; priceStr: string; url: string;
  reason: PurchaseReason | ''; category: PurchaseCategory | ''; notes: string;
  plannedBefore: boolean | null; hasAlternative: boolean | null;
  usageFrequency: UsageFrequency | ''; wouldBuyAtFullPrice: boolean | null;
  budgetImpact: BudgetImpact | '';
}

const INITIAL: FormData = {
  productName: '', priceStr: '', url: '', reason: '', category: '', notes: '',
  plannedBefore: null, hasAlternative: null,
  usageFrequency: '', wouldBuyAtFullPrice: null, budgetImpact: '',
};

interface Props { onClose: () => void; prefillUrl?: string; }

// ─── SHEET ───────────────────────────────────────────────────────────────────

export function AddPurchaseSheet({ onClose, prefillUrl }: Props) {
  const { colors, isDark } = useTheme();
  const [step, setStep]   = useState<Step>('basics');
  const [form, setForm]   = useState<FormData>({ ...INITIAL, url: prefillUrl ?? '' });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const { addPurchase, addingState } = usePurchaseStore(useShallow(state => ({
    addPurchase: state.addPurchase,
    addingState: state.addingState,
  })));
  const { isPro } = useSubscriptionStore();
  const isLoading = addingState === 'loading';

  const set = useCallback(<K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  }, []);

  const validateBasics = () => {
    const e: typeof errors = {};
    if (!form.productName.trim()) e.productName = 'กรุณาใส่ชื่อสินค้า';
    if (!form.priceStr.trim()) e.priceStr = 'กรุณาใส่ราคา';
    else if (isNaN(Number(form.priceStr)) || Number(form.priceStr) <= 0) e.priceStr = 'ราคาไม่ถูกต้อง';
    if (!form.reason) e.reason = 'กรุณาเลือกเหตุผล';
    if (!form.category) e.category = 'กรุณาเลือกหมวดหมู่';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 'basics') { if (validateBasics()) setStep('questions'); }
    else if (step === 'questions') setStep('reviewing');
  };

  const handleBack = () => {
    if (step === 'questions') setStep('basics');
    else if (step === 'reviewing') setStep('questions');
    else onClose();
  };

  const handleSubmit = async () => {
    const price = Number(form.priceStr);
    const input: CreatePurchaseInput = {
      productName: form.productName.trim(),
      price, currency: 'THB',
      url: form.url.trim() || null,
      category: form.category as PurchaseCategory,
      platform: form.url ? detectPlatformFromUrl(form.url) : 'unknown',
      reason: form.reason as PurchaseReason,
      notes: form.notes.trim() || null,
      questionnaire: form.plannedBefore !== null && form.hasAlternative !== null && form.usageFrequency && form.wouldBuyAtFullPrice !== null && form.budgetImpact
        ? {
            plannedBefore: form.plannedBefore,
            hasAlternative: form.hasAlternative,
            usageFrequency: form.usageFrequency as import('@/types').UsageFrequency,
            wouldBuyAtFullPrice: form.wouldBuyAtFullPrice,
            budgetImpact: form.budgetImpact as import('@/types').BudgetImpact,
            emotionalState: 'neutral' as import('@/types').EmotionalState,
          }
        : null,
      imageUrl: null,
      waitingHours: isPro() ? 48 : 24,
    };
    try {
      const savedPurchase = await addPurchase(input, isPro());
      if (savedPurchase) {
        onClose();
      } else {
        Alert.alert(
          'บันทึกรายการไม่สำเร็จ',
          usePurchaseStore.getState().error || 'ไม่สามารถบันทึกรายการได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่',
        );
      }
    } catch {
      Alert.alert('เกิดข้อผิดพลาด', 'กรุณาลองใหม่อีกครั้ง');
    }
  };

  const stepIndex = step === 'basics' ? 0 : step === 'questions' ? 1 : 2;

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#0D1A2B' : '#F8F7F5' }]}>
      {/* ── Header ──────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: isDark ? '#141927' : '#fff' }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerSide} hitSlop={8}>
          {step === 'basics'
            ? <Text style={[styles.cancelText, { color: colors.textMuted }]}>ยกเลิก</Text>
            : <Text style={[styles.cancelText, { color: colors.textSecondary }]}>← ย้อนกลับ</Text>
          }
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {step === 'basics' ? 'เพิ่มสิ่งที่อยากซื้อ' : step === 'questions' ? 'ถามตัวเองก่อน' : 'ยืนยัน'}
          </Text>
          <View style={styles.stepDots}>
            {[0, 1, 2].map(i => (
              <View key={i} style={[styles.stepDot, {
                backgroundColor: i <= stepIndex ? colors.primary : colors.border,
                width: i === stepIndex ? 24 : 8,
              }]} />
            ))}
          </View>
        </View>

        <View style={styles.headerSide} />
      </View>

      {/* ── Content ─────────────────────────────────────── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'basics'  && <BasicsStep form={form} errors={errors} set={set} colors={colors} isDark={isDark} />}
          {step === 'questions' && <QuestionsStep form={form} set={set} colors={colors} isDark={isDark} />}
          {step === 'reviewing' && <ReviewStep form={form} colors={colors} isDark={isDark} />}
        </ScrollView>

        {/* ── Footer ──────────────────────────────────────── */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: isDark ? '#141927' : '#fff' }]}>
          <LinearGradient
            colors={step === 'reviewing' ? ['#235E3B', '#3A9960'] : ['#1B3557', '#2F6293']}
            style={styles.ctaGrad}
          >
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={step === 'reviewing' ? handleSubmit : handleNext}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {step === 'reviewing'
                ? <><CheckIcon size={18} color="#fff" /><Text style={styles.ctaText}>{isLoading ? 'กำลังบันทึก...' : 'เพิ่มใน Waiting List'}</Text></>
                : <><Text style={styles.ctaText}>ถัดไป</Text><ArrowRightIcon size={16} color="#fff" /></>
              }
            </TouchableOpacity>
          </LinearGradient>
          {step === 'reviewing' && (
            <Text style={[styles.waitNote, { color: colors.textMuted }]}>
              รอ {isPro() ? '48' : '24'} ชม. ก่อนตัดสินใจ
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── STEP 1: BASICS ───────────────────────────────────────────────────────────

function BasicsStep({ form, errors, set, colors, isDark }: any) {
  return (
    <View style={styles.stepWrap}>
      <Text style={[styles.stepHint, { color: colors.textMuted }]}>
        บอกเราว่าคุณอยากได้อะไร แล้วเราจะช่วยตัดสินใจ
      </Text>

      <FormField label="ชื่อสินค้า *" error={errors.productName} colors={colors} isDark={isDark}>
        <StyledInput
          value={form.productName} onChangeText={(t: string) => set('productName', t)}
          placeholder="เช่น AirPods Pro, รองเท้า Nike"
          hasError={!!errors.productName} colors={colors} isDark={isDark}
        />
      </FormField>

      <FormField label="ราคา (บาท) *" error={errors.priceStr} colors={colors} isDark={isDark}>
        <StyledInput
          value={form.priceStr} onChangeText={(t: string) => set('priceStr', t)}
          placeholder="0.00" keyboardType="decimal-pad"
          hasError={!!errors.priceStr} colors={colors} isDark={isDark}
        />
      </FormField>

      <FormField label="ลิงก์สินค้า (ถ้ามี)" colors={colors} isDark={isDark}>
        <StyledInput
          value={form.url} onChangeText={(t: string) => set('url', t)}
          placeholder="https://shopee.co.th/..."
          keyboardType="url" autoCapitalize="none"
          colors={colors} isDark={isDark}
        />
      </FormField>

      <PickerField label="เหตุผลที่อยากได้ *" error={errors.reason} colors={colors}>
        <ChipGroup
          options={REASONS} selected={form.reason}
          onSelect={(v: string) => set('reason', v)}
          colors={colors} isDark={isDark}
        />
      </PickerField>

      <PickerField label="หมวดหมู่ *" error={errors.category} colors={colors}>
        <ChipGroup
          options={CATEGORIES} selected={form.category}
          onSelect={(v: string) => set('category', v)}
          colors={colors} isDark={isDark} wrap
        />
      </PickerField>

      <FormField label="บันทึก (ไม่บังคับ)" colors={colors} isDark={isDark}>
        <StyledInput
          value={form.notes} onChangeText={(t: string) => set('notes', t)}
          placeholder="เขียนเหตุผลเพิ่มเติมให้ตัวเองอ่านทีหลัง..."
          multiline numberOfLines={3}
          colors={colors} isDark={isDark}
        />
      </FormField>
    </View>
  );
}

// ─── STEP 2: QUESTIONS ───────────────────────────────────────────────────────

function QuestionsStep({ form, set, colors, isDark }: any) {
  return (
    <View style={styles.stepWrap}>
      <Text style={[styles.stepHint, { color: colors.textMuted }]}>
        คำถามต่อไปนี้ช่วยให้ AI คำนวณ Need Score ได้แม่นขึ้น
      </Text>

      <QuestionCard
        q="คุณวางแผนซื้อสิ่งนี้ก่อนเข้าแอปไหม?"
        value={form.plannedBefore} onChange={(v: boolean) => set('plannedBefore', v)}
        colors={colors} isDark={isDark}
      />

      <QuestionCard
        q="มีสิ่งทดแทนที่ใช้อยู่แล้วไหม?"
        value={form.hasAlternative} onChange={(v: boolean) => set('hasAlternative', v)}
        colors={colors} isDark={isDark}
      />

      <PickerField label="จะได้ใช้บ่อยแค่ไหน?" colors={colors}>
        <RadioGroup
          options={FREQUENCIES} selected={form.usageFrequency}
          onSelect={(v: string) => set('usageFrequency', v)}
          colors={colors} isDark={isDark}
        />
      </PickerField>

      <QuestionCard
        q="ถ้าไม่มีโปรโมชั่น คุณยังซื้อในราคาเต็มอยู่ไหม?"
        value={form.wouldBuyAtFullPrice} onChange={(v: boolean) => set('wouldBuyAtFullPrice', v)}
        colors={colors} isDark={isDark}
      />

      <PickerField label="กระทบงบประมาณเดือนนี้แค่ไหน?" colors={colors}>
        <ChipGroup
          options={BUDGET_IMPACTS} selected={form.budgetImpact}
          onSelect={(v: string) => set('budgetImpact', v)}
          colors={colors} isDark={isDark}
        />
      </PickerField>
    </View>
  );
}

// ─── STEP 3: REVIEW ──────────────────────────────────────────────────────────

function ReviewStep({ form, colors, isDark }: any) {
  const price = Number(form.priceStr);
  return (
    <View style={styles.stepWrap}>
      {/* Summary card */}
      <View style={[styles.reviewCard, { backgroundColor: isDark ? '#141927' : '#fff', borderColor: colors.border }]}>
        <Text style={[styles.reviewName, { color: colors.textPrimary }]}>{form.productName}</Text>
        <Text style={[styles.reviewPrice, { color: colors.primary }]}>฿{price.toLocaleString()}</Text>
        {form.url ? (
          <Text style={[styles.reviewUrl, { color: colors.textMuted }]} numberOfLines={1}>{form.url}</Text>
        ) : null}
      </View>

      {/* Key details */}
      <View style={[styles.detailRows, { backgroundColor: isDark ? '#141927' : '#fff', borderColor: colors.border }]}>
        {[
          { label: 'หมวดหมู่', value: CATEGORIES.find(c => c.value === form.category)?.label ?? form.category, icon: <WalletIcon size={14} color={colors.textMuted} /> },
          { label: 'เหตุผล', value: REASONS.find(r => r.value === form.reason)?.label ?? form.reason, icon: <FlameIcon size={14} color={colors.textMuted} /> },
          { label: 'ใช้บ่อยแค่ไหน', value: FREQUENCIES.find(f => f.value === form.usageFrequency)?.label ?? 'ไม่ได้ระบุ', icon: <ClockIcon size={14} color={colors.textMuted} /> },
        ].map((row, i) => (
          <React.Fragment key={row.label}>
            {i > 0 && <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />}
            <View style={styles.detailRow}>
              {row.icon}
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{row.label}</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{row.value}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Planned tip */}
      {form.plannedBefore === false && (
        <View style={[styles.roastTip, { backgroundColor: '#E8A030' + '15', borderColor: '#E8A030' + '30' }]}>
          <FlameIcon size={14} color="#E8A030" />
          <Text style={[styles.roastTipText, { color: '#E8A030' }]}>
            คุณไม่ได้วางแผนซื้อสิ่งนี้มาก่อน — นี่แหละคือสัญญาณของการซื้อแบบหุนหันพลันแล่น!
          </Text>
        </View>
      )}

      {form.notes ? (
        <View style={[styles.notesBox, { backgroundColor: isDark ? '#141927' : '#F4F6F9', borderColor: colors.border }]}>
          <Text style={[styles.notesLabel, { color: colors.textMuted }]}>บันทึก</Text>
          <Text style={[styles.notesText, { color: colors.textPrimary }]}>{form.notes}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function FormField({ label, error, children, colors, isDark }: any) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      {children}
      {error && <Text style={[styles.fieldError, { color: colors.danger ?? '#D46060' }]}>{error}</Text>}
    </View>
  );
}

function PickerField({ label, error, children, colors }: any) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      {children}
      {error && <Text style={[styles.fieldError, { color: colors.danger ?? '#D46060' }]}>{error}</Text>}
    </View>
  );
}

function StyledInput({ colors, isDark, hasError, multiline, ...rest }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[styles.input, {
        borderColor: hasError ? '#D46060' : focused ? colors.primary : colors.border,
        backgroundColor: isDark ? '#1E2A3A' : '#fff',
        color: colors.textPrimary,
        height: multiline ? 80 : 52,
        textAlignVertical: multiline ? 'top' : 'center',
        paddingTop: multiline ? 12 : 0,
      }]}
      placeholderTextColor={colors.textMuted}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      multiline={multiline}
      {...rest}
    />
  );
}

function QuestionCard({ q, value, onChange, colors, isDark }: any) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.questionText, { color: colors.textPrimary }]}>{q}</Text>
      <View style={styles.yesNoRow}>
        {[{ v: true, label: 'ใช่' }, { v: false, label: 'ไม่ใช่' }].map(opt => (
          <TouchableOpacity
            key={String(opt.v)}
            onPress={() => onChange(opt.v)}
            style={[styles.yesNoBtn, {
              borderColor: value === opt.v ? colors.primary : colors.border,
              backgroundColor: value === opt.v ? colors.primarySubtle : (isDark ? '#1E2A3A' : '#fff'),
            }]}
          >
            {value === opt.v && <CheckIcon size={14} color={colors.primary} />}
            <Text style={[styles.yesNoText, { color: value === opt.v ? colors.primary : colors.textSecondary }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function ChipGroup({ options, selected, onSelect, colors, isDark, wrap }: any) {
  return (
    <View style={[styles.chipWrap, wrap && { flexWrap: 'wrap' }]}>
      {options.map((o: any) => (
        <TouchableOpacity
          key={o.value}
          onPress={() => onSelect(o.value)}
          style={[styles.chip, {
            borderColor: selected === o.value ? colors.primary : colors.border,
            backgroundColor: selected === o.value ? colors.primarySubtle : (isDark ? '#1E2A3A' : '#fff'),
          }]}
        >
          <Text style={[styles.chipText, { color: selected === o.value ? colors.primary : colors.textSecondary }]}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function RadioGroup({ options, selected, onSelect, colors, isDark }: any) {
  return (
    <View style={{ gap: 8 }}>
      {options.map((o: any) => (
        <TouchableOpacity
          key={o.value}
          onPress={() => onSelect(o.value)}
          style={[styles.radioRow, {
            borderColor: selected === o.value ? colors.primary : colors.border,
            backgroundColor: selected === o.value ? colors.primarySubtle : (isDark ? '#1E2A3A' : '#fff'),
          }]}
        >
          <View style={[styles.radioOuter, { borderColor: selected === o.value ? colors.primary : colors.border }]}>
            {selected === o.value && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.radioLabel, { color: colors.textPrimary }]}>{o.label}</Text>
            {o.sub && <Text style={[styles.radioSub, { color: colors.textMuted }]}>{o.sub}</Text>}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const REASONS = [
  { value: 'want',        label: 'แค่อยากได้' },
  { value: 'need',        label: 'จำเป็นต้องใช้' },
  { value: 'impulse',     label: 'เห็นแล้วอยากได้เลย' },
  { value: 'gift',        label: 'ซื้อเป็นของขวัญ' },
  { value: 'replacement', label: 'ของเดิมพังแล้ว' },
  { value: 'deal',        label: 'โปรโมชั่นน่าสนใจ' },
];

const CATEGORIES = [
  { value: 'electronics',   label: 'อิเล็กทรอนิกส์' },
  { value: 'fashion',       label: 'แฟชั่น' },
  { value: 'beauty',        label: 'ความงาม' },
  { value: 'gaming',        label: 'เกมมิ่ง' },
  { value: 'home',          label: 'ของใช้บ้าน' },
  { value: 'food',          label: 'อาหาร' },
  { value: 'sports',        label: 'กีฬา' },
  { value: 'health',        label: 'สุขภาพ' },
  { value: 'books',         label: 'หนังสือ' },
  { value: 'travel',        label: 'ท่องเที่ยว' },
  { value: 'entertainment', label: 'ความบันเทิง' },
  { value: 'tools',         label: 'เครื่องมือ' },
  { value: 'other',         label: 'อื่นๆ' },
];

const FREQUENCIES = [
  { value: 'daily',   label: 'ทุกวัน',       sub: 'ใช้เป็นประจำ' },
  { value: 'weekly',  label: 'ทุกสัปดาห์',   sub: 'ไม่กี่ครั้งต่อสัปดาห์' },
  { value: 'monthly', label: 'ทุกเดือน',     sub: 'บางครั้ง' },
  { value: 'rarely',  label: 'นานๆ ครั้ง',   sub: 'ใช้แค่โอกาสพิเศษ' },
  { value: 'never',   label: 'แทบไม่ได้ใช้', sub: 'พูดตรงๆ กับตัวเอง' },
];

const BUDGET_IMPACTS = [
  { value: 'none',        label: 'ไม่กระทบ' },
  { value: 'minor',       label: 'นิดหน่อย' },
  { value: 'moderate',    label: 'พอสมควร' },
  { value: 'significant', label: 'กระทบมาก' },
];

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerSide: { width: 80 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  cancelText: { fontSize: 14 },
  stepDots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  stepDot: { height: 4, borderRadius: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  stepWrap: { padding: 16, gap: 20 },
  stepHint: { fontSize: 13, lineHeight: 19 },
  footer: { padding: 16, gap: 8, borderTopWidth: 1 },
  ctaGrad: { borderRadius: 14 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  waitNote: { textAlign: 'center', fontSize: 12 },
  fieldWrap: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  fieldError: { fontSize: 12, marginTop: -4 },
  input: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, fontSize: 15 },
  questionText: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  yesNoRow: { flexDirection: 'row', gap: 10 },
  yesNoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5 },
  yesNoText: { fontSize: 15, fontWeight: '600' },
  chipWrap: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: '600' },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5 },
  radioLabel: { fontSize: 15, fontWeight: '600' },
  radioSub: { fontSize: 12, marginTop: 1 },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 8, height: 8, borderRadius: 4 },
  reviewCard: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 6 },
  reviewName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  reviewPrice: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  reviewUrl: { fontSize: 12, marginTop: 2 },
  detailRows: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13 },
  detailLabel: { flex: 1, fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: '600', textAlign: 'right' },
  rowDivider: { height: 1, marginLeft: 14 },
  roastTip: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'flex-start' },
  roastTipText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  notesBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 5 },
  notesLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  notesText: { fontSize: 14, lineHeight: 20 },
});
