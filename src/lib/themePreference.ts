import { safeStorage } from './safeStorage';
import { applyThemeMode, ThemeMode } from '../constants/theme';

const THEME_PREFERENCE_KEY = 'nlbb_theme_mode_v1';

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'light' || value === 'dark';

export const loadThemePreference = async (): Promise<ThemeMode> => {
  return 'light';
};

export const saveThemePreference = async (mode: ThemeMode) => {
  try {
    await safeStorage.setItem(THEME_PREFERENCE_KEY, 'light');
  } catch {
    // Ignore write errors
  }
};

export const applyAndSaveThemePreference = async (mode: ThemeMode) => {
  applyThemeMode('light');
  await saveThemePreference('light');
};
