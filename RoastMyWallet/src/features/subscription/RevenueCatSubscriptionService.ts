import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import type { Currency, ServiceResult, SubscriptionOffering, SubscriptionPackage, SubscriptionStatus } from '@/types';
import { env } from '@/config/env';
import { supabase } from '@/services/supabase';
import { ENTITLEMENT_PRO, PACKAGE_IDS } from './SubscriptionService';
import type { ISubscriptionService } from './SubscriptionService';

/**
 * RevenueCat is the source of truth for Pro entitlement state.
 * Missing credentials or store configuration must never grant Pro implicitly.
 */
export class RevenueCatSubscriptionService implements ISubscriptionService {
  private configuredKey: string | null = null;
  private appUserId: string | null = null;

  private async ensureReady(): Promise<void> {
    const apiKey = Platform.OS === 'web' ? env.revenueCatWebApiKey : env.revenueCatApiKey;
    if (!apiKey) {
      const target = Platform.OS === 'web' ? 'EXPO_PUBLIC_REVENUECAT_WEB_API_KEY' : 'EXPO_PUBLIC_REVENUECAT_API_KEY';
      throw new Error(`ยังไม่ได้ตั้งค่า RevenueCat (${target}) จึงยังตรวจสอบหรือซื้อ Pro ไม่ได้`);
    }

    if (this.configuredKey !== apiKey) {
      Purchases.setLogLevel(LOG_LEVEL.ERROR);
      Purchases.configure({ apiKey });
      this.configuredKey = apiKey;
      this.appUserId = null;
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw new Error('ไม่สามารถยืนยันบัญชีก่อนตรวจสอบ Pro ได้');
    const nextUserId = user?.id ?? null;

    if (nextUserId !== this.appUserId) {
      if (nextUserId) {
        await Purchases.logIn(nextUserId);
      } else if (this.appUserId) {
        await Purchases.logOut();
      }
      this.appUserId = nextUserId;
    }
  }

  async getStatus(): Promise<ServiceResult<SubscriptionStatus>> {
    try {
      await this.ensureReady();
      const customer = await Purchases.getCustomerInfo();
      const entitlement = customer.entitlements.active[ENTITLEMENT_PRO];
      if (entitlement) {
        return { data: 'pro', error: null };
      }
      return { data: 'free', error: null };
    } catch (error) {
      return { data: 'unknown', error: messageOf(error) };
    }
  }

  async isPro(): Promise<boolean> {
    const result = await this.getStatus();
    return result.data === 'pro' || result.data === 'trial';
  }

  async getOfferings(): Promise<ServiceResult<SubscriptionOffering[]>> {
    try {
      await this.ensureReady();
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) {
        return {
          data: [],
          error: 'ยังไม่มี Current Offering ใน RevenueCat กรุณาตั้งค่า Offering และแพ็กเกจ Pro',
        };
      }

      const packages = current.availablePackages
        .map(toSubscriptionPackage)
        .filter((item): item is SubscriptionPackage => item !== null);

      if (packages.length === 0) {
        return { data: [], error: 'ไม่พบแพ็กเกจรายเดือนหรือรายปีใน RevenueCat Offering' };
      }

      return {
        data: [{
          id: current.identifier,
          displayName: current.serverDescription || 'RoastMyWallet Pro',
          packages,
        }],
        error: null,
      };
    } catch (error) {
      return { data: [], error: messageOf(error) };
    }
  }

  async purchase(packageId: SubscriptionPackage['id']): Promise<ServiceResult<SubscriptionStatus>> {
    try {
      await this.ensureReady();
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) {
        return { data: 'unknown', error: 'ยังไม่มี Current Offering สำหรับซื้อ Pro' };
      }

      const selected = current.availablePackages.find(pkg => toSubscriptionPackage(pkg)?.id === packageId);
      if (!selected) {
        return { data: 'unknown', error: 'ไม่พบแพ็กเกจนี้ใน RevenueCat กรุณาตรวจสอบ Product ID และ Offering' };
      }

      const result = await Purchases.purchasePackage(selected);
      const isActive = Boolean(result.customerInfo.entitlements.active[ENTITLEMENT_PRO]);
      return isActive
        ? { data: 'pro', error: null }
        : { data: 'free', error: 'ชำระเงินแล้วแต่ยังไม่พบ Pro entitlement กรุณาตรวจสอบ entitlement ID ใน RevenueCat' };
    } catch (error) {
      return { data: 'unknown', error: messageOf(error) };
    }
  }

  async restorePurchases(): Promise<ServiceResult<SubscriptionStatus>> {
    if (Platform.OS === 'web') {
      return {
        data: 'unknown',
        error: 'การกู้คืนการซื้อใช้ได้บนแอป iOS/Android เท่านั้น สำหรับเว็บให้จัดการสมาชิกผ่าน RevenueCat Customer Center เมื่อเปิดใช้งาน',
      };
    }
    try {
      await this.ensureReady();
      const customer = await Purchases.restorePurchases();
      return customer.entitlements.active[ENTITLEMENT_PRO]
        ? { data: 'pro', error: null }
        : { data: 'free', error: 'ไม่พบรายการซื้อ Pro ที่กู้คืนได้ในบัญชีนี้' };
    } catch (error) {
      return { data: 'unknown', error: messageOf(error) };
    }
  }

  async refreshStatus(): Promise<ServiceResult<SubscriptionStatus>> {
    return this.getStatus();
  }
}

const SUPPORTED_CURRENCIES: readonly Currency[] = ['THB', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'MYR'];

function toSubscriptionPackage(pkg: {
  identifier: string;
  packageType: string;
  product: { title?: string; price?: number; currencyCode?: string };
}): SubscriptionPackage | null {
  const marker = `${pkg.identifier} ${pkg.packageType}`.toLowerCase();
  const period = /annual|year|annualy/.test(marker) || pkg.packageType.toLowerCase().includes('annual')
    ? 'year'
    : /month/.test(marker) || pkg.packageType.toLowerCase().includes('month')
      ? 'month'
      : null;
  if (!period) return null;

  const id = period === 'year' ? PACKAGE_IDS.PRO_YEARLY : PACKAGE_IDS.PRO_MONTHLY;
  const candidateCurrency = (pkg.product.currencyCode ?? 'THB').toUpperCase();
  const currency = SUPPORTED_CURRENCIES.includes(candidateCurrency as Currency)
    ? candidateCurrency as Currency
    : 'THB';

  return {
    id,
    displayName: pkg.product.title || (period === 'year' ? 'Pro รายปี' : 'Pro รายเดือน'),
    price: Number(pkg.product.price ?? 0),
    currency,
    period,
  };
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'เกิดข้อผิดพลาดกับบริการสมาชิก Pro กรุณาลองอีกครั้ง';
}
