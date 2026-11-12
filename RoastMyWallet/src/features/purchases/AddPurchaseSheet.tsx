import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { detectPlatformFromUrl } from '@/features/intercept/InterceptService';
import { PlatformTile, PLATFORM_NAME } from '@/components/icons/PlatformIcons';
import { CloseIcon, LinkIcon, ChevronDownIcon, CheckIcon, ClockIcon } from '@/components/icons/RmwIcons';
import type {
  PurchaseReason, PurchaseCategory, UsageFrequency, BudgetImpact,
  ScoringQuestionnaire, CreatePurchaseInput, ShoppingPlatform,
} from '@/types';

interface Props { onClose: () => void; prefillUrl?: string }

// ─── Options (values match the database enums) ───────────────────────────────

const REASONS: { value: PurchaseReason; label: string }[] = [
  { value: 'need', label: 'จำเป็นต้องใช้' },
  { value: 'want', label: 'แค่อยากได้' },
  { value: 'sale', label: 'ลดราคา' },
  { value: 'influencer', label: 'มีคนรีวิว' },
  { value: 'fomo', label: 'กลัวพลาด' },
  { value: 'bored', label: 'เบื่อๆ' },
  { value: 'replacement', label: 'ของเดิมพัง' },
];

const CATEGORIES: { value: PurchaseCategory; label: string; words: string[] }[] = [
  { value: 'electronics', label: 'อิเล็กทรอนิกส์', words: ['iphone', 'ipad', 'macbook', 'airpods', 'หูฟัง', 'keyboard', 'คีย์บอร์ด', 'โน้ตบุ๊ก', 'notebook', 'laptop', 'มือถือ', 'ทีวี', 'กล้อง', 'camera', 'ที่ชาร์จ', 'ssd', 'monitor', 'เมาส์', 'mouse', 'ลำโพง', 'tablet'] },
  { value: 'fashion', label: 'แฟชั่น', words: ['รองเท้า', 'เสื้อ', 'กางเกง', 'กระเป๋า', 'nike', 'adidas', 'แจ็คเก็ต', 'dress', 'ชุด', 'หมวก', 'แว่น', 'นาฬิกา'] },
  { value: 'beauty', label: 'ความงาม', words: ['ลิป', 'ครีม', 'เซรั่ม', 'น้ำหอม', 'makeup', 'skincare', 'มาสคารา', 'โฟม'] },
  { value: 'gaming', label: 'เกมมิ่ง', words: ['steam', 'ps5', 'playstation', 'xbox', 'nintendo', 'switch', 'เกม', 'game', 'rov', 'robux'] },
  { value: 'home', label: 'ของใช้บ้าน', words: ['โซฟา', 'หม้อ', 'พัดลม', 'เตียง', 'ที่นอน', 'ตู้', 'โต๊ะ', 'เก้าอี้', 'หลอดไฟ', 'เครื่องครัว', 'ผ้าห่ม'] },
  { value: 'food', label: 'อาหาร', words: ['อาหาร', 'ขนม', 'กาแฟ', 'บุฟเฟ่', 'buffet', 'ร้านอาหาร', 'ชานม'] },
  { value: 'sports', label: 'กีฬา', words: ['ฟุตบอล', 'ยิม', 'โยคะ', 'จักรยาน', 'วิ่ง', 'ไม้แบด', 'กอล์ฟ', 'ชุดกีฬา'] },
  { value: 'health', label: 'สุขภาพ', words: ['วิตามิน', 'อาหารเสริม', 'เวย์', 'whey', 'ยา'] },
  { value: 'books', label: 'หนังสือ', words: ['หนังสือ', 'นิยาย', 'book', 'มังงะ', 'manga'] },
  { value: 'travel', label: 'ท่องเที่ยว', words: ['ตั๋ว', 'โรงแรม', 'ที่พัก', 'เที่ยวบิน', 'flight', 'ทัวร์', 'agoda', 'klook'] },
  { value: 'entertainment', label: 'ความบันเทิง', words: ['netflix', 'spotify', 'youtube', 'disney', 'คอนเสิร์ต', 'ตั๋วหนัง'] },
  { value: 'tools', label: 'เครื่องมือ', words: ['สว่าน', 'ไขควง', 'drill', 'เครื่องมือ'] },
  { value: 'other', label: 'อื่นๆ', words: [] },
];

