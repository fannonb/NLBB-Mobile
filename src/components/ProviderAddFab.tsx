import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ColorPalette, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';
import { useProviderAddStore } from '../store/providerAddStore';

function createFabStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    fab: {
      position: 'absolute',
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: p.gold,
      alignItems: 'center',
      justifyContent: 'center',
      ...s.gold,
    },
  });
}

export default function ProviderAddFab() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createFabStyles(palette, shadow), [palette, shadow]);
  const requestAddService = useProviderAddStore((s) => s.requestAddService);

  const handlePress = () => {
    requestAddService();
    navigation.navigate('ProviderApp', {
      screen: 'Business',
      params: {
        screen: 'Services',
      },
    });
  };

  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: insets.bottom + 72 }]}
      onPress={handlePress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel="Add Service"
    >
      <Feather name="plus" size={26} color={palette.bg} />
    </TouchableOpacity>
  );
}
