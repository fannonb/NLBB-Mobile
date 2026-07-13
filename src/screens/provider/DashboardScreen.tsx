import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import SectionHeader from '../../components/SectionHeader';
import Toast from '../../components/Toast';
import { useAppStore } from '../../store/appStore';
import { useBookingDataStore } from '../../store/bookingDataStore';
import { resolveImageUrl } from '../../lib/config';
import { toProviderAppointmentCard } from '../../lib/api/bookings';
import { providerManagementApi } from '../../lib/api/providerManagement';
import { useAuthStore } from '../../store/authStore';
import { openPhoneNumber, openWhatsAppContact } from '../../lib/contactActions';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop';
const resolveImageUri = (value: string | null | undefined, fallback: string) =>
  resolveImageUrl(value, fallback);

const getInitials = (name?: string) => {
  if (!name) return 'P';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const pickPreferredString = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

const buildFreshImageUri = (uri: string | null | undefined, version?: string | null) => {
  const resolved = resolveImageUrl(uri);
  if (!resolved) {
    return '';
  }
  const token = (version ?? '').trim();
  if (!token) {
    return resolved;
  }
  return `${resolved}${resolved.includes('?') ? '&' : '?'}v=${encodeURIComponent(token)}`;
};

const isSameCalendarDay = (value: string, target = new Date()) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return date.toDateString() === target.toDateString();
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateWeek() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return { d, dayLabel: DAYS[d.getDay()], dateNum: d.getDate(), monthLabel: MONTHS[d.getMonth()], isToday: i === 0 };
  });
}

function createDashboardStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 24, paddingVertical: 12,
    },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
    location: { color: p.textSecondary, fontSize: 13 },
    businessName: { color: p.textPrimary, fontFamily: Fonts.serifMedium, fontSize: 22 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    notifBtn: { position: 'relative', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    notifBadge: {
      position: 'absolute', top: 4, right: 4, width: 16, height: 16,
      borderRadius: 8, backgroundColor: p.error,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: p.bg,
    },
    notifBadgeText: { color: '#fff', fontSize: 9, fontFamily: Fonts.sansBold },
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
      resizeMode: 'cover',
    },
    avatarText: {
      color: p.textPrimary,
      fontFamily: Fonts.serifBold,
      fontSize: 14,
    },
    scroll: { paddingBottom: 32 },
    loadingWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 24,
      marginBottom: 24,
    },
    loadingText: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 13 },
    subChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: Radius.full,
      backgroundColor: p.goldDim,
      borderWidth: 1,
      borderColor: p.goldBorder,
    },
    subChipDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: p.success,
    },
    subChipText: {
      color: p.gold,
      fontFamily: Fonts.sansMedium,
      fontSize: 11,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 24,
      marginBottom: 18,
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      padding: 14,
      borderWidth: 1,
      borderColor: p.border,
      ...s.soft,
    },
    statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statusDot: { width: 9, height: 9, borderRadius: 4.5 },
    statusTitle: { color: p.textPrimary, fontFamily: Fonts.sansBold, fontSize: 14 },
    statusSubtitle: { color: p.textMuted, fontSize: 11, marginTop: 1 },
    pendingBanner: {
      marginHorizontal: 24,
      marginBottom: 20,
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      padding: 16,
      borderWidth: 1.5,
      borderColor: p.goldBorder,
      ...s.soft,
    },
    pendingBannerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    pendingBannerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pendingPulse: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: p.gold,
    },
    pendingBannerTitle: {
      color: p.textPrimary,
      fontFamily: Fonts.sansBold,
      fontSize: 15,
    },
    pendingBannerSub: {
      color: p.textSecondary,
      fontFamily: Fonts.sans,
      fontSize: 13,
      marginBottom: 12,
    },
    pendingBannerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: p.gold,
      borderRadius: Radius.md,
      paddingVertical: 10,
      ...s.gold,
    },
    pendingBannerBtnText: {
      color: p.bg,
      fontFamily: Fonts.sansBold,
      fontSize: 13,
    },
    nextUpCard: {
      backgroundColor: p.card,
      borderRadius: Radius.xl,
      padding: 18,
      marginHorizontal: 24,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: p.border,
      ...s.card,
    },
    nextUpLabel: {
      color: p.textMuted,
      fontFamily: Fonts.sansMedium,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    nextUpRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    nextUpAvatar: { width: 48, height: 48, borderRadius: 24 },
    nextUpAvatarPlaceholder: { backgroundColor: p.goldDim, alignItems: 'center', justifyContent: 'center' },
    nextUpInfo: { flex: 1 },
    nextUpName: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 16, marginBottom: 2 },
    nextUpService: { color: p.textSecondary, fontSize: 13 },
    nextUpTime: { color: p.gold, fontFamily: Fonts.sansBold, fontSize: 14 },
    nextUpActions: { flexDirection: 'row', gap: 10 },
    nextUpAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: Radius.md,
      backgroundColor: p.cardInner,
      borderWidth: 1,
      borderColor: p.border,
    },
    nextUpActionPrimary: {
      backgroundColor: p.goldDim,
      borderColor: p.goldBorder,
    },
    nextUpActionText: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 12 },
    metricsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 24, marginBottom: 24 },
    metricTile: {
      flex: 1,
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: p.border,
      ...s.soft,
    },
    metricValue: {
      color: p.textPrimary,
      fontFamily: Fonts.serifMedium,
      fontSize: 20,
      marginBottom: 4,
    },
    metricLabel: {
      color: p.textMuted,
      fontFamily: Fonts.sans,
      fontSize: 10,
      textAlign: 'center',
    },
    confirmedCard: {
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      padding: 14,
      marginHorizontal: 24,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: p.border,
      ...s.soft,
    },
    confirmedTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    confirmedAvatar: { width: 42, height: 42, borderRadius: 21 },
    confirmedAvatarPlaceholder: {
      backgroundColor: p.goldDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmedInfo: { flex: 1 },
    confirmedName: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14, marginBottom: 2 },
    confirmedService: { color: p.textSecondary, fontSize: 12 },
    confirmedMeta: { color: p.textMuted, fontSize: 11, marginTop: 2 },
    confirmedRight: { alignItems: 'flex-end' },
    confirmedTime: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 13, marginBottom: 2 },
    confirmedPrice: { color: p.gold, fontFamily: Fonts.sansBold, fontSize: 12 },
    confirmedActions: { flexDirection: 'row', gap: 10 },
    confirmedAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.cardInner,
    },
    confirmedActionPrimary: {
      borderColor: p.goldBorder,
      backgroundColor: p.goldDim,
    },
    confirmedActionText: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 12 },
    section: { marginBottom: 24 },
    toolGrid: { flexDirection: 'row', gap: 12, paddingHorizontal: 24 },
    toolItem: {
      flex: 1, backgroundColor: p.card, borderRadius: Radius.lg, padding: 12,
      alignItems: 'center', gap: 8, borderWidth: 1, borderColor: p.border, ...s.soft,
    },
    toolLabel: { color: p.textSecondary, fontSize: 10, fontFamily: Fonts.sansMedium },
    daysScroll: { paddingHorizontal: 24, gap: 10 },
    dayItem: {
      width: 66, paddingVertical: 12, borderRadius: Radius.lg, backgroundColor: p.card,
      alignItems: 'center', borderWidth: 1, borderColor: p.border, gap: 2,
    },
    dayItemActive: { backgroundColor: p.gold, ...s.gold },
    dayLabel: { color: p.textMuted, fontSize: 10, fontFamily: Fonts.sansBold, textTransform: 'uppercase', letterSpacing: 0.5 },
    dayLabelActive: { color: p.bg },
    dayDate: { color: p.textPrimary, fontFamily: Fonts.serifMedium, fontSize: 20 },
    dayDateActive: { color: p.bg },
    dayMonth: { color: p.textMuted, fontSize: 10 },
    dayMonthActive: { color: 'rgba(255,255,255,0.7)' },
    todayCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: p.card, borderRadius: Radius.lg, padding: 14,
      marginHorizontal: 24, marginBottom: 10, borderWidth: 1, borderColor: p.border, ...s.soft,
    },
    todayAvatar: { width: 44, height: 44, borderRadius: 22 },
    todayAvatarPlaceholder: { backgroundColor: p.goldDim, alignItems: 'center', justifyContent: 'center' },
    todayInfo: { flex: 1 },
    todayName: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14, marginBottom: 2 },
    todayService: { color: p.textSecondary, fontSize: 12 },
    todayRight: { alignItems: 'flex-end' },
    todayTime: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 13, marginBottom: 2 },
    todayPrice: { color: p.gold, fontFamily: Fonts.sansBold, fontSize: 12 },
    emptyPending: {
      alignItems: 'center', paddingVertical: 28, gap: 8,
      backgroundColor: p.card, borderRadius: Radius.xl, marginHorizontal: 24,
      borderWidth: 1, borderColor: p.border, ...s.soft,
    },
    emptyPendingText: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 15 },
    emptyPendingSubtext: { color: p.textMuted, fontSize: 13 },
    requestCard: {
      backgroundColor: p.card, borderRadius: Radius.xl, padding: 16,
      marginHorizontal: 24, marginBottom: 16, gap: 14, borderWidth: 1, borderColor: p.border, ...s.soft,
    },
    reqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    reqUser: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    reqAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: p.border },
    reqAvatarPlaceholder: { backgroundColor: p.goldDim, alignItems: 'center', justifyContent: 'center' },
    reqName: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14 },
    reqBadge: { fontSize: 11, marginTop: 2 },
    agoBadge: { backgroundColor: p.cardInner, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    agoText: { color: p.textSecondary, fontSize: 10 },
    serviceBox: {
      backgroundColor: p.cardInner, borderRadius: Radius.md, padding: 14,
      borderWidth: 1, borderColor: p.border,
    },
    serviceBoxTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    serviceBoxName: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14 },
    serviceBoxPrice: { color: p.gold, fontFamily: Fonts.sansBold, fontSize: 14 },
    serviceBoxMeta: { flexDirection: 'row', gap: 24 },
    serviceMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    serviceMetaText: { color: p.textSecondary, fontSize: 11 },
    tapHint: { color: p.textMuted, fontSize: 11, fontFamily: Fonts.sans, textAlign: 'right' },
    viewAllBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      marginHorizontal: 24, paddingVertical: 12,
      backgroundColor: p.goldDim, borderRadius: Radius.lg, borderWidth: 1, borderColor: p.goldBorder,
    },
    viewAllText: { color: p.gold, fontFamily: Fonts.sansMedium, fontSize: 13 },
  });
}

