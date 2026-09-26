import { formatDistanceToNow, differenceInHours, differenceInMinutes, format, parseISO } from 'date-fns';
import type { Currency } from '@/types';

// ─── CURRENCY ─────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  THB: '฿',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  SGD: 'S$',
  MYR: 'RM',
};

const CURRENCY_LOCALES: Record<Currency, string> = {
  THB: 'th-TH',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  SGD: 'en-SG',
  MYR: 'ms-MY',
};

export function formatCurrency(
  amount: number,
  currency: Currency = 'THB',
  options: { compact?: boolean; showSymbol?: boolean } = {}
): string {
  const { compact = false, showSymbol = true } = options;
  const symbol = CURRENCY_SYMBOLS[currency];

  if (compact && amount >= 1000) {
    const k = amount / 1000;
    const formatted = k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
    return showSymbol ? `${symbol}${formatted}` : formatted;
  }

  const intl = new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    maximumFractionDigits: currency === 'JPY' ? 0 : 0,
    minimumFractionDigits: 0,
  });

  const formatted = intl.format(Math.abs(amount));
  const sign = amount < 0 ? '-' : '';

  return showSymbol ? `${sign}${symbol}${formatted}` : `${sign}${formatted}`;
}

export function formatCurrencyShort(amount: number, currency: Currency = 'THB'): string {
  return formatCurrency(amount, currency, { compact: true });
}

// ─── TIME ─────────────────────────────────────────────────────────────────────

export function formatCountdown(targetDate: string | null): string {
  if (!targetDate) return '—';

  const target = parseISO(targetDate);
  const now = new Date();
  const hoursLeft = differenceInHours(target, now);
  const minutesLeft = differenceInMinutes(target, now);

  if (minutesLeft <= 0) return 'Ready now';
  if (minutesLeft < 60) return `${minutesLeft}m`;
  if (hoursLeft < 24) {
    const mins = minutesLeft % 60;
    return mins > 0 ? `${hoursLeft}h ${mins}m` : `${hoursLeft}h`;
  }

  const days = Math.floor(hoursLeft / 24);
  const remainingHours = hoursLeft % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function formatCountdownDetailed(targetDate: string | null): {
  value: string;
  unit: string;
  isReady: boolean;
} {
  if (!targetDate) return { value: '—', unit: '', isReady: false };

  const target = parseISO(targetDate);
  const now = new Date();
  const minutesLeft = differenceInMinutes(target, now);
  const hoursLeft = differenceInHours(target, now);

  if (minutesLeft <= 0) return { value: 'Ready', unit: 'now', isReady: true };
  if (minutesLeft < 60) return { value: `${minutesLeft}`, unit: minutesLeft === 1 ? 'minute' : 'minutes', isReady: false };

  const days = Math.floor(hoursLeft / 24);
  const hours = hoursLeft % 24;

  if (days > 0) return { value: `${days}d ${hours}h`, unit: 'remaining', isReady: false };
  return { value: `${hoursLeft}h ${minutesLeft % 60}m`, unit: 'remaining', isReady: false };
}

export function formatRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return '—';
  }
}

export function formatDate(dateString: string, pattern: string = 'MMM d, yyyy'): string {
  try {
    return format(parseISO(dateString), pattern);
  } catch {
    return '—';
  }
}

export function formatMonthYear(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMMM yyyy');
  } catch {
    return '—';
  }
}

// ─── NUMBERS ─────────────────────────────────────────────────────────────────

export function formatPercent(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatScore(score: number): string {
  return Math.round(score).toString().padStart(2, '0');
}

// ─── TEXT ─────────────────────────────────────────────────────────────────────

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function titleCase(text: string): string {
  return text.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── PLATFORM ────────────────────────────────────────────────────────────────

export function formatPlatformName(platform: string): string {
  const names: Record<string, string> = {
    tiktok_shop: 'TikTok Shop',
    shopee: 'Shopee',
    lazada: 'Lazada',
    instagram: 'Instagram',
    facebook: 'Facebook',
    amazon: 'Amazon',
    other_website: 'Website',
    physical_store: 'Physical Store',
    unknown: 'Unknown',
  };
  return names[platform] ?? platform;
}

export function formatCategoryName(category: string): string {
  const names: Record<string, string> = {
    electronics: 'Electronics',
    fashion: 'Fashion',
    beauty: 'Beauty',
    home: 'Home',
    food: 'Food',
    gaming: 'Gaming',
    sports: 'Sports',
    books: 'Books',
    travel: 'Travel',
    entertainment: 'Entertainment',
    health: 'Health',
    tools: 'Tools',
    other: 'Other',
  };
  return names[category] ?? category;
}

export function formatReasonName(reason: string): string {
  const names: Record<string, string> = {
    need: 'Genuine Need',
    want: 'I Want It',
    sale: 'On Sale',
    influencer: 'Influencer',
    fomo: 'FOMO',
    bored: 'Bored',
    replacement: 'Replacement',
    other: 'Other',
  };
  return names[reason] ?? reason;
}
