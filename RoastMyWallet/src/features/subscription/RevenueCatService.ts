import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type PurchasesPackage } from 'react-native-purchases';
import { env } from '@/config/env';
import type { SubscriptionOffering, SubscriptionPackage, Currency } from '@/types';

let configured = false;
let configuredUserId: string | null = null;
let availablePackages = new Map<string, PurchasesPackage>();

function getApiKey(): string {
  if (Platform.OS !== 'android') {
    throw new Error('Google Play Billing ใช้ได้เฉพาะ Android');
  }
  if (!env.revenueCatApiKey) {
    throw new Error('ยังไม่ได้ตั้งค่า RevenueCat API key ใน environment');
  }
  return env.revenueCatApiKey;
}

/** Configure RevenueCat with the authenticated Supabase user ID. */
export async function configureRevenueCat(userId: string): Promise<void> {
  getApiKey();
  if (!configured) {
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey: getApiKey(), appUserID: userId });
    configured = true;
    configuredUserId = userId;
    return;
  }
  if (configuredUserId !== userId) {
    await Purchases.logIn(userId);
    configuredUserId = userId;
  }
}

export async function logOutRevenueCat(): Promise<void> {
  if (!configured || !configuredUserId) return;
  try {
    await Purchases.logOut();
  } finally {
    configuredUserId = null;
  }
}

export async function loadRevenueCatOfferings(): Promise<SubscriptionOffering[]> {
  if (!configured) throw new Error('RevenueCat ยังไม่ได้เริ่มต้น');
  const result = await Purchases.getOfferings();
  const current = result.current;
  if (!current) throw new Error('ยังไม่มี Offering ที่เปิดใช้งานใน RevenueCat Dashboard');
  availablePackages = new Map(current.availablePackages.map(item => [item.identifier, item]));

  const mapped = current.availablePackages
    .filter(item => item.identifier === 'pro_monthly' || item.identifier === 'pro_yearly')
    .map(item => {
      const isYearly = item.identifier === 'pro_yearly';
      return {
        id: item.identifier as SubscriptionPackage['id'],
        displayName: isYearly ? 'รายปี' : 'รายเดือน',
        price: Number(item.product.price) || 0,
        currency: (item.product.currencyCode || 'THB') as Currency,
        period: isYearly ? 'year' as const : 'month' as const,
      };
    });
  return [{ id: current.identifier, displayName: current.serverDescription || 'RoastMyWallet Pro', packages: mapped }];
}

/** Executes the Google Play purchase flow. Entitlement is not granted here. */
export async function purchaseRevenueCatPackage(packageId: SubscriptionPackage['id']): Promise<void> {
  if (!configured) throw new Error('RevenueCat ยังไม่ได้เริ่มต้น');
  const selected = availablePackages.get(packageId);
  if (!selected) {
    await loadRevenueCatOfferings();
  }
  const pkg = availablePackages.get(packageId);
  if (!pkg) throw new Error('ไม่พบแพ็กเกจนี้ใน RevenueCat Offering');
  await Purchases.purchasePackage(pkg);
  // Intentionally do not grant Pro from CustomerInfo/client callback.
  // The server-verified Supabase row is the sole entitlement source.
}

export async function restoreRevenueCatPurchases(): Promise<void> {
  if (!configured) throw new Error('RevenueCat ยังไม่ได้เริ่มต้น');
  await Purchases.restorePurchases();
  // Restoring a store transaction is not proof that the backend webhook has run.
}
