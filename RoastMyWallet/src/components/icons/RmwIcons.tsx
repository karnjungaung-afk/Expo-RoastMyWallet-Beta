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
export function ShieldIcon({ size = 24, color = '#1E3A8A', strokeWidth = 1.8 }: IconProps) {
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
export function WalletIcon({ size = 24, color = '#1E3A8A', strokeWidth = 1.8 }: IconProps) {
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
export function ClockIcon({ size = 24, color = '#1E3A8A', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M12 7V12L15 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M12 3V2M21 12H22M12 21V22M3 12H2" stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" />
    </Svg>
  );
}

// ── Chart / Insights ──────────────────────────────────────────────────────────
export function ChartIcon({ size = 24, color = '#1E3A8A', strokeWidth = 1.8 }: IconProps) {
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
export function SquadIcon({ size = 24, color = '#1E3A8A', strokeWidth = 1.8 }: IconProps) {
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
export function UserIcon({ size = 24, color = '#1E3A8A', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M4 20C4 16.7 7.6 14 12 14C16.4 14 20 16.7 20 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────
export function HomeIcon({ size = 24, color = '#1E3A8A', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 10.5L12 3L21 10.5V20C21 20.6 20.6 21 20 21H15V15H9V21H4C3.4 21 3 20.6 3 20V10.5Z"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Bell / Notification ───────────────────────────────────────────────────────
export function BellIcon({ size = 24, color = '#1E3A8A', strokeWidth = 1.8, hasAlert = false }: IconProps & { hasAlert?: boolean }) {
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
export function PauseIcon({ size = 24, color = '#1E3A8A', strokeWidth = 1.8 }: IconProps) {
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
export function ArrowRightIcon({ size = 20, color = '#1E3A8A', strokeWidth = 2 }: IconProps) {
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

// ── Auth / paywall icons ──────────────────────────────────────────────────────
export function MailIcon({ size = 20, color = '#6B7280', strokeWidth = 1.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="3" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M3.5 7.5L12 13L20.5 7.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
export function LockIcon({ size = 20, color = '#6B7280', strokeWidth = 1.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4.5" y="10.5" width="15" height="10" rx="3" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M8 10.5V8C8 5.8 9.8 4 12 4C14.2 4 16 5.8 16 8V10.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx="12" cy="15.5" r="1.3" fill={color} />
    </Svg>
  );
}
export function EyeIcon({ size = 20, color = '#6B7280', strokeWidth = 1.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2.5 12C4.5 8 8 5.5 12 5.5C16 5.5 19.5 8 21.5 12C19.5 16 16 18.5 12 18.5C8 18.5 4.5 16 2.5 12Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}
export function EyeOffIcon({ size = 20, color = '#6B7280', strokeWidth = 1.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 3L21 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M10.6 5.6C11.1 5.5 11.5 5.5 12 5.5C16 5.5 19.5 8 21.5 12C20.7 13.6 19.7 14.9 18.5 15.9M14.1 18.3C13.4 18.4 12.7 18.5 12 18.5C8 18.5 4.5 16 2.5 12C3.3 10.4 4.4 9 5.8 7.9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.9 10C9.4 10.5 9 11.2 9 12C9 13.7 10.3 15 12 15C12.8 15 13.5 14.6 14 14.1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
export function ChevronLeftIcon({ size = 22, color = '#fff', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
export function ChevronRightIcon({ size = 18, color = '#9CA3AF', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5L16 12L9 19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
export function CrownIcon({ size = 24, color = '#F59E0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2.5 18.5L4.5 8.5L9 12.5L12 5L15 12.5L19.5 8.5L21.5 18.5H2.5Z" fill={color} />
      <Rect x="2.5" y="19.5" width="19" height="2" rx="1" fill={color} />
    </Svg>
  );
}
export function LogoutIcon({ size = 20, color = '#DC2626', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10 4H6.5C5.7 4 5 4.7 5 5.5V18.5C5 19.3 5.7 20 6.5 20H10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M14 8L18 12L14 16M18 12H9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 20, color = '#6B7280', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6L18 18M18 6L6 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
export function LinkIcon({ size = 18, color = '#6B7280', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10 14C11.2 15.2 13 15.2 14.2 14L18 10.2C19.2 9 19.2 7.2 18 6C16.8 4.8 15 4.8 13.8 6L12.9 6.9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M14 10C12.8 8.8 11 8.8 9.8 10L6 13.8C4.8 15 4.8 16.8 6 18C7.2 19.2 9 19.2 10.2 18L11.1 17.1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
export function ChevronDownIcon({ size = 18, color = '#6B7280', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 9L12 16L19 9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
