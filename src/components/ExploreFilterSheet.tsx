import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';

export interface ExploreFilters {
  minRating: number | null;
  maxPrice: number | null;
  maxDistanceKm: number | null;
  openNowOnly: boolean;
}

export const DEFAULT_EXPLORE_FILTERS: ExploreFilters = {
  minRating: null,
  maxPrice: null,
  maxDistanceKm: null,
  openNowOnly: false,
};

export const hasActiveFilters = (filters: ExploreFilters) =>
  filters.minRating !== null ||
  filters.maxPrice !== null ||
  filters.maxDistanceKm !== null ||
  filters.openNowOnly;

const RATING_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Any rating', value: null },
  { label: '4.0+', value: 4.0 },
  { label: '4.5+', value: 4.5 },
  { label: '4.8+', value: 4.8 },
];

const PRICE_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Any price', value: null },
  { label: 'Under Ksh 1,000', value: 1000 },
  { label: 'Under Ksh 2,500', value: 2500 },
  { label: 'Under Ksh 5,000', value: 5000 },
];

const DISTANCE_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Any distance', value: null },
  { label: 'Under 2 km', value: 2 },
  { label: 'Under 5 km', value: 5 },
  { label: 'Under 10 km', value: 10 },
];

interface ExploreFilterSheetProps {
  visible: boolean;
  initialFilters: ExploreFilters;
  onApply: (filters: ExploreFilters) => void;
  onClose: () => void;
}

function createStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: p.overlayDark, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: p.card,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 28,
      maxHeight: '88%',
      ...s.card,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: p.border,
      alignSelf: 'center',
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: { fontFamily: Fonts.serifMedium, fontSize: 20, color: p.textPrimary },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: p.cardInner,
      alignItems: 'center',
      justifyContent: 'center',
    },
    section: { marginBottom: 22 },
    sectionLabel: {
      color: p.textSecondary,
      fontFamily: Fonts.sansMedium,
      fontSize: 13,
      marginBottom: 10,
    },
    optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: Radius.full,
      backgroundColor: p.cardInner,
      borderWidth: 1.5,
      borderColor: p.border,
    },
    chipActive: { backgroundColor: p.gold, borderColor: p.gold },
    chipText: { color: p.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 13 },
    chipTextActive: { color: p.bg, fontFamily: Fonts.sansBold },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    switchLabel: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14 },
    actionsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    resetBtn: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: p.border,
    },
    resetBtnText: { color: p.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 14 },
    applyBtn: {
      flex: 2,
      paddingVertical: 14,
      alignItems: 'center',
      borderRadius: Radius.md,
      backgroundColor: p.gold,
      ...s.gold,
    },
    applyBtnText: { color: p.bg, fontFamily: Fonts.sansBold, fontSize: 14 },
  });
}

export default function ExploreFilterSheet({
  visible,
  initialFilters,
  onApply,
  onClose,
}: ExploreFilterSheetProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = createStyles(palette, shadow);
  const [draft, setDraft] = useState<ExploreFilters>(initialFilters);

  useEffect(() => {
    if (visible) {
      setDraft(initialFilters);
    }
  }, [visible, initialFilters]);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft(DEFAULT_EXPLORE_FILTERS);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Filter providers</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Feather name="x" size={16} color={palette.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Minimum rating</Text>
            <View style={styles.optionsRow}>
              {RATING_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.chip, draft.minRating === opt.value && styles.chipActive]}
                  onPress={() => setDraft((d) => ({ ...d, minRating: opt.value }))}
                >
                  <Text
                    style={[styles.chipText, draft.minRating === opt.value && styles.chipTextActive]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Price</Text>
            <View style={styles.optionsRow}>
              {PRICE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.chip, draft.maxPrice === opt.value && styles.chipActive]}
                  onPress={() => setDraft((d) => ({ ...d, maxPrice: opt.value }))}
                >
                  <Text
                    style={[styles.chipText, draft.maxPrice === opt.value && styles.chipTextActive]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Distance</Text>
            <View style={styles.optionsRow}>
              {DISTANCE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.chip, draft.maxDistanceKm === opt.value && styles.chipActive]}
                  onPress={() => setDraft((d) => ({ ...d, maxDistanceKm: opt.value }))}
                >
                  <Text
                    style={[
                      styles.chipText,
                      draft.maxDistanceKm === opt.value && styles.chipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Open now only</Text>
              <Switch
                value={draft.openNowOnly}
                onValueChange={(value) => setDraft((d) => ({ ...d, openNowOnly: value }))}
                trackColor={{ false: palette.border, true: palette.goldDim }}
                thumbColor={draft.openNowOnly ? palette.gold : palette.textMuted}
              />
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Text style={styles.applyBtnText}>Apply filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
