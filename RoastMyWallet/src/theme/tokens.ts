/**
 * RoastMyWallet Design Token System
 *
 * Visual language ("Playful Block"):
 * - Warm cream canvas, near-black ink for primary actions and navigation
 * - Saturated colour-block cards (purple / green / yellow / orange / pink / blue)
 * - Very round shapes: 28px cards, pill buttons, floating pill tab bar
 * - Big, heavy numbers and headings carry the hierarchy
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
  /** Brand coral. Use for emphasis (roast, warnings-in-brand), not for buttons. */
  accent: string;
  accentSubtle: string;
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
  tabBarActiveBg: string;
  tabBarActiveIcon: string;
  tabBarIdleIcon: string;
  skeleton: string;
  shimmer: string;
  scrim: string;
  inputBackground: string;
  // Colour blocks (card fills). Always pair with the matching `onBlock*` text colour.
  blockPurple: string;
  blockGreen: string;
  blockYellow: string;
  blockOrange: string;
  blockBlue: string;
  blockPink: string;
  blockSky: string;
  onBlockDark: string;   // text on purple / green / orange / blue
  onBlockLight: string;  // text on yellow / pink / sky
}

// ─── LIGHT COLORS ─────────────────────────────────────────────────────────────

export const lightColors: ThemeColors = {
  background: '#F5EDE0',
  backgroundSubtle: '#EDE3D1',
  surface: '#FFFCF6',
  surfaceRaised: '#FFFFFF',
  surfaceOverlay: 'rgba(245,237,224,0.97)',
  textPrimary: '#16130F',
  textSecondary: '#5E5649',
  textMuted: '#9A9082',
  textDisabled: '#CFC6B8',
  textInverse: '#FFFBF3',
  textLink: '#6F4FD0',
  border: '#E6DAC6',
  borderSubtle: '#EFE5D4',
  borderStrong: '#CFC0A6',
  divider: '#E9DECB',
  primary: '#16130F',
  primaryHover: '#2A251F',
  primaryActive: '#000000',
  primarySubtle: '#FFEDB8',
  primaryText: '#FFFBF3',
  accent: '#F15B50',
  accentSubtle: '#FFE0DA',
  mecha: '#7C62D8',
  mechaSubtle: '#E9E1FB',
  mechaLine: '#CFC0F2',
  success: '#2F8A5F',
  successSubtle: '#DCF2E4',
  successText: '#1E6B47',
  warning: '#D68A13',
  warningSubtle: '#FFF0C9',
  warningText: '#98600A',
  danger: '#D94343',
  dangerSubtle: '#FFE1DF',
  dangerText: '#AD2929',
  riskHigh: '#E5484D',
  riskHighSubtle: '#FFE1DF',
  riskMedium: '#E39A1B',
  riskMediumSubtle: '#FFF0C9',
  riskLow: '#2F8A5F',
  riskLowSubtle: '#DCF2E4',
  tabActive: '#16130F',
  tabInactive: '#9A9082',
  tabBar: '#16130F',
  tabBarActiveBg: '#FFFBF3',
  tabBarActiveIcon: '#16130F',
  tabBarIdleIcon: '#FFFBF3',
  skeleton: '#EBE0CC',
  shimmer: '#F8F1E4',
  scrim: 'rgba(22,19,15,0.52)',
  inputBackground: '#FFFCF6',
  blockPurple: '#7C62D8',
  blockGreen: '#3F6B50',
  blockYellow: '#F7C548',
  blockOrange: '#F0603A',
  blockBlue: '#5D6BAA',
  blockPink: '#F6BCD8',
  blockSky: '#9CC3EC',
  onBlockDark: '#FFFBF3',
  onBlockLight: '#16130F',
};

// ─── DARK COLORS ──────────────────────────────────────────────────────────────

