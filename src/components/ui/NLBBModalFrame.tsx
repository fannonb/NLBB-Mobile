import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Modal, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import {
  createNLBBModalStyles,
  getModalToneColors,
  NLBBModalTone,
} from './nlbbModalStyles';

type FeatherIcon = React.ComponentProps<typeof Feather>['name'];

interface NLBBModalFrameProps {
  visible: boolean;
  title: string;
  message?: string;
  icon: FeatherIcon;
  tone?: NLBBModalTone;
  animated?: boolean;
  showClose?: boolean;
  onRequestClose?: () => void;
  footer?: string;
  children?: React.ReactNode;
}

export default function NLBBModalFrame({
  visible,
  title,
  message,
  icon,
  tone = 'neutral',
  animated = true,
  showClose = false,
  onRequestClose,
  footer,
  children,
}: NLBBModalFrameProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createNLBBModalStyles(palette, shadow), [palette, shadow]);
  const toneColors = useMemo(() => getModalToneColors(palette, tone), [palette, tone]);
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 180,
          friction: 14,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.94);
      fadeAnim.setValue(0);
    }
  }, [animated, fadeAnim, scaleAnim, visible]);

  const cardContent = (
    <View style={styles.card}>
      {showClose && onRequestClose ? (
        <TouchableOpacity style={styles.closeBtn} onPress={onRequestClose} activeOpacity={0.85}>
          <Feather name="x" size={16} color={palette.textMuted} />
        </TouchableOpacity>
      ) : null}
      <View style={styles.body}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: toneColors.iconBg,
              borderColor: toneColors.ring,
            },
          ]}
        >
          <Feather name={icon} size={30} color={toneColors.iconColor} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {children}
        {footer ? (
          <View style={styles.footer}>
            <Text style={styles.footerText}>{footer}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onRequestClose}
    >
      {animated ? (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%', alignItems: 'center' }}>
            {cardContent}
          </Animated.View>
        </Animated.View>
      ) : (
        <View style={styles.overlay}>{cardContent}</View>
      )}
    </Modal>
  );
}

export function NLBBModalActions({
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  primaryDanger = false,
  busy = false,
  single = false,
}: {
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  primaryDanger?: boolean;
  busy?: boolean;
  single?: boolean;
}) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createNLBBModalStyles(palette, shadow), [palette, shadow]);

  if (secondaryLabel && onSecondary) {
    return (
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.secondaryBtn, busy && styles.btnDisabled]}
          onPress={onSecondary}
          activeOpacity={0.85}
          disabled={busy}
        >
          <Text style={styles.secondaryBtnText}>{secondaryLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            primaryDanger && styles.primaryBtnDanger,
            busy && styles.btnDisabled,
          ]}
          onPress={onPrimary}
          activeOpacity={0.85}
          disabled={busy}
        >
          <Text
            style={[styles.primaryBtnText, primaryDanger && styles.primaryBtnTextDanger]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {busy ? 'Working…' : primaryLabel}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.actions}>
      <TouchableOpacity
        style={[
          styles.primaryBtn,
          single && styles.primaryBtnFull,
          primaryDanger && styles.primaryBtnDanger,
          busy && styles.btnDisabled,
        ]}
        onPress={onPrimary}
        activeOpacity={0.85}
        disabled={busy}
      >
        <Text
          style={[styles.primaryBtnText, primaryDanger && styles.primaryBtnTextDanger]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {busy ? 'Working…' : primaryLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
