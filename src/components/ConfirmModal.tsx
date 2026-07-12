import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function createConfirmStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    modal: {
      backgroundColor: p.card,
      borderRadius: Radius.xl,
      padding: 28,
      alignItems: 'center',
      width: '100%',
      ...s.card,
    },
    iconWrap: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      color: p.textPrimary,
      fontFamily: Fonts.serifMedium,
      fontSize: 20,
      marginBottom: 8,
      textAlign: 'center',
    },
    message: {
      color: p.textSecondary,
      fontFamily: Fonts.sans,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: Radius.md,
      backgroundColor: p.bg,
      borderWidth: 1,
      borderColor: p.border,
      alignItems: 'center',
    },
    cancelText: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14 },
    confirmBtn: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: Radius.md,
      backgroundColor: p.gold,
      alignItems: 'center',
      ...s.gold,
    },
    confirmBtnDanger: {
      backgroundColor: p.error,
      shadowColor: p.error,
    },
    confirmText: { color: p.bg, fontFamily: Fonts.sansBold, fontSize: 14 },
    confirmTextDanger: { color: '#fff' },
  });
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createConfirmStyles(palette, shadow), [palette, shadow]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={[styles.iconWrap, { backgroundColor: isDanger ? 'rgba(220,38,38,0.12)' : palette.goldDim }]}>
            <Feather
              name={isDanger ? 'alert-triangle' : 'help-circle'}
              size={24}
              color={isDanger ? palette.error : palette.gold}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, isDanger && styles.confirmBtnDanger]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={[styles.confirmText, isDanger && styles.confirmTextDanger]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
