/**
 * iOS Intercept Service
 *
 * ✅ Universal Links — user taps shopping URL in Safari/browser
 * ✅ Deep link — roastmywallet://intercept?url=...
 * ✅ Share Extension — user presses Share → RoastMyWallet in share sheet
 * ✅ Clipboard monitor — detects copied product URL when app foregrounds
 *
 * Native share extension requires EAS Build (not Expo Go).
 * Everything else works in both Expo Go and production builds.
 */

import * as Linking from 'expo-linking';
import { AppState, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { IInterceptService } from './InterceptService';
import type { InterceptEvent } from '@/types';
import { detectPlatformFromUrl, isShoppingUrl } from './intercept.utils';

type Callback = (event: InterceptEvent) => void;

export class IOSInterceptService implements IInterceptService {
  private callbacks: Set<Callback> = new Set();
  private linkingSub: { remove: () => void } | null = null;
  private appStateSub: { remove: () => void } | null = null;
  private lastClipboard = '';
  private isRunning = false;

  isSupported() { return Platform.OS === 'ios'; }
  async hasPermission(): Promise<boolean> { return true; }
  async requestPermission(): Promise<boolean> { return true; }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // Deep links & Universal Links
    this.linkingSub = Linking.addEventListener('url', ({ url }) => this.handleUrl(url));
    try {
      const initial = await Linking.getInitialURL();
      if (initial) this.handleUrl(initial);
    } catch {}

    // Clipboard check on foreground — iOS 16+ shows a system banner
    this.appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') this.checkClipboard();
    });
    this.checkClipboard();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.linkingSub?.remove();
    this.appStateSub?.remove();
    this.linkingSub = null;
    this.appStateSub = null;
  }

  subscribe(cb: Callback): () => void {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  getCapabilityDescription(): string {
    return 'กด Share แล้วเลือก RoastMyWallet — รองรับ Safari, Shopee, TikTok และแอปช้อปปิ้งอื่นๆ';
  }

  private handleUrl(url: string) {
    if (!url) return;

    if (url.startsWith('roastmywallet://intercept') || url.startsWith('roastmywallet://share')) {
      const parsed = Linking.parse(url);
      const target = parsed.queryParams?.url as string | undefined;
      if (target) this.emit('share_intent', target);
      return;
    }

    if (isShoppingUrl(url)) this.emit('url_open', url);
  }

  private async checkClipboard() {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text || text === this.lastClipboard) return;
      this.lastClipboard = text;
      if (isShoppingUrl(text)) this.emit('url_open', text);
    } catch {}
  }

  private emit(trigger: InterceptEvent['trigger'], url: string) {
    const event: InterceptEvent = {
      trigger,
      platform: detectPlatformFromUrl(url),
      url,
      detectedAt: new Date().toISOString(),
    };
    this.callbacks.forEach(cb => {
      try { cb(event); } catch (e) { console.error('[iOSIntercept]', e); }
    });
  }
}
