/**
 * interceptStore — manages intercept events and the roast overlay state
 *
 * Flow:
 *   useInterceptListener (mounted in _layout.tsx)
 *     → intercept service detects share intent / URL / clipboard
 *     → calls interceptStore.handleIntercept(event)
 *     → roast modal becomes visible
 *     → user dismisses OR adds to waiting list
 */

import { create } from 'zustand';
import type { InterceptEvent, ShoppingPlatform } from '@/types';
import { getRoastMessage } from '@/features/intercept/InterceptService';

export interface InterceptState {
  // Current event waiting for user action
  pendingEvent: InterceptEvent | null;
  roastMessage: string;
  isVisible: boolean;

  // History of intercept events this session
  interceptedCount: number;
  savedCount: number;       // times user chose "Add to wait list" instead of buying

  // Actions
  handleIntercept: (event: InterceptEvent) => void;
  dismiss: () => void;
  confirmSaved: () => void;    // user added to pause list → credit saved count
}

export const useInterceptStore = create<InterceptState>((set, get) => ({
  pendingEvent: null,
  roastMessage: '',
  isVisible: false,
  interceptedCount: 0,
  savedCount: 0,

  handleIntercept: (event: InterceptEvent) => {
    const roastMessage = getRoastMessage(event.platform as ShoppingPlatform);
    set({
      pendingEvent: event,
      roastMessage,
      isVisible: true,
      interceptedCount: get().interceptedCount + 1,
    });
  },

  dismiss: () => set({ isVisible: false, pendingEvent: null }),

  confirmSaved: () =>
    set(s => ({ savedCount: s.savedCount + 1, isVisible: false, pendingEvent: null })),
}));
