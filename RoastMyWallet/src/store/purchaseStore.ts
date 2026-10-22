import { create } from 'zustand';
import type { Purchase, CreatePurchaseInput, PurchaseStatus, LoadingState, Currency } from '@/types';
import { supabase } from '@/services/supabase';
import { calculateNeedScore, calculateQuickScore, suggestWaitingHours } from '@/utils/scoring';
import { analyzePurchase } from '@/features/ai/AIService';
import { addHours } from 'date-fns';
import { useNotificationStore } from '@/store/notificationStore';

interface PurchaseState {
  purchases: Purchase[];
  loadingState: LoadingState;
  addingState: LoadingState;
  error: string | null;

  // Actions
  loadPurchases: (force?: boolean) => Promise<void>;
  addPurchase: (input: CreatePurchaseInput, isPro: boolean) => Promise<Purchase | null>;
  updatePurchaseStatus: (id: string, status: PurchaseStatus) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  extendWaiting: (id: string, additionalHours: number) => Promise<void>;

  // Computed helpers (not reactive — call in component)
  getWaiting: () => Purchase[];
  getDecided: () => Purchase[];
  getThisMonthAvoided: () => number;
  getThisMonthAvoidedCount: () => number;
}

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  purchases: [],
  loadingState: 'idle',
  addingState: 'idle',
  error: null,

  loadPurchases: async (force = false) => {
    // Avoid repeating the same initial fetch whenever the user changes tabs.
    // Pull-to-refresh passes force=true to explicitly request fresh data.
    const currentState = get().loadingState;
    if (!force && (currentState === 'success' || currentState === 'loading')) return;

    // Keep purchases created while this network request is in flight. Otherwise,
    // a slower stale fetch can overwrite a newly saved/optimistic item.
    const requestStartedAt = Date.now();
    set({ loadingState: 'loading', error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200); // Free: limit applied server-side via RLS policy

      if (error) throw error;

      const purchases = (data ?? []).map(mapSupabasePurchase);
      const fetchedIds = new Set(purchases.map(p => p.id));
      const locallyCreatedDuringRequest = get().purchases.filter(p =>
        !fetchedIds.has(p.id) &&
        (p.id.startsWith('temp-') || new Date(p.createdAt).getTime() >= requestStartedAt)
      );
      set({
        purchases: [...locallyCreatedDuringRequest, ...purchases],
        loadingState: 'success',
      });
    } catch (err) {
      set({ loadingState: 'error', error: String(err) });
    }
  },

  addPurchase: async (input, isPro) => {
    set({ addingState: 'loading', error: null });
    let optimisticId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate need score
      let scoring;
      if (input.questionnaire) {
        scoring = calculateNeedScore(input.reason, input.questionnaire);
      } else {
        scoring = calculateQuickScore(input.reason);
      }

      const waitingHours = input.waitingHours ||
        suggestWaitingHours(input.price, scoring.risk, input.currency);

      const waitingUntil = addHours(new Date(), waitingHours).toISOString();

      // Create purchase record (optimistic)
      optimisticId = `temp-${Date.now()}`;
      const optimisticPurchase: Purchase = {
        id: optimisticId,
        userId: user.id,
        ...input,
        needScore: scoring.score,
        impulseRisk: scoring.risk,
        aiRoast: null,
        aiReason: null,
        aiRecommendation: null,
        status: 'waiting',
        waitingUntil,
        waitingHours,
        decidedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add optimistically
      set(state => ({ purchases: [optimisticPurchase, ...state.purchases] }));

      // Save to database.
      // Row is typed as `any` because we hand-wrote Database types without full
      // insert-shape inference. Replace with generated types from `supabase gen types`.
      const insertRow: Record<string, unknown> = {
        user_id: user.id,
        product_name: input.productName,
        price: input.price,
        currency: input.currency,
        url: input.url,
        image_url: input.imageUrl,
        platform: input.platform,
        category: input.category,
        reason: input.reason,
        notes: input.notes,
        questionnaire: (input.questionnaire as unknown) as Record<string, unknown> | null,
        need_score: scoring.score,
        impulse_risk: scoring.risk,
        status: 'waiting',
        waiting_until: waitingUntil,
        waiting_hours: waitingHours,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: savedData, error: saveError } = await (supabase as any)
        .from('purchases')
        .insert(insertRow)
        .select()
        .single();

      if (saveError) throw saveError;

      const savedPurchase = mapSupabasePurchase(savedData);

      // Replace optimistic with real
      set(state => ({
        purchases: state.purchases.map(p =>
          p.id === optimisticId ? savedPurchase : p
        ),
      }));

      // Kick off AI analysis in background (non-blocking)
      if (savedPurchase) {
        analyzeInBackground(savedPurchase, isPro)
          .then(aiResult => {
            if (aiResult) {
              set(state => ({
                purchases: state.purchases.map(p =>
                  p.id === savedPurchase.id
                    ? { ...p, aiRoast: aiResult.roast, aiReason: aiResult.reason, aiRecommendation: aiResult.recommendation }
                    : p
                ),
              }));
            }
          })
          .catch(err => console.error('[PurchaseStore] AI background error:', err));

        // Schedule the "time to decide" notification (non-blocking)
        try {
          useNotificationStore.getState().schedulePurchaseReminder(savedPurchase);
        } catch (_) {} // Notification failure never blocks purchase flow
      }

      set({ addingState: 'success' });
      return savedPurchase;
    } catch (err) {
      const message = getErrorMessage(err);
      set({ addingState: 'error', error: message });
      // Remove only this failed optimistic entry; don't discard other pending entries.
      if (optimisticId) {
        set(state => ({
          purchases: state.purchases.filter(p => p.id !== optimisticId),
        }));
      }
      // Supabase/PostgREST errors are plain objects, so String(err) hides the useful details.
      console.error('[PurchaseStore] addPurchase failed:', {
        message,
        error: err,
      });
      return null;
    }
  },

  updatePurchaseStatus: async (id, status) => {
    const decidedAt = ['bought', 'avoided'].includes(status)
      ? new Date().toISOString()
      : null;

    // Optimistic update
    set(state => ({
      purchases: state.purchases.map(p =>
        p.id === id ? { ...p, status, decidedAt, updatedAt: new Date().toISOString() } : p
      ),
    }));

    const { error } = await (supabase as any)
      .from('purchases')
      .update({
        status,
        decided_at: decidedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      // Revert on failure
      await get().loadPurchases();
      throw error;
    }
  },

  deletePurchase: async (id) => {
    // Optimistic remove
    set(state => ({
      purchases: state.purchases.filter(p => p.id !== id),
    }));

    const { error } = await (supabase as any).from('purchases').delete().eq('id', id);

    if (error) {
      await get().loadPurchases();
      throw error;
    }
  },

  extendWaiting: async (id, additionalHours) => {
    const purchase = get().purchases.find(p => p.id === id);
    if (!purchase) return;

    const currentUntil = purchase.waitingUntil
      ? new Date(purchase.waitingUntil)
      : new Date();
    const newUntil = addHours(currentUntil, additionalHours);

    set(state => ({
      purchases: state.purchases.map(p =>
        p.id === id ? { ...p, waitingUntil: newUntil.toISOString() } : p
      ),
    }));

    await (supabase as any)
      .from('purchases')
      .update({ waiting_until: newUntil.toISOString() })
      .eq('id', id);
  },

  // ─── COMPUTED ────────────────────────────────────────────────────────────

  getWaiting: () => {
    return get().purchases.filter(p => p.status === 'waiting');
  },

  getDecided: () => {
    return get().purchases.filter(
      p => p.status === 'bought' || p.status === 'avoided' || p.status === 'expired'
    );
  },

  getThisMonthAvoided: () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return get().purchases
      .filter(p =>
        (p.status === 'avoided' || p.status === 'expired') &&
        new Date(p.updatedAt) >= startOfMonth
      )
      .reduce((sum, p) => sum + p.price, 0);
  },

  getThisMonthAvoidedCount: () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return get().purchases.filter(p =>
      (p.status === 'avoided' || p.status === 'expired') &&
      new Date(p.updatedAt) >= startOfMonth
    ).length;
  },
}));

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function analyzeInBackground(purchase: Purchase, isPro: boolean) {
  try {
    const result = await analyzePurchase(purchase, purchase.needScore ?? 50, { isPro });
    if (result.data) {
      await (supabase as any)
        .from('purchases')
        .update({
          ai_roast: result.data.roast,
          ai_reason: result.data.reason,
          ai_recommendation: result.data.recommendation,
        })
        .eq('id', purchase.id);
    }
    return result.data;
  } catch {
    return null;
  }
}

