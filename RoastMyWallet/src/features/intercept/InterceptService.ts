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

// ─── SHOPPING PLATFORM METADATA ──────────────────────────────────────────────

export interface PlatformMeta {
  name: string;
  emoji: string;
  color: string;
}

export const PLATFORM_META: Record<ShoppingPlatform, PlatformMeta> = {
  tiktok_shop:    { name: 'TikTok Shop',      emoji: '🎵', color: '#010101' },
  shopee:         { name: 'Shopee',            emoji: '🛍️', color: '#EE4D2D' },
  lazada:         { name: 'Lazada',            emoji: '🛒', color: '#0F146D' },
  tokopedia:      { name: 'Tokopedia',         emoji: '🟢', color: '#42B549' },
  jd_central:     { name: 'JD Central',        emoji: '❤️', color: '#CC0001' },
  central_online: { name: 'Central Online',    emoji: '🏬', color: '#E31837' },
  zalora:         { name: 'ZALORA',            emoji: '👗', color: '#000000' },
  klook:          { name: 'Klook',             emoji: '✈️', color: '#FF5722' },
  instagram:      { name: 'Instagram Shop',    emoji: '📸', color: '#E1306C' },
  facebook:       { name: 'Facebook Shop',     emoji: '👍', color: '#1877F2' },
  amazon:         { name: 'Amazon',            emoji: '📦', color: '#FF9900' },
  aliexpress:     { name: 'AliExpress',        emoji: '🔴', color: '#E62E04' },
  taobao:         { name: 'Taobao',            emoji: '🏮', color: '#FF4400' },
  shein:          { name: 'SHEIN',             emoji: '✨', color: '#000000' },
  grab_mart:      { name: 'GrabMart',          emoji: '🚗', color: '#00B14F' },
  line_shopping:  { name: 'LINE Shopping',     emoji: '💬', color: '#06C755' },
  other_website:  { name: 'ร้านค้าออนไลน์',  emoji: '🌐', color: '#555555' },
  physical_store: { name: 'ร้านค้า',          emoji: '🏪', color: '#8B6914' },
  unknown:        { name: 'Shopping',          emoji: '🛒', color: '#555555' },
};

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
  tokopedia:      [{ toString: () => '🟢 Tokopedia กำลังล่อใจอยู่ รอ 24 ชั่วโมงก่อนได้ไหม?' }[Symbol.toPrimitive]?.('string') ?? '🟢 รอ 24 ชั่วโมงก่อนสั่ง เผื่อใจเปลี่ยน'],
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

// ─── URL DETECTION ───────────────────────────────────────────────────────────

export const SHOPPING_PATTERNS: Array<{ pattern: RegExp; platform: ShoppingPlatform }> = [
  // TikTok
  { pattern: /tiktok\.com\/(shop|@[^/]+\/video|@[^/]+\/product)/, platform: 'tiktok_shop' },
  // Shopee — multi-country
  { pattern: /shopee\.(co\.th|com|ph|sg|com\.br|com\.my|vn|tw|id)/, platform: 'shopee' },
  // Lazada — multi-country
  { pattern: /lazada\.(co\.th|com|sg|com\.my|com\.ph|vn)/, platform: 'lazada' },
  // Tokopedia
  { pattern: /tokopedia\.com/, platform: 'tokopedia' },
  // JD Central (Thailand)
  { pattern: /jd\.co\.th|central\.co\.th\/jd/, platform: 'jd_central' },
  // Central Online
  { pattern: /central\.co\.th/, platform: 'central_online' },
  // ZALORA
  { pattern: /zalora\.(co\.th|com|sg|com\.my|com\.ph)/, platform: 'zalora' },
  // Klook
  { pattern: /klook\.com/, platform: 'klook' },
  // SHEIN
  { pattern: /shein\.(com|co\.th)/, platform: 'shein' },
  // AliExpress
  { pattern: /aliexpress\.com/, platform: 'aliexpress' },
  // Taobao
  { pattern: /taobao\.com|world\.taobao\.com/, platform: 'taobao' },
  // GrabMart
  { pattern: /grab\.com\/(food|mart|express)/, platform: 'grab_mart' },
  // LINE Shopping
  { pattern: /shop\.line\.me|liff\.line\.me/, platform: 'line_shopping' },
  // Instagram shopping
  { pattern: /instagram\.com\/(p\/|reel\/|shop|products)/, platform: 'instagram' },
  // Facebook shop / marketplace
  { pattern: /facebook\.com\/(marketplace|groups|commerce|shop|products)/, platform: 'facebook' },
  // Amazon — multi-country
  { pattern: /amazon\.(com|co\.jp|co\.uk|de|fr|com\.au|sg)/, platform: 'amazon' },
];

export function detectPlatformFromUrl(url: string): ShoppingPlatform {
  for (const { pattern, platform } of SHOPPING_PATTERNS) {
    if (pattern.test(url)) return platform;
  }
  return 'other_website';
}

export function isShoppingUrl(url: string): boolean {
  return SHOPPING_PATTERNS.some(({ pattern }) => pattern.test(url));
}

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
