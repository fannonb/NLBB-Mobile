import { useEffect } from 'react';
import { loadThemePreference, saveThemePreference } from '../lib/themePreference';
import { useAppStore } from '../store/appStore';
import { applyThemeMode } from '../constants/theme';

export const useInitializeTheme = () => {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  useEffect(() => {
    const initTheme = async () => {
      try {
        const savedTheme = await loadThemePreference();
        setTheme(savedTheme);
        applyThemeMode(savedTheme);
      } catch {
        applyThemeMode('light');
      }
    };

    initTheme();
  }, []);

  useEffect(() => {
    applyThemeMode(theme);
    saveThemePreference(theme).catch(() => {});
  }, [theme]);
};
