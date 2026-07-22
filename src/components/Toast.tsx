import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius } from '../constants/theme';
import { useThemedColors } from '../hooks/useThemedColors';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onHide: () => void;
  duration?: number;
}

function toastConfig(
  type: ToastType,
  p: ColorPalette
): {
  color: string;
  bg: string;
  border: string;
  icon: React.ComponentProps<typeof Feather>['name'];
} {
  switch (type) {
    case 'success':
      return {
        color: '#166534',
        bg: '#ECFDF5',
        border: '#86EFAC',
        icon: 'check-circle',
      };
    case 'error':
      return {
        color: '#991B1B',
        bg: '#FEF2F2',
        border: '#FECACA',
        icon: 'x-circle',
      };
    default:
      return {
        color: p.textPrimary,
        bg: p.card,
        border: p.goldBorder,
        icon: 'info',
      };
  }
}

function createToastStyles(p: ColorPalette) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 20,
      right: 20,
      zIndex: 9999,
      elevation: 12,
      alignItems: 'center',
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: Radius.lg,
      borderWidth: 1.5,
      // Solid fill — avoid translucent overlays that look faint / show lines through text
      backgroundColor: p.card,
    },
    accent: {
      width: 4,
      alignSelf: 'stretch',
      borderRadius: 2,
      marginRight: 2,
    },
    text: {
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      lineHeight: 20,
      flex: 1,
      fontWeight: '600',
    },
  });
}

export default function Toast({ visible, message, type = 'success', onHide, duration = 2500 }: ToastProps) {
  const palette = useThemedColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createToastStyles(palette), [palette]);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 220, useNativeDriver: true }),
      ]).start(() => onHide());
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onHide, opacity, translateY]);

  if (!visible) return null;

  const cfg = toastConfig(type, palette);
  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 12, opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.toast, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
        <View style={[styles.accent, { backgroundColor: cfg.color }]} />
        <Feather name={cfg.icon} size={18} color={cfg.color} />
        <Text style={[styles.text, { color: cfg.color }]}>{message}</Text>
      </View>
    </Animated.View>
  );
}
