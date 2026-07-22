import React, { useMemo, useState } from 'react';
import { TextInput, TouchableOpacity, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';
import InputFocusWrap from './InputFocusWrap';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  filterActive?: boolean;
}

function createSearchBarStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: p.cardInner,
      borderRadius: Radius.full,
      height: 52,
      paddingHorizontal: 16,
      gap: 12,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    input: {
      flex: 1,
      minWidth: 0,
      alignSelf: 'stretch',
      color: p.textPrimary,
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      padding: 0,
    },
    filterBtn: {
      backgroundColor: p.card,
      borderRadius: Radius.full,
      padding: 8,
      borderWidth: 1,
      borderColor: p.borderLight,
    },
    filterDot: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: p.gold,
      borderWidth: 1,
      borderColor: p.card,
    },
  });
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Find salons, barbers, spas...',
  onFilterPress,
  filterActive = false,
}: SearchBarProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createSearchBarStyles(palette, shadow), [palette, shadow]);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <InputFocusWrap style={[styles.container, isFocused && { borderColor: palette.gold }]}>
      <Feather name="search" size={18} color={isFocused ? palette.gold : palette.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={palette.textMuted}
        style={styles.input}
      />
      {onFilterPress && (
        <TouchableOpacity style={styles.filterBtn} onPress={onFilterPress} activeOpacity={0.7}>
          <Feather name="sliders" size={16} color={palette.textPrimary} />
          {filterActive && <View style={styles.filterDot} />}
        </TouchableOpacity>
      )}
    </InputFocusWrap>
  );
}