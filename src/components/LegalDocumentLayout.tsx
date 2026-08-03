import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { LegalSection } from '../constants/legalContent';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';

interface LegalDocumentLayoutProps {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
  navigation: { goBack: () => void };
}

function createStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: p.card,
      alignItems: 'center',
      justifyContent: 'center',
      ...s.soft,
    },
    heading: {
      flex: 1,
      textAlign: 'center',
      fontFamily: Fonts.serifMedium,
      fontSize: 18,
      color: p.textPrimary,
    },
    scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
    intro: {
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: p.border,
      ...s.soft,
    },
    introTitle: {
      fontFamily: Fonts.serifMedium,
      fontSize: 20,
      color: p.textPrimary,
      marginBottom: 6,
    },
    introMeta: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: p.textMuted,
    },
    section: { marginBottom: 24 },
    sectionTitle: {
      fontFamily: Fonts.serifMedium,
      fontSize: 16,
      color: p.textPrimary,
      marginBottom: 10,
    },
    paragraph: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      color: p.textSecondary,
      lineHeight: 22,
      marginBottom: 10,
    },
    bulletList: { gap: 8, marginTop: 2 },
    bulletRow: { flexDirection: 'row', gap: 10, paddingRight: 4 },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: p.gold,
      marginTop: 8,
    },
    bulletText: {
      flex: 1,
      fontFamily: Fonts.sans,
      fontSize: 14,
      color: p.textSecondary,
      lineHeight: 22,
    },
  });
}

export default function LegalDocumentLayout({
  title,
  lastUpdated,
  sections,
  navigation,
}: LegalDocumentLayoutProps) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createStyles(palette, shadow), [palette, shadow]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.heading}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.intro}>
          <Text style={styles.introTitle}>{title}</Text>
          <Text style={styles.introMeta}>Last updated: {lastUpdated}</Text>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
            {section.bullets ? (
              <View style={styles.bulletList}>
                {section.bullets.map((bullet) => (
                  <View key={bullet} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
