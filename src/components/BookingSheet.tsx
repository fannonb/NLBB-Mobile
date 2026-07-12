import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';
import { NLBBButton } from './ui';
import { useBookingSheetStore } from '../store/bookingSheetStore';
import { providerApi } from '../lib/api/providers';
import {
  bookingApi,
  buildScheduledAt,
  formatBookingDate,
  formatBookingTime,
  BookingRecord,
} from '../lib/api/bookings';
import {
  BOOKING_DAYS,
  BOOKING_MONTHS,
  BOOKING_TIME_SLOTS,
  formatBookingDisplayDate,
  generateBookingDates,
  isBookingSlotAvailable,
} from '../lib/bookingFlowUtils';
import { navigate } from '../lib/navigationRef';
import { Service } from '../types';

type SheetPhase = 'service' | 'schedule' | 'confirm' | 'loading' | 'success';

const STEP_LABELS: Record<'service' | 'schedule' | 'confirm', string> = {
  service: 'Choose service',
  schedule: 'Date & time',
  confirm: 'Confirm',
};

function createSheetStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: p.overlayDark,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: p.card,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      height: 540,
      maxHeight: '92%',
      ...s.card,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: p.border,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: p.borderLight,
    },
    headerBody: { flex: 1 },
    providerName: {
      fontFamily: Fonts.serifMedium,
      fontSize: 18,
      color: p.textPrimary,
    },
    stepLabel: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: p.textMuted,
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: p.cardInner,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressRow: {
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    progressDot: {
      flex: 1,
      height: 3,
      borderRadius: 2,
      backgroundColor: p.border,
    },
    progressDotActive: {
      backgroundColor: p.gold,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    serviceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.cardInner,
      marginBottom: 10,
      gap: 12,
    },
    serviceItemActive: {
      borderColor: p.goldBorder,
      backgroundColor: p.goldDim,
    },
    serviceInfo: { flex: 1 },
    serviceName: {
      fontFamily: Fonts.sansMedium,
      fontSize: 15,
      color: p.textPrimary,
    },
    serviceMeta: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: p.textSecondary,
      marginTop: 4,
    },
    servicePrice: {
      fontFamily: Fonts.sansBold,
      fontSize: 14,
      color: p.gold,
      marginTop: 6,
    },
    checkCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: p.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkCircleActive: {
      backgroundColor: p.gold,
      borderColor: p.gold,
    },
    sectionLabel: {
      fontFamily: Fonts.sansMedium,
      fontSize: 11,
      color: p.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 12,
      marginTop: 8,
    },
    datesRow: { gap: 10, paddingBottom: 4 },
    dateCell: {
      width: 68,
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 10,
      borderRadius: Radius.lg,
      backgroundColor: p.cardInner,
      borderWidth: 1,
      borderColor: p.border,
    },
    dateCellActive: {
      backgroundColor: p.gold,
      borderColor: p.gold,
      ...s.gold,
    },
    dateDayLabel: {
      color: p.textMuted,
      fontFamily: Fonts.sansMedium,
      fontSize: 11,
      textTransform: 'uppercase',
    },
    dateDayLabelActive: { color: p.bg },
    dateDateNum: {
      color: p.textPrimary,
      fontFamily: Fonts.serifMedium,
      fontSize: 22,
      marginVertical: 4,
    },
    dateDateNumActive: { color: p.bg },
    dateMonthLabel: { color: p.textMuted, fontSize: 10 },
    dateMonthLabelActive: { color: p.bg },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    timeSlot: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: Radius.md,
      backgroundColor: p.cardInner,
      borderWidth: 1,
      borderColor: p.border,
    },
    timeSlotActive: {
      backgroundColor: p.gold,
      borderColor: p.gold,
      ...s.gold,
    },
    timeSlotDisabled: { opacity: 0.35 },
    timeSlotText: {
      color: p.textSecondary,
      fontFamily: Fonts.sansMedium,
      fontSize: 13,
    },
    timeSlotTextActive: { color: p.bg, fontWeight: '700' },
    notesInput: {
      backgroundColor: p.cardInner,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: p.border,
      padding: 14,
      minHeight: 72,
      marginTop: 8,
    },
    notesText: {
      color: p.textPrimary,
      fontFamily: Fonts.sans,
      fontSize: 14,
      lineHeight: 20,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 14,
    },
    summaryIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: p.goldDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryLabel: {
      color: p.textMuted,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    summaryValue: {
      color: p.textPrimary,
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      marginTop: 2,
    },
    priceNote: {
      color: p.textMuted,
      fontFamily: Fonts.sans,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 12,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: p.borderLight,
      gap: 10,
    },
    footerRow: {
      flexDirection: 'row',
      gap: 10,
    },
    loadingWrap: {
      paddingVertical: 48,
      alignItems: 'center',
      gap: 12,
    },
    loadingText: {
      color: p.textSecondary,
      fontFamily: Fonts.sans,
      fontSize: 14,
    },
    successWrap: {
      paddingHorizontal: 20,
      paddingVertical: 32,
      alignItems: 'center',
    },
    successCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: p.gold,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      ...s.gold,
    },
    successTitle: {
      fontFamily: Fonts.serifMedium,
      fontSize: 24,
      color: p.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    successSub: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      color: p.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    successCard: {
      width: '100%',
      backgroundColor: p.cardInner,
      borderRadius: Radius.lg,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: p.goldBorder,
      marginBottom: 20,
    },
    successRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    successRowText: {
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      color: p.textPrimary,
      flex: 1,
    },
    loadError: {
      padding: 24,
      alignItems: 'center',
      gap: 12,
    },
    loadErrorText: {
      color: p.textSecondary,
      fontFamily: Fonts.sans,
      fontSize: 14,
      textAlign: 'center',
    },
  });
}

