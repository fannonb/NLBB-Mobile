import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import type { ColorPalette, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from './useThemedColors';

/**
 * Rebuilds a StyleSheet whenever light/dark theme changes.
 * Define `factory` at module scope so it stays stable: `function createStyles(p, s) { return StyleSheet.create({...}); }`
 */
export function useThemedStylesheet<T extends StyleSheet.NamedStyles<T>>(
  factory: (palette: ColorPalette, shadow: ShadowPalette) => T
): T {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  return useMemo(() => StyleSheet.create(factory(palette, shadow)), [palette, shadow, factory]);
}
