import React, { forwardRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, type TextInputProps } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useTheme } from '@/hooks/useTheme';
import { EyeIcon, EyeOffIcon } from '@/components/icons/RmwIcons';

interface Props extends TextInputProps {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  /** Adds a show/hide toggle and secures the input. */
  password?: boolean;
}

/** Labelled input with leading icon, optional password toggle, inline error. */
export const AuthField = forwardRef<React.ComponentRef<typeof TextInput>, Props>(
  ({ label, icon, error, password, style, ...rest }, ref) => {
    const { colors } = useTheme();
    const [focused, setFocused] = useState(false);
    const [shown, setShown] = useState(false);
    const border = error ? colors.danger : focused ? colors.primary : colors.border;
    return (
      <View style={{ gap: 6 }}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        <View style={[styles.row, { borderColor: border, backgroundColor: colors.inputBackground }]}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <TextInput
            ref={ref}
            style={[styles.input, { color: colors.textPrimary }, style]}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={password && !shown}
            onFocus={e => { setFocused(true); rest.onFocus?.(e); }}
            onBlur={e => { setFocused(false); rest.onBlur?.(e); }}
            accessibilityLabel={label}
            {...rest}
          />
          {password ? (
            <TouchableOpacity onPress={() => setShown(s => !s)} hitSlop={10} accessibilityRole="button" accessibilityLabel={shown ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} style={styles.eye}>
              {shown ? <EyeOffIcon size={20} color={colors.textMuted} /> : <EyeIcon size={20} color={colors.textMuted} />}
            </TouchableOpacity>
          ) : null}
        </View>
        {error ? <Text style={[styles.error, { color: colors.danger }]} accessibilityLiveRegion="polite">{error}</Text> : null}
      </View>
    );
  },
);
AuthField.displayName = 'AuthField';

const styles = StyleSheet.create({
  label: { fontSize: 13, fontFamily: 'Prompt_600SemiBold' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderWidth: 2.5, borderRadius: 14, paddingHorizontal: 12, gap: 10, boxShadow: '2px 2px 0px 0px #14110F' },
  icon: { width: 22, alignItems: 'center' },
  input: { flex: 1, fontSize: 15, paddingVertical: 12, outlineStyle: 'none' as any },
  eye: { padding: 2 },
  error: { fontSize: 12 },
});
