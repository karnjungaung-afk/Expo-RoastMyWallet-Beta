/**
 * RoastMyWallet Custom SVG Icon Library
 * Anime/mecha aesthetic — angular, intentional, brand-specific
 * All icons use currentColor prop for theme compatibility
 */
import React from 'react';
import Svg, { Path, Circle, Rect, Polygon, Line, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// ── Flame — roasting / intercept ──────────────────────────────────────────────
export function FlameIcon({ size = 24, color = '#E8A030', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 2 9 6 9 10C9 11.1 9.4 12.1 10 12.8C8.3 12.2 7 10.5 7 8.5C5.1 10.2 4 12.5 4 15C4 18.9 7.6 22 12 22C16.4 22 20 18.9 20 15C20 10.5 16 6 12 2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 22C13.9 22 15.5 20.7 15.5 19C15.5 17.3 14 16 12 14C10 16 8.5 17.3 8.5 19C8.5 20.7 10.1 22 12 22Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Shield — protection / saved ───────────────────────────────────────────────
export function ShieldIcon({ size = 24, color = '#1B3557', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L4 5.5V11C4 15.4 7.4 19.6 12 21C16.6 19.6 20 15.4 20 11V5.5L12 2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 12L11 14L15 10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Wallet — spending / budget ────────────────────────────────────────────────
export function WalletIcon({ size = 24, color = '#1B3557', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="14" rx="3" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M2 10H22" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M6 6V5C6 3.9 6.9 3 8 3H16C17.1 3 18 3.9 18 5V6" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="17" cy="15" r="1.5" fill={color} />
    </Svg>
  );
}

// ── Clock / Timer — waiting list ──────────────────────────────────────────────
export function ClockIcon({ size = 24, color = '#1B3557', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M12 7V12L15 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M12 3V2M21 12H22M12 21V22M3 12H2" stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" />
    </Svg>
  );
}

// ── Chart / Insights ──────────────────────────────────────────────────────────
export function ChartIcon({ size = 24, color = '#1B3557', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="12" width="4" height="9" rx="1" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="10" y="7" width="4" height="14" rx="1" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="17" y="3" width="4" height="18" rx="1" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M2 21H22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

// ── Users / Squad ─────────────────────────────────────────────────────────────
export function SquadIcon({ size = 24, color = '#1B3557', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="3" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M3 20C3 17.2 5.7 15 9 15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx="17" cy="7" r="3" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M15 15C18.3 15 21 17.2 21 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M9 15H15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

// ── User / Profile ────────────────────────────────────────────────────────────
export function UserIcon({ size = 24, color = '#1B3557', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M4 20C4 16.7 7.6 14 12 14C16.4 14 20 16.7 20 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────
export function HomeIcon({ size = 24, color = '#1B3557', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 10.5L12 3L21 10.5V20C21 20.6 20.6 21 20 21H15V15H9V21H4C3.4 21 3 20.6 3 20V10.5Z"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Bell / Notification ───────────────────────────────────────────────────────
export function BellIcon({ size = 24, color = '#1B3557', strokeWidth = 1.8, hasAlert = false }: IconProps & { hasAlert?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 10C6 7 8.7 4.5 12 4.5C15.3 4.5 18 7 18 10V16H6V10Z"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 16H20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M10 16V17C10 18.1 10.9 19 12 19C13.1 19 14 18.1 14 17V16"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M12 4.5V3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      {hasAlert && <Circle cx="18" cy="6" r="3" fill="#E8A030" />}
    </Svg>
  );
}

// ── Plus / Add ────────────────────────────────────────────────────────────────
export function PlusIcon({ size = 24, color = '#fff', strokeWidth = 2.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5V19M5 12H19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

// ── Pause / Hold ──────────────────────────────────────────────────────────────
export function PauseIcon({ size = 24, color = '#1B3557', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="4" width="4" height="16" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="14" y="4" width="4" height="16" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

// ── Check / Success ───────────────────────────────────────────────────────────
export function CheckIcon({ size = 24, color = '#2E7A4F', strokeWidth = 2.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12L10 17L19 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Arrow Right ───────────────────────────────────────────────────────────────
export function ArrowRightIcon({ size = 20, color = '#1B3557', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12H19M13 6L19 12L13 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Mecha Corner Mark — decorative ────────────────────────────────────────────
export function CornerMark({ size = 12, color = 'rgba(255,255,255,0.2)', position = 'tl' }: { size?: number; color?: string; position?: 'tl' | 'tr' | 'bl' | 'br' }) {
  const isRight = position === 'tr' || position === 'br';
  const isBottom = position === 'bl' || position === 'br';
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {!isRight && !isBottom && <><Path d={`M0 ${size} L0 0 L${size} 0`} stroke={color} strokeWidth="1.5" /></>}
      {isRight && !isBottom && <><Path d={`M${size} ${size} L${size} 0 L0 0`} stroke={color} strokeWidth="1.5" /></>}
      {!isRight && isBottom && <><Path d={`M0 0 L0 ${size} L${size} ${size}`} stroke={color} strokeWidth="1.5" /></>}
      {isRight && isBottom && <><Path d={`M${size} 0 L${size} ${size} L0 ${size}`} stroke={color} strokeWidth="1.5" /></>}
    </Svg>
  );
}
