import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

function createEmptyStateStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: p.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: p.border,
      ...s.soft,
    },
    title: {
      color: p.textPrimary,
      fontFamily: Fonts.serifMedium,
      fontSize: 20,
      marginBottom: 8,
      textAlign: 'center',
    },
    message: {
      color: p.textMuted,
      fontFamily: Fonts.sans,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
    },
    cta: {
      marginTop: 24,
      backgroundColor: p.gold,
      borderRadius: Radius.md,
      paddingHorizontal: 28,
      paddingVertical: 12,
      ...s.gold,
    },
    ctaText: {
      color: p.bg,
      fontFamily: Fonts.sansBold,
      fontSize: 14,
    },
  });
}

export default function EmptyState({ icon, title, message, ctaLabel, onCta }: EmptyStateProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createEmptyStateStyles(palette, shadow), [palette, shadow]);

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Feather name={icon} size={32} color={palette.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {ctaLabel && onCta && (
        <TouchableOpacity style={styles.cta} onPress={onCta} activeOpacity={0.85}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
