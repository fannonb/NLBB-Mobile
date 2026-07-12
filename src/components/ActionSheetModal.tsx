import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';

export interface ActionSheetOption {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  isDanger?: boolean;
}

interface ActionSheetModalProps {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  onDismiss: () => void;
}

function createActionSheetStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: p.overlayDark,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: p.card,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingHorizontal: 0,
      paddingTop: 16,
      paddingBottom: 32,
      width: '100%',
      maxHeight: '80%',
      borderTopWidth: 1,
      borderTopColor: p.border,
    },
    header: {
      paddingHorizontal: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: p.borderLight,
    },
    title: {
      fontFamily: Fonts.serifMedium,
      fontSize: 18,
      color: p.textPrimary,
      textAlign: 'center',
      fontWeight: '600',
    },
    optionsWrapper: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: p.cardInner,
      borderRadius: Radius.lg,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 8,
      gap: 12,
      borderWidth: 1,
      borderColor: p.borderLight,
    },
    optionDanger: {
      backgroundColor: 'rgba(220,38,38,0.08)',
      borderColor: 'rgba(220,38,38,0.2)',
    },
    optionIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: p.bg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: p.borderLight,
    },
    optionIconDanger: {
      backgroundColor: 'rgba(220,38,38,0.12)',
    },
    optionContent: {
      flex: 1,
    },
    optionLabel: {
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      color: p.textPrimary,
      fontWeight: '500',
    },
    optionLabelDanger: {
      color: p.error,
      fontFamily: Fonts.sansBold,
    },
    optionSub: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: p.textSecondary,
      marginTop: 4,
    },
    cancelBtn: {
      marginHorizontal: 12,
      marginTop: 8,
      backgroundColor: p.bg,
      borderRadius: Radius.lg,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: p.borderLight,
    },
    cancelBtnText: {
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      color: p.textPrimary,
      fontWeight: '500',
    },
  });
}

export default function ActionSheetModal({
  visible,
  title,
  options,
  onDismiss,
}: ActionSheetModalProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createActionSheetStyles(palette, shadow), [palette, shadow]);

  const handleOptionPress = (onPress: () => void) => {
    onPress();
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
            </View>
          )}

          <ScrollView
            contentContainerStyle={styles.optionsWrapper}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.option, option.isDanger && styles.optionDanger]}
                onPress={() => handleOptionPress(option.onPress)}
                activeOpacity={0.8}
              >
                <View style={[styles.optionIcon, option.isDanger && styles.optionIconDanger]}>
                  <Feather
                    name={option.icon}
                    size={18}
                    color={option.isDanger ? palette.error : palette.gold}
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, option.isDanger && styles.optionLabelDanger]}>
                    {option.label}
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={18}
                  color={option.isDanger ? palette.error : palette.textMuted}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss} activeOpacity={0.8}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