export const darkColors: ThemeColors = {
  background: '#17141A',
  backgroundSubtle: '#1F1B24',
  surface: '#241F2A',
  surfaceRaised: '#2E2836',
  surfaceOverlay: 'rgba(23,20,26,0.97)',
  textPrimary: '#FFF8EE',
  textSecondary: '#D3C7D6',
  textMuted: '#A094A5',
  textDisabled: '#5F5465',
  textInverse: '#17141A',
  textLink: '#CDB8FF',
  border: '#3A3342',
  borderSubtle: '#2E2836',
  borderStrong: '#564C60',
  divider: '#342D3C',
  primary: '#FFF3DC',
  primaryHover: '#FFFFFF',
  primaryActive: '#EBDDBF',
  primarySubtle: '#4A3D1E',
  primaryText: '#17141A',
  accent: '#FF786B',
  accentSubtle: '#56323A',
  mecha: '#A48BF0',
  mechaSubtle: '#3A3053',
  mechaLine: '#54467A',
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
  tabActive: '#FFF3DC',
  tabInactive: '#A094A5',
  tabBar: '#2E2836',
  tabBarActiveBg: '#FFF3DC',
  tabBarActiveIcon: '#17141A',
  tabBarIdleIcon: '#FFF8EE',
  skeleton: '#2E2836',
  shimmer: '#3A3342',
  scrim: 'rgba(0,0,0,0.68)',
  inputBackground: '#1F1B24',
  blockPurple: '#8B73E6',
  blockGreen: '#4C8061',
  blockYellow: '#F2C14E',
  blockOrange: '#F2694A',
  blockBlue: '#6F7DBE',
  blockPink: '#E7A9C9',
  blockSky: '#8DB4DF',
  onBlockDark: '#FFFBF3',
  onBlockLight: '#16130F',
};

// ─── TYPOGRAPHY ───────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: { sans: undefined as string | undefined, mono: 'Courier New' },
  size: {
    '2xs': 10, xs: 11, sm: 12, base: 14, md: 16,
    lg: 18, xl: 22, '2xl': 28, '3xl': 36, '4xl': 48, '5xl': 64,
  },
  weight: {
    regular: '400' as const, medium: '500' as const,
    semibold: '600' as const, bold: '700' as const, black: '900' as const,
  },
  lineHeight: { tight: 1.1, snug: 1.3, normal: 1.5, relaxed: 1.65 },
  tracking: { tighter: -1.2, tight: -0.5, normal: 0, wide: 0.3, wider: 0.6, widest: 1.0 },
} as const;

// ─── SPACING ─────────────────────────────────────────────────────────────────

export const spacing = {
  0: 0, 0.5: 2, 1: 4, 1.5: 6, 2: 8, 2.5: 10, 3: 12, 3.5: 14,
  4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40,
  11: 44, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96,
} as const;

// ─── BORDER RADIUS ────────────────────────────────────────────────────────────

export const radius = {
  none: 0, xs: 6, sm: 12, md: 16, lg: 20, xl: 24, '2xl': 28, '3xl': 36, full: 9999,
} as const;

// ─── SHADOWS ─────────────────────────────────────────────────────────────────
// Warm, soft and low. Depth mostly comes from colour blocks, not shadows.

export const shadows = {
  none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  subtle: { shadowColor: '#6B4E2B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  sm: { shadowColor: '#6B4E2B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  md: { shadowColor: '#6B4E2B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 5 },
  float: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 20, elevation: 10 },
} as const;

export const zIndex = { base: 0, raised: 1, dropdown: 10, sticky: 20, overlay: 30, modal: 40, toast: 50 } as const;

export const layout = {
  contentMaxWidth: 520, sidebarWidth: 248,
  tabBarHeight: 64, headerHeight: 56, touchTargetMin: 44,
  screenPaddingH: spacing[5], screenPaddingV: spacing[6],
  cardPadding: spacing[5], cardGap: spacing[4],
} as const;

export const animation = {
  duration: { instant: 100, fast: 150, normal: 250, slow: 350, lazy: 500 },
  easing: {
    easeOut: [0.0, 0.0, 0.2, 1.0] as [number, number, number, number],
    easeInOut: [0.4, 0.0, 0.2, 1.0] as [number, number, number, number],
    spring: { damping: 18, stiffness: 200 },
  },
} as const;

/** Rotating palette for category / list accents. Order matters: keeps neighbours distinct. */
export function blockPalette(c: ThemeColors) {
  return [
    { bg: c.blockPurple, fg: c.onBlockDark },
    { bg: c.blockYellow, fg: c.onBlockLight },
    { bg: c.blockOrange, fg: c.onBlockDark },
    { bg: c.blockGreen, fg: c.onBlockDark },
    { bg: c.blockPink, fg: c.onBlockLight },
    { bg: c.blockBlue, fg: c.onBlockDark },
    { bg: c.blockSky, fg: c.onBlockLight },
  ] as const;
}