const guessCategory = (name: string): PurchaseCategory | null => {
  const n = name.toLowerCase();
  if (n.trim().length < 2) return null;
  return CATEGORIES.find(c => c.words.some(w => n.includes(w)))?.value ?? null;
};

const FREQUENCIES: { value: UsageFrequency; label: string }[] = [
  { value: 'daily', label: 'ทุกวัน' }, { value: 'weekly', label: 'ทุกสัปดาห์' }, { value: 'monthly', label: 'ทุกเดือน' },
  { value: 'rarely', label: 'นานๆ ครั้ง' }, { value: 'never', label: 'แทบไม่ใช้' },
];
const BUDGETS: { value: BudgetImpact; label: string }[] = [
  { value: 'none', label: 'ไม่กระทบ' }, { value: 'minor', label: 'นิดหน่อย' },
  { value: 'moderate', label: 'พอสมควร' }, { value: 'significant', label: 'มาก' },
];

type YesNo = boolean | null;
interface Answers { plannedBefore: YesNo; hasAlternative: YesNo; wouldBuyAtFullPrice: YesNo; usageFrequency: UsageFrequency | null; budgetImpact: BudgetImpact | null }
const NO_ANSWERS: Answers = { plannedBefore: null, hasAlternative: null, wouldBuyAtFullPrice: null, usageFrequency: null, budgetImpact: null };

// ─── Sheet ───────────────────────────────────────────────────────────────────

