import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';

interface MetricCardProps {
  icon: string;
  value: string;
  label: string;
  trend?: string;
  trendUp?: boolean;
}

function createMetricStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: p.border,
      ...s.card,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: p.cardInner,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trendBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
    },
    trendText: {
      fontSize: 10,
      fontFamily: Fonts.sansMedium,
    },
    value: {
      color: p.textPrimary,
      fontFamily: Fonts.serif,
      fontSize: 26,
      marginBottom: 4,
    },
    label: {
      color: p.textSecondary,
      fontSize: 11,
      fontFamily: Fonts.sans,
    },
  });
}

export default function MetricCard({ icon, value, label, trend, trendUp = true }: MetricCardProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createMetricStyles(palette, shadow), [palette, shadow]);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Feather name={icon as any} size={14} color={palette.gold} />
        </View>
        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: trendUp ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }]}>
            <Feather name={trendUp ? 'trending-up' : 'trending-down'} size={10} color={trendUp ? palette.success : palette.error} />
            <Text style={[styles.trendText, { color: trendUp ? palette.success : palette.error }]}>{trend}</Text>
          </View>
        )}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
