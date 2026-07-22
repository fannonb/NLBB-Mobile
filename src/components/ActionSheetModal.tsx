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
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: p.card,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingTop: 10,
      paddingBottom: 32,
      width: '100%',
      maxHeight: '80%',
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: p.border,
      ...s.card,
    },
    handle: {
      alignSelf: 'center',
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: p.border,
      marginBottom: 14,
    },
    header: {
      paddingHorizontal: 24,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: p.borderLight,
    },
    title: {
      fontFamily: Fonts.serifMedium,
      fontSize: 20,
      color: p.textPrimary,
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    optionsWrapper: {
      paddingHorizontal: 16,
      paddingVertical: 12,
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
      borderColor: p.border,
    },
    optionDanger: {
      backgroundColor: 'rgba(212,48,48,0.08)',
      borderColor: 'rgba(212,48,48,0.22)',
    },
    optionIcon: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      backgroundColor: p.goldDim,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: p.goldBorder,
    },
    optionIconDanger: {
      backgroundColor: 'rgba(212,48,48,0.12)',
      borderColor: 'rgba(212,48,48,0.2)',
    },
    optionContent: {
      flex: 1,
    },
    optionLabel: {
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      color: p.textPrimary,
    },
    optionLabelDanger: {
      color: p.error,
      fontFamily: Fonts.sansBold,
    },
    cancelBtn: {
      marginHorizontal: 16,
      marginTop: 4,
      backgroundColor: p.bg,
      borderRadius: Radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: p.border,
    },
    cancelBtnText: {
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      color: p.textSecondary,
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
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onDismiss} />
        <View style={styles.container}>
          <View style={styles.handle} />
          {title ? (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
            </View>
          ) : null}

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
                activeOpacity={0.85}
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

          <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss} activeOpacity={0.85}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
