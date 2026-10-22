import type { ShoppingPlatform } from '@/types';

export interface PlatformMeta {
  name: string;
  emoji: string;
  color: string;
}

export const PLATFORM_META: Record<ShoppingPlatform, PlatformMeta> = {
  tiktok_shop:    { name: 'TikTok Shop',      emoji: '🎵', color: '#010101' },
  shopee:         { name: 'Shopee',            emoji: '🛍️', color: '#EE4D2D' },
  lazada:         { name: 'Lazada',            emoji: '🛒', color: '#0F146D' },
  tokopedia:      { name: 'Tokopedia',         emoji: '🟢', color: '#42B549' },
  jd_central:     { name: 'JD Central',        emoji: '❤️', color: '#CC0001' },
  central_online: { name: 'Central Online',    emoji: '🏬', color: '#E31837' },
  zalora:         { name: 'ZALORA',            emoji: '👗', color: '#000000' },
  klook:          { name: 'Klook',             emoji: '✈️', color: '#FF5722' },
  instagram:      { name: 'Instagram Shop',    emoji: '📸', color: '#E1306C' },
  facebook:       { name: 'Facebook Shop',     emoji: '👍', color: '#1877F2' },
  amazon:         { name: 'Amazon',            emoji: '📦', color: '#FF9900' },
  aliexpress:     { name: 'AliExpress',        emoji: '🔴', color: '#E62E04' },
  taobao:         { name: 'Taobao',            emoji: '🏮', color: '#FF4400' },
  shein:          { name: 'SHEIN',             emoji: '✨', color: '#000000' },
  grab_mart:      { name: 'GrabMart',          emoji: '🚗', color: '#00B14F' },
  line_shopping:  { name: 'LINE Shopping',     emoji: '💬', color: '#06C755' },
  other_website: { name: 'ร้านค้าออนไลน์', emoji: '🌐', color: '#555555' },
  physical_store: { name: 'ร้านค้า', emoji: '🏪', color: '#8B6914' },
  unknown:        { name: 'Shopping', emoji: '🛒', color: '#555555' },
};

// Shared URL detection utilities. Keep this module independent of platform services
// to prevent circular imports between InterceptService and platform implementations.
export const SHOPPING_PATTERNS: Array<{ pattern: RegExp; platform: ShoppingPlatform }> = [
  { pattern: /tiktok\.com\/(shop|@[^/]+\/video|@[^/]+\/product)/, platform: 'tiktok_shop' },
  { pattern: /shopee\.(co\.th|com|ph|sg|com\.br|com\.my|vn|tw|id)/, platform: 'shopee' },
  { pattern: /lazada\.(co\.th|com|sg|com\.my|com\.ph|vn)/, platform: 'lazada' },
  { pattern: /tokopedia\.com/, platform: 'tokopedia' },
  { pattern: /jd\.co\.th|central\.co\.th\/jd/, platform: 'jd_central' },
  { pattern: /central\.co\.th/, platform: 'central_online' },
  { pattern: /zalora\.(co\.th|com|sg|com\.my|com\.ph)/, platform: 'zalora' },
  { pattern: /klook\.com/, platform: 'klook' },
  { pattern: /shein\.(com|co\.th)/, platform: 'shein' },
  { pattern: /aliexpress\.com/, platform: 'aliexpress' },
  { pattern: /taobao\.com|world\.taobao\.com/, platform: 'taobao' },
  { pattern: /grab\.com\/(food|mart|express)/, platform: 'grab_mart' },
  { pattern: /shop\.line\.me|liff\.line\.me/, platform: 'line_shopping' },
  { pattern: /instagram\.com\/(p\/|reel\/|shop|products)/, platform: 'instagram' },
  { pattern: /facebook\.com\/(marketplace|groups|commerce|shop|products)/, platform: 'facebook' },
  { pattern: /amazon\.(com|co\.jp|co\.uk|de|fr|com\.au|sg)/, platform: 'amazon' },
];

export function detectPlatformFromUrl(url: string): ShoppingPlatform {
  for (const { pattern, platform } of SHOPPING_PATTERNS) {
    if (pattern.test(url)) return platform;
  }
  return 'other_website';
}

export function isShoppingUrl(url: string): boolean {
  return SHOPPING_PATTERNS.some(({ pattern }) => pattern.test(url));
}
