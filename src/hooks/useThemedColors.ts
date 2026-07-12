import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { getThemeColors, getThemeShadows } from '../constants/theme';

/** Reactive palette from Zustand theme — use with useMemo(() => StyleSheet.create(...), [palette]) */
export const useThemedColors = () => {
  const theme = useAppStore((state) => state.theme);
  return useMemo(() => getThemeColors(theme), [theme]);
};

/** Reactive shadow tokens from Zustand theme */
export const useThemedShadows = () => {
  const theme = useAppStore((state) => state.theme);
  return useMemo(() => getThemeShadows(theme), [theme]);
};

/** Alias for clarity in new code */
export const useThemePalette = useThemedColors;
