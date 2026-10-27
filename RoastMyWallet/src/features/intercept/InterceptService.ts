import { Platform } from 'react-native';
import type { InterceptEvent, ShoppingPlatform } from '@/types';

// ─── INTERCEPT SERVICE INTERFACE ─────────────────────────────────────────────

export interface IInterceptService {
  isSupported(): boolean;
  hasPermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  start(): Promise<void>;
  stop(): Promise<void>;
  subscribe(callback: (event: InterceptEvent) => void): () => void;
  getCapabilityDescription(): string;
}

// Shared platform metadata and URL detection live in a lightweight utility module.
export { PLATFORM_META } from './intercept.utils';
export type { PlatformMeta } from './intercept.utils';

// ─── ROAST MESSAGES ──────────────────────────────────────────────────────────

export const ROAST_MESSAGES: Record<ShoppingPlatform, string[]> = {
  tiktok_shop: [
    '⚠️ TikTok algorithm รู้จักคุณดีกว่าแม่ตัวเองแล้ว สั่งจริงไหม หรือแค่ "Add to Cart" ไว้ก่อน?',
    '🎵 "5 นาที" ใน TikTok = 2 ชั่วโมง + ของไม่จำเป็นอีก 3 ชิ้น ระวัง!',
    '🔥 Live สั่งเลยได้ส่วนลด! หรือจริงๆ แค่ไม่อยากรู้สึก FOMO?',
  ],
  shopee: [
    '🛍️ Shopee Coins กำลังหมดอายุ... แต่ประหยัดเงิน 100 บาทโดยการไม่ซื้อเลยดีกว่า',
    '🔥 Flash Sale 5 นาที! — เคยซื้อแล้วรู้สึกดีขึ้นจริงๆ ไหม?',
    '📦 Free shipping ฟรี แต่ตัวสินค้ายังต้องจ่ายอยู่ดีนะ...',
  ],
  lazada: [
    '🛒 Voucher หมดอายุพรุ่งนี้! — หรือแค่กลัวพลาดทั้งที่ไม่ได้อยากได้จริงๆ?',
    '⚡ LazFlash กำลังนับถอยหลัง... บัญชีธนาคารก็กำลังนับถอยหลังเหมือนกัน',
    '💳 0% นาน 10 เดือน — แต่สิ้นสุดแล้วยังต้องจ่ายเต็มนะ!',
  ],
  tokopedia:      ['🟢 Tokopedia กำลังล่อใจอยู่ รอ 24 ชั่วโมงก่อนได้ไหม?'],
  jd_central:     ['❤️ JD Central: ของดีจริงหรือแค่ดูดีบนหน้าจอ? ลองรอดูสักคืน'],
  central_online: ['🏬 Central: ราคาดีกว่าหน้าร้านจริงไหม? หรือแค่รู้สึกอยากได้?'],
  zalora:         ['👗 แฟชั่นใหม่ แต่ตู้เสื้อผ้าเต็มแล้ว... ใส่จริงกี่ครั้ง?'],
  klook:          ['✈️ Trip นี้จองแล้วจะได้ไปจริงๆ ไหม? หรือแค่ฝัน?'],
  instagram:      ['📸 Influencer บอกว่าดี แต่เขาได้รับฟรี ส่วนคุณต้องจ่ายเอง...'],
  facebook:       ['👍 Facebook Marketplace: ของถูกมีเหตุผล ตรวจสอบดีแล้วยัง?'],
  amazon:         ['📦 Prime Delivery เร็วจริง แต่ต้องการจริงๆ ไหม หรือแค่ขี้เกียจออกไปซื้อ?'],
  aliexpress:     ['🔴 รอ 30-60 วัน ถึงบ้าน แล้วจะยังอยากได้อยู่ไหม?'],
  taobao:         ['🏮 Taobao: คิดค่า shipping ด้วยยัง? บางทีถูกกว่าแค่ตัวเลข'],
  shein:          ['✨ Fast fashion ราคาถูก แต่โลกจ่ายราคานั้นแทนคุณ 🌍'],
  grab_mart:      ['🚗 Delivery ฟรีแต่มีขั้นต่ำ — ซื้อเพิ่มเพื่อให้ถึงขั้นต่ำ = ไม่ประหยัด'],
  line_shopping:  ['💬 Line Points กำลังหมดอายุ... แต่ซื้อของไม่จำเป็นก็ยังเสียเงินอยู่ดี'],
  other_website:  ['🌐 ก่อนกด Checkout — คุณวางแผนซื้อสิ่งนี้ก่อนเข้าเว็บไหม?'],
  physical_store: ['🏪 อยู่ในร้านแล้ว — ลิสต์สิ่งที่ต้องการจริงๆ ยาวแค่ไหน?'],
  unknown:        ['🛒 เดี๋ยวก่อน! ของชิ้นนี้จำเป็นจริงๆ ไหม หรือแค่อยากได้?'],
};

export function getRoastMessage(platform: ShoppingPlatform): string {
  const msgs = ROAST_MESSAGES[platform];
  if (!msgs) return ROAST_MESSAGES.unknown[0];
  if (Array.isArray(msgs)) return msgs[Math.floor(Math.random() * msgs.length)];
  return String(msgs);
}

// URL detection lives in a dependency-free module to avoid platform-service cycles.
export { SHOPPING_PATTERNS, detectPlatformFromUrl, isShoppingUrl } from './intercept.utils';

// ─── PLATFORM FACTORY ────────────────────────────────────────────────────────

import { AndroidInterceptService } from './intercept.android';
import { IOSInterceptService } from './intercept.ios';
import { WebInterceptService } from './intercept.web';

export function createInterceptService(): IInterceptService {
  switch (Platform.OS) {
    case 'android': return new AndroidInterceptService();
    case 'ios':     return new IOSInterceptService();
    default:        return new WebInterceptService();
  }
}
