import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { ColorPalette, Fonts, Radius } from '../constants/theme';
import { useThemedColors } from '../hooks/useThemedColors';

interface OutlineButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  danger?: boolean;
}

function createOutlineStyles(p: ColorPalette) {
  return StyleSheet.create({
    btn: {
      borderWidth: 1,
      borderColor: p.gold,
      borderRadius: Radius.md,
      paddingVertical: 14,
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    label: {
      color: p.gold,
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      fontWeight: '500',
    },
    danger: {
      borderColor: p.error,
    },
    dangerText: {
      color: p.error,
    },
  });
}

export default function OutlineButton({ label, onPress, style, danger = false }: OutlineButtonProps) {
  const palette = useThemedColors();
  const styles = useMemo(() => createOutlineStyles(palette), [palette]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.btn, danger && styles.danger, style]}
    >
      <Text style={[styles.label, danger && styles.dangerText]}>{label}</Text>
    </TouchableOpacity>
  );
}
