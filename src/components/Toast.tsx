import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onHide: () => void;
  duration?: number;
}

function toastConfig(type: ToastType, p: ColorPalette): { color: string; bg: string; icon: React.ComponentProps<typeof Feather>['name'] } {
  switch (type) {
    case 'success':
      return { color: p.success, bg: 'rgba(22,163,74,0.14)', icon: 'check-circle' };
    case 'error':
      return { color: p.error, bg: 'rgba(220,38,38,0.14)', icon: 'x-circle' };
    default:
      return { color: p.gold, bg: p.goldDim, icon: 'info' };
  }
}

function createToastStyles(_p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      top: 60,
      left: 24,
      right: 24,
      zIndex: 9999,
      alignItems: 'center',
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: Radius.lg,
      borderWidth: 1,
      ...s.card,
    },
    text: {
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      flex: 1,
    },
  });
}

export default function Toast({ visible, message, type = 'success', onHide, duration = 2500 }: ToastProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createToastStyles(palette, shadow), [palette, shadow]);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
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
    }
  }, [visible]);

  if (!visible) return null;

  const cfg = toastConfig(type, palette);
  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <View style={[styles.toast, { backgroundColor: cfg.bg, borderColor: cfg.color + '44' }]}>
        <Feather name={cfg.icon} size={16} color={cfg.color} />
        <Text style={[styles.text, { color: cfg.color }]}>{message}</Text>
      </View>
    </Animated.View>
  );
}
