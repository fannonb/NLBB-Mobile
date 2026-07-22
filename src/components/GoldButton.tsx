import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';

interface GoldButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

function createGoldButtonStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    btn: {
      backgroundColor: p.gold,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
      minHeight: 52,
      paddingHorizontal: 16,
      ...s.gold,
    },
    label: {
      color: p.bg,
      fontFamily: Fonts.sansBold,
      fontWeight: '700',
      letterSpacing: 0.2,
      textAlign: 'center',
    },
    disabled: {
      opacity: 0.5,
    },
  });
}

export default function GoldButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  size = 'md',
}: GoldButtonProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createGoldButtonStyles(palette, shadow), [palette, shadow]);
  const paddingVertical = size === 'sm' ? 10 : size === 'lg' ? 18 : 14;
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.btn,
        { paddingVertical },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.bg} size="small" />
      ) : (
        <Text
          style={[styles.label, { fontSize }, textStyle]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
