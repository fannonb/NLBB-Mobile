import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Fonts } from '../constants/theme';
import { getCategoryVisual } from '../constants/categoryVisuals';
import { useThemedColors } from '../hooks/useThemedColors';

interface CategoryTileProps {
  category: { id: string; name: string; slug?: string; icon?: string };
  onPress: () => void;
}

export default function CategoryTile({ category, onPress }: CategoryTileProps) {
  const palette = useThemedColors();
  const visual = getCategoryVisual(category.slug ?? category.name, category.icon);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={styles.wrapper}>
      <View
        style={[
          styles.tile,
          { backgroundColor: visual.bg, borderColor: palette.borderLight },
        ]}
      >
        <View style={[styles.iconBadge, { backgroundColor: palette.card }]}>
          <MaterialCommunityIcons name={visual.icon} size={24} color={visual.color} />
        </View>
        <Text style={[styles.label, { color: palette.textPrimary }]} numberOfLines={1}>
          {category.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  tile: {
    borderRadius: 16,
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontFamily: Fonts.sansBold,
    letterSpacing: 0.2,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
