import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ColorPalette, Fonts } from '../constants/theme';
import { useThemedColors } from '../hooks/useThemedColors';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
  badge?: number;
}

function createSectionHeaderStyles(p: ColorPalette) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 18,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      color: p.textPrimary,
      fontFamily: Fonts.serifMedium,
      fontSize: 20,
      letterSpacing: -0.4,
    },
    badge: {
      backgroundColor: p.gold,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: {
      color: p.bg,
      fontFamily: Fonts.sansBold,
      fontSize: 11,
      fontWeight: '700',
    },
    seeAll: {
      color: p.gold,
      fontFamily: Fonts.sansMedium,
      fontSize: 12,
      letterSpacing: 0.2,
    },
  });
}

export default function SectionHeader({ title, onSeeAll, badge }: SectionHeaderProps) {
  const palette = useThemedColors();
  const styles = useMemo(() => createSectionHeaderStyles(palette), [palette]);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
