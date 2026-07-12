import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';

type HubAction = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  screen: 'Services' | 'Subscription';
};

function createHubStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    header: { paddingHorizontal: 24, paddingVertical: 16 },
    heading: { fontFamily: Fonts.serifMedium, fontSize: 26, color: p.textPrimary, marginBottom: 6 },
    subheading: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      color: p.textSecondary,
      lineHeight: 21,
    },
    scroll: { paddingHorizontal: 24, paddingBottom: 100 },
    introCard: {
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      padding: 18,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: p.goldBorder,
      ...s.soft,
    },
    introText: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      color: p.textSecondary,
      lineHeight: 20,
    },
    actionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      padding: 18,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: p.border,
      gap: 14,
      ...s.card,
    },
    actionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: p.goldDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBody: { flex: 1 },
    actionTitle: {
      fontFamily: Fonts.sansMedium,
      fontSize: 16,
      color: p.textPrimary,
      marginBottom: 4,
    },
    actionSubtitle: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      color: p.textSecondary,
      lineHeight: 18,
    },
  });
}

const ACTIONS: HubAction[] = [
  {
    key: 'services',
    title: 'Services',
    subtitle: 'Add, edit, and pause what customers can book.',
    icon: 'scissors',
    screen: 'Services',
  },
  {
    key: 'subscription',
    title: 'Subscription & plan',
    subtitle: 'Manage your NLBB provider plan and payments.',
    icon: 'credit-card',
    screen: 'Subscription',
  },
];

export default function BusinessHubScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createHubStyles(palette, shadow), [palette, shadow]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Services</Text>
        <Text style={styles.subheading}>Run your shop — services, plan, and growth tools.</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            Keep your services and subscription up to date so customers always see accurate pricing and availability.
          </Text>
        </View>

        {ACTIONS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.actionCard}
            activeOpacity={0.88}
            onPress={() => {
              navigation.navigate(item.screen);
            }}
          >
            <View style={styles.actionIcon}>
              <Feather name={item.icon} size={22} color={palette.gold} />
            </View>
            <View style={styles.actionBody}>
              <Text style={styles.actionTitle}>{item.title}</Text>
              <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={palette.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
