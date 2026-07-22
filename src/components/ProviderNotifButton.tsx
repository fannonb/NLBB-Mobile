import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';
import { navigate } from '../lib/navigationRef';
import { useAppStore } from '../store/appStore';

function createNotifStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    wrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: p.card,
      borderWidth: 1,
      borderColor: p.border,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
      ...s.soft,
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: 9,
      backgroundColor: p.error,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: p.bg,
      zIndex: 2,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontFamily: Fonts.sansBold,
      lineHeight: 11,
    },
  });
}

export function useProviderUnreadCount() {
  return useAppStore((s) => s.providerNotifications.reduce((count, n) => (n.isRead ? count : count + 1), 0));
}

export default function ProviderNotifButton({ onPress }: { onPress?: () => void } = {}) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createNotifStyles(palette, shadow), [palette, shadow]);
  const unreadCount = useProviderUnreadCount();

  return (
    <TouchableOpacity
      onPress={onPress ?? (() => navigate('ProviderNotifications'))}
      style={styles.wrap}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
    >
      <Feather name="bell" size={20} color={unreadCount > 0 ? palette.gold : palette.textSecondary} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
