/**
 * useInterceptListener
 *
 * Mounts the platform-specific InterceptService and pipes events
 * into the interceptStore. Also handles clipboard monitoring on
 * Android (requires user consent — opt-in only).
 *
 * Mount once in root _layout.tsx.
 */

import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { createInterceptService, isShoppingUrl, detectPlatformFromUrl } from './InterceptService';
import type { IInterceptService } from './InterceptService';
import { useInterceptStore } from '@/store/interceptStore';
import type { InterceptEvent } from '@/types';

export function useInterceptListener() {
  const serviceRef = useRef<IInterceptService | null>(null);
  const clipboardTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastClipboard = useRef<string>('');
  const handleIntercept = useInterceptStore(s => s.handleIntercept);
  // clipboardMonitorEnabled — not yet in SettingsState; 
  // always false (safe opt-out default) until user enables from Settings
  const clipboardMonitorEnabled = false;

  // ── Intercept service (share intents + deep links) ──────────────────────────
  useEffect(() => {
    const service = createInterceptService();
    serviceRef.current = service;

    const unsub = service.subscribe((event: InterceptEvent) => {
      handleIntercept(event);
    });

    service.start().catch(err =>
      console.warn('[InterceptListener] Failed to start service:', err),
    );

    return () => {
      unsub();
      service.stop();
      serviceRef.current = null;
    };
  }, []);

  // ── Clipboard monitor (opt-in, Android + iOS) ────────────────────────────────
  // iOS 16+ shows a system banner when clipboard is read.
  // Only enable when user explicitly opts in from Settings.
  useEffect(() => {
    if (!clipboardMonitorEnabled) {
      if (clipboardTimerRef.current) {
        clearInterval(clipboardTimerRef.current);
        clipboardTimerRef.current = null;
      }
      return;
    }

    const checkClipboard = async () => {
      try {
        const text = await Clipboard.getStringAsync();
        if (!text || text === lastClipboard.current) return;
        lastClipboard.current = text;

        if (isShoppingUrl(text)) {
          handleIntercept({
            trigger: 'url_open',
            platform: detectPlatformFromUrl(text),
            url: text,
            detectedAt: new Date().toISOString(),
          });
        }
      } catch {
        // Clipboard access may be silently denied
      }
    };

    // Only check when app comes to foreground (not while backgrounded)
    const handleAppState = (next: AppStateStatus) => {
      if (next === 'active') checkClipboard();
    };

    const sub = AppState.addEventListener('change', handleAppState);
    // Also check on mount
    checkClipboard();

    return () => {
      sub.remove();
      if (clipboardTimerRef.current) {
        clearInterval(clipboardTimerRef.current);
        clipboardTimerRef.current = null;
      }
    };
  }, [clipboardMonitorEnabled]);
}
