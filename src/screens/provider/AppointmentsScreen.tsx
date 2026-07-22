import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { resolveImageUrl } from '../../lib/config';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import InfoModal from '../../components/InfoModal';
import ProviderNotifButton from '../../components/ProviderNotifButton';
import Toast from '../../components/Toast';
import { toProviderAppointmentCard, ProviderAppointmentCard, ProviderAppointmentStatus } from '../../lib/api/bookings';
import { openPhoneNumber, openWhatsAppContact } from '../../lib/contactActions';
import { useBookingDataStore } from '../../store/bookingDataStore';
import { useAppStore } from '../../store/appStore';

type TabType = 'all' | ProviderAppointmentStatus;
type ManageableAppointmentStatus = Exclude<ProviderAppointmentStatus, 'pending'>;

function getStatusConfig(p: ColorPalette): Record<ProviderAppointmentStatus, { label: string; color: string; bg: string }> {
  return {
    upcoming: { label: 'Upcoming', color: p.gold, bg: p.goldDim },
    pending: { label: 'Pending', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
    completed: { label: 'Completed', color: p.success, bg: 'rgba(34,197,94,0.1)' },
    declined: { label: 'Declined', color: p.error, bg: 'rgba(220,38,38,0.1)' },
    cancelled: { label: 'Cancelled', color: p.textMuted, bg: 'rgba(107,114,128,0.1)' },
  };
}

async function callPhone(phone: string, showInfo: (title: string, message: string) => void) {
  if (!phone) {
    showInfo('No Phone Number', 'This customer did not share a phone number yet.');
    return;
  }
  const ok = await openPhoneNumber(phone);
  if (ok) return;
  showInfo('Cannot Call', 'Phone calling is not available on this device.');
}

async function openWhatsApp(phone: string, showInfo: (title: string, message: string) => void) {
  if (!phone) {
    showInfo('No WhatsApp Number', 'This customer did not share a contact number yet.');
    return;
  }
  const ok = await openWhatsAppContact(phone);
  if (ok) return;
  showInfo('WhatsApp Not Found', 'Please install WhatsApp to message clients.');
}

const toBackendAction = (status: ManageableAppointmentStatus) => {
  if (status === 'upcoming') return 'accepted';
  if (status === 'declined') return 'declined';
  return status;
};

function createAppointmentsStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 24, paddingVertical: 12,
    },
    heading: { fontFamily: Fonts.serifMedium, fontSize: 24, color: p.textPrimary, flex: 1 },
    tabsContainer: { borderBottomWidth: 1, borderBottomColor: p.border, maxHeight: 52 },
    tabs: { paddingHorizontal: 24, gap: 4 },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, paddingBottom: 14, paddingTop: 4 },
    tabActive: { borderBottomWidth: 2, borderBottomColor: p.gold },
    tabText: { color: p.textMuted, fontFamily: Fonts.sansMedium, fontSize: 14 },
    tabTextActive: { color: p.gold, fontFamily: Fonts.sansBold },
    tabBadge: {
      backgroundColor: p.border, borderRadius: 10,
      paddingHorizontal: 7, paddingVertical: 2,
    },
    tabBadgeActive: { backgroundColor: p.gold },
    tabBadgeText: { color: p.textMuted, fontSize: 10, fontFamily: Fonts.sansBold },
    tabBadgeTextActive: { color: p.bg },
    scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, gap: 16 },
    loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 24 },
    loadingText: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 14 },
    card: {
      backgroundColor: p.card, borderRadius: Radius.xl, padding: 16,
      gap: 14, borderWidth: 1, borderColor: p.border, ...s.soft,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    dateText: { color: p.textPrimary, fontFamily: Fonts.sansBold, fontSize: 15, marginBottom: 3 },
    timeText: { color: p.textSecondary, fontSize: 12 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
    statusText: { fontFamily: Fonts.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
    customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    customerAvatar: { width: 44, height: 44, borderRadius: 22 },
    customerAvatarPlaceholder: { backgroundColor: p.goldDim, alignItems: 'center', justifyContent: 'center' },
    customerInfo: { flex: 1 },
    customerName: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14, marginBottom: 2 },
    serviceText: { color: p.textSecondary, fontSize: 13, marginBottom: 2 },
    clientBadge: { color: p.textMuted, fontSize: 11 },
    price: { color: p.gold, fontFamily: Fonts.sansBold, fontSize: 15 },
    notesRow: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      backgroundColor: p.cardInner, borderRadius: Radius.md, padding: 10,
      borderWidth: 1, borderColor: p.border,
    },
    notesText: { color: p.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },
    actionsRow: { flexDirection: 'row', gap: 10 },
    declineBtn: {
      flex: 1, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: p.bg,
      borderWidth: 1, borderColor: p.border, alignItems: 'center',
    },
    declineText: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 12 },
    acceptBtn: {
      flex: 2, paddingVertical: 10, borderRadius: Radius.md,
      backgroundColor: p.gold, alignItems: 'center', ...s.gold,
    },
    acceptText: { color: p.bg, fontFamily: Fonts.sansBold, fontSize: 12 },
    contactBtn: {
      flex: 1, flexDirection: 'row', gap: 5, paddingVertical: 10,
      borderRadius: Radius.md, borderWidth: 1, borderColor: p.goldBorder,
      alignItems: 'center', justifyContent: 'center',
    },
    whatsappBtn: {
      flex: 1, flexDirection: 'row', gap: 5, paddingVertical: 10,
      borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(37,211,102,0.35)',
      alignItems: 'center', justifyContent: 'center',
    },
    contactText: { color: p.gold, fontFamily: Fonts.sansMedium, fontSize: 12 },
    completeBtn: {
      flex: 2, paddingVertical: 10, borderRadius: Radius.md,
      backgroundColor: p.card, borderWidth: 1, borderColor: p.border, alignItems: 'center',
    },
    completeText: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 12 },
  });
}

