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
  background: '#F2F0EB',
  backgroundSubtle: '#EBE9E3',
  surface: '#FFFFFF',
  surfaceRaised: '#FAFAF8',
  surfaceOverlay: 'rgba(242,240,235,0.95)',
  textPrimary: '#18191C',
  textSecondary: '#525660',
  textMuted: '#9CA0A8',
  textDisabled: '#C8C5BD',
  textInverse: '#FFFFFF',
  textLink: '#2F6293',
  border: '#DEDBD4',
  borderSubtle: '#ECEAE4',
  borderStrong: '#C8C5BD',
  divider: '#E8E5DF',
  primary: '#1B3557',
  primaryHover: '#22487A',
  primaryActive: '#0D1F35',
  primarySubtle: '#D8E9F4',
  primaryText: '#FFFFFF',
  mecha: '#2A5070',
  mechaSubtle: '#D0E5F0',
  mechaLine: '#B8CDDB',
  success: '#2E7A4F',
  successSubtle: '#D2F0E0',
  successText: '#1A4D30',
  warning: '#B8721E',
  warningSubtle: '#FAF0D0',
  warningText: '#7A3E0A',
  danger: '#A33535',
  dangerSubtle: '#FAE2E2',
  dangerText: '#5C1A1A',
  riskHigh: '#A33535',
  riskHighSubtle: '#FAE2E2',
  riskMedium: '#B8721E',
  riskMediumSubtle: '#FAF0D0',
  riskLow: '#2E7A4F',
  riskLowSubtle: '#D2F0E0',
  tabActive: '#1B3557',
  tabInactive: '#A8A59E',
  tabBar: '#FFFFFF',
  skeleton: '#E8E5DF',
  shimmer: '#F0EDE7',
  scrim: 'rgba(24,25,28,0.5)',
  inputBackground: '#F5F3EE',
};

// ─── DARK COLORS ──────────────────────────────────────────────────────────────

export const darkColors: ThemeColors = {
  background: '#111318',
  backgroundSubtle: '#0D0F12',
  surface: '#1C2028',
  surfaceRaised: '#222830',
  surfaceOverlay: 'rgba(17,19,24,0.95)',
  textPrimary: '#E6E4DE',
  textSecondary: '#8A8F9B',
  textMuted: '#50555F',
  textDisabled: '#363B44',
  textInverse: '#111318',
  textLink: '#88B8D9',
  border: '#2C3240',
  borderSubtle: '#20252F',
  borderStrong: '#404858',
  divider: '#252B35',
  primary: '#5A96C3',
  primaryHover: '#88B8D9',
  primaryActive: '#3D7AAD',
  primarySubtle: '#1A2A3D',
  primaryText: '#111318',
  mecha: '#4D87AE',
  mechaSubtle: '#1A2D3D',
  mechaLine: '#2A4050',
  success: '#52B57D',
  successSubtle: '#1A3A28',
  successText: '#A8DFC0',
  warning: '#DFA53C',
  warningSubtle: '#3D2A10',
  warningText: '#F2D494',
  danger: '#D46060',
  dangerSubtle: '#3A1A1A',
  dangerText: '#F0B4B4',
  riskHigh: '#D46060',
  riskHighSubtle: '#3A1A1A',
  riskMedium: '#DFA53C',
  riskMediumSubtle: '#3D2A10',
  riskLow: '#52B57D',
  riskLowSubtle: '#1A3A28',
  tabActive: '#88B8D9',
  tabInactive: '#50555F',
  tabBar: '#1C2028',
  skeleton: '#252B35',
  shimmer: '#2C3240',
  scrim: 'rgba(0,0,0,0.65)',
  inputBackground: '#1A2028',
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
  none: 0, xs: 2, sm: 4, md: 8, lg: 12, xl: 16, '2xl': 20, full: 9999,
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
  contentMaxWidth: 420, sidebarWidth: 260,
  tabBarHeight: 64, headerHeight: 56, touchTargetMin: 44,
  screenPaddingH: spacing[4], screenPaddingV: spacing[5],
  cardPadding: spacing[4], cardGap: spacing[3],
} as const;

export const animation = {
  duration: { instant: 100, fast: 150, normal: 250, slow: 350, lazy: 500 },
  easing: {
    easeOut: [0.0, 0.0, 0.2, 1.0] as [number, number, number, number],
    easeInOut: [0.4, 0.0, 0.2, 1.0] as [number, number, number, number],
    spring: { damping: 20, stiffness: 180 },
  },
} as const;
