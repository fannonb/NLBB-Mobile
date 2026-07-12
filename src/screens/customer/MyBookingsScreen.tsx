import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Shadow } from '../../constants/theme';
import { BookingStatus } from '../../types';
import { bookingApi, toCustomerBookingCard, CustomerBookingCard } from '../../lib/api/bookings';
import { providerApi } from '../../lib/api/providers';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import FeedbackModalHost from '../../components/FeedbackModalHost';
import Toast from '../../components/Toast';
import CustomerAppHeader from '../../components/CustomerAppHeader';
import { useModalManager } from '../../hooks/useModalManager';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { openPhoneNumber, openWhatsAppContact } from '../../lib/contactActions';

type DisplayBooking = CustomerBookingCard & {
  providerPhone?: string | null;
  providerWhatsapp?: string | null;
};

const TABS: { key: BookingStatus; label: string }[] = [
  { key: 'confirmed', label: 'Upcoming' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Declined' },
  { key: 'completed', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

function normalizeBooking(booking: CustomerBookingCard): DisplayBooking {
  return {
    ...booking,
    providerPhone: booking.providerPhone ?? null,
    providerWhatsapp: booking.providerWhatsapp ?? null,
  };
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const config: Record<BookingStatus, { label: string; color: string; bg: string; border: string }> = {
    confirmed: { label: 'Confirmed', color: Colors.gold, bg: Colors.goldDim, border: Colors.goldBorder },
    pending: { label: 'Pending', color: Colors.textSecondary, bg: 'rgba(0,0,0,0.04)', border: Colors.border },
    rejected: { label: 'Declined', color: Colors.error, bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
    completed: { label: 'Completed', color: Colors.success, bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
    cancelled: { label: 'Cancelled', color: Colors.textMuted, bg: 'rgba(107,114,128,0.1)', border: Colors.border },
  };
  const c = config[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

export default function MyBookingsScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { isLoggedIn, requireAuth } = useRequireAuth();
  const { customerNotifications, hydrateCustomerNotifications } = useAppStore();
  const unreadCount = customerNotifications.filter((n) => !n.isRead).length;
  const [activeTab, setActiveTab] = useState<BookingStatus>('confirmed');
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [bookings, setBookings] = useState<DisplayBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false, message: '', type: 'success',
  });
  const highlightedBookingId = route?.params?.bookingId as string | undefined;
  const { modal, showError, showInfo, hideModal } = useModalManager();

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      setBookings([]);
      return;
    }

    let active = true;

    const loadBookings = async () => {
      setLoading(true);
      try {
        const response = await bookingApi.listMyBookings();
        if (!active) return;
        setBookings(response.map((booking) => normalizeBooking(toCustomerBookingCard(booking))));
      } catch {
        if (active) {
          setBookings([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadBookings();

    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    hydrateCustomerNotifications();
  }, [hydrateCustomerNotifications]);

  useEffect(() => {
    if (!highlightedBookingId || bookings.length === 0) {
      return;
    }

    const targetBooking = bookings.find((booking) => booking.id === highlightedBookingId);
    if (targetBooking) {
      setActiveTab(targetBooking.status);
    }
  }, [bookings, highlightedBookingId]);

  const filtered = useMemo(
    () => bookings.filter((booking) => booking.status === activeTab),
    [activeTab, bookings]
  );

  const tabCounts = useMemo(
    () => ({
      confirmed: bookings.filter((booking) => booking.status === 'confirmed').length,
      pending: bookings.filter((booking) => booking.status === 'pending').length,
      rejected: bookings.filter((booking) => booking.status === 'rejected').length,
      completed: bookings.filter((booking) => booking.status === 'completed').length,
      cancelled: bookings.filter((booking) => booking.status === 'cancelled').length,
    }),
    [bookings]
  );

  const handleCancel = async (id: string) => {
    try {
      const updated = await bookingApi.updateBookingStatus(id, 'cancelled');
      const normalized = normalizeBooking(toCustomerBookingCard(updated));
      setBookings((current) => current.map((booking) => (booking.id === id ? normalized : booking)));
      setToast({ visible: true, message: 'Booking cancelled.', type: 'info' });
    } catch (error: any) {
      showError('Could Not Cancel Booking', error?.message ?? 'Please try again.');
    } finally {
      setCancelConfirm(null);
    }
  };

  const resolveProviderContact = async (booking: DisplayBooking) => {
    if (booking.providerPhone || booking.providerWhatsapp) {
      return booking;
    }

    try {
      const provider = await providerApi.getProvider(booking.providerId);
      return {
        ...booking,
        providerPhone: provider.phone ?? null,
        providerWhatsapp: provider.whatsapp ?? null,
      };
    } catch {
      return booking;
    }
  };

  const openPhone = async (booking: DisplayBooking) => {
    const resolved = await resolveProviderContact(booking);
    const phone = resolved.providerPhone ?? resolved.providerWhatsapp ?? '';
    if (!phone) {
      showInfo('No Contact', 'Contact number is not available for this provider.');
      return;
    }
    const ok = await openPhoneNumber(phone);
    if (ok) {
      return;
    }
    showError('Unable to Open', 'Phone calling is not supported on your device.');
  };

  const openWhatsApp = async (booking: DisplayBooking) => {
    const resolved = await resolveProviderContact(booking);
    const phone = resolved.providerWhatsapp ?? resolved.providerPhone ?? '';
    if (!phone) {
      showInfo('No WhatsApp', 'WhatsApp number is not available for this provider.');
      return;
    }
    const ok = await openWhatsAppContact(phone);
    if (ok) {
      return;
    }
    showError('WhatsApp Not Found', 'Please install WhatsApp to message the provider.');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast((t) => ({ ...t, visible: false }))} />

      <CustomerAppHeader
        variant="page"
        navigation={navigation}
        unreadCount={unreadCount}
        avatarUri={user?.avatar}
        title="My Bookings"
        pageSubtitle="Upcoming visits & history"
        onNotifPress={() => requireAuth('notifications', () => navigation.navigate('Notifications'))}
      />

      {!isLoggedIn ? (
        <EmptyState
          icon="calendar"
          title="Sign in to see bookings"
          message="Browse providers freely, then sign in when you are ready to book and track your appointments."
          ctaLabel="Sign in to continue"
          onCta={() => requireAuth('bookings')}
        />
      ) : (
        <>
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {(tabCounts[tab.key] ?? 0) > 0 && (
                <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                    {tabCounts[tab.key]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, filtered.length === 0 && !loading && { flex: 1 }]}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={Colors.gold} />
            <Text style={styles.loadingText}>Loading your bookings...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="calendar"
            title={activeTab === 'confirmed' ? 'No upcoming bookings' : activeTab === 'pending' ? 'No pending bookings' : 'Nothing here yet'}
            message={
              activeTab === 'confirmed'
                ? 'Explore providers and book your next appointment.'
                : `Your ${activeTab} bookings will appear here.`
            }
            ctaLabel={activeTab === 'confirmed' ? 'Explore Providers' : undefined}
            onCta={activeTab === 'confirmed' ? () => navigation.navigate('Explore') : undefined}
          />
        ) : (
          filtered.map((booking) => (
            <View
              key={booking.id}
              style={[styles.card, booking.id === highlightedBookingId && styles.cardHighlighted]}
            >
              {booking.id === highlightedBookingId ? (
                <View style={styles.linkedBadge}>
                  <Feather name="bell" size={10} color={Colors.gold} />
                  <Text style={styles.linkedBadgeText}>Opened from notification</Text>
                </View>
              ) : null}
              <View style={styles.dateRow}>
                <View style={styles.dateIcon}>
                  <Feather
                    name={booking.status === 'confirmed' ? 'calendar' : 'clock'}
                    size={18}
                    color={booking.status === 'confirmed' ? Colors.gold : Colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateText}>{booking.date}</Text>
                  <Text style={styles.timeText}>{booking.time} - {booking.endTime}</Text>
                </View>
                <StatusBadge status={booking.status} />
              </View>

              <Text style={styles.refText}>{booking.ref}</Text>

              <View style={styles.providerRow}>
                {booking.providerImage ? (
                  <Image source={{ uri: booking.providerImage }} style={styles.providerImg} />
                ) : (
                  <View style={[styles.providerImg, styles.providerImgPlaceholder]}>
                    <Feather name="scissors" size={18} color={Colors.gold} />
                  </View>
                )}
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{booking.providerName}</Text>
                  <Text style={styles.serviceName}>{booking.serviceName}</Text>
                  <View style={styles.priceRow}>
                    <Feather name="credit-card" size={10} color={booking.status === 'confirmed' ? Colors.gold : Colors.textMuted} />
                    <Text style={[styles.price, { color: booking.status === 'confirmed' ? Colors.gold : Colors.textSecondary }]}>
                      Ksh {booking.servicePrice.toLocaleString()}
                    </Text>
                  </View>
                </View>
                {(booking.status === 'confirmed' || booking.status === 'pending') && (
                  <View style={styles.contactCol}>
                    <TouchableOpacity style={styles.contactBtn} onPress={() => openPhone(booking)}>
                      <Feather name="phone" size={13} color={Colors.gold} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.contactBtn, styles.whatsappBtn]} onPress={() => openWhatsApp(booking)}>
                      <Feather name="message-circle" size={13} color="#25D366" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {booking.status === 'confirmed' && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.viewProviderBtn}
                    onPress={() => navigation.navigate('ProviderDetails', { providerId: booking.providerId })}
                  >
                    <Text style={styles.viewProviderText}>View Provider</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setCancelConfirm(booking.id)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
              {booking.status === 'pending' && (
                <TouchableOpacity style={styles.cancelBtnFull} onPress={() => setCancelConfirm(booking.id)}>
                  <Text style={styles.cancelBtnText}>Cancel Request</Text>
                </TouchableOpacity>
              )}
              {booking.status === 'completed' && (
                booking.reviewId ? (
                  <View style={styles.reviewedBadge}>
                    <Feather name="check-circle" size={14} color={Colors.success} />
                    <Text style={styles.reviewedBadgeText}>Review Submitted</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() =>
                      navigation.navigate('WriteReview', {
                        providerId: booking.providerId,
                        providerName: booking.providerName,
                        providerImage: booking.providerImage,
                        serviceName: booking.serviceName,
                        bookingId: booking.id,
                      })
                    }
                  >
                    <Feather name="star" size={14} color={Colors.gold} />
                    <Text style={styles.reviewBtnText}>Write a Review</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          ))
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!cancelConfirm}
        title="Cancel Booking?"
        message="Are you sure you want to cancel this booking? This cannot be undone."
        isDanger
        confirmLabel="Cancel Booking"
        onConfirm={() => cancelConfirm && handleCancel(cancelConfirm)}
        onCancel={() => setCancelConfirm(null)}
      />
      <FeedbackModalHost modal={modal} onDismiss={hideModal} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  tabsContainer: { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingTop: 12 },
  tabs: { paddingHorizontal: 24, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 12, paddingHorizontal: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.gold },
  tabText: { color: Colors.textMuted, fontFamily: Fonts.sansMedium, fontSize: 14 },
  tabTextActive: { color: Colors.gold, fontFamily: Fonts.sansBold },
  tabBadge: { backgroundColor: Colors.border, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: Colors.gold },
  tabBadgeText: { color: Colors.textMuted, fontSize: 10, fontFamily: Fonts.sansBold },
  tabBadgeTextActive: { color: Colors.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, gap: 16 },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 24 },
  loadingText: { color: Colors.textSecondary, fontFamily: Fonts.sans, fontSize: 14 },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 16,
    gap: 12, borderWidth: 1, borderColor: Colors.border, ...Shadow.card,
  },
  cardHighlighted: {
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  linkedBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.goldDim,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  linkedBadgeText: {
    color: Colors.gold,
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
  },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 12,
  },
  dateIcon: {
    width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  dateText: { color: Colors.textPrimary, fontFamily: Fonts.sansBold, fontSize: 14 },
  timeText: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1,
  },
  badgeText: { fontFamily: Fonts.sansBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  refText: { color: Colors.textMuted, fontSize: 11, fontFamily: Fonts.sans },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  providerImg: { width: 56, height: 56, borderRadius: Radius.md, resizeMode: 'cover', borderWidth: 1, borderColor: Colors.border },
  providerImgPlaceholder: { backgroundColor: Colors.goldDim, alignItems: 'center', justifyContent: 'center' },
  providerInfo: { flex: 1 },
  providerName: { color: Colors.textPrimary, fontFamily: Fonts.serifMedium, fontSize: 15, marginBottom: 2 },
  serviceName: { color: Colors.textSecondary, fontSize: 12, marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  price: { fontFamily: Fonts.sansMedium, fontSize: 12 },
  contactCol: { flexDirection: 'column', gap: 8 },
  contactBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.goldDim,
    borderWidth: 1, borderColor: Colors.goldBorder, alignItems: 'center', justifyContent: 'center',
  },
  whatsappBtn: { backgroundColor: 'rgba(37,211,102,0.1)', borderColor: 'rgba(37,211,102,0.35)' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  viewProviderBtn: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.bg,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  viewProviderText: { color: Colors.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 12 },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  cancelBtnFull: { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { color: Colors.error, fontFamily: Fonts.sansMedium, fontSize: 12 },
  reviewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.goldBorder, backgroundColor: Colors.goldDim,
  },
  reviewBtnText: { color: Colors.gold, fontFamily: Fonts.sansMedium, fontSize: 13 },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  reviewedBadgeText: { color: Colors.success, fontFamily: Fonts.sansMedium, fontSize: 13 },
});
