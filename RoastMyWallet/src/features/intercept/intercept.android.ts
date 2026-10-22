/**
 * Android Intercept Service
 *
 * Capabilities:
 * ✅ Share intent (android.intent.action.SEND) — main mechanism
 *    User shares product URL from Shopee/TikTok/etc → RoastMyWallet opens
 * ✅ Deep link (roastmywallet://intercept?url=...)
 * ✅ App link / Browser intent (shopping domain URLs from browser)
 *
 * NOT used (Google Play policy):
 * ✗ Accessibility API  ✗ Overlay window  ✗ Background app detection
 */

import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import type { IInterceptService } from './InterceptService';
import type { InterceptEvent } from '@/types';
import { detectPlatformFromUrl, isShoppingUrl } from './intercept.utils';

type Callback = (event: InterceptEvent) => void;

export class AndroidInterceptService implements IInterceptService {
  private callbacks: Set<Callback> = new Set();
  private linkingSub: { remove: () => void } | null = null;
  private isRunning = false;

  isSupported()                           { return Platform.OS === 'android'; }
  async hasPermission(): Promise<boolean> { return true; }  // Share intents: no permission
  async requestPermission(): Promise<boolean> { return true; }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    this.linkingSub = Linking.addEventListener('url', ({ url }) => this.handleUrl(url));

    // Cold-start: app opened via intent
    try {
      const initial = await Linking.getInitialURL();
      if (initial) this.handleUrl(initial);
    } catch {}
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.linkingSub?.remove();
    this.linkingSub = null;
  }

  subscribe(cb: Callback): () => void {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  getCapabilityDescription(): string {
    return 'กดแชร์ในแอปช้อปปิ้ง แล้วเลือก RoastMyWallet — ระบบจะดักจับและถามว่าซื้อจริงไหม';
  }

  private handleUrl(url: string) {
    if (!url) return;

    // 1. Our deep link: roastmywallet://intercept?url=<shopping_url>
    if (url.startsWith('roastmywallet://intercept')) {
      const parsed = Linking.parse(url);
      const target = parsed.queryParams?.url as string | undefined;
      if (target) this.emit('share_intent', target);
      return;
    }

    // 2. roastmywallet://share?url=<shopping_url>
    if (url.startsWith('roastmywallet://share')) {
      const parsed = Linking.parse(url);
      const target = parsed.queryParams?.url as string | undefined;
      if (target) this.emit('share_intent', target);
      return;
    }

    // 3. Direct shopping URL (app link from browser / intent filter)
    if (isShoppingUrl(url)) {
      this.emit('url_open', url);
    }
  }

  private emit(trigger: InterceptEvent['trigger'], url: string) {
    const event: InterceptEvent = {
      trigger,
      platform: detectPlatformFromUrl(url),
      url,
      detectedAt: new Date().toISOString(),
    };
    this.callbacks.forEach(cb => {
      try { cb(event); } catch (e) { console.error('[AndroidIntercept]', e); }
    });
  }
}
