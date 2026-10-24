import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle, Ellipse } from 'react-native-svg';
import type { ShoppingPlatform } from '@/types';

interface TileProps { size?: number; }

export function ShopeeTile({ size = 44 }: TileProps) {
  return <View style={[s.tile,{width:size,height:size,borderRadius:size/2,backgroundColor:'#EE4D2D'}]}><Svg width={size*.54} height={size*.54} viewBox="0 0 24 24"><Rect x="3" y="8" width="18" height="13" rx="2" fill="none" stroke="#fff" strokeWidth="1.8"/><Path d="M9 12C9 10.3 10.3 9 12 9C13.7 9 15 10.3 15 12" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round"/><Path d="M6 8L7 4H17L18 8" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/></Svg></View>;
}
export function TikTokTile({ size = 44 }: TileProps) {
  return <View style={[s.tile,{width:size,height:size,borderRadius:size/2,backgroundColor:'#010101'}]}><Svg width={size*.52} height={size*.52} viewBox="0 0 24 24"><Path d="M9 12A4 4 0 1 0 13 16V5.5C14.5 6.5 16 7 18 7V10C17 10 15.5 9.5 14 8.5V16A5 5 0 1 1 9 11" fill="#fff" opacity="0.9"/></Svg></View>;
}
export function LazadaTile({ size = 44 }: TileProps) {
  return <View style={[s.tile,{width:size,height:size,borderRadius:size/2,backgroundColor:'#0F146D'}]}><Svg width={size*.55} height={size*.55} viewBox="0 0 24 24"><Path d="M12 3L4 8V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V8Z" fill="none" stroke="#FF6000" strokeWidth="1.8" strokeLinejoin="round"/><Path d="M9 21V14H15V21" fill="none" stroke="#fff" strokeWidth="1.8"/></Svg></View>;
}
export function AmazonTile({ size = 44 }: TileProps) {
  return <View style={[s.tile,{width:size,height:size,borderRadius:size/2,backgroundColor:'#FF9900'}]}><Svg width={size*.58} height={size*.58} viewBox="0 0 24 24"><Rect x="5" y="6" width="14" height="11" rx="2" fill="none" stroke="#1a1a1a" strokeWidth="1.8"/><Path d="M9 10H15M9 13H13" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"/><Path d="M5 17C8 19.5 14 19.5 19 17" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/><Path d="M17.5 15.5L19 17L17.5 18.5" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></Svg></View>;
}
export function InstagramTile({ size = 44 }: TileProps) {
  return <View style={[s.tile,{width:size,height:size,borderRadius:size/2,backgroundColor:'#E1306C'}]}><Svg width={size*.52} height={size*.52} viewBox="0 0 24 24"><Rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="#fff" strokeWidth="1.8"/><Circle cx="12" cy="12" r="4" fill="none" stroke="#fff" strokeWidth="1.8"/><Circle cx="17" cy="7" r="1" fill="#fff"/></Svg></View>;
}
export function SheinTile({ size = 44 }: TileProps) {
  return <View style={[s.tile,{width:size,height:size,borderRadius:size/2,backgroundColor:'#1A1A1A'}]}><Svg width={size*.55} height={size*.55} viewBox="0 0 24 24"><Path d="M7 6C7 4 8.5 3 10.5 3C12.5 3 14 4 14 6V7H7V6Z" fill="none" stroke="#fff" strokeWidth="1.5"/><Rect x="5" y="7" width="14" height="13" rx="2" fill="none" stroke="#fff" strokeWidth="1.6"/><Path d="M10 11L11.5 13L10 15M14 11L12.5 13L14 15" stroke="#E91E8C" strokeWidth="1.6" strokeLinecap="round"/></Svg></View>;
}
export function LineShoppingTile({ size = 44 }: TileProps) {
  return <View style={[s.tile,{width:size,height:size,borderRadius:size/2,backgroundColor:'#06C755'}]}><Svg width={size*.54} height={size*.54} viewBox="0 0 24 24"><Path d="M12 3C7 3 3 6.6 3 11C3 15 6.3 18.2 10.7 18.9L12 21L13.3 18.9C17.7 18.2 21 15 21 11C21 6.6 17 3 12 3Z" fill="none" stroke="#fff" strokeWidth="1.8"/><Path d="M8 10H16M8 13H14" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></Svg></View>;
}
export function GrabTile({ size = 44 }: TileProps) {
  return <View style={[s.tile,{width:size,height:size,borderRadius:size/2,backgroundColor:'#00B14F'}]}><Svg width={size*.54} height={size*.54} viewBox="0 0 24 24"><Circle cx="12" cy="8" r="3" fill="none" stroke="#fff" strokeWidth="1.8"/><Path d="M5 20C5 16.7 8.1 14 12 14S19 16.7 19 20" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none"/></Svg></View>;
}
export function GenericShopTile({ size = 44, color = '#7C6AF0' }: TileProps & { color?: string }) {
  return <View style={[s.tile,{width:size,height:size,borderRadius:size/2,backgroundColor:color}]}><Svg width={size*.54} height={size*.54} viewBox="0 0 24 24"><Path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2Z" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/><Path d="M3 6H21" stroke="#fff" strokeWidth="1.8"/><Path d="M16 10C16 12.2 14.2 14 12 14C9.8 14 8 12.2 8 10" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round"/></Svg></View>;
}

