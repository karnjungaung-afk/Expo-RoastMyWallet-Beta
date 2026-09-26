import { useMemo } from 'react';
import { startOfMonth, subMonths, format } from 'date-fns';
import { usePurchaseStore } from '@/store/purchaseStore';
import { calculateAvoidedSpending, calculateImpulseRate } from '@/utils/scoring';
import type { Purchase, PurchaseCategory, PurchaseReason } from '@/types';

export interface MonthlyBreakdown {
  month: string;       // 'Jan', 'Feb', etc.
  monthKey: string;    // 'YYYY-MM'
  avoided: number;
  spent: number;
  count: number;
}

export interface AnalyticsData {
  // Lifetime
  totalAvoided: number;
  totalSpent: number;
  avoidedCount: number;
  boughtCount: number;
  waitingCount: number;

  // Rates
  impulseRate: number;
  avoidanceRate: number;
  avgWaitingHours: number;

  // Current month
  thisMonthAvoided: number;
  thisMonthSpent: number;
  thisMonthAvoidedCount: number;
  thisMonthBoughtCount: number;

  // Patterns
  topCategory: PurchaseCategory | null;
  topReason: PurchaseReason | null;
  topImpulseTrigger: PurchaseReason | null;

  // Trend
  last6Months: MonthlyBreakdown[];

  // Pro metrics
  longestStreak: number;         // days without an impulse buy
  mostExpensiveAvoided: number;
}

export function useAnalytics(): AnalyticsData {
  const purchases = usePurchaseStore(s => s.purchases);

  return useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);

    const decided = purchases.filter(p => p.status === 'bought' || p.status === 'avoided' || p.status === 'expired');
    const avoided = purchases.filter(p => p.status === 'avoided' || p.status === 'expired');
    const bought = purchases.filter(p => p.status === 'bought');
    const waiting = purchases.filter(p => p.status === 'waiting');

    // This month
    const thisMonthPurchases = purchases.filter(
      p => new Date(p.updatedAt) >= monthStart
    );
    const thisMonthAvoided = thisMonthPurchases.filter(p => p.status === 'avoided' || p.status === 'expired');
    const thisMonthBought = thisMonthPurchases.filter(p => p.status === 'bought');

    // Avg waiting hours
    const waitedPurchases = decided.filter(p => p.decidedAt && p.createdAt);
    const avgWaitingHours = waitedPurchases.length > 0
      ? waitedPurchases.reduce((sum, p) => {
          const diff = (new Date(p.decidedAt!).getTime() - new Date(p.createdAt).getTime()) / 3_600_000;
          return sum + diff;
        }, 0) / waitedPurchases.length
      : 0;

    // Top category (all time)
    const topCategory = getMostFrequent(purchases.map(p => p.category)) as PurchaseCategory | null;

    // Top reason overall
    const topReason = getMostFrequent(purchases.map(p => p.reason)) as PurchaseReason | null;

    // Top impulse trigger = reason for HIGH risk avoided purchases
    const impulseTrigger = getMostFrequent(
      avoided.filter(p => p.impulseRisk === 'high').map(p => p.reason)
    ) as PurchaseReason | null;

    // 6-month breakdown
    const last6Months: MonthlyBreakdown[] = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, 5 - i);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM');

      const monthPurchases = purchases.filter(p =>
        format(new Date(p.updatedAt), 'yyyy-MM') === monthKey
      );

      return {
        month: monthLabel,
        monthKey,
        avoided: monthPurchases
          .filter(p => p.status === 'avoided' || p.status === 'expired')
          .reduce((s, p) => s + p.price, 0),
        spent: monthPurchases
          .filter(p => p.status === 'bought')
          .reduce((s, p) => s + p.price, 0),
        count: monthPurchases.length,
      };
    });

    // Longest streak without impulse buy (bought HIGH risk)
    const longestStreak = calculateAvoidanceStreak(bought);

    // Most expensive avoided
    const mostExpensiveAvoided = avoided.length > 0
      ? Math.max(...avoided.map(p => p.price))
      : 0;

    // Avoidance rate
    const avoidanceRate = decided.length > 0
      ? Math.round((avoided.length / decided.length) * 100)
      : 0;

    return {
      totalAvoided: calculateAvoidedSpending(purchases),
      totalSpent: bought.reduce((s, p) => s + p.price, 0),
      avoidedCount: avoided.length,
      boughtCount: bought.length,
      waitingCount: waiting.length,
      impulseRate: calculateImpulseRate(
        purchases.map(p => ({ status: p.status, impulseRisk: p.impulseRisk }))
      ),
      avoidanceRate,
      avgWaitingHours: Math.round(avgWaitingHours),
      thisMonthAvoided: thisMonthAvoided.reduce((s, p) => s + p.price, 0),
      thisMonthSpent: thisMonthBought.reduce((s, p) => s + p.price, 0),
      thisMonthAvoidedCount: thisMonthAvoided.length,
      thisMonthBoughtCount: thisMonthBought.length,
      topCategory,
      topReason,
      topImpulseTrigger: impulseTrigger,
      last6Months,
      longestStreak,
      mostExpensiveAvoided,
    };
  }, [purchases]);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getMostFrequent(values: string[]): string | null {
  if (values.length === 0) return null;
  const counts = values.reduce((acc, v) => {
    acc[v] = (acc[v] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
}

function calculateAvoidanceStreak(impulseBuys: Purchase[]): number {
  if (impulseBuys.length === 0) return 0;

  // Sort by decided date
  const sorted = [...impulseBuys]
    .filter(p => p.impulseRisk === 'high' && p.decidedAt)
    .sort((a, b) => new Date(b.decidedAt!).getTime() - new Date(a.decidedAt!).getTime());

  if (sorted.length === 0) return 0;

  // Days since last impulse buy
  const lastImpulse = new Date(sorted[0].decidedAt!);
  const daysSince = Math.floor(
    (Date.now() - lastImpulse.getTime()) / 86_400_000
  );

  return daysSince;
}