interface StepTransitionProps {
  children: React.ReactNode;
  phase: string;
}

function StepTransition({ children, phase }: StepTransitionProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 130,
      friction: 8,
    }).start();
  }, [phase, anim]);

  const opacity = anim;
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 0],
  });

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function BookingSheet() {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createSheetStyles(palette, shadow), [palette, shadow]);

  const { visible, payload, close } = useBookingSheetStore();
  const [phase, setPhase] = useState<SheetPhase>('service');
  const successScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase === 'success') {
      successScaleAnim.setValue(0);
      Animated.spring(successScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 160,
        friction: 5.5,
      }).start();
    }
  }, [phase, successScaleAnim]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [createdBooking, setCreatedBooking] = useState<BookingRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const dates = useMemo(() => generateBookingDates(), []);
  const selectedDate = dates[selectedDateIdx];
  const selectedService = services.find((s) => s.id === selectedServiceId);

  const activeStep: 'service' | 'schedule' | 'confirm' =
    phase === 'service' ? 'service' : phase === 'schedule' ? 'schedule' : 'confirm';

  const stepIndex = activeStep === 'service' ? 0 : activeStep === 'schedule' ? 1 : 2;

  useEffect(() => {
    if (!visible || !payload) {
      return;
    }

    setPhase('service');
    setSelectedDateIdx(0);
    setSelectedTime(null);
    setNotes('');
    setCreatedBooking(null);
    setSubmitError(null);
    setLoadError(null);

    const preselected = payload.preselectedServiceId ?? null;
    setSelectedServiceId(preselected);

    if (payload.services && payload.services.length > 0) {
      setServices(payload.services);
      setPhase(preselected ? 'schedule' : 'service');
      return;
    }

    let active = true;
    setLoadingServices(true);

    providerApi
      .getProvider(payload.providerId)
      .then((provider) => {
        if (!active) return;
        const list = provider?.services ?? [];
        setServices(list);
        if (list.length === 0) {
          setLoadError('This provider has no bookable services yet.');
          return;
        }
        const serviceId = preselected && list.some((s) => s.id === preselected) ? preselected : null;
        setSelectedServiceId(serviceId);
        setPhase(serviceId ? 'schedule' : 'service');
      })
      .catch(() => {
        if (active) {
          setLoadError('Could not load services. Please try again.');
        }
      })
      .finally(() => {
        if (active) {
          setLoadingServices(false);
        }
      });

    return () => {
      active = false;
    };
  }, [visible, payload]);

  const handleClose = () => {
    close();
  };

  const goToSchedule = () => {
    if (!selectedServiceId) return;
    setPhase('schedule');
  };

  const goToConfirm = () => {
    if (!selectedTime) return;
    setPhase('confirm');
  };

  const handleSubmit = async () => {
    if (!payload || !selectedService || !selectedTime) return;

    setPhase('loading');
    setSubmitError(null);

    try {
      const scheduledAt = buildScheduledAt(selectedDate, selectedTime);
      const booking = await bookingApi.createBooking({
        providerId: payload.providerId,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        duration: selectedService.duration,
        scheduledAt,
        notes: notes.trim() || undefined,
      });
      setCreatedBooking(booking);
      setPhase('success');
    } catch (error: any) {
      setSubmitError(error?.message ?? 'Booking failed. Please try again.');
      setPhase('confirm');
    }
  };

  const renderServiceStep = () => (
    <StepTransition phase={phase}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 16 }]}>
        {loadingServices ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={palette.gold} />
            <Text style={styles.loadingText}>Loading services...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.loadError}>
            <Feather name="alert-circle" size={28} color={palette.textMuted} />
            <Text style={styles.loadErrorText}>{loadError}</Text>
            <NLBBButton label="Close" onPress={handleClose} variant="secondary" />
          </View>
        ) : (
          services.map((service) => {
            const isActive = selectedServiceId === service.id;
            return (
              <TouchableOpacity
                key={service.id}
                style={[styles.serviceItem, isActive && styles.serviceItemActive]}
                onPress={() => setSelectedServiceId(service.id)}
                activeOpacity={0.85}
              >
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceMeta}>{service.duration} mins · {service.description}</Text>
                  <Text style={styles.servicePrice}>Ksh {service.price.toLocaleString()}</Text>
                </View>
                <View style={[styles.checkCircle, isActive && styles.checkCircleActive]}>
                  {isActive ? <Feather name="check" size={14} color={palette.bg} /> : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </StepTransition>
  );

  const renderScheduleStep = () => (
    <StepTransition phase={phase}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 16 }]}>
        <Text style={styles.sectionLabel}>Select date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesRow}>
          {dates.map((date, idx) => {
            const isToday = idx === 0;
            const isSelected = selectedDateIdx === idx;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  setSelectedDateIdx(idx);
                  setSelectedTime(null);
                }}
                style={[styles.dateCell, isSelected && styles.dateCellActive]}
              >
                <Text style={[styles.dateDayLabel, isSelected && styles.dateDayLabelActive]}>
                  {isToday ? 'Today' : BOOKING_DAYS[date.getDay()]}
                </Text>
                <Text style={[styles.dateDateNum, isSelected && styles.dateDateNumActive]}>{date.getDate()}</Text>
                <Text style={[styles.dateMonthLabel, isSelected && styles.dateMonthLabelActive]}>
                  {BOOKING_MONTHS[date.getMonth()]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionLabel}>Select time</Text>
        <View style={styles.timeGrid}>
          {BOOKING_TIME_SLOTS.map((slot) => {
            const available = isBookingSlotAvailable(selectedDate, slot);
            const active = selectedTime === slot;
            return (
              <TouchableOpacity
                key={slot}
                onPress={() => available && setSelectedTime(slot)}
                style={[
                  styles.timeSlot,
                  active && styles.timeSlotActive,
                  !available && styles.timeSlotDisabled,
                ]}
                disabled={!available}
              >
                <Text style={[styles.timeSlotText, active && styles.timeSlotTextActive]}>{slot}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Notes (optional)</Text>
        <View style={styles.notesInput}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special requests..."
            placeholderTextColor={palette.textMuted}
            style={styles.notesText}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </StepTransition>
  );

  const renderConfirmStep = () => (
    <StepTransition phase={phase}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 16 }]}>
        {[
          { icon: 'scissors' as const, label: 'Service', value: selectedService?.name },
          { icon: 'calendar' as const, label: 'Date', value: formatBookingDisplayDate(selectedDate) },
          { icon: 'clock' as const, label: 'Time', value: `${selectedTime} · ${selectedService?.duration} mins` },
          { icon: 'map-pin' as const, label: 'Provider', value: payload?.providerName },
        ].map((row) => (
          <View key={row.label} style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Feather name={row.icon} size={14} color={palette.gold} />
            </View>
            <View>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={styles.summaryValue}>{row.value}</Text>
            </View>
          </View>
        ))}
        <Text style={styles.priceNote}>
          Guide price Ksh {selectedService?.price.toLocaleString()} — pay at the venue. NLBB does not charge booking fees.
        </Text>
        {submitError ? (
          <Text style={[styles.priceNote, { color: palette.error, marginTop: 8 }]}>{submitError}</Text>
        ) : null}
      </ScrollView>
    </StepTransition>
  );

  const renderSuccess = () => {
    const bookingDate = createdBooking
      ? formatBookingDate(createdBooking.scheduledAt)
      : formatBookingDisplayDate(selectedDate);
    const bookingTime = createdBooking
      ? formatBookingTime(createdBooking.scheduledAt)
      : selectedTime;

    return (
      <View style={styles.successWrap}>
        <Animated.View style={[styles.successCircle, { transform: [{ scale: successScaleAnim }] }]}>
          <Feather name="check" size={36} color={palette.bg} />
        </Animated.View>
        <Text style={styles.successTitle}>Booking requested</Text>
        <Text style={styles.successSub}>
          Your request was sent to {payload?.providerName}. You will be notified once confirmed.
        </Text>
        <View style={styles.successCard}>
          <View style={styles.successRow}>
            <Feather name="scissors" size={14} color={palette.gold} />
            <Text style={styles.successRowText}>{selectedService?.name}</Text>
          </View>
          <View style={styles.successRow}>
            <Feather name="calendar" size={14} color={palette.gold} />
            <Text style={styles.successRowText}>{bookingDate} · {bookingTime}</Text>
          </View>
        </View>
        <NLBBButton
          label="View my bookings"
          onPress={() => {
            handleClose();
            navigate('CustomerApp', { screen: 'Bookings' });
          }}
          size="lg"
          style={{ width: '100%' }}
        />
        <NLBBButton label="Done" onPress={handleClose} variant="ghost" style={{ width: '100%', marginTop: 8 }} />
      </View>
    );
  };

  const renderFooter = () => {
    if (phase === 'loading' || phase === 'success' || loadError) {
      return null;
    }

    if (phase === 'service') {
      return (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <NLBBButton
            label="Continue"
            onPress={goToSchedule}
            disabled={!selectedServiceId}
            size="lg"
            style={{ width: '100%' }}
          />
        </View>
      );
    }

    if (phase === 'schedule') {
      return (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.footerRow}>
            <NLBBButton label="Back" onPress={() => setPhase('service')} variant="secondary" style={{ flex: 1 }} />
            <NLBBButton
              label="Review"
              onPress={goToConfirm}
              disabled={!selectedTime}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.footerRow}>
          <NLBBButton label="Back" onPress={() => setPhase('schedule')} variant="secondary" style={{ flex: 1 }} />
          <NLBBButton label="Confirm booking" onPress={handleSubmit} style={{ flex: 1 }} />
        </View>
      </View>
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {phase !== 'success' && phase !== 'loading' ? (
            <>
              <View style={styles.header}>
                <View style={styles.headerBody}>
                  <Text style={styles.providerName}>{payload?.providerName}</Text>
                  <Text style={styles.stepLabel}>
                    Step {stepIndex + 1} of 3 · {STEP_LABELS[activeStep]}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Feather name="x" size={18} color={palette.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.progressRow}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]}
                  />
                ))}
              </View>
            </>
          ) : null}

          {phase === 'loading' ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={palette.gold} />
              <Text style={styles.loadingText}>Sending your booking request...</Text>
            </View>
          ) : phase === 'success' ? (
            renderSuccess()
          ) : phase === 'service' ? (
            renderServiceStep()
          ) : phase === 'schedule' ? (
            renderScheduleStep()
          ) : (
            renderConfirmStep()
          )}

          {renderFooter()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
