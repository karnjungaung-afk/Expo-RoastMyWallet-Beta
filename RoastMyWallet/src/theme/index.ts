import { useColorScheme } from 'react-native';
import { lightColors, darkColors, typography, spacing, radius, shadows, zIndex, layout, animation } from './tokens';

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof lightColors;

export interface Theme {
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  zIndex: typeof zIndex;
  layout: typeof layout;
  animation: typeof animation;
  isDark: boolean;
}

export function buildTheme(scheme: ColorScheme): Theme {
  return {
    colors: scheme === 'dark' ? darkColors : lightColors,
    typography,
    spacing,
    radius,
    shadows,
    zIndex,
    layout,
    animation,
    isDark: scheme === 'dark',
  };
}

export const lightTheme = buildTheme('light');
export const darkTheme = buildTheme('dark');

export { lightColors, darkColors, typography, spacing, radius, shadows, zIndex, layout, animation };
export { palette } from './tokens';
