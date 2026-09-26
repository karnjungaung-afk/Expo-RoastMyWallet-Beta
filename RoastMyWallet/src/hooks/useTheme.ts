import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { buildTheme, type Theme } from '@/theme';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * useTheme
 *
 * Priority order for color scheme:
 * 1. User's explicit theme choice (from profile/settings) — if they pick 'dark_command' → dark
 * 2. System color scheme (light/dark preference)
 *
 * Theme variants that force dark mode: 'dark_command'
 * Theme variants that force light mode: 'cozy_minimal', 'warm_japanese', 'clean_mono'
 * Theme variants that follow system: 'mecha_blue' (but uses navy accent in both modes)
 */
export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const userTheme = useSettingsStore(s => s.theme);

  return useMemo(() => {
    // Map user-selected app theme to dark/light scheme
    let scheme: 'light' | 'dark';

    if (userTheme === 'dark_command') {
      scheme = 'dark';
    } else if (
      userTheme === 'cozy_minimal' ||
      userTheme === 'warm_japanese' ||
      userTheme === 'clean_mono'
    ) {
      scheme = 'light';
    } else {
      // 'mecha_blue' and any unknown → follow system
      scheme = systemScheme === 'dark' ? 'dark' : 'light';
    }

    return buildTheme(scheme);
  }, [systemScheme, userTheme]);
}

export function useColors() {
  return useTheme().colors;
}
