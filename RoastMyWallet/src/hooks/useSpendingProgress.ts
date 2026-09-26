import { useMemo } from 'react';
import {
  startOfDay, startOfWeek, startOfMonth,
  endOfDay, endOfWeek, endOfMonth,
} from 'date-fns';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { SpendingProgress, LimitProgress } from '@/types';

/**
 * useSpendingProgress
 *
 * Calculates how much of each spending limit has been used.
 * Only counts "bought" purchases within the period.
 * Optionally filters to impulse-only purchases if the limit is so configured.
 *
 * Returns null for each period if no limit is set.
 */
export function useSpendingProgress(): SpendingProgress {
  const purchases = usePurchaseStore(s => s.purchases);
  const { spendingLimits } = useSettingsStore();

  return useMemo(() => {
    const now = new Date();
    const bought = purchases.filter(p => p.status === 'bought');

    function calcProgress(
      limit: number | null | undefined,
      periodStart: Date,
      periodEnd: Date
    ): LimitProgress | null {
      if (!limit) return null;

      let purchases = bought.filter(p => {
        const d = new Date(p.decidedAt ?? p.updatedAt);
        return d >= periodStart && d <= periodEnd;
      });

      if (spendingLimits?.impulseOnly) {
        purchases = purchases.filter(p => p.impulseRisk === 'high');
      }

      const spent = purchases.reduce((sum, p) => sum + p.price, 0);
      const remaining = Math.max(0, limit - spent);
      const percentUsed = Math.min(100, Math.round((spent / limit) * 100));

      return {
        limit,
        spent,
        remaining,
        percentUsed,
        isExceeded: spent > limit,
      };
    }

    return {
      daily: calcProgress(
        spendingLimits?.daily,
        startOfDay(now),
        endOfDay(now)
      ),
      weekly: calcProgress(
        spendingLimits?.weekly,
        startOfWeek(now, { weekStartsOn: 1 }),
        endOfWeek(now, { weekStartsOn: 1 })
      ),
      monthly: calcProgress(
        spendingLimits?.monthly,
        startOfMonth(now),
        endOfMonth(now)
      ),
    };
  }, [purchases, spendingLimits]);
}

/**
 * useSpendingAlert
 *
 * Returns the most urgent spending alert if any limit is >80% used.
 * Used for proactive warnings in the UI.
 */
export function useSpendingAlert(): {
  hasAlert: boolean;
  severity: 'warning' | 'exceeded' | null;
  period: 'daily' | 'weekly' | 'monthly' | null;
  percentUsed: number;
} {
  const progress = useSpendingProgress();

  const periods = (
    [
      { key: 'daily' as const, data: progress.daily },
      { key: 'weekly' as const, data: progress.weekly },
      { key: 'monthly' as const, data: progress.monthly },
    ] as const
  ).filter(p => p.data !== null);

  // Find the most urgent
  const exceeded = periods.find(p => p.data?.isExceeded);
  if (exceeded) {
    return {
      hasAlert: true,
      severity: 'exceeded',
      period: exceeded.key,
      percentUsed: exceeded.data!.percentUsed,
    };
  }

  const warning = periods
    .filter(p => (p.data?.percentUsed ?? 0) >= 80)
    .sort((a, b) => (b.data?.percentUsed ?? 0) - (a.data?.percentUsed ?? 0))[0];

  if (warning) {
    return {
      hasAlert: true,
      severity: 'warning',
      period: warning.key,
      percentUsed: warning.data!.percentUsed,
    };
  }

  return { hasAlert: false, severity: null, period: null, percentUsed: 0 };
}
