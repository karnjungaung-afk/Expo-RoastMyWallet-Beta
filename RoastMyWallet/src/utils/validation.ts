import { z } from 'zod';

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be 50 characters or less')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

// ─── PURCHASE ─────────────────────────────────────────────────────────────────

const PURCHASE_REASONS = [
  'need', 'want', 'sale', 'influencer', 'fomo', 'bored', 'replacement', 'other',
] as const;

const PURCHASE_CATEGORIES = [
  'electronics', 'fashion', 'beauty', 'home', 'food', 'gaming',
  'sports', 'books', 'travel', 'entertainment', 'health', 'tools', 'other',
] as const;

const SHOPPING_PLATFORMS = [
  'tiktok_shop', 'shopee', 'lazada', 'instagram', 'facebook',
  'amazon', 'other_website', 'physical_store', 'unknown',
] as const;

const USAGE_FREQUENCIES = ['daily', 'weekly', 'monthly', 'rarely', 'never'] as const;
const BUDGET_IMPACTS = ['none', 'minor', 'moderate', 'significant'] as const;

export const questionnaireSchema = z.object({
  plannedBefore: z.boolean(),
  hasAlternative: z.boolean(),
  usageFrequency: z.enum(USAGE_FREQUENCIES),
  wouldBuyAtFullPrice: z.boolean(),
  budgetImpact: z.enum(BUDGET_IMPACTS),
  emotionalState: z.enum(['calm', 'excited', 'bored', 'stressed', 'happy', 'unknown']),
});

export const createPurchaseSchema = z.object({
  productName: z
    .string()
    .min(1, 'Product name is required')
    .max(200, 'Name too long')
    .trim(),
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than 0')
    .max(10_000_000, 'Price too large'),
  currency: z.enum(['THB', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'MYR']).default('THB'),
  url: z
    .string()
    .url('Enter a valid URL')
    .optional()
    .or(z.literal(''))
    .transform(v => v || null),
  imageUrl: z.string().url().optional().nullable(),
  platform: z.enum(SHOPPING_PLATFORMS).default('unknown'),
  category: z.enum(PURCHASE_CATEGORIES),
  reason: z.enum(PURCHASE_REASONS),
  notes: z
    .string()
    .max(500, 'Notes too long')
    .optional()
    .transform(v => v?.trim() || null),
  waitingHours: z
    .number()
    .int()
    .min(1, 'Waiting period must be at least 1 hour')
    .max(720, 'Waiting period cannot exceed 30 days')
    .optional(),
  questionnaire: questionnaireSchema.optional().nullable(),
});

export type CreatePurchaseFormValues = z.input<typeof createPurchaseSchema>;
export type CreatePurchaseData = z.output<typeof createPurchaseSchema>;

// ─── SPENDING LIMITS ──────────────────────────────────────────────────────────

export const spendingLimitsSchema = z.object({
  daily: z.number().positive('Must be positive').nullable(),
  weekly: z.number().positive('Must be positive').nullable(),
  monthly: z.number().positive('Must be positive').nullable(),
  impulseOnly: z.boolean().default(false),
}).refine(
  data => data.daily !== null || data.weekly !== null || data.monthly !== null,
  { message: 'Set at least one spending limit' }
);

// ─── SQUAD ────────────────────────────────────────────────────────────────────

export const createSquadSchema = z.object({
  name: z
    .string()
    .min(2, 'Squad name must be at least 2 characters')
    .max(40, 'Squad name too long')
    .trim(),
});

export const squadMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message too long')
    .trim(),
  type: z.enum(['roast', 'support']).default('roast'),
});

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name too long')
    .trim()
    .optional(),
  currency: z.enum(['THB', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'MYR']).optional(),
  language: z.enum(['en', 'th', 'ja', 'zh']).optional(),
  defaultWaitingHours: z.number().int().min(1).max(720).optional(),
  aiPersonality: z.enum(['balanced', 'strict', 'gentle', 'savage']).optional(),
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function parsePrice(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function formatZodErrors(errors: z.ZodError): Record<string, string> {
  return errors.issues.reduce((acc, issue) => {
    const path = issue.path.join('.');
    acc[path] = issue.message;
    return acc;
  }, {} as Record<string, string>);
}