function mapSupabasePurchase(data: any): Purchase {
  return {
    id: data.id,
    userId: data.user_id,
    productName: data.product_name,
    price: data.price,
    currency: data.currency as Currency,
    url: data.url,
    imageUrl: data.image_url,
    platform: data.platform,
    category: data.category,
    reason: data.reason,
    notes: data.notes,
    questionnaire: data.questionnaire,
    needScore: data.need_score,
    impulseRisk: data.impulse_risk,
    aiRoast: data.ai_roast,
    aiReason: data.ai_reason,
    aiRecommendation: data.ai_recommendation,
    status: data.status,
    waitingUntil: data.waiting_until,
    waitingHours: data.waiting_hours,
    decidedAt: data.decided_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// ─── SELECTORS ────────────────────────────────────────────────────────────────

export const selectWaitingPurchases = (state: PurchaseState) =>
  state.purchases.filter(p => p.status === 'waiting');

export const selectAvoidedThisMonth = (state: PurchaseState) =>
  state.getThisMonthAvoided();


function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;

  if (typeof err === 'string') return err;

  if (err && typeof err === 'object') {
    const value = err as Record<string, unknown>;
    const parts = [
      typeof value.message === 'string' ? value.message : null,
      typeof value.details === 'string' ? value.details : null,
      typeof value.hint === 'string' ? `Hint: ${value.hint}` : null,
      typeof value.code === 'string' ? `Code: ${value.code}` : null,
    ].filter(Boolean);

    if (parts.length) return parts.join(' — ');

    try {
      return JSON.stringify(err);
    } catch {
      return 'เกิดข้อผิดพลาดที่ไม่ทราบรายละเอียด';
    }
  }

  return 'เกิดข้อผิดพลาดที่ไม่ทราบรายละเอียด';
}
