/**
 * RoastMyWallet Design Token System
 *
 * Philosophy:
 * - Warm off-white base with deep navy primary
 * - Mecha texture via thin lines and corner marks, NOT heavy decorations
 * - Color = semantic meaning, not decoration
 * - Typography carries hierarchy, not size alone
 */

// ─── RAW PALETTE ─────────────────────────────────────────────────────────────

export const palette = {
  warmWhite: '#F2F0EB',
  warmGray50: '#ECEAE4',
  warmGray100: '#DEDBD4',
  warmGray200: '#C8C5BD',
  warmGray300: '#A8A59E',
  warmGray400: '#7E7B75',
  warmGray500: '#55524D',
  warmGray600: '#3A3835',
  warmGray700: '#262420',
  warmGray800: '#18191C',
  warmGray900: '#0E0F11',
  navy900: '#0D1F35',
  navy800: '#1B3557',
  navy700: '#22487A',
  navy600: '#2F6293',
  navy500: '#3D7AAD',
  navy400: '#5A96C3',
  navy300: '#88B8D9',
  navy200: '#B5D3EA',
  navy100: '#D8E9F4',
  green800: '#1A4D30',
  green700: '#235E3B',
  green600: '#2E7A4F',
  green500: '#3B9A65',
  green400: '#52B57D',
  green200: '#A8DFC0',
  green100: '#D2F0E0',
  amber800: '#7A3E0A',
  amber700: '#A05315',
  amber600: '#B8721E',
  amber500: '#C98A2A',
  amber400: '#DFA53C',
  amber200: '#F2D494',
  amber100: '#FAF0D0',
  red800: '#5C1A1A',
  red700: '#7A2020',
  red600: '#A33535',
  red500: '#C04444',
  red400: '#D46060',
  red200: '#F0B4B4',
  red100: '#FAE2E2',
  mecha700: '#1E3A52',
  mecha600: '#2A5070',
  mecha500: '#3A6A8F',
  mecha400: '#4D87AE',
  mecha200: '#A0C4DA',
  mecha100: '#D0E5F0',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ─── COLOR OBJECT TYPE ────────────────────────────────────────────────────────
// Defined explicitly so light and dark can have different literal values
// without TypeScript enforcing identical string literals.

export interface ThemeColors {
  background: string;
  backgroundSubtle: string;
  surface: string;
  surfaceRaised: string;
  surfaceOverlay: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textInverse: string;
  textLink: string;
  border: string;
  borderSubtle: string;
  borderStrong: string;
  divider: string;
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primarySubtle: string;
  primaryText: string;
  mecha: string;
  mechaSubtle: string;
  mechaLine: string;
  success: string;
  successSubtle: string;
  successText: string;
  warning: string;
  warningSubtle: string;
  warningText: string;
  danger: string;
  dangerSubtle: string;
  dangerText: string;
  riskHigh: string;
  riskHighSubtle: string;
  riskMedium: string;
  riskMediumSubtle: string;
  riskLow: string;
  riskLowSubtle: string;
  tabActive: string;
  tabInactive: string;
  tabBar: string;
  skeleton: string;
  shimmer: string;
  scrim: string;
  inputBackground: string;
}

// ─── LIGHT COLORS ─────────────────────────────────────────────────────────────

export const lightColors: ThemeColors = {
  background: '#FFF4DC',
  backgroundSubtle: '#FFE9B8',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFDF6',
  surfaceOverlay: 'rgba(255,244,220,0.98)',
  textPrimary: '#14110F',
  textSecondary: '#3B342F',
  textMuted: '#6E645C',
  textDisabled: '#B9AE9F',
  textInverse: '#FFFFFF',
  textLink: '#6B3FE0',
  border: '#14110F',
  borderSubtle: '#14110F',
  borderStrong: '#14110F',
  divider: '#14110F',
  primary: '#FF6B4A',
  primaryHover: '#FF5733',
  primaryActive: '#E84A2B',
  primarySubtle: '#FFD9CE',
  primaryText: '#14110F',
  mecha: '#8B5CF6',
  mechaSubtle: '#E4D6FF',
  mechaLine: '#14110F',
  success: '#2FBF71',
  successSubtle: '#C9F5DC',
  successText: '#0E5A33',
  warning: '#FFC62E',
  warningSubtle: '#FFEFA8',
  warningText: '#6B4700',
  danger: '#FF4D6D',
  dangerSubtle: '#FFD0D9',
  dangerText: '#8A1330',
  riskHigh: '#FF4D6D',
  riskHighSubtle: '#FFD0D9',
  riskMedium: '#FFC62E',
  riskMediumSubtle: '#FFEFA8',
  riskLow: '#2FBF71',
  riskLowSubtle: '#C9F5DC',
  tabActive: '#14110F',
  tabInactive: '#6E645C',
  tabBar: '#FFFFFF',
  skeleton: '#F2E2BD',
  shimmer: '#FFF4DC',
  scrim: 'rgba(20,17,15,0.55)',
  inputBackground: '#FFFFFF',
};

// ─── DARK COLORS ──────────────────────────────────────────────────────────────

export const darkColors: ThemeColors = {
  background: '#1B1530',
  backgroundSubtle: '#241C40',
  surface: '#2A2148',
  surfaceRaised: '#33295A',
  surfaceOverlay: 'rgba(27,21,48,0.98)',
  textPrimary: '#FFF8E8',
  textSecondary: '#E0D6F5',
  textMuted: '#A99BCB',
  textDisabled: '#6A5E8A',
  textInverse: '#14110F',
  textLink: '#C7B0FF',
  border: '#FFF8E8',
  borderSubtle: '#6A5E8A',
  borderStrong: '#FFF8E8',
  divider: '#4A3F72',
  primary: '#FF7A5C',
  primaryHover: '#FF8E74',
  primaryActive: '#E8603F',
  primarySubtle: '#5A2F3A',
  primaryText: '#14110F',
  mecha: '#B79BFF',
  mechaSubtle: '#42347A',
  mechaLine: '#FFF8E8',
  success: '#5BE39A',
  successSubtle: '#1F5A43',
  successText: '#A8F2C8',
  warning: '#FFD54F',
  warningSubtle: '#5C4A1C',
  warningText: '#FFE69A',
  danger: '#FF6F8A',
  dangerSubtle: '#5E2B3F',
  dangerText: '#FFB3C2',
  riskHigh: '#FF6F8A',
  riskHighSubtle: '#5E2B3F',
  riskMedium: '#FFD54F',
  riskMediumSubtle: '#5C4A1C',
  riskLow: '#5BE39A',
  riskLowSubtle: '#1F5A43',
  tabActive: '#FFF8E8',
  tabInactive: '#A99BCB',
  tabBar: '#2A2148',
  skeleton: '#33295A',
  shimmer: '#42347A',
  scrim: 'rgba(0,0,0,0.7)',
  inputBackground: '#241C40',
};

// ─── TYPOGRAPHY ───────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    sans: 'Prompt_500Medium' as string | undefined,
    sansBold: 'Prompt_700Bold',
    sansBlack: 'Prompt_800ExtraBold',
    mono: 'Prompt_500Medium',
  },
  size: {
    '2xs': 10, xs: 11, sm: 12, base: 14, md: 16,
    lg: 18, xl: 22, '2xl': 28, '3xl': 36, '4xl': 48,
  },
  weight: {
    regular: '400' as const, medium: '500' as const,
    semibold: '600' as const, bold: '700' as const,
  },
  lineHeight: { tight: 1.2, snug: 1.35, normal: 1.5, relaxed: 1.65 },
  tracking: { tight: -0.5, normal: 0, wide: 0.3, wider: 0.6, widest: 1.0 },
} as const;

