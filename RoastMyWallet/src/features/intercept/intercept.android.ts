/**
 * Android Intercept Service
 *
 * Capabilities on Android:
 * ✅ Share intents — user shares a product URL to PauseBuy
 * ✅ Deep links — apps can register pausebuy:// scheme
 * ✅ App links — HTTPS-based verified deep links
 * ✅ Notifications — trigger when user opens shopping apps (requires usage access)
 *
 * What we do NOT use:
 * ✗ Accessibility APIs — Google Play policy restricts this to assistive apps
 * ✗ Overlay windows — restricted without special permissions
 * ✗ Background app detection without usage stats permission
 *
 * The primary intercept mechanism: Share Intent
 * User finds a product → shares URL → PauseBuy opens and pre-fills the form.
 * This is frictionless, opt-in, and platform-policy compliant.
 */

import * as Linking from 'expo-linking';
import type { IInterceptService } from './InterceptService';
import type { InterceptEvent } from '@/types';
import { detectPlatformFromUrl, isShoppingUrl } from './InterceptService';

type Callback = (event: InterceptEvent) => void;

export class AndroidInterceptService implements IInterceptService {
  private callbacks: Set<Callback> = new Set();
  private linkingSubscription: { remove: () => void } | null = null;
  private isRunning = false;

  isSupported(): boolean {
    return true; // Share intents always available on Android
  }

  async hasPermission(): Promise<boolean> {
    // Share intents don't require special permissions
    return true;
  }

  async requestPermission(): Promise<boolean> {
    // No special permission needed for share intents
    return true;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // Listen for URLs opened via deep links or share intents
    this.linkingSubscription = Linking.addEventListener('url', this.handleUrl);

    // Check if app was opened with a URL (cold start)
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      this.handleUrl({ url: initialUrl });
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.linkingSubscription?.remove();
    this.linkingSubscription = null;
  }

  subscribe(callback: Callback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  getCapabilityDescription(): string {
    return 'Share any product URL from a shopping app directly to PauseBuy. Tap Share → PauseBuy in any browser or app to add it to your pause list instantly.';
  }

  private handleUrl = ({ url }: { url: string }) => {
    if (!url) return;

    // Handle our deep link scheme: pausebuy://intercept?url=<shopping_url>
    if (url.startsWith('pausebuy://intercept')) {
      const parsed = Linking.parse(url);
      const shoppingUrl = parsed.queryParams?.url as string | undefined;

      if (shoppingUrl && isShoppingUrl(shoppingUrl)) {
        const event: InterceptEvent = {
          trigger: 'share_intent',
          platform: detectPlatformFromUrl(shoppingUrl),
          url: shoppingUrl,
          detectedAt: new Date().toISOString(),
        };
        this.emit(event);
      }
      return;
    }

    // Direct shopping URL (app link)
    if (isShoppingUrl(url)) {
      const event: InterceptEvent = {
        trigger: 'url_open',
        platform: detectPlatformFromUrl(url),
        url,
        detectedAt: new Date().toISOString(),
      };
      this.emit(event);
    }
  };

  private emit(event: InterceptEvent) {
    this.callbacks.forEach(cb => {
      try { cb(event); } catch (e) { console.error('[AndroidIntercept] Callback error:', e); }
    });
  }
}
