import React, { useEffect, useMemo, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { resolveImageUrl } from '../../lib/config';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import ConfirmModal from '../../components/ConfirmModal';
import InfoModal from '../../components/InfoModal';
import Toast from '../../components/Toast';
import { useModalManager } from '../../hooks/useModalManager';
import { bookingApi, toProviderAppointmentCard, ProviderAppointmentCard, ProviderAppointmentStatus } from '../../lib/api/bookings';
import { openPhoneNumber, openWhatsAppContact } from '../../lib/contactActions';

async function callPhone(phone: string, showInfo: (title: string, message: string) => void) {
  if (!phone) {
    showInfo('No Phone Number', 'Calling is not available for this booking.');
    return;
  }
  const ok = await openPhoneNumber(phone);
  if (ok) return;
  showInfo('Cannot Call', 'Calling is not available on this device.');
}

async function openWhatsApp(phone: string, showInfo: (title: string, message: string) => void) {
  if (!phone) {
    showInfo('No WhatsApp Number', 'Messaging is not available for this booking.');
    return;
  }
  const ok = await openWhatsAppContact(phone);
  if (ok) return;
  showInfo('WhatsApp Not Found', 'Please install WhatsApp to message clients.');
}

type ManageableAppointmentStatus = Exclude<ProviderAppointmentStatus, 'pending'>;

const actionToBackend = (status: ManageableAppointmentStatus) => {
  if (status === 'upcoming') return 'accepted';
  if (status === 'declined') return 'declined';
  return status;
};

function getStatusColors(p: ColorPalette): Record<ProviderAppointmentStatus, { color: string; bg: string; label: string }> {
  return {
    upcoming: { color: p.gold, bg: p.goldDim, label: 'Upcoming' },
    pending: { color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', label: 'Pending Approval' },
    completed: { color: p.success, bg: 'rgba(34,197,94,0.1)', label: 'Completed' },
    declined: { color: p.error, bg: 'rgba(220,38,38,0.1)', label: 'Declined' },
    cancelled: { color: p.textMuted, bg: 'rgba(107,114,128,0.1)', label: 'Cancelled' },
  };
}

function createDetailStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 14 },
    centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    notFoundText: { color: p.textMuted, fontFamily: Fonts.sans, fontSize: 14 },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 24, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: p.border,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: p.card, alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
      flex: 1, textAlign: 'center',
      fontFamily: Fonts.serifMedium, fontSize: 18, color: p.textPrimary,
    },
    scroll: { padding: 24, gap: 16, paddingBottom: 40 },
    statusBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: Radius.lg, padding: 14, borderWidth: 1,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusLabel: { fontFamily: Fonts.sansBold, fontSize: 14 },
    card: {
      backgroundColor: p.card, borderRadius: Radius.xl, padding: 20,
      borderWidth: 1, borderColor: p.border, gap: 14, ...s.soft,
    },
    cardTitle: { fontFamily: Fonts.serifMedium, fontSize: 16, color: p.textPrimary },
    customerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: p.border },
    avatarPlaceholder: { backgroundColor: p.goldDim, alignItems: 'center', justifyContent: 'center' },
    customerInfo: { flex: 1 },
    customerName: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 16, marginBottom: 2 },
    customerMeta: { color: p.textSecondary, fontSize: 12, marginBottom: 2 },
    customerPhone: { color: p.textMuted, fontSize: 12 },
    contactBtns: { flexDirection: 'row', gap: 10 },
    contactBtn: {
      flex: 1, flexDirection: 'row', gap: 8, paddingVertical: 11,
      borderRadius: Radius.md, borderWidth: 1, borderColor: p.goldBorder,
      alignItems: 'center', justifyContent: 'center',
    },
    whatsappBtn: { borderColor: 'rgba(37,211,102,0.35)' },
    contactBtnText: { color: p.gold, fontFamily: Fonts.sansMedium, fontSize: 13 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    detailIcon: {
      width: 32, height: 32, borderRadius: 16, backgroundColor: p.goldDim,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    detailLabel: { color: p.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 },
    detailValue: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14, marginTop: 2 },
    notesBox: { backgroundColor: p.cardInner, borderRadius: Radius.md, padding: 14, borderWidth: 1, borderColor: p.border },
    notesText: { color: p.textSecondary, fontSize: 14, lineHeight: 22 },
    actionsBlock: { gap: 12 },
    acceptBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      backgroundColor: p.gold, borderRadius: Radius.lg, paddingVertical: 16, ...s.gold,
    },
    acceptBtnText: { color: p.bg, fontFamily: Fonts.sansBold, fontSize: 15 },
    declineBtn: {
      paddingVertical: 14, borderRadius: Radius.lg, borderWidth: 1,
      borderColor: 'rgba(220,38,38,0.3)', alignItems: 'center',
    },
    declineBtnText: { color: p.error, fontFamily: Fonts.sansMedium, fontSize: 14 },
    completeBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      backgroundColor: p.success, borderRadius: Radius.lg, paddingVertical: 16,
    },
    completeBtnText: { color: '#fff', fontFamily: Fonts.sansBold, fontSize: 15 },
    cancelBtn: { paddingVertical: 14, alignItems: 'center' },
    cancelBtnText: { color: p.textMuted, fontFamily: Fonts.sansMedium, fontSize: 14 },
  });
}

