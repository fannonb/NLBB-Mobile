import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Text, StyleSheet, Modal, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';

interface LoginErrorModalProps {
  visible: boolean;
  onDismiss: () => void;
  errorType?: 'invalid_credentials' | 'network' | 'server' | 'empty_fields';
  titleOverride?: string;
  messageOverride?: string;
  hintOverride?: string;
}

function createLoginErrorStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    container: {
      backgroundColor: p.card,
      borderRadius: Radius.xl,
      padding: 32,
      alignItems: 'center',
      width: '100%',
      maxWidth: 320,
      ...s.card,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(220,38,38,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    icon: {
      color: p.error,
    },
    title: {
      fontFamily: Fonts.serifMedium,
      fontSize: 22,
      color: p.textPrimary,
      marginBottom: 12,
      textAlign: 'center',
      fontWeight: '600',
    },
    message: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      color: p.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 28,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    retryBtn: {
      flex: 1,
      backgroundColor: p.gold,
      borderRadius: Radius.md,
      paddingVertical: 12,
      alignItems: 'center',
      ...s.gold,
    },
    retryBtnText: {
      color: p.bg,
      fontFamily: Fonts.sansBold,
      fontSize: 14,
      fontWeight: '700',
    },
    cancelBtn: {
      flex: 1,
      backgroundColor: p.cardInner,
      borderRadius: Radius.md,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: p.border,
    },
    cancelBtnText: {
      color: p.textSecondary,
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
    },
    hint: {
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: p.borderLight,
      width: '100%',
    },
    hintText: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: p.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
}

const ERROR_CONFIG = {
  invalid_credentials: {
    title: 'Invalid Credentials',
    message: 'The email or password you entered is incorrect. Please try again.',
    icon: 'alert-circle' as const,
    hint: 'Tip: Make sure caps lock is off and check for extra spaces.',
  },
  network: {
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection and try again.',
    icon: 'wifi-off' as const,
    hint: 'Make sure you have a stable internet connection.',
  },
  server: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Our team has been notified. Please try again shortly.',
    icon: 'server' as const,
    hint: 'Try again in a few moments.',
  },
  empty_fields: {
    title: 'Missing Information',
    message: 'Please enter both your email and password to continue.',
    icon: 'inbox' as const,
    hint: 'Both fields are required to sign in.',
  },
};

export default function LoginErrorModal({
  visible,
  onDismiss,
  errorType = 'invalid_credentials',
  titleOverride,
  messageOverride,
  hintOverride,
}: LoginErrorModalProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createLoginErrorStyles(palette, shadow), [palette, shadow]);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const config = ERROR_CONFIG[errorType];
  const title = titleOverride ?? config.title;
  const message = messageOverride ?? config.message;
  const hint = hintOverride ?? config.hint;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconWrap}>
            <Feather name={config.icon} size={36} style={styles.icon} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.retryBtn} onPress={onDismiss} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hint}>
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
