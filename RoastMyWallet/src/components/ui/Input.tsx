import React, { forwardRef, useState } from 'react';
import {
  TextInput, View, Text, TouchableOpacity, StyleSheet,
  type TextInputProps, type ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { spacing, radius, typography } from '@/theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, hint, error, required, leftIcon, rightElement, containerStyle, style, ...props }, ref) => {
    const { colors } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const borderColor = error ? colors.danger : isFocused ? colors.primary : colors.border;

    return (
      <View style={[styles.container, containerStyle]}>
        {label != null && (
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
            {required === true && <Text style={[styles.required, { color: colors.danger }]}> *</Text>}
          </View>
        )}

        <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor }]}>
          {leftIcon != null && <View style={styles.leftIcon}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            style={[
              styles.input,
              { color: colors.textPrimary },
              leftIcon != null ? styles.inputWithLeftIcon : undefined,
              rightElement != null ? styles.inputWithRightElement : undefined,
              style,
            ]}
            placeholderTextColor={colors.textMuted}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            accessibilityLabel={label}
            {...props}
          />

          {rightElement != null && <View style={styles.rightElement}>{rightElement}</View>}
        </View>

        {(error != null || hint != null) && (
          <Text style={[styles.helper, { color: error != null ? colors.danger : colors.textMuted }]}>
            {error ?? hint}
          </Text>
        )}
      </View>
    );
  }
);
Input.displayName = 'Input';

// ─── SELECT TRIGGER ───────────────────────────────────────────────────────────

interface SelectTriggerProps {
  label?: string;
  value: string | null;
  placeholder?: string;
  error?: string;
  onPress: () => void;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function SelectTrigger({
  label, value, placeholder = 'Select...', error, onPress, rightIcon, containerStyle,
}: SelectTriggerProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label != null && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}

      <TouchableOpacity
        activeOpacity={0.7} onPress={onPress}
        accessibilityRole="button" accessibilityLabel={label}
        style={[styles.inputWrapper, {
          backgroundColor: colors.inputBackground,
          borderColor: error != null ? colors.danger : colors.border,
        }]}
      >
        <Text
          style={[styles.input, styles.selectText, { color: value != null ? colors.textPrimary : colors.textMuted }]}
          numberOfLines={1}
        >
          {value ?? placeholder}
        </Text>
        {rightIcon != null && <View style={styles.rightElement}>{rightIcon}</View>}
      </TouchableOpacity>

      {error != null && (
        <Text style={[styles.helper, { color: colors.danger }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[1.5] },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  required: { fontSize: typography.size.sm },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: radius.md, minHeight: 48, overflow: 'hidden',
  },
  input: {
    flex: 1, fontSize: typography.size.base, fontWeight: typography.weight.regular,
    paddingHorizontal: spacing[3], paddingVertical: spacing[3], includeFontPadding: false,
  },
  inputWithLeftIcon: { paddingLeft: spacing[1] },
  inputWithRightElement: { paddingRight: spacing[1] },
  selectText: { paddingVertical: spacing[3.5] },
  leftIcon: { paddingLeft: spacing[3] },
  rightElement: { paddingRight: spacing[3] },
  helper: { fontSize: typography.size.xs, fontWeight: typography.weight.regular },
});
