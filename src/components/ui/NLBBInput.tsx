import React, { useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius } from '../../constants/theme';
import { useThemedColors } from '../../hooks/useThemedColors';

interface NLBBInputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Feather.glyphMap;
  error?: string;
  containerStyle?: ViewStyle;
  rightElement?: React.ReactNode;
  onToggleSecure?: () => void;
  secureVisible?: boolean;
}

function createInputStyles(p: ColorPalette) {
  return StyleSheet.create({
    field: { gap: 6 },
    label: {
      color: p.textSecondary,
      fontFamily: Fonts.sansMedium,
      fontSize: 12,
      marginLeft: 4,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: p.bg,
      borderRadius: Radius.md,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
      borderWidth: 1,
      borderColor: p.borderLight,
    },
    inputWrapError: {
      borderColor: p.error,
    },
    input: {
      flex: 1,
      color: p.textPrimary,
      fontFamily: Fonts.sans,
      fontSize: 14,
      padding: 0,
    },
    error: {
      color: p.error,
      fontFamily: Fonts.sans,
      fontSize: 11,
      marginLeft: 4,
      marginTop: 2,
    },
  });
}

export default function NLBBInput({
  label,
  icon,
  error,
  containerStyle,
  rightElement,
  onToggleSecure,
  secureVisible,
  secureTextEntry,
  style,
  ...inputProps
}: NLBBInputProps) {
  const palette = useThemedColors();
  const styles = useMemo(() => createInputStyles(palette), [palette]);

  const showSecureToggle = secureTextEntry !== undefined && onToggleSecure;

  return (
    <View style={[styles.field, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrap, error ? styles.inputWrapError : null]}>
        {icon ? <Feather name={icon} size={16} color={palette.textSecondary} /> : null}
        <TextInput
          {...inputProps}
          secureTextEntry={secureTextEntry && !secureVisible}
          placeholderTextColor={palette.textMuted}
          style={[styles.input, style]}
        />
        {showSecureToggle ? (
          <TouchableOpacity onPress={onToggleSecure} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather
              name={secureVisible ? 'eye-off' : 'eye'}
              size={16}
              color={palette.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
        {rightElement}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
