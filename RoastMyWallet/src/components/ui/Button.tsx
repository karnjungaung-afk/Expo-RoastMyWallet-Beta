import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { spacing, radius, typography } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'accent' | 'soft';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  style,
  labelStyle,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const { colors } = theme;
  const isDisabled = disabled || loading;

  // ── Variant styles ────────────────────────────────────────────────────────

  const variantStyles: Record<Variant, { container: ViewStyle; label: TextStyle }> = {
    // Ink-black pill — the signature action button
    primary: {
      container: { backgroundColor: colors.primary, borderWidth: 0 },
      label: { color: colors.primaryText },
    },
    // Brand coral pill
    accent: {
      container: {
        backgroundColor: colors.accent, borderWidth: 0,
        shadowColor: colors.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 4,
      },
      label: { color: '#FFFFFF' },
    },
    // Cream/white pill with soft outline
    secondary: {
      container: { backgroundColor: colors.surfaceRaised, borderWidth: 1.5, borderColor: colors.border },
      label: { color: colors.textPrimary },
    },
    // Tinted pill, no border (for tertiary actions on cream)
    soft: {
      container: { backgroundColor: colors.backgroundSubtle, borderWidth: 0 },
      label: { color: colors.textPrimary },
    },
    outline: {
      container: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.textPrimary },
      label: { color: colors.textPrimary },
    },
    ghost: {
      container: { backgroundColor: 'transparent', borderWidth: 0 },
      label: { color: colors.textPrimary },
    },
    danger: {
      container: { backgroundColor: colors.danger, borderWidth: 0 },
      label: { color: '#FFFFFF' },
    },
  };

  // ── Size styles ────────────────────────────────────────────────────────────

  const sizeStyles: Record<Size, { container: ViewStyle; label: TextStyle }> = {
    sm: {
      container: { paddingHorizontal: spacing[4], paddingVertical: spacing[1.5], borderRadius: radius.full, minHeight: 36 },
      label: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, letterSpacing: typography.tracking.wide },
    },
    md: {
      container: { paddingHorizontal: spacing[6], paddingVertical: spacing[3], borderRadius: radius.full, minHeight: 50 },
      label: { fontSize: typography.size.base, fontWeight: typography.weight.bold, letterSpacing: typography.tracking.normal },
    },
    lg: {
      container: { paddingHorizontal: spacing[8], paddingVertical: spacing[4], borderRadius: radius.full, minHeight: 58 },
      label: { fontSize: typography.size.md, fontWeight: typography.weight.bold },
    },
  };

  const vs = variantStyles[variant];
  const ss = sizeStyles[size];

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={[
        styles.base,
        vs.container,
        ss.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={vs.label.color as string}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && <>{icon}</>}
          <Text
            style={[
              styles.label,
              vs.label,
              ss.label,
              isDisabled && styles.labelDisabled,
              icon ? (iconPosition === 'left' ? styles.labelWithLeftIcon : styles.labelWithRightIcon) : null,
              labelStyle,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && <>{icon}</>}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    includeFontPadding: false,
  },
  labelDisabled: {
    // Inherited opacity from container
  },
  labelWithLeftIcon: {
    marginLeft: spacing[2],
  },
  labelWithRightIcon: {
    marginRight: spacing[2],
  },
});
