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
  background: '#FFF9F1',
  backgroundSubtle: '#FFF0E1',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceOverlay: 'rgba(255,249,241,0.97)',
  textPrimary: '#292321',
  textSecondary: '#6F625D',
  textMuted: '#A99B94',
  textDisabled: '#D8CDC6',
  textInverse: '#FFFFFF',
  textLink: '#7139D5',
  border: '#F0DED1',
  borderSubtle: '#F8EDE4',
  borderStrong: '#E2C6B5',
  divider: '#F3E5DA',
  primary: '#F15B50',
  primaryHover: '#DF493F',
  primaryActive: '#C83C34',
  primarySubtle: '#FFE3DE',
  primaryText: '#FFFFFF',
  mecha: '#7139D5',
  mechaSubtle: '#EEE5FF',
  mechaLine: '#D8C5FF',
  success: '#218B62',
  successSubtle: '#DDF5E8',
  successText: '#176B4A',
  warning: '#D68A13',
  warningSubtle: '#FFF0C9',
  warningText: '#98600A',
  danger: '#D94343',
  dangerSubtle: '#FFE1DF',
  dangerText: '#AD2929',
  riskHigh: '#D94343',
  riskHighSubtle: '#FFE1DF',
  riskMedium: '#D68A13',
  riskMediumSubtle: '#FFF0C9',
  riskLow: '#218B62',
  riskLowSubtle: '#DDF5E8',
  tabActive: '#F15B50',
  tabInactive: '#A99B94',
  tabBar: '#FFFFFF',
  skeleton: '#F1E5DC',
  shimmer: '#FFF8F2',
  scrim: 'rgba(41,35,33,0.48)',
  inputBackground: '#FFFAF6',
};

// ─── DARK COLORS ──────────────────────────────────────────────────────────────

export const darkColors: ThemeColors = {
  background: '#211C24',
  backgroundSubtle: '#2B2330',
  surface: '#342A38',
  surfaceRaised: '#403247',
  surfaceOverlay: 'rgba(33,28,36,0.97)',
  textPrimary: '#FFF8F0',
  textSecondary: '#D3C2D1',
  textMuted: '#A28FA2',
  textDisabled: '#66586A',
  textInverse: '#211C24',
  textLink: '#D6B7FF',
  border: '#514052',
  borderSubtle: '#403247',
  borderStrong: '#70576C',
  divider: '#49394A',
  primary: '#FF786B',
  primaryHover: '#FF8B7F',
  primaryActive: '#E85D52',
  primarySubtle: '#56323A',
  primaryText: '#211C24',
  mecha: '#B78BFF',
  mechaSubtle: '#443456',
  mechaLine: '#624B7A',
  success: '#67D5A0',
  successSubtle: '#254C3B',
  successText: '#9AE7BD',
  warning: '#FFD166',
  warningSubtle: '#594627',
  warningText: '#FFE09A',
  danger: '#FF8580',
  dangerSubtle: '#5A3035',
  dangerText: '#FFB0A8',
  riskHigh: '#FF8580',
  riskHighSubtle: '#5A3035',
  riskMedium: '#FFD166',
  riskMediumSubtle: '#594627',
  riskLow: '#67D5A0',
  riskLowSubtle: '#254C3B',
  tabActive: '#FF786B',
  tabInactive: '#A28FA2',
  tabBar: '#342A38',
  skeleton: '#403247',
  shimmer: '#49394A',
  scrim: 'rgba(0,0,0,0.68)',
  inputBackground: '#2B2330',
};

// ─── TYPOGRAPHY ───────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: { sans: undefined as string | undefined, mono: 'Courier New' },
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
  none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 26, full: 9999,
} as const;

// ─── SHADOWS ─────────────────────────────────────────────────────────────────

export const shadows = {
  none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  subtle: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
} as const;

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
