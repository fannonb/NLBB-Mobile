import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeedbackModalHost from '../../components/FeedbackModalHost';
import { ColorPalette, Fonts, Radius, ShadowPalette, ThemeMode, getThemeColors } from '../../constants/theme';
import { useModalManager } from '../../hooks/useModalManager';
import { applyAndSaveThemePreference } from '../../lib/themePreference';
import { useAppStore } from '../../store/appStore';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import { preferencesApi } from '../../lib/api/preferences';

interface ThemePreset {
  id: ThemeMode;
  label: string;
  description: string;
  bgColor: string;
  textColor: string;
  cardColor: string;
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'light',
    label: 'Light',
    description: 'Warm and bright',
    bgColor: getThemeColors('light').bg,
    textColor: getThemeColors('light').textPrimary,
    cardColor: getThemeColors('light').card,
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Low-glare luxury contrast',
    bgColor: getThemeColors('dark').bg,
    textColor: getThemeColors('dark').textPrimary,
    cardColor: getThemeColors('dark').card,
  },
];

function createDarkModeStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: p.card,
      alignItems: 'center',
      justifyContent: 'center',
      ...s.soft,
    },
    heading: { flex: 1, textAlign: 'center', fontFamily: Fonts.serifMedium, fontSize: 18, color: p.textPrimary },
    scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
    section: { marginBottom: 28 },
    sectionTitle: { fontFamily: Fonts.serifMedium, fontSize: 16, color: p.textPrimary, marginBottom: 16 },
    themeGrid: { flexDirection: 'row', gap: 12 },
    themeCard: {
      flex: 1,
      borderRadius: Radius.lg,
      borderWidth: 2,
      borderColor: p.border,
      padding: 12,
      alignItems: 'center',
      ...s.card,
    },
    themeCardSelected: {
      borderColor: p.gold,
      backgroundColor: p.goldDim,
    },
    themePreview: {
      width: 56,
      height: 56,
      borderRadius: Radius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    themePreviewInner: {
      width: 36,
      height: 26,
      borderRadius: Radius.sm,
      borderWidth: 1,
    },
    themeLabel: { fontFamily: Fonts.sansMedium, fontSize: 13, color: p.textPrimary },
    themeLabelActive: { fontFamily: Fonts.sansBold },
    themeDescription: { fontFamily: Fonts.sans, fontSize: 11, color: p.textMuted, marginTop: 4 },
    checkmark: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: p.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: p.goldDim,
      borderRadius: Radius.lg,
      padding: 14,
      gap: 12,
      marginBottom: 28,
    },
    infoContent: { flex: 1 },
    infoTitle: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 12 },
    infoText: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 11, marginTop: 2, lineHeight: 16 },
    preview: { borderRadius: Radius.lg, padding: 16, minHeight: 200 },
    previewCard: { borderRadius: Radius.md, padding: 14, gap: 8 },
    previewHeader: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    previewAvatar: { width: 36, height: 36, borderRadius: 18 },
    previewText: { flex: 1, gap: 6 },
    previewLine: { height: 8, borderRadius: 4 },
    previewLineSm: { height: 6, borderRadius: 3 },
  });
}

export default function DarkModeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createDarkModeStyles(palette, shadow), [palette, shadow]);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(theme);
  const [isApplying, setIsApplying] = useState(false);
  const { modal, showError, hideModal } = useModalManager();

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  useEffect(() => {
    let active = true;

    const loadPreferences = async () => {
      try {
        const preferences = await preferencesApi.getMyPreferences();
        if (!active) {
          return;
        }

        setSelectedTheme(preferences.themeMode);
        if (preferences.themeMode !== theme) {
          setTheme(preferences.themeMode);
          await applyAndSaveThemePreference(preferences.themeMode);
        }
      } catch {
        // Keep local fallback preferences when backend is unavailable.
      }
    };

    void loadPreferences();

    return () => {
      active = false;
    };
  }, []);

  const activePreset = useMemo(
    () => THEME_PRESETS.find((preset) => preset.id === selectedTheme) ?? THEME_PRESETS[0],
    [selectedTheme]
  );

  const applyTheme = async (mode: ThemeMode) => {
    if (isApplying) {
      return;
    }

    setSelectedTheme(mode);
    setTheme(mode);
    setIsApplying(true);

    try {
      await Promise.all([
        applyAndSaveThemePreference(mode),
        preferencesApi.updateMyPreferences({ themeMode: mode }).catch(() => {}),
      ]);
      
      // Theme is now applied immediately via Zustand store updates
      // No need for app reload - all components using useThemedColors() will re-render automatically
      setIsApplying(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save theme preference';
      showError('Theme Save Failed', message);
      setIsApplying(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.heading}>Dark Mode</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Theme</Text>
          <View style={styles.themeGrid}>
            {THEME_PRESETS.map((themePreset) => (
              <TouchableOpacity
                key={themePreset.id}
                style={[
                  styles.themeCard,
                  selectedTheme === themePreset.id && styles.themeCardSelected,
                ]}
                onPress={() => {
                  void applyTheme(themePreset.id);
                }}
                activeOpacity={0.8}
                disabled={isApplying}
              >
                <View
                  style={[
                    styles.themePreview,
                    {
                      backgroundColor: themePreset.bgColor,
                      borderColor: themePreset.textColor,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.themePreviewInner,
                      {
                        backgroundColor: themePreset.cardColor,
                        borderColor: palette.gold,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.themeLabel, selectedTheme === themePreset.id && styles.themeLabelActive]}>
                  {themePreset.label}
                </Text>
                <Text style={styles.themeDescription}>{themePreset.description}</Text>
                {selectedTheme === themePreset.id && (
                  <View style={styles.checkmark}>
                    <Feather name="check" size={14} color={palette.bg} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoBox}>
          <Feather name="info" size={16} color={palette.gold} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Theme Applies Immediately</Text>
            <Text style={styles.infoText}>Only Light and Dark themes are available. Your choice is saved and applied across the app.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View
            style={[
              styles.preview,
              {
                backgroundColor: activePreset.bgColor,
              },
            ]}
          >
            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor: activePreset.cardColor,
                },
              ]}
            >
              <View style={styles.previewHeader}>
                <View
                  style={[
                    styles.previewAvatar,
                    {
                      backgroundColor: activePreset.bgColor,
                    },
                  ]}
                />
                <View style={styles.previewText}>
                  <View
                    style={[
                      styles.previewLine,
                      { backgroundColor: palette.gold },
                    ]}
                  />
                  <View
                    style={[
                      styles.previewLineSm,
                      {
                        backgroundColor: activePreset.bgColor,
                      },
                    ]}
                  />
                </View>
              </View>
              <View
                style={[
                  styles.previewLine,
                  {
                    backgroundColor: activePreset.bgColor,
                  },
                ]}
              />
              <View
                style={[
                  styles.previewLine,
                  {
                    backgroundColor: activePreset.bgColor,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      <FeedbackModalHost modal={modal} onDismiss={hideModal} />
    </View>
  );
}
