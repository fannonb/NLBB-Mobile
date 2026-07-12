import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';

interface ErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  buttonLabel?: string;
}

function createErrorStyles(p: ColorPalette, s: ShadowPalette) {
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
      backgroundColor: 'rgba(220,38,38,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    icon: {
      color: p.error,
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
    actionRow: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    btn: {
      flex: 1,
      backgroundColor: p.error,
      borderRadius: Radius.md,
      paddingVertical: 12,
      alignItems: 'center',
      ...s.card,
    },
    btnText: {
      color: '#fff',
      fontFamily: Fonts.sansBold,
      fontSize: 14,
      fontWeight: '700',
    },
    secondaryBtn: {
      flex: 1,
      backgroundColor: p.cardInner,
      borderRadius: Radius.md,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: p.border,
    },
    secondaryBtnText: {
      color: p.textSecondary,
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
    },
  });
}

export default function ErrorModal({
  visible,
  title,
  message,
  onDismiss,
  buttonLabel = 'Try Again',
}: ErrorModalProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createErrorStyles(palette, shadow), [palette, shadow]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconWrap}>
            <Feather name="x-circle" size={40} style={styles.icon} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btn} onPress={onDismiss} activeOpacity={0.85}>
              <Text style={styles.btnText}>{buttonLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onDismiss} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
