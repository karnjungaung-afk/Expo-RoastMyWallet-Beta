import type { PurchaseCategory, PurchaseReason, ShoppingPlatform } from '@/types';

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

export interface CategoryConfig {
  value: PurchaseCategory;
  label: string;
  emoji: string;     // Used ONLY in category picker chips — nowhere else
  description: string;
}

export const CATEGORIES: CategoryConfig[] = [
  { value: 'electronics',   label: 'Electronics',   emoji: '📱', description: 'Gadgets, devices, accessories' },
  { value: 'fashion',       label: 'Fashion',       emoji: '👕', description: 'Clothing, shoes, accessories' },
  { value: 'beauty',        label: 'Beauty',        emoji: '✨', description: 'Skincare, makeup, personal care' },
  { value: 'gaming',        label: 'Gaming',        emoji: '🎮', description: 'Games, hardware, peripherals' },
  { value: 'home',          label: 'Home',          emoji: '🏠', description: 'Furniture, decor, appliances' },
  { value: 'food',          label: 'Food',          emoji: '🍜', description: 'Food, beverages, dining' },
  { value: 'sports',        label: 'Sports',        emoji: '🏃', description: 'Equipment, activewear' },
  { value: 'health',        label: 'Health',        emoji: '💊', description: 'Supplements, medical, wellness' },
  { value: 'books',         label: 'Books',         emoji: '📚', description: 'Books, courses, education' },
  { value: 'travel',        label: 'Travel',        emoji: '✈️',  description: 'Flights, hotels, experiences' },
  { value: 'entertainment', label: 'Entertainment', emoji: '🎬', description: 'Subscriptions, tickets, media' },
  { value: 'tools',         label: 'Tools',         emoji: '🔧', description: 'Tools, equipment, supplies' },
  { value: 'other',         label: 'Other',         emoji: '📦', description: 'Anything else' },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map(c => [c.value, c])
) as Record<PurchaseCategory, CategoryConfig>;

// ─── REASONS ─────────────────────────────────────────────────────────────────

export interface ReasonConfig {
  value: PurchaseReason;
  label: string;
  shortLabel: string;
  riskWeight: number;  // -1 to +1, used in scoring explanation
  description: string;
  roastHint: string;   // Shown to AI as context for tone
}

export const REASONS: ReasonConfig[] = [
  {
    value: 'need',
    label: 'Genuine Need',
    shortLabel: 'Need',
    riskWeight: 0.8,
    description: 'I actually need this for something specific',
    roastHint: 'Be gentle — this might be legitimate',
  },
  {
    value: 'replacement',
    label: 'Replacement',
    shortLabel: 'Replacement',
    riskWeight: 0.7,
    description: 'My current one is broken or worn out',
    roastHint: 'Check if the old one is truly unusable',
  },
  {
    value: 'want',
    label: 'I Want It',
    shortLabel: 'Want',
    riskWeight: 0.3,
    description: 'I want it but don\'t necessarily need it',
    roastHint: 'Medium skepticism — wants are fine but habit patterns matter',
  },
  {
    value: 'sale',
    label: 'On Sale',
    shortLabel: 'Sale',
    riskWeight: -0.2,
    description: 'Primarily triggered by a discount or promotion',
    roastHint: 'Classic discount trap — ask if they\'d buy at full price',
  },
  {
    value: 'influencer',
    label: 'Influencer / Review',
    shortLabel: 'Influencer',
    riskWeight: -0.4,
    description: 'Saw it promoted by an influencer or in a review',
    roastHint: 'Lightly roast the herd mentality, not the person',
  },
  {
    value: 'fomo',
    label: 'FOMO',
    shortLabel: 'FOMO',
    riskWeight: -0.6,
    description: 'Fear of missing out on a deal or trend',
    roastHint: 'Be direct — FOMO is a well-known spending trap',
  },
  {
    value: 'bored',
    label: 'Boredom',
    shortLabel: 'Bored',
    riskWeight: -0.8,
    description: 'Shopping out of boredom or stress relief',
    roastHint: 'Playfully challenge this — retail therapy rarely works',
  },
  {
    value: 'other',
    label: 'Other',
    shortLabel: 'Other',
    riskWeight: 0.0,
    description: 'Some other reason',
    roastHint: 'Neutral — ask clarifying questions',
  },
];

export const REASON_MAP = Object.fromEntries(
  REASONS.map(r => [r.value, r])
) as Record<PurchaseReason, ReasonConfig>;

// ─── PLATFORMS ────────────────────────────────────────────────────────────────

export interface PlatformConfig {
  value: ShoppingPlatform;
  label: string;
  color: string;   // Brand-adjacent but never exact brand colors for legal safety
  domains: string[];
}

export const PLATFORMS: PlatformConfig[] = [
  {
    value: 'tiktok_shop',
    label: 'TikTok Shop',
    color: '#2A2A2A',
    domains: ['tiktok.com'],
  },
  {
    value: 'shopee',
    label: 'Shopee',
    color: '#E05C24',
    domains: ['shopee.co.th', 'shopee.com', 'shopee.ph', 'shopee.sg', 'shopee.com.my'],
  },
  {
    value: 'lazada',
    label: 'Lazada',
    color: '#0F146D',
    domains: ['lazada.co.th', 'lazada.com', 'lazada.sg', 'lazada.com.my', 'lazada.com.ph'],
  },
  {
    value: 'instagram',
    label: 'Instagram',
    color: '#C13584',
    domains: ['instagram.com'],
  },
  {
    value: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    domains: ['facebook.com', 'fb.com'],
  },
  {
    value: 'amazon',
    label: 'Amazon',
    color: '#FF9900',
    domains: ['amazon.com', 'amazon.co.jp', 'amazon.co.uk', 'amazon.de'],
  },
  {
    value: 'other_website',
    label: 'Website',
    color: '#5A6475',
    domains: [],
  },
  {
    value: 'physical_store',
    label: 'Physical Store',
    color: '#3D7A5A',
    domains: [],
  },
  {
    value: 'unknown',
    label: 'Unknown',
    color: '#9CA0A8',
    domains: [],
  },
];

export const PLATFORM_MAP = Object.fromEntries(
  PLATFORMS.map(p => [p.value, p])
) as Record<ShoppingPlatform, PlatformConfig>;

// ─── WAITING PERIOD OPTIONS ───────────────────────────────────────────────────

export const WAITING_OPTIONS = [
  { hours: 6,   label: '6 hours',    description: 'Quick pause' },
  { hours: 12,  label: '12 hours',   description: 'Half a day' },
  { hours: 24,  label: '24 hours',   description: 'One day (recommended)' },
  { hours: 48,  label: '48 hours',   description: 'Two days' },
  { hours: 72,  label: '3 days',     description: 'Three days' },
  { hours: 168, label: '1 week',     description: 'One week' },
] as const;

// ─── AI PERSONALITY OPTIONS ───────────────────────────────────────────────────

export const AI_PERSONALITIES = [
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Honest but not harsh. The default.',
  },
  {
    value: 'strict',
    label: 'Strict',
    description: 'Pushes back harder on impulse purchases.',
  },
  {
    value: 'gentle',
    label: 'Gentle',
    description: 'Encouraging and kind, still honest.',
  },
  {
    value: 'savage',
    label: 'Savage',
    description: 'No filter. Maximum roast. Still not cruel.',
  },
] as const;
