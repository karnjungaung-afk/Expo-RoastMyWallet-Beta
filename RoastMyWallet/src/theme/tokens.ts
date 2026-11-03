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
  background: '#EEF2FF',
  backgroundSubtle: '#E4EAFB',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceOverlay: 'rgba(238,242,255,0.95)',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textDisabled: '#D1D5DB',
  textInverse: '#FFFFFF',
  textLink: '#2563EB',
  border: '#E5E7EB',
  borderSubtle: '#F3F4F6',
  borderStrong: '#D1D5DB',
  divider: '#EEF0F4',
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  primaryActive: '#1E40AF',
  primarySubtle: '#DBEAFE',
  primaryText: '#FFFFFF',
  mecha: '#3B82F6',
  mechaSubtle: '#DBEAFE',
  mechaLine: '#BFDBFE',
  success: '#16A34A',
  successSubtle: '#DCFCE7',
  successText: '#15803D',
  warning: '#D97706',
  warningSubtle: '#FEF3C7',
  warningText: '#B45309',
  danger: '#DC2626',
  dangerSubtle: '#FEE2E2',
  dangerText: '#B91C1C',
  riskHigh: '#DC2626',
  riskHighSubtle: '#FEE2E2',
  riskMedium: '#D97706',
  riskMediumSubtle: '#FEF3C7',
  riskLow: '#16A34A',
  riskLowSubtle: '#DCFCE7',
  tabActive: '#2563EB',
  tabInactive: '#9CA3AF',
  tabBar: '#FFFFFF',
  skeleton: '#E5E7EB',
  shimmer: '#F3F4F6',
  scrim: 'rgba(15,31,74,0.5)',
  inputBackground: '#F8FAFF',
};

// ─── DARK COLORS ──────────────────────────────────────────────────────────────

export const darkColors: ThemeColors = {
  background: '#0F172A',
  backgroundSubtle: '#0B1220',
  surface: '#1E293B',
  surfaceRaised: '#293548',
  surfaceOverlay: 'rgba(15,23,42,0.95)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDisabled: '#475569',
  textInverse: '#0F172A',
  textLink: '#60A5FA',
  border: '#293548',
  borderSubtle: '#1E293B',
  borderStrong: '#3B4A63',
  divider: '#223049',
  primary: '#2563EB',
  primaryHover: '#3B82F6',
  primaryActive: '#1D4ED8',
  primarySubtle: '#1E3A8A',
  primaryText: '#FFFFFF',
  mecha: '#60A5FA',
  mechaSubtle: '#172554',
  mechaLine: '#1E3A8A',
  success: '#22C55E',
  successSubtle: '#14532D',
  successText: '#86EFAC',
  warning: '#F59E0B',
  warningSubtle: '#451A03',
  warningText: '#FCD34D',
  danger: '#EF4444',
  dangerSubtle: '#450A0A',
  dangerText: '#FCA5A5',
  riskHigh: '#EF4444',
  riskHighSubtle: '#450A0A',
  riskMedium: '#F59E0B',
  riskMediumSubtle: '#451A03',
  riskLow: '#22C55E',
  riskLowSubtle: '#14532D',
  tabActive: '#60A5FA',
  tabInactive: '#64748B',
  tabBar: '#1E293B',
  skeleton: '#293548',
  shimmer: '#334155',
  scrim: 'rgba(0,0,0,0.65)',
  inputBackground: '#162032',
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
