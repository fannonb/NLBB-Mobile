import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import CustomerAppHeader from '../../components/CustomerAppHeader';
import ActionSheetModal, { ActionSheetOption } from '../../components/ActionSheetModal';
import FeedbackModalHost from '../../components/FeedbackModalHost';
import { useModalManager } from '../../hooks/useModalManager';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useAuthGateStore } from '../../store/authGateStore';
import { bookingApi, CustomerBookingCard, toCustomerBookingCard } from '../../lib/api/bookings';
import { providerApi } from '../../lib/api/providers';
import { Provider } from '../../types';
import { authApi } from '../../lib/api/auth';
import { notificationsApi } from '../../lib/api/notifications';
import { isApiClientError } from '../../lib/api/client';



const formatStatusLabel = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

function createProfileStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
    userSection: { alignItems: 'center', marginBottom: 32 },
    avatarWrap: { position: 'relative', marginBottom: 16 },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 2,
      borderColor: p.gold,
      padding: 4,
    },
    avatarPlaceholder: {
      backgroundColor: p.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      color: p.textPrimary,
      fontFamily: Fonts.serifMedium,
      fontSize: 30,
    },
    cameraBtn: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: p.gold,
      alignItems: 'center',
      justifyContent: 'center',
      ...s.gold,
    },
    userName: { fontFamily: Fonts.serif, fontSize: 24, color: p.textPrimary, marginBottom: 6 },
    userMeta: { color: p.textSecondary, fontSize: 13, marginBottom: 20, textAlign: 'center' },
    editBtn: {
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: p.gold,
    },
    editBtnText: { color: p.gold, fontFamily: Fonts.sansMedium, fontSize: 14 },
    pushTestBtn: {
      marginTop: 12,
      backgroundColor: p.textPrimary,
      borderRadius: Radius.md,
      paddingHorizontal: 18,
      paddingVertical: 14,
      alignItems: 'center',
      ...s.soft,
    },
    pushTestBtnText: { color: p.bg, fontFamily: Fonts.sansMedium, fontSize: 14 },
    pushTestBtnSub: { color: p.textMuted, fontFamily: Fonts.sans, fontSize: 11, marginTop: 2 },
    section: { marginBottom: 32 },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: { fontFamily: Fonts.serifMedium, fontSize: 18, color: p.textPrimary },
    seeAll: { color: p.gold, fontFamily: Fonts.sansMedium, fontSize: 12 },
    favGrid: { flexDirection: 'row', gap: 14 },
    favCard: {
      flex: 1,
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: p.border,
      ...s.card,
    },
    emptyCard: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 132,
      gap: 8,
    },
    emptyCardTitle: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14 },
    emptyCardText: { color: p.textSecondary, fontSize: 12, textAlign: 'center', lineHeight: 18 },
    favImgWrap: { height: 96, position: 'relative' },
    favImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    favHeart: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(26,26,26,0.7)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    favInfo: { padding: 12 },
    favName: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14, marginBottom: 2 },
    favCat: { color: p.textSecondary, fontSize: 11, marginBottom: 6 },
    favRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    favRatingText: { color: p.textPrimary, fontFamily: Fonts.sansBold, fontSize: 11 },
    recentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      padding: 16,
      gap: 14,
      borderWidth: 1,
      borderColor: p.border,
      ...s.card,
    },
    recentImg: { width: 48, height: 48, borderRadius: Radius.md, resizeMode: 'cover' },
    recentImgPlaceholder: {
      backgroundColor: p.bg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: p.border,
    },
    recentInfo: { flex: 1 },
    recentName: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14, marginBottom: 4 },
    recentService: { color: p.textSecondary, fontSize: 12, marginBottom: 4 },
    recentDate: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    recentDateText: { color: p.textSecondary, fontSize: 11 },
    upcomingBadge: {
      backgroundColor: p.bg,
      borderRadius: Radius.md,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: p.border,
    },
    upcomingText: { color: p.gold, fontFamily: Fonts.sansBold, fontSize: 10 },

    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      paddingVertical: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'rgba(220,38,38,0.2)',
      ...s.soft,
    },
    logoutText: { color: p.error, fontFamily: Fonts.sansMedium, fontSize: 14 },
    guestCard: {
      backgroundColor: p.card,
      borderRadius: Radius.xl,
      padding: 28,
      alignItems: 'center',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: p.goldBorder,
      ...s.card,
    },
    guestEmblem: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: p.goldDim,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: p.goldBorder,
    },
    guestTitle: {
      fontFamily: Fonts.serifMedium,
      fontSize: 22,
      color: p.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    guestText: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      color: p.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
    },
    guestPrimaryBtn: {
      width: '100%',
      backgroundColor: p.gold,
      borderRadius: Radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 10,
      ...s.gold,
    },
    guestPrimaryBtnText: { color: p.bg, fontFamily: Fonts.sansBold, fontSize: 15 },
    guestSecondaryBtn: {
      width: '100%',
      borderRadius: Radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: p.border,
    },
    guestSecondaryBtnText: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14 },
  });
}

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createProfileStyles(palette, shadow), [palette, shadow]);
  const { logout, user, refreshCurrentUser } = useAuthStore();
  const { isLoggedIn, requireAuth } = useRequireAuth();
  const openAuthGate = useAuthGateStore((state) => state.open);
  const { customerNotifications, favorites, hydrateCustomerNotifications } = useAppStore();
  const { modal, showActionSheet, showInfo, showError, showSuccess, hideModal } = useModalManager();
  const [sendingTestPush, setSendingTestPush] = useState(false);
  const unreadCount = isLoggedIn ? customerNotifications.filter((notification) => !notification.isRead).length : 0;
  const [recentBooking, setRecentBooking] = useState<CustomerBookingCard | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const favoriteProviders = useMemo(
    () => providers.filter((provider) => favorites.includes(provider.id)).slice(0, 2),
    [favorites, providers]
  );

  const userMeta = [user?.email, user?.phone].filter(Boolean).join(' | ');
  const avatarInitial = (user?.name?.trim()?.charAt(0) ?? 'U').toUpperCase();

  const ensureMediaPermission = async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showInfo('Permission Required', 'Camera permission is required to take a photo.');
        return false;
      }
      return true;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showInfo('Permission Required', 'Gallery permission is required to select a photo.');
      return false;
    }
    return true;
  };

  const pickAndUploadAvatar = async (source: 'camera' | 'gallery') => {
    const allowed = await ensureMediaPermission(source);
    if (!allowed) {
      return;
    }

    const pickerOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    };

    try {
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.base64) {
        showError('Image Error', 'Could not process selected image. Please try again.');
        return;
      }

      const mimeType =
        asset.mimeType && asset.mimeType.startsWith('image/')
          ? asset.mimeType
          : asset.uri.toLowerCase().endsWith('.png')
            ? 'image/png'
            : 'image/jpeg';

      setUploadingAvatar(true);
      await authApi.uploadAvatar({ dataUri: `data:${mimeType};base64,${asset.base64}` });
      await refreshCurrentUser();
      showSuccess('Photo Updated', 'Profile photo updated.');
    } catch (error) {
      const message =
        isApiClientError(error) ? error.message : error instanceof Error ? error.message : 'Image upload failed';
      showError('Upload Failed', message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const openAvatarPicker = () => {
    const options: ActionSheetOption[] = [
      {
        id: 'camera',
        label: 'Take Photo',
        icon: 'camera',
        onPress: () => {
          void pickAndUploadAvatar('camera');
        },
      },
      {
        id: 'gallery',
        label: 'Choose from Gallery',
        icon: 'image',
        onPress: () => {
          void pickAndUploadAvatar('gallery');
        },
      },
    ];
    showActionSheet('Update Photo', options);
  };

  const sendTestPush = async () => {
    setSendingTestPush(true);
    try {
      await notificationsApi.sendTestPush({
        title: 'NLBB push test',
        body: 'If this appears, push notifications are working correctly on your device.',
      });
      showSuccess('Test Push Sent', 'We sent a test notification to this device. Watch for it now.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send the test push right now.';
      showError('Push Test Failed', message);
    } finally {
      setSendingTestPush(false);
    }
  };

  useEffect(() => {
    hydrateCustomerNotifications();
  }, [hydrateCustomerNotifications]);

  useFocusEffect(
    React.useCallback(() => {
      if (isLoggedIn) {
        void refreshCurrentUser();
      }
    }, [refreshCurrentUser, isLoggedIn])
  );

  useEffect(() => {
    if (!isLoggedIn) {
      setRecentBooking(null);
      return;
    }

    let active = true;

    const loadRecentBooking = async () => {
      try {
        const bookings = await bookingApi.listMyBookings();
        if (!active) {
          return;
        }
        const latest = bookings[0] ? toCustomerBookingCard(bookings[0]) : null;
        setRecentBooking(latest);
      } catch {
        if (active) {
          setRecentBooking(null);
        }
      }
    };

    loadRecentBooking();

    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    let active = true;

    const loadProviders = async () => {
      try {
        const result = await providerApi.listProviders();
        if (!active) {
          return;
        }
        setProviders(result);
      } catch {
        if (active) {
          setProviders([]);
        }
      }
    };

    loadProviders();

    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomerAppHeader
        variant="page"
        navigation={navigation}
        unreadCount={unreadCount}
        title="Profile"
        pageSubtitle={isLoggedIn ? 'Account & preferences' : 'Browse freely, sign in to book'}
        showAvatar={false}
        onNotifPress={() => requireAuth('notifications', () => navigation.navigate('Notifications'))}
      />

      <ActionSheetModal
        visible={modal.visible && modal.type === 'actionSheet'}
        title={modal.title}
        options={modal.data ?? []}
        onDismiss={hideModal}
      />
      <FeedbackModalHost modal={modal} onDismiss={hideModal} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {!isLoggedIn ? (
          <>
            <View style={styles.guestCard}>
              <View style={styles.guestEmblem}>
                <Feather name="user" size={28} color={palette.gold} />
              </View>
              <Text style={styles.guestTitle}>Browsing as guest</Text>
              <Text style={styles.guestText}>
                Explore providers and services now. Sign in when you are ready to book, save favorites, and contact shops.
              </Text>
              <TouchableOpacity
                style={styles.guestPrimaryBtn}
                onPress={() => openAuthGate('profile')}
                activeOpacity={0.85}
              >
                <Text style={styles.guestPrimaryBtnText}>Sign in or create account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.guestSecondaryBtn}
                onPress={() => navigation.navigate('Explore')}
                activeOpacity={0.8}
              >
                <Text style={styles.guestSecondaryBtnText}>Continue exploring</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
        <View style={styles.userSection}>
          <View style={styles.avatarWrap}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{avatarInitial}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraBtn} onPress={openAvatarPicker} disabled={uploadingAvatar}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={palette.bg} />
              ) : (
                <Feather name="camera" size={12} color={palette.bg} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name ?? 'Your Profile'}</Text>
          <Text style={styles.userMeta}>{userMeta || 'Account details will appear here'}</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pushTestBtn} onPress={sendTestPush} disabled={sendingTestPush}>
            <Text style={styles.pushTestBtnText}>{sendingTestPush ? 'Sending...' : 'Send Test Push'}</Text>
            <Text style={styles.pushTestBtnSub}>Quickly verify push notifications on this device</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Favorites</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.favGrid}>
            {favoriteProviders.length > 0 ? (
              favoriteProviders.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  onPress={() => navigation.navigate('ProviderDetails', { providerId: provider.id })}
                  style={styles.favCard}
                  activeOpacity={0.85}
                >
                  <View style={styles.favImgWrap}>
                    <Image source={{ uri: provider.coverImage }} style={styles.favImg} />
                    <View style={styles.favHeart}>
                      <Feather name="heart" size={12} color={palette.gold} />
                    </View>
                  </View>
                  <View style={styles.favInfo}>
                    <Text style={styles.favName} numberOfLines={1}>
                      {provider.name}
                    </Text>
                    <Text style={styles.favCat}>{provider.category}</Text>
                    <View style={styles.favRating}>
                      <Feather name="star" size={10} color={palette.gold} />
                      <Text style={styles.favRatingText}>{provider.rating}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.favCard, styles.emptyCard]}>
                <Feather name="heart" size={18} color={palette.gold} />
                <Text style={styles.emptyCardTitle}>No favorites yet</Text>
                <Text style={styles.emptyCardText}>Providers you save will appear here.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {recentBooking ? (
            <TouchableOpacity onPress={() => navigation.navigate('Bookings')} style={styles.recentCard}>
              {recentBooking.providerImage ? (
                <Image source={{ uri: recentBooking.providerImage }} style={styles.recentImg} />
              ) : (
                <View style={[styles.recentImg, styles.recentImgPlaceholder]}>
                  <Feather name="calendar" size={18} color={palette.gold} />
                </View>
              )}
              <View style={styles.recentInfo}>
                <Text style={styles.recentName}>{recentBooking.providerName}</Text>
                <Text style={styles.recentService}>{recentBooking.serviceName}</Text>
                <View style={styles.recentDate}>
                  <Feather name="calendar" size={10} color={palette.textMuted} />
                  <Text style={styles.recentDateText}>
                    {recentBooking.date} at {recentBooking.time}
                  </Text>
                </View>
              </View>
              <View style={styles.upcomingBadge}>
                <Text style={styles.upcomingText}>{formatStatusLabel(recentBooking.status)}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.recentCard, styles.emptyCard]}>
              <Feather name="calendar" size={18} color={palette.gold} />
              <Text style={styles.emptyCardTitle}>No bookings yet</Text>
              <Text style={styles.emptyCardText}>Your recent appointments will show here.</Text>
            </View>
          )}
        </View>



        <TouchableOpacity
          onPress={async () => {
            await logout();
            navigation.replace('CustomerApp');
          }}
          style={styles.logoutBtn}
        >
          <Feather name="log-out" size={18} color={palette.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
