/**
 * Web Intercept Service
 *
 * ✅ URL query param — page loaded with ?url=<shopping_url>
 * ✅ postMessage — browser extension sends ROASTMYWALLET_INTERCEPT event
 * ✅ Clipboard on paste — detects pasted shopping URLs (no permission needed)
 *
 * How to trigger from browser:
 *   https://app.roastmywallet.com/?url=https://shopee.co.th/...
 *
 * Browser extension (future): posts { type: 'ROASTMYWALLET_INTERCEPT', url }
 * to the RoastMyWallet PWA window when user visits a shopping site.
 */

import type { IInterceptService } from './InterceptService';
import type { InterceptEvent } from '@/types';
import { detectPlatformFromUrl, isShoppingUrl } from './intercept.utils';

type Callback = (event: InterceptEvent) => void;

export class WebInterceptService implements IInterceptService {
  private callbacks: Set<Callback> = new Set();
  private messageHandler: ((e: MessageEvent) => void) | null = null;
  private pasteHandler: ((e: ClipboardEvent) => void) | null = null;
  private isRunning = false;

  isSupported() {
    return typeof window !== 'undefined';
  }

  async hasPermission(): Promise<boolean> { return true; }
  async requestPermission(): Promise<boolean> { return true; }

  async start(): Promise<void> {
    if (this.isRunning || typeof window === 'undefined') return;
    this.isRunning = true;

    // 1. URL query param on load
    try {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('url') || params.get('interceptUrl');
      if (urlParam && isShoppingUrl(urlParam)) {
        this.emit('url_open', urlParam);
      }
    } catch {}

    // 2. postMessage from browser extension
    this.messageHandler = (e: MessageEvent) => {
      try {
        if (!e.data || e.data.type !== 'ROASTMYWALLET_INTERCEPT') return;
        const url = e.data.url as string | undefined;
        if (url && isShoppingUrl(url)) this.emit('share_intent', url);
      } catch {}
    };
    window.addEventListener('message', this.messageHandler);

    // 3. Global paste event — user pastes a shopping URL anywhere in the PWA
    this.pasteHandler = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain') || '';
      if (text && isShoppingUrl(text)) {
        e.preventDefault();
        this.emit('url_open', text);
      }
    };
    document.addEventListener('paste', this.pasteHandler);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.messageHandler) window.removeEventListener('message', this.messageHandler);
    if (this.pasteHandler) document.removeEventListener('paste', this.pasteHandler);
    this.messageHandler = null;
    this.pasteHandler = null;
  }

  subscribe(cb: Callback): () => void {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  getCapabilityDescription(): string {
    return 'Copy URL สินค้าแล้ว Paste ในแอป หรือเปิด ?url=<link> เพื่อ roast ก่อนซื้อ';
  }

  private emit(trigger: InterceptEvent['trigger'], url: string) {
    const event: InterceptEvent = {
      trigger,
      platform: detectPlatformFromUrl(url),
      url,
      detectedAt: new Date().toISOString(),
    };
    this.callbacks.forEach(cb => {
      try { cb(event); } catch (e) { console.error('[WebIntercept]', e); }
    });
  }
}
