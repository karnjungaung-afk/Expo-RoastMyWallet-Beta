import { Platform } from 'react-native';
import type { InterceptEvent, ShoppingPlatform } from '@/types';

// ─── INTERCEPT SERVICE INTERFACE ─────────────────────────────────────────────

export interface IInterceptService {
  isSupported(): boolean;
  hasPermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  start(): Promise<void>;
  stop(): Promise<void>;
  subscribe(callback: (event: InterceptEvent) => void): () => void;
  getCapabilityDescription(): string;
}

// ─── SHOPPING URL DETECTION ───────────────────────────────────────────────────

export const SHOPPING_PATTERNS: Array<{ pattern: RegExp; platform: ShoppingPlatform }> = [
  { pattern: /tiktok\.com\/(shop|@[^/]+\/video)/, platform: 'tiktok_shop' },
  { pattern: /shopee\.(co\.th|com|ph|sg|com\.br|com\.my)/, platform: 'shopee' },
  { pattern: /lazada\.(co\.th|com|sg|com\.my|com\.ph)/, platform: 'lazada' },
  { pattern: /instagram\.com\/(p\/|reel\/|shop)/, platform: 'instagram' },
  { pattern: /facebook\.com\/(marketplace|groups|commerce|shop)/, platform: 'facebook' },
  { pattern: /amazon\.(com|co\.jp|co\.uk|de|fr)/, platform: 'amazon' },
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

// ─── CAPABILITY MATRIX ────────────────────────────────────────────────────────
//
// What PauseBuy Auto-Intercept can ACTUALLY do per platform:
//
// Android:
//  ✅ Share Intent: user shares product URL → PauseBuy form pre-filled
//  ✅ Custom URL scheme (pausebuy://) and App Links (HTTPS)
//  ❌ Detect shopping app open: NOT SUPPORTED
//     (Accessibility API is restricted by Google Play policy for non-assistive apps)
//  ❌ Overlay window: NOT SUPPORTED for consumer apps without SYSTEM_ALERT_WINDOW
//  ⚠️ Push notifications: SUPPORTED when app in background
//
// iOS:
//  ✅ Share Extension: native Share Sheet integration (requires separate Xcode target)
//  ✅ Universal Links (HTTPS) and custom scheme (pausebuy://)
//  ❌ Detect other app open: NOT SUPPORTED (iOS sandbox)
//  ❌ Overlay on other apps: NOT SUPPORTED
//  ❌ Screen Time API: no public API for custom apps
//  ⚠️ Clipboard monitoring: technically possible, iOS 16+ shows paste banner
//
// Web:
//  ✅ URL parameter: pausebuy.app/add?url=<product_url>
//  ✅ postMessage from browser extension
//  🔧 Full shopping interception: REQUIRES BROWSER EXTENSION (separate project)
//
// The "Auto-Intercept" UI should honestly describe what's possible
// on each platform rather than promising identical behavior everywhere.

// ─── PLATFORM FACTORY (static imports, not dynamic) ───────────────────────────
// Dynamic imports caused TS errors with bundler module resolution.
// Use Platform.select with static imports instead.

import { AndroidInterceptService } from './intercept.android';
import { IOSInterceptService } from './intercept.ios';
import { WebInterceptService } from './intercept.web';

export function createInterceptService(): IInterceptService {
  switch (Platform.OS) {
    case 'android':
      return new AndroidInterceptService();
    case 'ios':
      return new IOSInterceptService();
    default:
      return new WebInterceptService();
  }
}
