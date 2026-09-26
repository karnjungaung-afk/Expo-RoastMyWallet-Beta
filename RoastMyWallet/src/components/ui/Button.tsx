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

  const variantStyles: Record<Variant, { container: ViewStyle; label: TextStyle }> = {
    primary: {
      container: {
        backgroundColor: colors.primary,
        borderWidth: 0,
      },
      label: {
        color: colors.primaryText,
      },
    },
    secondary: {
      container: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      },
      label: {
        color: colors.textPrimary,
      },
    },
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary,
      },
      label: {
        color: colors.primary,
      },
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      label: {
        color: colors.primary,
      },
    },
    danger: {
      container: {
        backgroundColor: colors.danger,
        borderWidth: 0,
      },
      label: {
        color: '#FFFFFF',
      },
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
        fontWeight: typography.weight.medium,
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
        fontWeight: typography.weight.semibold,
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
        fontWeight: typography.weight.semibold,
      },
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