export default function AppointmentsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createAppointmentsStyles(palette, shadow), [palette, shadow]);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const bookingRecords = useBookingDataStore((state) => state.records);
  const loading = useBookingDataStore((state) => state.loading);
  const loadedAt = useBookingDataStore((state) => state.loadedAt);
  const loadMyBookings = useBookingDataStore((state) => state.loadMyBookings);
  const updateBookingStatus = useBookingDataStore((state) => state.updateBookingStatus);
  const [confirm, setConfirm] = useState<{ id: string; action: ManageableAppointmentStatus; title: string; msg: string } | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false, message: '', type: 'success',
  });
  const [infoModal, setInfoModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });

  const showInfo = (title: string, message: string) => {
    setInfoModal({ visible: true, title, message });
  };

  useFocusEffect(
    useCallback(() => {
      void loadMyBookings();
      void useAppStore.getState().hydrateProviderNotifications({ force: true });
    }, [loadMyBookings])
  );

  const appointments = useMemo(
    () => bookingRecords.map((booking) => toProviderAppointmentCard(booking)),
    [bookingRecords]
  );

  const filtered = useMemo(
    () => (activeTab === 'all' ? appointments : appointments.filter((a) => a.status === activeTab)),
    [appointments, activeTab]
  );
  const isLoadingAppointments = loading || (loadedAt === 0 && appointments.length === 0);

  const counts = useMemo(() => ({
    all: appointments.length,
    upcoming: appointments.filter((a) => a.status === 'upcoming').length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    declined: appointments.filter((a) => a.status === 'declined').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
  }), [appointments]);

  useEffect(() => {
    if (
      activeTab === 'upcoming' &&
      counts.upcoming === 0 &&
      counts.pending > 0
    ) {
      setActiveTab('pending');
    }
  }, [activeTab, counts.pending, counts.upcoming]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const handleAction = (id: string, action: ManageableAppointmentStatus, title: string, msg: string) => {
    setConfirm({ id, action, title, msg });
  };

  const executeAction = async () => {
    if (!confirm) return;
    const pending = confirm;
    setConfirm(null);

    try {
      await updateBookingStatus(pending.id, toBackendAction(pending.action));
      void useAppStore.getState().hydrateProviderNotifications({ force: true });

      const messages: Record<ProviderAppointmentStatus, string> = {
        upcoming: 'Booking accepted - client notified.',
        declined: 'Booking declined.',
        completed: 'Appointment marked as complete.',
        cancelled: 'Appointment cancelled.',
        pending: '',
      };
      showToast(messages[pending.action] || 'Status updated.');
    } catch (error: any) {
      showInfo('Could Not Update Booking', error?.message ?? 'Please try again.');
    }
  };

  const TABS: { key: TabType; label: string }[] = [
    { key: 'pending', label: 'Requests' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'declined', label: 'Declined' },
    { key: 'completed', label: 'Completed' },
    { key: 'all', label: 'All' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />

      <View style={styles.header}>
        <Text style={styles.heading}>Appointments</Text>
        <ProviderNotifButton />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={styles.tabsContainer}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {counts[tab.key] > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                  {counts[tab.key]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, filtered.length === 0 && !isLoadingAppointments && { flex: 1 }]}>
        {isLoadingAppointments ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={palette.gold} />
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={activeTab === 'pending' ? 'inbox' : 'calendar'}
            title={activeTab === 'pending' ? 'No pending requests' : 'No appointments'}
            message={
              activeTab === 'pending'
                ? 'New booking requests from customers will appear here.'
                : `Your ${activeTab} appointments will appear here.`
            }
          />
        ) : (
          filtered.map((apt) => (
            <AppointmentCard
              key={apt.id}
              apt={apt}
              styles={styles}
              palette={palette}
              onAccept={() =>
                handleAction(apt.id, 'upcoming', 'Accept Booking?', `Accept ${apt.customerName}'s booking for ${apt.service}?`)
              }
              onDecline={() =>
                handleAction(apt.id, 'declined', 'Decline Booking?', `Decline ${apt.customerName}'s request? They will be notified.`)
              }
              onComplete={() =>
                handleAction(apt.id, 'completed', 'Mark Complete?', `Mark ${apt.customerName}'s appointment as completed?`)
              }
              onCancel={() =>
                handleAction(apt.id, 'cancelled', 'Cancel Appointment?', `Cancel ${apt.customerName}'s upcoming appointment?`)
              }
              onCall={() => callPhone(apt.customerPhone, showInfo)}
              onWhatsApp={() => openWhatsApp(apt.customerPhone, showInfo)}
              onViewDetail={() => navigation.navigate('AppointmentDetail', { appointmentId: apt.id })}
            />
          ))
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!confirm}
        title={confirm?.title ?? ''}
        message={confirm?.msg ?? ''}
        isDanger={confirm?.action === 'declined' || confirm?.action === 'cancelled'}
        confirmLabel={confirm?.action === 'declined' ? 'Decline' : confirm?.action === 'cancelled' ? 'Cancel' : 'Confirm'}
        onConfirm={executeAction}
        onCancel={() => setConfirm(null)}
      />

      <InfoModal
        visible={infoModal.visible}
        title={infoModal.title}
        message={infoModal.message}
        onDismiss={() => setInfoModal((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

function AppointmentCard({
  apt, styles, palette, onAccept, onDecline, onComplete, onCancel, onCall, onWhatsApp, onViewDetail,
}: {
  apt: ProviderAppointmentCard;
  styles: any;
  palette: ColorPalette;
  onAccept: () => void;
  onDecline: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
  onViewDetail: () => void;
}) {
  const statusConfig = useMemo(() => getStatusConfig(palette), [palette]);
  const sc = statusConfig[apt.status];
  return (
    <TouchableOpacity style={styles.card} onPress={onViewDetail} activeOpacity={0.9}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.dateText}>{apt.date}</Text>
          <Text style={styles.timeText}>{apt.time} · {apt.duration}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
        </View>
      </View>

      <View style={styles.customerRow}>
        {apt.customerImg ? (
          <Image source={{ uri: resolveImageUrl(apt.customerImg) }} style={styles.customerAvatar} />
        ) : (
          <View style={[styles.customerAvatar, styles.customerAvatarPlaceholder]}>
            <Feather name="user" size={18} color={palette.gold} />
          </View>
        )}
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{apt.customerName}</Text>
          <Text style={styles.serviceText}>{apt.service}</Text>
          <Text style={styles.clientBadge}>
            {apt.isNewClient ? 'New client' : `Returning · ${apt.pastVisits ?? 0} past visits`}
          </Text>
        </View>
        <Text style={styles.price}>Ksh {apt.price.toLocaleString()}</Text>
      </View>

      {apt.notes ? (
        <View style={styles.notesRow}>
          <Feather name="file-text" size={12} color={palette.textMuted} />
          <Text style={styles.notesText} numberOfLines={2}>{apt.notes}</Text>
        </View>
      ) : null}

      {apt.status === 'pending' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
            <Text style={styles.acceptText}>Accept Booking</Text>
          </TouchableOpacity>
        </View>
      )}
      {apt.status === 'upcoming' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.contactBtn} onPress={onCall}>
            <Feather name="phone" size={14} color={palette.gold} />
            <Text style={styles.contactText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.whatsappBtn} onPress={onWhatsApp}>
            <Feather name="message-circle" size={14} color="#25D366" />
            <Text style={[styles.contactText, { color: '#25D366' }]}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.completeBtn} onPress={onComplete}>
            <Text style={styles.completeText}>Mark Done</Text>
          </TouchableOpacity>
        </View>
      )}
      {apt.status === 'declined' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.contactBtn} onPress={onCall}>
            <Feather name="phone" size={14} color={palette.gold} />
            <Text style={styles.contactText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.whatsappBtn} onPress={onWhatsApp}>
            <Feather name="message-circle" size={14} color="#25D366" />
            <Text style={[styles.contactText, { color: '#25D366' }]}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.completeBtn} onPress={onCancel}>
            <Text style={styles.completeText}>Cancel Slot</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}
