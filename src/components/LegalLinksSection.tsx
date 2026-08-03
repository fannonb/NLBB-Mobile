import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';

interface LegalLinksSectionProps {
  navigation: { navigate: (route: string) => void };
  title?: string;
  style?: object;
}

function createStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    section: { marginBottom: 32 },
    sectionTitle: { fontFamily: Fonts.serifMedium, fontSize: 18, color: p.textPrimary, marginBottom: 16 },
    legalCard: {
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: p.border,
      overflow: 'hidden',
      ...s.card,
    },
    legalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    legalRowBorder: {
      borderTopWidth: 1,
      borderTopColor: p.border,
    },
    legalRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    legalRowIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: p.goldDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    legalRowTitle: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14 },
    legalRowText: { color: p.textSecondary, fontSize: 11, marginTop: 2 },
  });
}

export default function LegalLinksSection({
  navigation,
  title = 'Legal',
  style,
}: LegalLinksSectionProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createStyles(palette, shadow), [palette, shadow]);

  const openLegalScreen = (route: 'TermsOfService' | 'PrivacyPolicy') => {
    const parent = (navigation as { getParent?: () => { navigate: (name: string) => void } | undefined })
      .getParent?.();
    if (parent) {
      parent.navigate(route);
      return;
    }
    navigation.navigate(route);
  };

  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.legalCard}>
        <TouchableOpacity
          style={styles.legalRow}
          onPress={() => openLegalScreen('TermsOfService')}
          activeOpacity={0.8}
        >
          <View style={styles.legalRowLeft}>
            <View style={styles.legalRowIcon}>
              <Feather name="file-text" size={16} color={palette.gold} />
            </View>
            <View>
              <Text style={styles.legalRowTitle}>Terms of Service</Text>
              <Text style={styles.legalRowText}>Rules for using NLBB</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={palette.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.legalRow, styles.legalRowBorder]}
          onPress={() => openLegalScreen('PrivacyPolicy')}
          activeOpacity={0.8}
        >
          <View style={styles.legalRowLeft}>
            <View style={styles.legalRowIcon}>
              <Feather name="shield" size={16} color={palette.gold} />
            </View>
            <View>
              <Text style={styles.legalRowTitle}>Privacy Policy</Text>
              <Text style={styles.legalRowText}>How your data is collected and used</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={palette.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
