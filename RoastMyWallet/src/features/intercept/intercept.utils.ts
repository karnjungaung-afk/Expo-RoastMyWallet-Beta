import type { ShoppingPlatform } from '@/types';

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
