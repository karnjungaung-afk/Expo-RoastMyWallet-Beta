import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, type TouchableOpacityProps, type ViewStyle, type TextStyle } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useTheme } from '@/hooks/useTheme';
import { spacing, radius, typography, neo, neoShadow, candy } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
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

  const ink = theme.isDark ? candy.cream : candy.ink;
  const hard = { borderWidth: neo.borderWidth, borderColor: ink, ...neoShadow(ink, neo.shadowOffsetSm) };

  const variantStyles: Record<Variant, { container: ViewStyle; label: TextStyle }> = {
    primary: {
      container: { backgroundColor: candy.lime, ...hard },
      label: { color: candy.ink },
    },
    secondary: {
      container: { backgroundColor: colors.surface, ...hard },
      label: { color: colors.textPrimary },
    },
    outline: {
      container: { backgroundColor: candy.yellow, ...hard },
      label: { color: candy.ink },
    },
    ghost: {
      container: { backgroundColor: 'transparent', borderWidth: 0 },
      label: { color: colors.textPrimary, textDecorationLine: 'underline' },
    },
    danger: {
      container: { backgroundColor: candy.coral, ...hard },
      label: { color: candy.ink },
    },
  };

  // ── Size styles ────────────────────────────────────────────────────────────

  const sizeStyles: Record<Size, { container: ViewStyle; label: TextStyle }> = {
    sm: {
      container: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1.5],
        borderRadius: radius.md,
        minHeight: 36,
      },
      label: {
        fontSize: typography.size.sm,
        fontFamily: typography.fontFamily.sansBold,
        letterSpacing: typography.tracking.wide,
      },
    },
    md: {
      container: {
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[3],
        borderRadius: radius.md,
        minHeight: 48,
      },
      label: {
        fontSize: typography.size.base,
        fontFamily: typography.fontFamily.sansBold,
        letterSpacing: typography.tracking.normal,
      },
    },
    lg: {
      container: {
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[4],
        borderRadius: radius.lg,
        minHeight: 56,
      },
      label: {
        fontSize: typography.size.md,
        fontFamily: typography.fontFamily.sansBold,
      },
    },
  };

  const vs = variantStyles[variant];
  const ss = sizeStyles[size];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
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
