import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';
import { useAuthStore } from '../store/authStore';

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?q=80&w=200&auto=format&fit=crop';

const NLBB_LOGO = require('../../assets/transparent_logo.png');

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
    },
    badge: {
      position: 'absolute',
      top: 6,
      right: 6,
      minWidth: 17,
      height: 17,
      paddingHorizontal: 4,
      borderRadius: 9,
      backgroundColor: p.error,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: p.card,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontFamily: Fonts.sansBold,
      lineHeight: 11,
    },
  });
}

export function CustomerNotifButton({
  navigation,
  unreadCount,
  onPress,
}: {
  navigation: { navigate: (name: string) => void };
  unreadCount: number;
  onPress?: () => void;
}) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const notifStyles = useMemo(() => createNotifStyles(palette, shadow), [palette, shadow]);

  return (
    <TouchableOpacity
      onPress={onPress ?? (() => navigation.navigate('Notifications'))}
      style={notifStyles.wrap}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
    >
      <Feather name="bell" size={20} color={palette.textSecondary} />
      {unreadCount > 0 && (
        <View style={notifStyles.badge}>
          <Text style={notifStyles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function createHeaderStyles(p: ColorPalette) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
      backgroundColor: p.bg,
    },
    left: { flex: 1, paddingRight: 12, minWidth: 0 },
    logo: {
      width: 115,
      height: 36,
    },
    pageTitle: {
      color: p.textPrimary,
      fontFamily: Fonts.serifMedium,
      fontSize: 22,
      lineHeight: 28,
    },
    pageSubtitle: {
      marginTop: 3,
      color: p.textMuted,
      fontSize: 12,
      fontFamily: Fonts.sans,
      lineHeight: 16,
    },
    right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarBtn: {
      overflow: 'hidden',
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: p.border,
      backgroundColor: p.cardInner,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImg: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      color: p.textPrimary,
      fontFamily: Fonts.serifBold,
      fontSize: 14,
    },
    logoutBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: p.card,
      borderWidth: 1,
      borderColor: p.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

type CustomerAppHeaderProps = {
  navigation: { navigate: (name: string, params?: any) => void; replace?: (name: string, params?: any) => void };
  unreadCount: number;
  avatarUri?: string;
  variant: 'home' | 'page';
  /** variant page */
  title?: string;
  pageSubtitle?: string;
  /** variant home — kept for compat, greeting now renders in the hero section */
  locationLabel?: string;
  greetingLine?: string;
  rightAccessory?: React.ReactNode;
  showAvatar?: boolean;
  onAvatarPress?: () => void;
  onNotifPress?: () => void;
  noBorder?: boolean;
  transparentBg?: boolean;
};

export default function CustomerAppHeader({
  navigation,
  unreadCount,
  avatarUri,
  variant,
  title,
  pageSubtitle,
  locationLabel,
  rightAccessory,
  showAvatar = true,
  onAvatarPress,
  onNotifPress,
  noBorder = false,
  transparentBg = false,
}: CustomerAppHeaderProps) {
  const palette = useThemedColors();
  const styles = useMemo(() => createHeaderStyles(palette), [palette]);
  const { isLoggedIn, user, logout } = useAuthStore();

  const handleAvatarPress = () => {
    if (onAvatarPress) {
      onAvatarPress();
    } else {
      navigation.navigate('Profile');
    }
  };

  return (
    <View
      style={[
        styles.header,
        noBorder && { borderBottomWidth: 0 },
        transparentBg && { backgroundColor: 'transparent' },
      ]}
    >
      <View style={styles.left}>
        {variant === 'home' ? (
          <Image source={NLBB_LOGO} style={styles.logo} resizeMode="contain" />
        ) : (
          <>
            <Text style={styles.pageTitle}>{title ?? ''}</Text>
            {pageSubtitle ? <Text style={styles.pageSubtitle}>{pageSubtitle}</Text> : null}
          </>
        )}
      </View>

      <View style={styles.right}>
        {rightAccessory}
        {isLoggedIn && (
          <CustomerNotifButton
            navigation={navigation}
            unreadCount={unreadCount}
            onPress={onNotifPress}
          />
        )}
        {showAvatar ? (
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.85} style={styles.avatarBtn}>
            <View style={styles.avatar}>
              {isLoggedIn ? (
                user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
                )
              ) : (
                <Feather name="user" size={18} color={palette.textSecondary} />
              )}
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
