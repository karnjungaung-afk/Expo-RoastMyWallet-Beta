import React from 'react';
import { Text as RNText, StyleSheet, type TextProps } from 'react-native';

/**
 * Drop-in replacement for react-native's <Text>.
 * Applies the app font (Prompt) when no fontFamily is given, so every string
 * — Thai or Latin — renders in the neobrutalist type system.
 */
export function Text({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  const family = flat.fontFamily ?? 'Prompt_500Medium';
  return <RNText {...props} style={[style, { fontFamily: family }]} />;
}
