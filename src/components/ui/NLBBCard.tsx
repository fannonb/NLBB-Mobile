import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ColorPalette, Radius, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';

interface NLBBCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  inner?: boolean;
  elevated?: boolean;
}

function createCardStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: p.cardInner,
      borderRadius: Radius.xl,
      padding: 24,
      borderWidth: 1,
      borderColor: p.borderLight,
    },
    elevated: {
      ...s.card,
    },
    inner: {
      backgroundColor: p.bg,
      borderRadius: Radius.lg,
    },
  });
}

export default function NLBBCard({
  children,
  style,
  inner = false,
  elevated = true,
}: NLBBCardProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createCardStyles(palette, shadow), [palette, shadow]);

  return (
    <View style={[styles.card, elevated && styles.elevated, inner && styles.inner, style]}>
      {children}
    </View>
  );
}
