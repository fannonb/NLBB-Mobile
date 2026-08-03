import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';

interface AccountDangerZoneProps {
  role: 'customer' | 'provider';
  onDeletePress: () => void;
  style?: object;
}

function createStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    section: { marginBottom: 32 },
    sectionTitle: { fontFamily: Fonts.serifMedium, fontSize: 18, color: p.textPrimary, marginBottom: 16 },
    card: {
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: 'rgba(220,38,38,0.18)',
      padding: 16,
      gap: 12,
      ...s.soft,
    },
    title: { color: p.error, fontFamily: Fonts.sansBold, fontSize: 14 },
    copy: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: 'rgba(220,38,38,0.25)',
      paddingVertical: 12,
      backgroundColor: 'rgba(220,38,38,0.06)',
    },
    buttonText: { color: p.error, fontFamily: Fonts.sansMedium, fontSize: 13 },
  });
}

export default function AccountDangerZone({ role, onDeletePress, style }: AccountDangerZoneProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = React.useMemo(() => createStyles(palette, shadow), [palette, shadow]);

  const copy =
    role === 'provider'
      ? 'Permanently remove your provider account, business listing, and profile data.'
      : 'Permanently remove your account, profile, favorites, and associated data.';

  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.card}>
        <Text style={styles.title}>Delete account</Text>
        <Text style={styles.copy}>{copy}</Text>
        <TouchableOpacity style={styles.button} onPress={onDeletePress} activeOpacity={0.85}>
          <Feather name="trash-2" size={14} color={palette.error} />
          <Text style={styles.buttonText}>Delete account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
