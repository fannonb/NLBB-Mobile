import { useEffect } from 'react';
import { saveThemePreference } from '../lib/themePreference';
import { useAppStore } from '../store/appStore';
import { applyThemeMode } from '../constants/theme';

export const useInitializeTheme = () => {
  const theme = useAppStore((state) => state.theme);
  useEffect(() => {
    applyThemeMode(theme);
    void saveThemePreference(theme);
  }, [theme]);
};
