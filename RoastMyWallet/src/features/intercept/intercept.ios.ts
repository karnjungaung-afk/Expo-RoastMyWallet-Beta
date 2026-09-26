/**
 * iOS Intercept Service
 *
 * iOS sandbox is significantly stricter than Android.
 *
 * What's available on iOS:
 * ✅ Share Extension — native Share Sheet integration (separate target)
 * ✅ Universal Links — HTTPS-verified deep links
 * ✅ Custom URL Scheme — pausebuy:// deep links
 * ✅ Siri Shortcuts — Add PauseBuy shortcut to Safari share sheet
 * ✅ Notifications — Push notifications triggered by server-side events
 * ✅ Clipboard monitoring — detect product URLs copied from shopping apps
 *
 * What is NOT available:
 * ✗ App-open detection (no background app monitoring)
 * ✗ Overlay on other apps
 * ✗ Screen Time API for custom detection
 *
 * Primary mechanism: Share Extension
 * User finds a product → Share Sheet → PauseBuy Extension → pre-fills form.
 * The extension is a separate Xcode target that communicates via App Groups.
 *
 * Note: The Share Extension is a native iOS target and requires Xcode configuration.
 * This service handles the app side of the communication.
 */

import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import type { IInterceptService } from './InterceptService';
import type { InterceptEvent } from '@/types';
import { detectPlatformFromUrl, isShoppingUrl } from './InterceptService';

type Callback = (event: InterceptEvent) => void;

export class IOSInterceptService implements IInterceptService {
  private callbacks: Set<Callback> = new Set();
  private linkingSubscription: { remove: () => void } | null = null;
  private clipboardPollingInterval: ReturnType<typeof setInterval> | null = null;
  private lastCheckedClipboard = '';
  private isRunning = false;

  isSupported(): boolean {
    // Share Extension + deep links are always supported on iOS
    // Clipboard monitoring is available but requires care (iOS 16+ shows UI indicator)
    return true;
  }

  async hasPermission(): Promise<boolean> {
    // Deep links don't require permission
    // Clipboard monitoring in iOS 16+ shows a banner but doesn't block
    return true;
  }

  async requestPermission(): Promise<boolean> {
    return true;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // Listen for URLs from Share Extension and Universal Links
    this.linkingSubscription = Linking.addEventListener('url', this.handleUrl);

    // Check cold-start URL
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      this.handleUrl({ url: initialUrl });
    }

    // Optionally: poll clipboard for product URLs (conservative interval)
    // Note: iOS 16+ shows a paste notification — only enable with user consent
    // this.startClipboardPolling();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.linkingSubscription?.remove();
    this.linkingSubscription = null;

    if (this.clipboardPollingInterval) {
      clearInterval(this.clipboardPollingInterval);
      this.clipboardPollingInterval = null;
    }
  }

  subscribe(callback: Callback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  getCapabilityDescription(): string {
    return 'Tap the Share button in Safari or any shopping app, then choose PauseBuy to instantly add a product to your pause list. You can also install a Siri Shortcut for faster access.';
  }

  private handleUrl = ({ url }: { url: string }) => {
    if (!url) return;

    // Handle Share Extension callback: pausebuy://share?url=<product_url>
    if (url.startsWith('pausebuy://share')) {
      const parsed = Linking.parse(url);
      const shoppingUrl = parsed.queryParams?.url as string | undefined;

      if (shoppingUrl) {
        this.emit({
          trigger: 'share_intent',
          platform: detectPlatformFromUrl(shoppingUrl),
          url: shoppingUrl,
          detectedAt: new Date().toISOString(),
        });
      }
      return;
    }

    // Universal link / custom scheme
    if (isShoppingUrl(url)) {
      this.emit({
        trigger: 'url_open',
        platform: detectPlatformFromUrl(url),
        url,
        detectedAt: new Date().toISOString(),
      });
    }
  };

  private startClipboardPolling() {
    // Poll every 5 seconds when the app is in foreground
    // This is secondary to share extension; only activate if user opts in
    this.clipboardPollingInterval = setInterval(async () => {
      try {
        const text = await Clipboard.getStringAsync();
        if (text && text !== this.lastCheckedClipboard && isShoppingUrl(text)) {
          this.lastCheckedClipboard = text;
          this.emit({
            trigger: 'url_open',
            platform: detectPlatformFromUrl(text),
            url: text,
            detectedAt: new Date().toISOString(),
          });
        }
      } catch {
        // Clipboard access may be denied silently
      }
    }, 5000);
  }

  private emit(event: InterceptEvent) {
    this.callbacks.forEach(cb => {
      try { cb(event); } catch (e) { console.error('[IOSIntercept] Callback error:', e); }
    });
  }
}