export default function DashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createDashboardStyles(palette, shadow), [palette, shadow]);
  const { user } = useAuthStore();
  const {
    providerNotifications,
    providerProfile,
    hydrateProviderNotifications,
    updateProviderProfile,
  } = useAppStore();
  const bookingRecords = useBookingDataStore((state) => state.records);
  const bookingsLoading = useBookingDataStore((state) => state.loading);
  const bookingsLoadedAt = useBookingDataStore((state) => state.loadedAt);
  const loadMyBookings = useBookingDataStore((state) => state.loadMyBookings);
  const updateBookingStatus = useBookingDataStore((state) => state.updateBookingStatus);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const week = useMemo(() => generateWeek(), []);

  const loadDashboardData = useCallback(async (active?: { current: boolean }) => {
    const isActive = () => (active ? active.current : true);
    setLoadingProfile(true);
    try {
      const [, provider] = await Promise.all([
        loadMyBookings({ force: true }),
        providerManagementApi.getMyProfile().catch(() => null),
      ]);
      if (!isActive()) return;
      if (provider) {
        updateProviderProfile({
          businessName: provider.name,
          description: provider.description,
          phone: provider.phone ?? '',
          whatsapp: provider.whatsapp ?? provider.phone ?? '',
          instagram: provider.instagram ?? '',
          facebook: provider.facebook ?? '',
          location: provider.location,
          category: provider.category,
          coverImage: provider.coverImage ?? DEFAULT_COVER,
          avatar: provider.avatar ?? '',
          workingHours: provider.workingHours ?? [],
          galleryImages: provider.galleryImages ?? provider.images ?? [],
          mpesaPhone: provider.mpesaPhone ?? provider.phone ?? '',
          isOpen: provider.isOpen ?? true,
        });
      }
      await hydrateProviderNotifications({ force: true });
    } catch {
      // Keep current dashboard data visible when a refresh fails.
    } finally {
      if (isActive()) {
        setLoadingProfile(false);
      }
    }
  }, [hydrateProviderNotifications, loadMyBookings, updateProviderProfile]);

  useFocusEffect(
    useCallback(() => {
      const active = { current: true };
      void loadDashboardData(active);
      return () => {
        active.current = false;
      };
    }, [loadDashboardData])
  );

  const appointments = useMemo(
    () => bookingRecords.map((booking) => toProviderAppointmentCard(booking)),
    [bookingRecords]
  );
  const loading = loadingProfile || bookingsLoading || bookingsLoadedAt === 0;
  const pending = appointments.filter((a) => a.status === 'pending');
  const upcomingAppointments = [...appointments]
    .filter((a) => a.status === 'upcoming')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const todayCount = bookingRecords.filter((booking) => booking.status !== 'cancelled' && isSameCalendarDay(booking.scheduledAt)).length;
  const todayUpcoming = upcomingAppointments.filter((a) => isSameCalendarDay(a.scheduledAt));
  const completedCount = bookingRecords.filter((booking) => booking.status === 'completed').length;
  const nextUp = upcomingAppointments[0] ?? null;
  const unreadCount = providerNotifications.filter((n) => !n.isRead).length;
  const resolvedAvatarUri = pickPreferredString(providerProfile.avatar, user?.avatar);
  const avatarImageUri = buildFreshImageUri(
    resolvedAvatarUri,
    providerProfile.businessName || user?.id || null
  );

  const handleToggleOpen = async (next: boolean) => {
    setTogglingOpen(true);
    updateProviderProfile({ isOpen: next });
    try {
      await providerManagementApi.setMyOpenState(next);
      setToast({
        visible: true,
        message: next ? 'You are now visible as open.' : 'Marked closed — bookings paused.',
        type: 'success',
      });
    } catch {
      updateProviderProfile({ isOpen: !next });
      setToast({ visible: true, message: 'Could not update status. Try again.', type: 'error' });
    } finally {
      setTogglingOpen(false);
    }
  };

  const handleMarkCompleted = async (appointmentId: string) => {
    try {
      await updateBookingStatus(appointmentId, 'completed');
      setToast({
        visible: true,
        message: 'Appointment marked as completed.',
        type: 'success',
      });
    } catch {
      setToast({
        visible: true,
        message: 'Could not mark appointment as completed.',
        type: 'error',
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.businessName}>{providerProfile.businessName || 'Today'}</Text>
          <TouchableOpacity
            style={styles.subChip}
            onPress={() => navigation.navigate('Business', { screen: 'Subscription' })}
            activeOpacity={0.85}
          >
            <View style={styles.subChipDot} />
            <Text style={styles.subChipText}>Plan active</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.navigate('ProviderNotifications')}
          >
            <Feather name="bell" size={20} color={palette.textSecondary} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ProviderProfile')} activeOpacity={0.85}>
            <View style={styles.avatar}>
              {avatarImageUri ? (
                <Image key={avatarImageUri} source={{ uri: avatarImageUri }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{getInitials(providerProfile.businessName)}</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: providerProfile.isOpen ? palette.success : palette.textMuted },
            ]}
          />
          <View>
            <Text style={styles.statusTitle}>
              {providerProfile.isOpen ? 'Open for bookings' : 'Closed'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {providerProfile.isOpen
                ? 'Customers can see and book you now'
                : 'Hidden from new bookings until reopened'}
            </Text>
          </View>
        </View>
        <Switch
          value={providerProfile.isOpen}
          onValueChange={handleToggleOpen}
          disabled={togglingOpen}
          trackColor={{ false: palette.border, true: palette.goldDim }}
          thumbColor={providerProfile.isOpen ? palette.gold : palette.textMuted}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={palette.gold} />
            <Text style={styles.loadingText}>Loading today&apos;s schedule...</Text>
          </View>
        ) : null}

        {!loading && pending.length > 0 ? (
          <TouchableOpacity
            style={styles.pendingBanner}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Appointments')}
          >
            <View style={styles.pendingBannerHeader}>
              <View style={styles.pendingBannerTitleRow}>
                <View style={styles.pendingPulse} />
                <Text style={styles.pendingBannerTitle}>
                  {pending.length} pending request{pending.length === 1 ? '' : 's'}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={palette.gold} />
            </View>
            <Text style={styles.pendingBannerSub}>
              New bookings need your response — review and accept to confirm.
            </Text>
            <View style={styles.pendingBannerBtn}>
              <Text style={styles.pendingBannerBtnText}>Review requests</Text>
              <Feather name="arrow-right" size={14} color={palette.bg} />
            </View>
          </TouchableOpacity>
        ) : null}

        {!loading && nextUp ? (
          <View style={styles.nextUpCard}>
            <Text style={styles.nextUpLabel}>Next confirmed booking</Text>
            <View style={styles.nextUpRow}>
              {nextUp.customerImg ? (
                <Image source={{ uri: resolveImageUrl(nextUp.customerImg) }} style={styles.nextUpAvatar} />
              ) : (
                <View style={[styles.nextUpAvatar, styles.nextUpAvatarPlaceholder]}>
                  <Feather name="user" size={18} color={palette.gold} />
                </View>
              )}
              <View style={styles.nextUpInfo}>
                <Text style={styles.nextUpName}>{nextUp.customerName}</Text>
                <Text style={styles.nextUpService}>{nextUp.service}</Text>
              </View>
              <Text style={styles.nextUpTime}>
                {isSameCalendarDay(nextUp.scheduledAt) ? nextUp.time : `${nextUp.date} · ${nextUp.time}`}
              </Text>
            </View>
            <View style={styles.nextUpActions}>
              {nextUp.customerPhone ? (
                <TouchableOpacity
                  style={styles.nextUpAction}
                  onPress={() => {
                    void openPhoneNumber(nextUp.customerPhone);
                  }}
                >
                  <Feather name="phone" size={14} color={palette.gold} />
                  <Text style={styles.nextUpActionText}>Call</Text>
                </TouchableOpacity>
              ) : null}
              {nextUp.customerPhone ? (
                <TouchableOpacity
                  style={styles.nextUpAction}
                  onPress={() => {
                    void openWhatsAppContact(nextUp.customerPhone);
                  }}
                >
                  <Feather name="message-circle" size={14} color="#25D366" />
                  <Text style={styles.nextUpActionText}>WhatsApp</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.nextUpAction, styles.nextUpActionPrimary]}
                onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: nextUp.id })}
              >
                <Feather name="eye" size={14} color={palette.gold} />
                <Text style={[styles.nextUpActionText, { color: palette.gold }]}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="This week" onSeeAll={() => navigation.navigate('Appointments')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysScroll}
          >
            {week.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.dayItem, item.isToday && styles.dayItemActive]}
                onPress={() => navigation.navigate('Appointments')}
              >
                <Text style={[styles.dayLabel, item.isToday && styles.dayLabelActive]}>
                  {item.isToday ? 'Today' : item.dayLabel}
                </Text>
                <Text style={[styles.dayDate, item.isToday && styles.dayDateActive]}>{item.dateNum}</Text>
                <Text style={[styles.dayMonth, item.isToday && styles.dayMonthActive]}>{item.monthLabel}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricTile}>
            <Text style={styles.metricValue}>{todayCount}</Text>
            <Text style={styles.metricLabel}>Today</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricValue}>{pending.length}</Text>
            <Text style={styles.metricLabel}>Pending</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricValue}>{completedCount}</Text>
            <Text style={styles.metricLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Confirmed bookings" onSeeAll={() => navigation.navigate('Appointments')} />
          {upcomingAppointments.length === 0 ? (
            <View style={styles.emptyPending}>
              <Feather name="calendar" size={28} color={palette.textMuted} />
              <Text style={styles.emptyPendingText}>No confirmed bookings yet.</Text>
              <Text style={styles.emptyPendingSubtext}>Accepted appointments will appear here.</Text>
            </View>
          ) : (
            upcomingAppointments.slice(0, 3).map((apt) => (
              <View key={apt.id} style={styles.confirmedCard}>
                <TouchableOpacity
                  style={styles.confirmedTopRow}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: apt.id })}
                >
                  {apt.customerImg ? (
                    <Image source={{ uri: resolveImageUrl(apt.customerImg) }} style={styles.confirmedAvatar} />
                  ) : (
                    <View style={[styles.confirmedAvatar, styles.confirmedAvatarPlaceholder]}>
                      <Feather name="user" size={16} color={palette.gold} />
                    </View>
                  )}
                  <View style={styles.confirmedInfo}>
                    <Text style={styles.confirmedName}>{apt.customerName}</Text>
                    <Text style={styles.confirmedService}>{apt.service}</Text>
                    <Text style={styles.confirmedMeta}>{apt.date} · {apt.time} ({apt.duration})</Text>
                  </View>
                  <View style={styles.confirmedRight}>
                    <Text style={styles.confirmedTime}>
                      {isSameCalendarDay(apt.scheduledAt) ? 'Today' : apt.date}
                    </Text>
                    <Text style={styles.confirmedPrice}>Ksh {apt.price.toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.confirmedActions}>
                  <TouchableOpacity
                    style={styles.confirmedAction}
                    onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: apt.id })}
                  >
                    <Feather name="eye" size={14} color={palette.textSecondary} />
                    <Text style={styles.confirmedActionText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmedAction, styles.confirmedActionPrimary]}
                    onPress={() => handleMarkCompleted(apt.id)}
                  >
                    <Feather name="check-circle" size={14} color={palette.gold} />
                    <Text style={[styles.confirmedActionText, { color: palette.gold }]}>Mark Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Quick actions" />
          <View style={styles.toolGrid}>
            {[
              { icon: 'scissors' as const, label: 'Services', action: () => navigation.navigate('Business', { screen: 'Services' }) },
              { icon: 'star' as const, label: 'Reviews', action: () => navigation.navigate('ProviderReviews') },
            ].map((tool) => (
              <TouchableOpacity
                key={tool.label}
                onPress={tool.action}
                style={styles.toolItem}
                activeOpacity={0.8}
              >
                <Feather name={tool.icon} size={22} color={palette.gold} />
                <Text style={styles.toolLabel}>{tool.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {!loading && todayUpcoming.length > 1 ? (
          <View style={styles.section}>
            <SectionHeader title="Later today" onSeeAll={() => navigation.navigate('Appointments')} />
            {todayUpcoming.slice(1).map((apt) => (
              <TouchableOpacity
                key={apt.id}
                style={styles.todayCard}
                onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: apt.id })}
              >
                {apt.customerImg ? (
                  <Image source={{ uri: resolveImageUrl(apt.customerImg) }} style={styles.todayAvatar} />
                ) : (
                  <View style={[styles.todayAvatar, styles.todayAvatarPlaceholder]}>
                    <Feather name="user" size={16} color={palette.gold} />
                  </View>
                )}
                <View style={styles.todayInfo}>
                  <Text style={styles.todayName}>{apt.customerName}</Text>
                  <Text style={styles.todayService}>{apt.service}</Text>
                </View>
                <View style={styles.todayRight}>
                  <Text style={styles.todayTime}>{apt.time}</Text>
                  <Text style={styles.todayPrice}>Ksh {apt.price.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={[styles.section, { marginBottom: 100 }]}>
          <SectionHeader
            title="Pending requests"
            badge={pending.length}
            onSeeAll={() => navigation.navigate('Appointments')}
          />
          {pending.length === 0 ? (
            <View style={styles.emptyPending}>
              <Feather name="check-circle" size={28} color={palette.success} />
              <Text style={styles.emptyPendingText}>You&apos;re all caught up!</Text>
              <Text style={styles.emptyPendingSubtext}>No pending requests at the moment.</Text>
            </View>
          ) : (
            pending.slice(0, 2).map((req) => (
              <TouchableOpacity
                key={req.id}
                style={styles.requestCard}
                onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: req.id })}
              >
                <View style={styles.reqHeader}>
                  <View style={styles.reqUser}>
                    {req.customerImg ? (
                      <Image source={{ uri: resolveImageUrl(req.customerImg) }} style={styles.reqAvatar} />
                    ) : (
                      <View style={[styles.reqAvatar, styles.reqAvatarPlaceholder]}>
                        <Feather name="user" size={16} color={palette.gold} />
                      </View>
                    )}
                    <View>
                      <Text style={styles.reqName}>{req.customerName}</Text>
                      <Text style={[styles.reqBadge, { color: req.isNewClient ? palette.gold : palette.textSecondary }]}>
                        {req.isNewClient ? 'New client' : `Returning · ${req.pastVisits ?? 0} visits`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.agoBadge}>
                    <Text style={styles.agoText}>{req.ago}</Text>
                  </View>
                </View>
                <View style={styles.serviceBox}>
                  <View style={styles.serviceBoxTop}>
                    <Text style={styles.serviceBoxName}>{req.service}</Text>
                    <Text style={styles.serviceBoxPrice}>Ksh {req.price.toLocaleString()}</Text>
                  </View>
                  <View style={styles.serviceBoxMeta}>
                    <View style={styles.serviceMetaItem}>
                      <Feather name="calendar" size={11} color={palette.gold} />
                      <Text style={styles.serviceMetaText}>{req.date}</Text>
                    </View>
                    <View style={styles.serviceMetaItem}>
                      <Feather name="clock" size={11} color={palette.gold} />
                      <Text style={styles.serviceMetaText}>{req.time} ({req.duration})</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.tapHint}>Tap to view & respond →</Text>
              </TouchableOpacity>
            ))
          )}
          {pending.length > 2 && (
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('Appointments')}>
              <Text style={styles.viewAllText}>View {pending.length - 2} more requests</Text>
              <Feather name="arrow-right" size={14} color={palette.gold} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </View>
  );
}
