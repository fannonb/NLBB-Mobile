import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';

interface AccountSettingsSectionProps {
  navigation: any;
  onChangePasswordPress: () => void;
  style?: object;
}

interface SettingsRow {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
}

function createStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    section: { marginBottom: 32 },
    sectionTitle: { fontFamily: Fonts.serifMedium, fontSize: 18, color: p.textPrimary, marginBottom: 16 },
    card: {
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: p.border,
      overflow: 'hidden',
      ...s.soft,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: p.border },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: p.goldDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: { flex: 1 },
    label: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14 },
    description: { color: p.textMuted, fontFamily: Fonts.sans, fontSize: 12, marginTop: 2 },
  });
}

/** Settings shared by the customer and provider profile tabs. */
export default function AccountSettingsSection({
  navigation,
  onChangePasswordPress,
  style,
}: AccountSettingsSectionProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = React.useMemo(() => createStyles(palette, shadow), [palette, shadow]);

  const rows: SettingsRow[] = [
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Choose which push alerts you receive',
      icon: 'bell',
      onPress: () => navigation.navigate('NotificationSettings'),
    },
    {
      id: 'appearance',
      label: 'Appearance',
      description: 'Light or dark theme',
      icon: 'moon',
      onPress: () => navigation.navigate('DarkMode'),
    },
    {
      id: 'password',
      label: 'Change Password',
      description: 'Signs out your other devices',
      icon: 'shield',
      onPress: onChangePasswordPress,
    },
  ];

  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle}>Settings</Text>
      <View style={styles.card}>
        {rows.map((row, index) => (
          <TouchableOpacity
            key={row.id}
            style={[styles.row, index < rows.length - 1 && styles.rowBorder]}
            onPress={row.onPress}
            activeOpacity={0.8}
          >
            <View style={styles.iconWrap}>
              <Feather name={row.icon} size={16} color={palette.gold} />
            </View>
            <View style={styles.body}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.description}>{row.description}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={palette.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
