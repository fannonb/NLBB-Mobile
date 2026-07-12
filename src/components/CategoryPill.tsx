import React, { useMemo, useRef } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Animated, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { getCategoryVisual } from '../constants/categoryVisuals';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';
import { Category } from '../types';

interface CategoryPillProps {
  category: Category;
  isActive?: boolean;
  onPress: () => void;
  variant?: 'circle' | 'chip';
}

function createCategoryPillStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    circleWrapper: {
      alignItems: 'center',
      gap: 8,
    },
    circle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: p.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: p.borderLight,
    },
    circleLabel: {
      color: p.textSecondary,
      fontSize: 12,
      fontFamily: Fonts.sansMedium,
      textAlign: 'center',
      width: 68,
    },
    circleLabelActive: {
      color: p.textPrimary,
      fontFamily: Fonts.sansBold,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: Radius.full,
      backgroundColor: p.card,
      borderWidth: 1,
      borderColor: p.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    chipActive: {
      backgroundColor: p.gold,
      borderColor: p.gold,
      shadowColor: p.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    chipLabel: {
      color: p.textPrimary,
      fontFamily: Fonts.sansMedium,
      fontSize: 12,
    },
    chipLabelActive: {
      color: p.bg,
      fontFamily: Fonts.sansBold,
      fontWeight: '700',
    },
  });
}

export default function CategoryPill({
  category,
  isActive = false,
  onPress,
  variant = 'circle',
}: CategoryPillProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createCategoryPillStyles(palette, shadow), [palette, shadow]);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
      tension: 160,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 160,
      friction: 6,
    }).start();
  };

  const visual = getCategoryVisual(category.slug ?? category.name);

  if (variant === 'chip') {
    const chipIconColor = isActive ? '#FFFFFF' : visual.color;

    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View
          style={[
            styles.chip,
            isActive && styles.chipActive,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <MaterialCommunityIcons name={visual.icon} size={14} color={chipIconColor} />
          <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
            {category.name}
          </Text>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.circleWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.circle, { backgroundColor: isActive ? palette.gold : visual.bg }, isActive && shadow.soft]}>
          <MaterialCommunityIcons name={visual.icon} size={28} color={isActive ? palette.bg : visual.color} />
        </View>
        <Text style={[styles.circleLabel, isActive && styles.circleLabelActive]}>
          {category.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