export function AddPurchaseSheet({ onClose, prefillUrl }: Props) {
  const { colors } = useTheme();
  const wide = useWindowDimensions().width >= 600; // no touch scrolling assumed: wrap instead of side-scroll
  const { isPro } = useSubscriptionStore();
  const addPurchase = usePurchaseStore(s => s.addPurchase);
  const saving = usePurchaseStore(s => s.addingState === 'loading');

  const [name, setName] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [url, setUrl] = useState(prefillUrl ?? '');
  const [category, setCategory] = useState<PurchaseCategory | null>(null);
  const [catTouched, setCatTouched] = useState(false);
  const [reason, setReason] = useState<PurchaseReason | null>(null);
  const [more, setMore] = useState(false);
  const [answers, setAnswers] = useState<Answers>(NO_ANSWERS);
  const [notes, setNotes] = useState('');
  const [tried, setTried] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const priceRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const price = Number(priceStr);
  const nameOk = name.trim().length > 0;
  const priceOk = Number.isFinite(price) && price > 0;
  const platform: ShoppingPlatform | null = useMemo(() => (url.trim() ? detectPlatformFromUrl(url.trim()) : null), [url]);
  const suggested = useMemo(() => guessCategory(name), [name]);
  const shownCategory = catTouched ? category : suggested;
  const answered = Object.values(answers).filter(v => v !== null).length;
  const waitHours = isPro() ? 48 : 24;

  const onName = (t: string) => { setName(t); setSubmitError(''); };
  const onPrice = (t: string) => {
    const clean = t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setPriceStr(clean); setSubmitError('');
  };
  const pickCategory = (c: PurchaseCategory) => { setCategory(c); setCatTouched(true); };
  const setAnswer = <K extends keyof Answers>(k: K, v: Answers[K]) => setAnswers(a => ({ ...a, [k]: a[k] === v ? null : v }));

  const paste = async () => {
    try { const t = (await Clipboard.getStringAsync()).trim(); if (t) setUrl(t); } catch { /* clipboard may be blocked */ }
  };

  const submit = async () => {
    setTried(true);
    if (!nameOk || !priceOk) return;
    const finalReason: PurchaseReason = reason ?? 'other';
    // Unanswered questions fall back to the same conservative defaults as the quick score.
    const questionnaire: ScoringQuestionnaire | null = answered === 0 ? null : {
      plannedBefore: answers.plannedBefore ?? false,
      hasAlternative: answers.hasAlternative ?? false,
      usageFrequency: answers.usageFrequency ?? 'monthly',
      wouldBuyAtFullPrice: answers.wouldBuyAtFullPrice ?? (finalReason !== 'sale' && finalReason !== 'fomo'),
      budgetImpact: answers.budgetImpact ?? 'minor',
      emotionalState: 'unknown',
    };
    const input: CreatePurchaseInput = {
      productName: name.trim(), price, currency: 'THB',
      url: url.trim() || null, imageUrl: null,
      category: shownCategory ?? 'other',
      platform: platform ?? 'unknown',
      reason: finalReason,
      notes: notes.trim() || null,
      questionnaire,
      waitingHours: waitHours,
    };
    try {
      const saved = await addPurchase(input, isPro());
      if (saved) onClose();
      else setSubmitError(usePurchaseStore.getState().error || 'บันทึกไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
    } catch {
      setSubmitError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const showNameErr = tried && !nameOk;
  const showPriceErr = tried && !priceOk;

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.col}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>เพิ่มสิ่งที่อยากได้</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>ใส่แค่ชื่อกับราคาก็พอ ที่เหลือเลือกเพิ่มได้</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.close, { backgroundColor: colors.backgroundSubtle }]} accessibilityRole="button" accessibilityLabel="ปิด" hitSlop={8}>
            <CloseIcon size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Name */}
          <Field label="ชื่อสินค้า" error={showNameErr ? 'กรุณาใส่ชื่อสินค้า' : undefined} colors={colors}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: showNameErr ? colors.danger : colors.border, backgroundColor: colors.surface }]}
              value={name} onChangeText={onName} placeholder="เช่น AirPods Pro, รองเท้า Nike"
              placeholderTextColor={colors.textMuted} autoFocus returnKeyType="next" accessibilityLabel="ชื่อสินค้า"
              onSubmitEditing={() => priceRef.current?.focus()}
            />
          </Field>

          {/* Price */}
          <Field label="ราคา" error={showPriceErr ? 'กรุณาใส่ราคาที่มากกว่า 0' : undefined} colors={colors}>
            <View style={[styles.priceBox, { borderColor: showPriceErr ? colors.danger : colors.border, backgroundColor: colors.surface }]}>
              <Text style={[styles.baht, { color: colors.textMuted }]}>฿</Text>
              <TextInput
                ref={priceRef}
                style={[styles.priceInput, { color: colors.textPrimary }]}
                value={priceStr} onChangeText={onPrice} placeholder="0" placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad" returnKeyType="done" accessibilityLabel="ราคา (บาท)" onSubmitEditing={submit}
              />
            </View>
          </Field>

          {/* Category — one scrolling row, auto-suggested from the name */}
          <Field label="หมวดหมู่" hint={!catTouched && suggested ? 'แนะนำจากชื่อสินค้า' : 'ไม่บังคับ'} colors={colors}>
            {wide ? (
              <View style={styles.wrap}>
                {CATEGORIES.map(c => <Chip key={c.value} label={c.label} on={shownCategory === c.value} onPress={() => pickCategory(c.value)} colors={colors} />)}
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} style={styles.bleed} keyboardShouldPersistTaps="handled">
                {CATEGORIES.map(c => <Chip key={c.value} label={c.label} on={shownCategory === c.value} onPress={() => pickCategory(c.value)} colors={colors} />)}
              </ScrollView>
            )}
          </Field>

          {/* Reason */}
          <Field label="ทำไมถึงอยากได้?" hint="ไม่บังคับ" colors={colors}>
            <View style={styles.wrap}>
              {REASONS.map(r => (
                <Chip key={r.value} label={r.label} on={reason === r.value} onPress={() => setReason(reason === r.value ? null : r.value)} colors={colors} />
              ))}
            </View>
          </Field>

          {/* Link */}
          <Field label="ลิงก์สินค้า" hint="ไม่บังคับ" colors={colors}>
            <View style={[styles.linkBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              {platform && platform !== 'unknown' && platform !== 'other_website'
                ? <PlatformTile platform={platform} size={26} />
                : <LinkIcon size={18} color={colors.textMuted} />}
              <TextInput
                style={[styles.linkInput, { color: colors.textPrimary }]}
                value={url} onChangeText={setUrl} placeholder="วางลิงก์จาก Shopee, Lazada, TikTok…"
                placeholderTextColor={colors.textMuted} autoCapitalize="none" autoCorrect={false} keyboardType="url" accessibilityLabel="ลิงก์สินค้า"
              />
              {url ? (
                <TouchableOpacity onPress={() => setUrl('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="ล้างลิงก์"><CloseIcon size={16} color={colors.textMuted} /></TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={paste} style={[styles.pasteBtn, { backgroundColor: colors.primarySubtle }]} accessibilityRole="button">
                  <Text style={[styles.pasteText, { color: colors.primary }]}>วาง</Text>
                </TouchableOpacity>
              )}
            </View>
            {platform && platform !== 'unknown' && (
              <Text style={[styles.hint, { color: colors.textMuted }]}>ตรวจพบ: {PLATFORM_NAME[platform] ?? 'เว็บช้อปปิ้ง'}</Text>
            )}
          </Field>

          {/* Optional: sharper score */}
          <TouchableOpacity
            onPress={() => setMore(m => !m)} activeOpacity={0.8} accessibilityRole="button" accessibilityState={{ expanded: more }}
            style={[styles.moreHead, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.moreTitle, { color: colors.textPrimary }]}>ตอบเพิ่ม เพื่อให้คะแนนแม่นขึ้น</Text>
              <Text style={[styles.hint, { color: colors.textMuted, marginTop: 2 }]}>{answered > 0 ? `ตอบแล้ว ${answered}/5 ข้อ` : 'ไม่บังคับ · ใช้เวลาไม่ถึงนาที'}</Text>
            </View>
            <View style={{ transform: [{ rotate: more ? '180deg' : '0deg' }] }}><ChevronDownIcon size={20} color={colors.textMuted} /></View>
          </TouchableOpacity>

          {more && (
            <View style={[styles.moreBody, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <YesNoRow q="วางแผนจะซื้อ ก่อนเห็นของชิ้นนี้ไหม?" value={answers.plannedBefore} onChange={v => setAnswer('plannedBefore', v)} yes="ใช่" no="ไม่ใช่" colors={colors} />
              <YesNoRow q="มีของที่ใช้แทนกันได้อยู่แล้วไหม?" value={answers.hasAlternative} onChange={v => setAnswer('hasAlternative', v)} yes="มี" no="ไม่มี" colors={colors} />
              <YesNoRow q="ถ้าไม่ลดราคา ยังซื้อไหม?" value={answers.wouldBuyAtFullPrice} onChange={v => setAnswer('wouldBuyAtFullPrice', v)} yes="ซื้อ" no="ไม่ซื้อ" colors={colors} />
              <View style={{ gap: 8 }}>
                <Text style={[styles.q, { color: colors.textPrimary }]}>จะใช้บ่อยแค่ไหน?</Text>
                <View style={styles.wrap}>
                  {FREQUENCIES.map(f => <Chip key={f.value} label={f.label} small on={answers.usageFrequency === f.value} onPress={() => setAnswer('usageFrequency', f.value)} colors={colors} />)}
                </View>
              </View>
              <View style={{ gap: 8 }}>
                <Text style={[styles.q, { color: colors.textPrimary }]}>กระทบงบเดือนนี้แค่ไหน?</Text>
                <View style={styles.wrap}>
                  {BUDGETS.map(b => <Chip key={b.value} label={b.label} small on={answers.budgetImpact === b.value} onPress={() => setAnswer('budgetImpact', b.value)} colors={colors} />)}
                </View>
              </View>
              <View style={{ gap: 8 }}>
                <Text style={[styles.q, { color: colors.textPrimary }]}>โน้ตถึงตัวเอง</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBackground, height: 72, textAlignVertical: 'top', paddingTop: 12 }]}
                  value={notes} onChangeText={setNotes} placeholder="เขียนไว้ให้ตัวเองอ่านตอนตัดสินใจ" placeholderTextColor={colors.textMuted} multiline accessibilityLabel="โน้ต"
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          {submitError ? (
            <View style={[styles.alert, { backgroundColor: colors.dangerSubtle }]} accessibilityLiveRegion="polite">
              <Text style={{ color: colors.dangerText, fontSize: 13 }}>{submitError}</Text>
            </View>
          ) : null}
          <View style={styles.waitRow}>
            <ClockIcon size={14} color={colors.textMuted} />
            <Text style={[styles.hint, { color: colors.textMuted }]}>จะเข้า Waiting List และรอ {waitHours} ชม. ก่อนให้คุณตัดสินใจ</Text>
          </View>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: colors.primary }, (!nameOk || !priceOk) && !saving && { opacity: 0.5 }, saving && { opacity: 0.8 }]}
            onPress={submit} disabled={saving} activeOpacity={0.85} accessibilityRole="button"
          >
            {saving ? <ActivityIndicator color="#fff" /> : <><CheckIcon size={18} color="#fff" /><Text style={styles.ctaText}>เพิ่มใน Waiting List</Text></>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Small parts ─────────────────────────────────────────────────────────────

function Field({ label, hint, error, children, colors }: { label: string; hint?: string; error?: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
        {hint ? <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text> : null}
      </View>
      {children}
      {error ? <Text style={[styles.error, { color: colors.danger }]} accessibilityLiveRegion="polite">{error}</Text> : null}
    </View>
  );
}

function Chip({ label, on, onPress, colors, small }: { label: string; on: boolean; onPress: () => void; colors: any; small?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityState={{ selected: on }}
      style={[styles.chip, small && { paddingVertical: 7, paddingHorizontal: 12 }, { backgroundColor: on ? colors.primary : colors.surface, borderColor: on ? colors.primary : colors.border }]}
    >
      <Text style={[styles.chipText, small && { fontSize: 13 }, { color: on ? '#fff' : colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function YesNoRow({ q, value, onChange, yes, no, colors }: { q: string; value: YesNo; onChange: (v: boolean) => void; yes: string; no: string; colors: any }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.q, { color: colors.textPrimary }]}>{q}</Text>
      <View style={styles.yesNo}>
        {([[true, yes], [false, no]] as [boolean, string][]).map(([v, label]) => (
          <TouchableOpacity key={String(v)} onPress={() => onChange(v)} accessibilityRole="button" accessibilityState={{ selected: value === v }}
            style={[styles.yn, { backgroundColor: value === v ? colors.primary : colors.surface, borderColor: value === v ? colors.primary : colors.border }]}>
            <Text style={{ color: value === v ? '#fff' : colors.textSecondary, fontFamily: 'Prompt_700Bold', fontSize: 14 }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  col: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6 },
  title: { fontSize: 22, fontFamily: 'Prompt_800ExtraBold', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 3, lineHeight: 18 },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24, gap: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  label: { fontSize: 14, fontFamily: 'Prompt_700Bold' },
  hint: { fontSize: 12 },
  error: { fontSize: 12 },
  input: { minHeight: 52, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, outlineStyle: 'none' as any },
  priceBox: { flexDirection: 'row', alignItems: 'center', minHeight: 60, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, gap: 8 },
  baht: { fontSize: 24, fontFamily: 'Prompt_700Bold' },
  priceInput: { flex: 1, fontSize: 28, fontFamily: 'Prompt_800ExtraBold', letterSpacing: -0.6, paddingVertical: 10, outlineStyle: 'none' as any },
  bleed: { marginHorizontal: -20 },
  chipRow: { gap: 8, paddingHorizontal: 20 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 999, borderWidth: 1.5 },
  chipText: { fontSize: 14, fontFamily: 'Prompt_600SemiBold' },
  linkBox: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderWidth: 1.5, borderRadius: 14, paddingLeft: 14, paddingRight: 10 },
  linkInput: { flex: 1, fontSize: 15, paddingVertical: 12, outlineStyle: 'none' as any },
  pasteBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  pasteText: { fontSize: 13, fontFamily: 'Prompt_700Bold' },
  moreHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 16, borderWidth: 1 },
  moreTitle: { fontSize: 14, fontFamily: 'Prompt_700Bold' },
  moreBody: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 18, marginTop: -8 },
  q: { fontSize: 14, fontFamily: 'Prompt_600SemiBold', lineHeight: 20 },
  yesNo: { flexDirection: 'row', gap: 8 },
  yn: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 10, borderTopWidth: 1 },
  waitRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  alert: { borderRadius: 10, padding: 12 },
  cta: { minHeight: 54, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { color: '#fff', fontSize: 16, fontFamily: 'Prompt_800ExtraBold' },
});
