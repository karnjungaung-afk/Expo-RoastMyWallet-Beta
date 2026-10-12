/**
 * RoastMascot — SVG illustration used in the InterceptRoastModal
 * Anime/mecha-inspired angular flame character
 * No emoji, pure vector art
 */
import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

interface RoastMascotProps {
  size?: number;
  mode?: 'roasting' | 'success' | 'neutral';
}

export function RoastMascot({ size = 120, mode = 'roasting' }: RoastMascotProps) {
  // Colors by mode
  const flame1 = mode === 'success' ? '#00B8D9' : mode === 'roasting' ? '#E8A030' : '#5A96C3';
  const flame2 = mode === 'success' ? '#0088A8' : mode === 'roasting' ? '#C04444' : '#2F6293';
  const body   = '#1B3557';
  const accent = mode === 'roasting' ? '#E8A030' : '#00B8D9';

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Defs>
        <SvgLinearGradient id="flameGrad" x1="60" y1="20" x2="60" y2="80" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={flame1} stopOpacity="1" />
          <Stop offset="1" stopColor={flame2} stopOpacity="0.8" />
        </SvgLinearGradient>
        <SvgLinearGradient id="bodyGrad" x1="40" y1="60" x2="80" y2="110" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#2A4F7C" />
          <Stop offset="1" stopColor={body} />
        </SvgLinearGradient>
      </Defs>

      {/* Shield body — mecha armor */}
      <Path d="M60 20 L85 32 L85 68 C85 82 74 94 60 100 C46 94 35 82 35 68 L35 32 Z"
        fill="url(#bodyGrad)" />

      {/* Armor panels — angular details */}
      <Path d="M60 26 L80 36 L80 38 L60 28 L40 38 L40 36 Z" fill={accent} opacity="0.4" />
      <Path d="M42 50 L50 46 L50 70 L42 70 Z" fill="rgba(255,255,255,0.08)" />
      <Path d="M78 50 L70 46 L70 70 L78 70 Z" fill="rgba(255,255,255,0.08)" />
      <Path d="M55 54 L65 54 L65 56 L55 56 Z" fill={accent} opacity="0.6" />
      <Path d="M52 60 L68 60 L68 62 L52 62 Z" fill={accent} opacity="0.4" />

      {/* Eye visor — horizontal slit like Gundam */}
      <Rect x="46" y="43" width="28" height="7" rx="3.5" fill={accent} opacity="0.9" />
      <Rect x="48" y="44.5" width="10" height="4" rx="2" fill={flame1} opacity="0.7" />
      <Rect x="62" y="44.5" width="10" height="4" rx="2" fill={flame1} opacity="0.7" />

      {/* Flame halo — behind shield, representing "roast energy" */}
      <Path d="M60 18 C54 10 48 14 50 22 C45 16 38 22 44 28 C36 24 35 34 42 35 C35 38 38 46 44 44 C38 50 44 58 50 54 C46 62 55 66 58 60 L60 52 L62 60 C65 66 74 62 70 54 C76 58 82 50 76 44 C82 46 85 38 78 35 C85 34 84 24 76 28 C82 22 75 16 70 22 C72 14 66 10 60 18Z"
        fill="url(#flameGrad)" opacity="0.25" />

      {/* Corner marks — mecha detail */}
      <Path d="M35 28 L35 32 L39 32" stroke={accent} strokeWidth="1.5" opacity="0.6" />
      <Path d="M85 28 L85 32 L81 32" stroke={accent} strokeWidth="1.5" opacity="0.6" />
      <Path d="M35 104 L35 100 L39 100" stroke={accent} strokeWidth="1.5" opacity="0.4" />
      <Path d="M85 104 L85 100 L81 100" stroke={accent} strokeWidth="1.5" opacity="0.4" />

      {/* Chest emblem */}
      <Path d="M60 72 L64 78 L60 82 L56 78 Z" fill={accent} opacity="0.8" />
      <Path d="M60 74 L62.5 78 L60 80.5 L57.5 78 Z" fill="rgba(255,255,255,0.5)" />
    </Svg>
  );
}

// ── Shopping Platform Emblem ───────────────────────────────────────────────────
// Simple SVG for each platform shown in intercept modal
export function ShoppingBagIcon({ size = 32, color = '#E8A030' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect x="5" y="12" width="22" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M11 12V9C11 6.8 13.2 5 16 5C18.8 5 21 6.8 21 9V12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M12 18H20M16 16V20" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}
