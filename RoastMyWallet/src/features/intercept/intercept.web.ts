/**
 * Web Intercept Service
 *
 * On the web, a full browser extension is the most capable approach.
 * This service handles the PWA/web-app side of that integration.
 *
 * Capabilities:
 * ✅ URL parameter detection — roastmywallet.app/add?url=<shopping_url>
 * ✅ postMessage from browser extension → web app
 * ✅ Custom protocol handler (if installed as PWA)
 * ✅ Bookmarklet support (documented in onboarding)
 *
 * Browser Extension (separate project):
 *   The full browser extension intercept lives in /extension/
 *   and is a standalone Chrome/Firefox/Edge extension.
 *   It communicates with this web app via postMessage.
 *
 * Limitations vs mobile:
 * ✗ No push notifications without PWA installation
 * ✗ Limited background processing
 */

import type { IInterceptService } from './InterceptService';
import type { InterceptEvent } from '@/types';
import { detectPlatformFromUrl, isShoppingUrl } from './InterceptService';

type Callback = (event: InterceptEvent) => void;

export class WebInterceptService implements IInterceptService {
  private callbacks: Set<Callback> = new Set();
  private messageHandler: ((event: MessageEvent) => void) | null = null;
  private isRunning = false;

  isSupported(): boolean {
    // URL params always work; extension messaging requires extension
    return typeof window !== 'undefined';
  }

  async hasPermission(): Promise<boolean> {
    return true; // No permission required for URL params or postMessage
  }

  async requestPermission(): Promise<boolean> {
    return true;
  }

  async start(): Promise<void> {
    if (this.isRunning || typeof window === 'undefined') return;
    this.isRunning = true;

    // Check URL params on load
    this.checkUrlParams();

    // Listen for messages from browser extension
    this.messageHandler = this.handleMessage;
    window.addEventListener('message', this.messageHandler);

    // Listen for navigation (single-page app)
    window.addEventListener('popstate', this.handlePopState);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }
    window.removeEventListener('popstate', this.handlePopState);
  }

  subscribe(callback: Callback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  getCapabilityDescription(): string {
    return 'Use the RoastMyWallet browser extension to intercept shopping on any website. Or drag our bookmarklet to your bookmarks bar for one-click pausing.';
  }

  private checkUrlParams() {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const productUrl = params.get('url') || params.get('product_url');
    const source = params.get('source') || 'url_open';

    if (productUrl) {
      const decodedUrl = decodeURIComponent(productUrl);
      this.emit({
        trigger: source === 'extension' ? 'share_intent' : 'url_open',
        platform: detectPlatformFromUrl(decodedUrl),
        url: decodedUrl,
        detectedAt: new Date().toISOString(),
      });

      // Clean up URL params
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }

  private handleMessage = (event: MessageEvent) => {
    // Only accept messages from our extension (validate origin in production)
    if (typeof event.data !== 'object' || event.data === null) return;

    const { type, payload } = event.data as { type: string; payload?: unknown };

    if (type === 'PAUSEBUY_INTERCEPT' && payload && typeof payload === 'object') {
      const p = payload as Record<string, unknown>;
      const url = typeof p.url === 'string' ? p.url : null;

      if (url) {
        this.emit({
          trigger: 'share_intent',
          platform: detectPlatformFromUrl(url),
          url,
          detectedAt: new Date().toISOString(),
        });
      }
    }
  };

  private handlePopState = () => {
    this.checkUrlParams();
  };

  private emit(event: InterceptEvent) {
    this.callbacks.forEach(cb => {
      try { cb(event); } catch (e) { console.error('[WebIntercept] Callback error:', e); }
    });
  }
}
