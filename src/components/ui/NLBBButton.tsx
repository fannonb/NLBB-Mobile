import React, { useMemo, useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface NLBBButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

function createButtonStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    base: {
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    primary: {
      backgroundColor: p.gold,
      ...s.gold,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: p.goldBorder,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    label: {
      fontFamily: Fonts.sansBold,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    labelPrimary: {
      color: p.bg,
    },
    labelSecondary: {
      color: p.gold,
    },
    labelGhost: {
      color: p.textSecondary,
    },
    disabled: {
      opacity: 0.5,
    },
  });
}

export default function NLBBButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
}: NLBBButtonProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createButtonStyles(palette, shadow), [palette, shadow]);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const paddingVertical = size === 'sm' ? 10 : size === 'lg' ? 18 : 14;
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;
  const spinnerColor = variant === 'primary' ? palette.bg : palette.gold;

  const variantStyle =
    variant === 'secondary' ? styles.secondary : variant === 'ghost' ? styles.ghost : styles.primary;
  const labelStyle =
    variant === 'secondary'
      ? styles.labelSecondary
      : variant === 'ghost'
        ? styles.labelGhost
        : styles.labelPrimary;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 140,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 140,
      friction: 6,
    }).start();
  };

  const flattenedStyle = style ? StyleSheet.flatten(style) : {};
  const {
    width,
    height,
    alignSelf,
    flex,
    flexGrow,
    flexShrink,
    margin,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    marginHorizontal,
    marginVertical,
    position,
    top,
    right,
    bottom,
    left,
    zIndex,
    ...viewStyle
  } = flattenedStyle;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          width: width || 'auto',
          height: height || 'auto',
          alignSelf: alignSelf,
          flex: flex,
          flexGrow: flexGrow,
          flexShrink: flexShrink,
          margin: margin,
          marginLeft: marginLeft,
          marginRight: marginRight,
          marginTop: marginTop,
          marginBottom: marginBottom,
          marginHorizontal: marginHorizontal,
          marginVertical: marginVertical,
          position: position,
          top: top,
          right: right,
          bottom: bottom,
          left: left,
          zIndex: zIndex,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.base,
          variantStyle,
          { paddingVertical, transform: [{ scale: scaleAnim }] },
          disabled && styles.disabled,
          viewStyle,
          { width: '100%' },
          height ? { height: '100%', paddingVertical: 0 } : null,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={spinnerColor} size="small" />
        ) : (
          <Text style={[styles.label, labelStyle, { fontSize }, textStyle]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}