// ─── SPACING ─────────────────────────────────────────────────────────────────

export const spacing = {
  0: 0, 0.5: 2, 1: 4, 1.5: 6, 2: 8, 2.5: 10, 3: 12, 3.5: 14,
  4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40,
  11: 44, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96,
} as const;

// ─── BORDER RADIUS ────────────────────────────────────────────────────────────

export const radius = {
  none: 0, xs: 6, sm: 10, md: 14, lg: 18, xl: 24, '2xl': 30, full: 9999,
} as const;

// ─── SHADOWS ─────────────────────────────────────────────────────────────────

export const shadows = {
  none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  subtle: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
} as const;

// ─── NEOBRUTALISM ────────────────────────────────────────────────────────────
// Thick ink borders + hard offset shadows (no blur). `boxShadow` is supported
// by the New Architecture on iOS / Android / web.

export const neo = {
  borderWidth: 2.5,
  borderWidthThin: 2,
  shadowOffset: 4,
  shadowOffsetSm: 3,
  shadowOffsetLg: 6,
} as const;

export const candy = {
  lime: '#D6F73C',
  yellow: '#FFC62E',
  orange: '#FF9F43',
  coral: '#FF6B4A',
  pink: '#FF9ECF',
  purple: '#8B5CF6',
  lilac: '#C9B6FF',
  sky: '#7CD4FF',
  mint: '#7AE8B5',
  cream: '#FFF4DC',
  ink: '#14110F',
} as const;

/** Hard offset shadow, e.g. neoShadow('#14110F', 4) */
export function neoShadow(color: string, offset: number = neo.shadowOffset) {
  return { boxShadow: `${offset}px ${offset}px 0px 0px ${color}` } as const;
}

export const zIndex = { base: 0, raised: 1, dropdown: 10, sticky: 20, overlay: 30, modal: 40, toast: 50 } as const;

export const layout = {
  contentMaxWidth: 520, sidebarWidth: 248,
  tabBarHeight: 64, headerHeight: 56, touchTargetMin: 44,
  screenPaddingH: spacing[6], screenPaddingV: spacing[6],
  cardPadding: spacing[5], cardGap: spacing[4],
} as const;

export const animation = {
  duration: { instant: 100, fast: 150, normal: 250, slow: 350, lazy: 500 },
  easing: {
    easeOut: [0.0, 0.0, 0.2, 1.0] as [number, number, number, number],
    easeInOut: [0.4, 0.0, 0.2, 1.0] as [number, number, number, number],
    spring: { damping: 20, stiffness: 180 },
  },
} as const;