export function PlatformTile({ platform, size = 44 }: { platform: ShoppingPlatform; size?: number }) {
  switch (platform) {
    case 'shopee':        return <ShopeeTile size={size} />;
    case 'tiktok_shop':   return <TikTokTile size={size} />;
    case 'lazada':        return <LazadaTile size={size} />;
    case 'amazon':        return <AmazonTile size={size} />;
    case 'instagram':     return <InstagramTile size={size} />;
    case 'shein':         return <SheinTile size={size} />;
    case 'line_shopping': return <LineShoppingTile size={size} />;
    case 'grab_mart':     return <GrabTile size={size} />;
    case 'aliexpress':    return <GenericShopTile size={size} color="#E02E00" />;
    case 'taobao':        return <GenericShopTile size={size} color="#FF4400" />;
    case 'tokopedia':     return <GenericShopTile size={size} color="#42B549" />;
    case 'jd_central':    return <GenericShopTile size={size} color="#CC0001" />;
    case 'central_online':return <GenericShopTile size={size} color="#E31837" />;
    case 'zalora':        return <GenericShopTile size={size} color="#1A1A1A" />;
    case 'facebook':      return <GenericShopTile size={size} color="#1877F2" />;
    case 'klook':         return <GenericShopTile size={size} color="#FF5722" />;
    default:              return <GenericShopTile size={size} color="#7C6AF0" />;
  }
}

export const CATEGORY_GRADIENT: Record<string, [string, string]> = {
  electronics:   ['#4A90D9','#1B5EA8'], fashion:       ['#E91E8C','#9B1060'],
  beauty:        ['#FF6B9D','#C44D7A'], gaming:        ['#7C6AF0','#4A3AB0'],
  home:          ['#52B57D','#2E7A4F'], food:          ['#FF8C42','#C05A20'],
  sports:        ['#00BCD4','#007A8A'], health:        ['#4CAF50','#2E7D32'],
  books:         ['#795548','#4E342E'], travel:        ['#03A9F4','#0277BD'],
  entertainment: ['#FF5722','#BF360C'], tools:         ['#607D8B','#37474F'],
  other:         ['#9E9E9E','#616161'],
};

export const PLATFORM_NAME: Partial<Record<string,string>> = {
  shopee:'Shopee', tiktok_shop:'TikTok', lazada:'Lazada', amazon:'Amazon',
  instagram:'Instagram', shein:'SHEIN', line_shopping:'LINE', grab_mart:'Grab',
  aliexpress:'AliExpress', taobao:'Taobao', tokopedia:'Tokopedia',
  jd_central:'JD', central_online:'Central', zalora:'ZALORA', facebook:'Facebook',
};

const s = StyleSheet.create({ tile:{ alignItems:'center', justifyContent:'center' } });
