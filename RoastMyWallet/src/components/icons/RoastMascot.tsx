/**
 * RoastMascot — "Wally", a cartoon wallet with a flame on its head.
 * Neobrutalist: thick ink outlines, hard offset shadow, candy fills.
 * Pure vector art (no emoji, no image assets).
 */
import React from 'react';
import Svg, { Path, Rect, Circle, G, Ellipse } from 'react-native-svg';

interface RoastMascotProps {
  size?: number;
  mode?: 'roasting' | 'success' | 'neutral';
}

const INK = '#14110F';

export function RoastMascot({ size = 120, mode = 'roasting' }: RoastMascotProps) {
  const bodyFill = mode === 'success' ? '#7AE8B5' : mode === 'roasting' ? '#FF6B4A' : '#FFC62E';
  const flapFill = mode === 'success' ? '#2FBF71' : mode === 'roasting' ? '#FF9F43' : '#FF9F43';
  const flame = mode === 'success' ? '#7CD4FF' : '#FFC62E';
  const SW = 4;

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {/* hard shadow */}
      <Rect x={20} y={42} width={84} height={66} rx={18} fill={INK} />

      {/* flame hair */}
      <G>
        <Path
          d="M60 6 C66 16 74 18 70 30 L84 26 C82 34 80 38 76 42 L44 42 C40 38 36 32 38 24 L50 30 C46 20 54 14 60 6 Z"
          fill={flame} stroke={INK} strokeWidth={SW} strokeLinejoin="round"
        />
        <Path d="M60 22 C63 27 66 29 64 36 L56 36 C54 30 58 27 60 22 Z" fill="#FFFFFF" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      </G>

      {/* wallet body */}
      <Rect x={16} y={38} width={84} height={66} rx={18} fill={bodyFill} stroke={INK} strokeWidth={SW} />
      {/* flap */}
      <Path d="M16 56 C16 44 24 38 34 38 L82 38 C92 38 100 44 100 56 Z" fill={flapFill} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {/* clasp coin */}
      <Circle cx={100} cy={78} r={9} fill="#FFC62E" stroke={INK} strokeWidth={3} />
      <Circle cx={100} cy={78} r={3} fill={INK} />

      {/* cheeks */}
      <Ellipse cx={30} cy={84} rx={6} ry={4} fill="#FF9ECF" />
      <Ellipse cx={80} cy={84} rx={6} ry={4} fill="#FF9ECF" />

      {mode === 'roasting' && (
        <G>
          {/* sunglasses */}
          <Rect x={24} y={62} width={26} height={16} rx={6} fill={INK} />
          <Rect x={56} y={62} width={26} height={16} rx={6} fill={INK} />
          <Path d="M50 68 L56 68" stroke={INK} strokeWidth={4} />
          <Path d="M28 66 L34 66" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M60 66 L66 66" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
          {/* smirk + tongue */}
          <Path d="M38 90 C46 98 62 98 70 88" stroke={INK} strokeWidth={3.5} strokeLinecap="round" fill="none" />
          <Path d="M56 95 C56 102 66 102 66 94" fill="#FF4D6D" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        </G>
      )}
      {mode === 'success' && (
        <G>
          <Path d="M28 72 C32 64 42 64 46 72" stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none" />
          <Path d="M58 72 C62 64 72 64 76 72" stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none" />
          <Path d="M38 84 C40 98 66 98 68 84 Z" fill="#FFFFFF" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
        </G>
      )}
      {mode === 'neutral' && (
        <G>
          <Circle cx={38} cy={72} r={5} fill={INK} />
          <Circle cx={68} cy={72} r={5} fill={INK} />
          <Circle cx={39.5} cy={70.5} r={1.6} fill="#FFFFFF" />
          <Circle cx={69.5} cy={70.5} r={1.6} fill="#FFFFFF" />
          <Path d="M44 90 L62 90" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
        </G>
      )}
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
