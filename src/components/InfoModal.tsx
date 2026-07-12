import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';

interface InfoModalProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  buttonLabel?: string;
}

function createInfoStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    modal: {
      backgroundColor: p.card,
      borderRadius: Radius.xl,
      padding: 32,
      alignItems: 'center',
      width: '100%',
      maxWidth: 340,
      ...s.card,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: p.goldDim,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    icon: {
      color: p.gold,
    },
    title: {
      color: p.textPrimary,
      fontFamily: Fonts.serifMedium,
      fontSize: 22,
      marginBottom: 10,
      textAlign: 'center',
      fontWeight: '600',
    },
    message: {
      color: p.textSecondary,
      fontFamily: Fonts.sans,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 28,
    },
    btn: {
      backgroundColor: p.gold,
      borderRadius: Radius.md,
      paddingVertical: 12,
      paddingHorizontal: 32,
      alignItems: 'center',
      alignSelf: 'center',
      ...s.gold,
    },
    btnText: {
      color: p.bg,
      fontFamily: Fonts.sansBold,
      fontSize: 14,
      fontWeight: '700',
    },
  });
}

export default function InfoModal({
  visible,
  title,
  message,
  onDismiss,
  buttonLabel = 'Understood',
}: InfoModalProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createInfoStyles(palette, shadow), [palette, shadow]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconWrap}>
            <Feather name="info" size={40} style={styles.icon} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.btn} onPress={onDismiss} activeOpacity={0.85}>
            <Text style={styles.btnText}>{buttonLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