export default function AppointmentDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createDetailStyles(palette, shadow), [palette, shadow]);
  const { appointmentId } = route.params ?? {};
  const [appointment, setAppointment] = useState<ProviderAppointmentCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{ action: ManageableAppointmentStatus; title: string; msg: string } | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false, message: '', type: 'success',
  });
  const [infoModal, setInfoModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });
  const { showInfo: showInfoFromHook } = useModalManager();

  const showInfo = (title: string, message: string) => {
    setInfoModal({ visible: true, title, message });
  };

  useEffect(() => {
    let active = true;

    const loadAppointment = async () => {
      setLoading(true);
      try {
        const response = await bookingApi.listMyBookings();
        if (!active) return;
        const found = response.map((booking) => toProviderAppointmentCard(booking)).find((item) => item.id === appointmentId);
        setAppointment(found ?? null);
      } catch {
        if (active) {
          setAppointment(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAppointment();

    return () => {
      active = false;
    };
  }, [appointmentId]);

  const statusColors = useMemo(() => getStatusColors(palette), [palette]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={palette.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment Detail</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={palette.gold} />
          <Text style={styles.loadingText}>Loading appointment details...</Text>
        </View>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <View style={styles.centred}>
          <Text style={styles.notFoundText}>Appointment not found.</Text>
        </View>
      </View>
    );
  }

  const sc = statusColors[appointment.status];

  const handleAction = (action: ManageableAppointmentStatus, title: string, msg: string) => {
    setConfirm({ action, title, msg });
  };

  const executeAction = async () => {
    if (!confirm) return;
    try {
      const updated = await bookingApi.updateBookingStatus(appointment.id, actionToBackend(confirm.action));
      setAppointment(toProviderAppointmentCard(updated));
      const msgs: Record<ProviderAppointmentStatus, string> = {
        upcoming: 'Booking accepted.',
        declined: 'Booking declined.',
        completed: 'Marked as completed.',
        cancelled: 'Appointment cancelled.',
        pending: '',
      };
      setToast({ visible: true, message: msgs[confirm.action], type: 'success' });
      if (confirm.action !== 'completed') {
        setTimeout(() => navigation.goBack(), 1200);
      }
    } catch (error: any) {
      showInfo('Could Not Update Booking', error?.message ?? 'Please try again.');
    } finally {
      setConfirm(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast((t) => ({ ...t, visible: false }))} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.statusBanner, { backgroundColor: sc.bg, borderColor: sc.color + '44' }]}>
          <View style={[styles.statusDot, { backgroundColor: sc.color }]} />
          <Text style={[styles.statusLabel, { color: sc.color }]}>{sc.label}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <View style={styles.customerRow}>
            {appointment.customerImg ? (
              <Image source={{ uri: resolveImageUrl(appointment.customerImg) }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Feather name="user" size={20} color={palette.gold} />
              </View>
            )}
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{appointment.customerName}</Text>
              <Text style={styles.customerMeta}>
                {appointment.isNewClient ? 'New client' : `Returning · ${appointment.pastVisits ?? 0} past visits`}
              </Text>
              <Text style={styles.customerPhone}>{appointment.customerPhone}</Text>
            </View>
          </View>
          <View style={styles.contactBtns}>
            <TouchableOpacity style={styles.contactBtn} onPress={() => callPhone(appointment.customerPhone, showInfo)}>
              <Feather name="phone" size={16} color={palette.gold} />
              <Text style={styles.contactBtnText}>Call Client</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactBtn, styles.whatsappBtn]}
              onPress={() => openWhatsApp(appointment.customerPhone, showInfo)}
            >
              <Feather name="message-circle" size={16} color="#25D366" />
              <Text style={[styles.contactBtnText, { color: '#25D366' }]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Appointment Details</Text>
          {[
            { icon: 'scissors' as const, label: 'Service', value: appointment.service },
            { icon: 'calendar' as const, label: 'Date', value: appointment.date },
            { icon: 'clock' as const, label: 'Time', value: `${appointment.time} · ${appointment.duration}` },
            { icon: 'credit-card' as const, label: 'Amount', value: `Ksh ${appointment.price.toLocaleString()}` },
          ].map((row) => (
            <View key={row.label} style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Feather name={row.icon} size={14} color={palette.gold} />
              </View>
              <View>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={styles.detailValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {appointment.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Customer Notes</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{appointment.notes}</Text>
            </View>
          </View>
        )}

        {appointment.status === 'pending' && (
          <View style={styles.actionsBlock}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => handleAction('upcoming', 'Accept Booking?', `Accept ${appointment.customerName}'s request for ${appointment.service}?`)}
            >
              <Feather name="check" size={18} color={palette.bg} />
              <Text style={styles.acceptBtnText}>Accept Booking</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={() => handleAction('declined', 'Decline Booking?', `Decline ${appointment.customerName}'s booking? They will be notified.`)}
            >
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
        {appointment.status === 'upcoming' && (
          <View style={styles.actionsBlock}>
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => handleAction('completed', 'Mark Complete?', `Mark ${appointment.customerName}'s appointment as completed?`)}
            >
              <Feather name="check-circle" size={18} color={palette.bg} />
              <Text style={styles.completeBtnText}>Mark as Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleAction('cancelled', 'Cancel Appointment?', 'Cancel this upcoming appointment? The client will be notified.')}
            >
              <Text style={styles.cancelBtnText}>Cancel Appointment</Text>
            </TouchableOpacity>
          </View>
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

