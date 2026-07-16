import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import GoldButton from '../../components/GoldButton';
import ErrorModal from '../../components/ErrorModal';
import InfoModal from '../../components/InfoModal';
import SuccessModal from '../../components/SuccessModal';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
import { publicConfigApi, PublicReleaseConfig } from '../../lib/api/publicConfig';
import { subscriptionsApi } from '../../lib/api/subscriptions';
import { paymentsApi } from '../../lib/api/payments';
import { providerManagementApi } from '../../lib/api/providerManagement';
import { Payment, Subscription } from '../../types';

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Not set';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }
  return date.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const calculateDaysLeft = (renewalDate?: string | null) => {
  if (!renewalDate) {
    return 0;
  }
  const renewal = new Date(renewalDate);
  if (Number.isNaN(renewal.getTime())) {
    return 0;
  }
  const diff = renewal.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
};

const normalizeMpesaPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1'))) {
    return `254${digits}`;
  }

  if (digits.length === 10 && digits.startsWith('0')) {
    const subscriber = digits.slice(1);
    if (subscriber.startsWith('7') || subscriber.startsWith('1')) {
      return `254${subscriber}`;
    }
  }

  if (digits.length === 12 && digits.startsWith('254')) {
    const subscriber = digits.slice(3);
    if (subscriber.startsWith('7') || subscriber.startsWith('1')) {
      return digits;
    }
  }

  return null;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createSubscriptionStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: p.cardInner,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: p.border,
    },
    heading: { fontFamily: Fonts.serifMedium, fontSize: 24, color: p.textPrimary },
    loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24 },
    loadingText: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 14 },
    scroll: { paddingHorizontal: 24, paddingBottom: 40 },
    statusCard: {
      borderRadius: Radius.xl,
      padding: 20,
      marginBottom: 28,
      borderWidth: 1,
      ...s.soft,
    },
    statusCardActive: { backgroundColor: p.card, borderColor: p.goldBorder },
    statusCardExpired: { backgroundColor: p.card, borderColor: 'rgba(239,68,68,0.3)' },
    statusTop: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
    statusIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    statusLabel: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 16, marginBottom: 4 },
    statusSub: { fontSize: 13, fontFamily: Fonts.sans },
    statusDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: p.border,
      paddingTop: 16,
    },
    statusDetailItem: { alignItems: 'center' },
    statusDetailLabel: { color: p.textMuted, fontSize: 11, marginBottom: 4 },
    statusDetailValue: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14 },
    section: { marginBottom: 28 },
    sectionTitle: { fontFamily: Fonts.serifMedium, fontSize: 18, color: p.textPrimary, marginBottom: 16 },
    paymentCard: {
      backgroundColor: p.card,
      borderRadius: Radius.xl,
      padding: 20,
      gap: 16,
      borderWidth: 1,
      borderColor: p.borderLight,
      ...s.soft,
    },
    amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amountLabel: { color: p.textSecondary, fontSize: 14 },
    amountValue: { color: p.textPrimary, fontFamily: Fonts.serifMedium, fontSize: 24 },
    creditRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: p.goldDim,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: p.goldBorder,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    creditLabel: { color: p.textSecondary, fontSize: 13 },
    creditValue: { color: p.gold, fontFamily: Fonts.sansBold, fontSize: 13 },
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: p.cardInner,
      borderRadius: Radius.md,
      padding: 14,
      borderWidth: 1,
      borderColor: p.border,
    },
    mpesaLogo: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: 'rgba(34,197,94,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    phoneInfo: { flex: 1 },
    phoneLabel: { color: p.textMuted, fontSize: 11 },
    phoneNumber: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14, marginTop: 2 },
    phoneInput: { flex: 1, color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14, padding: 0 },
    editPhoneBtn: { padding: 4 },
    savePhoneBtn: { backgroundColor: p.gold, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 6 },
    savePhoneText: { color: p.bg, fontFamily: Fonts.sansBold, fontSize: 12 },
    payBtn: { width: '100%' },
    emptyCard: {
      backgroundColor: p.card,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: p.border,
      padding: 16,
    },
    emptyText: { color: p.textSecondary, fontSize: 13 },
    historyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: p.card,
      borderRadius: Radius.md,
      padding: 14,
      gap: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: p.borderLight,
    },
    historyIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: p.cardInner,
      alignItems: 'center',
      justifyContent: 'center',
    },
    historyInfo: { flex: 1 },
    historyDate: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14 },
    historyRef: { color: p.textMuted, fontSize: 11, marginTop: 2 },
    historyRight: { alignItems: 'flex-end' },
    historyAmount: { color: p.textPrimary, fontFamily: Fonts.sansBold, fontSize: 14 },
    historyStatus: { color: p.textMuted, fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
    featureNotice: {
      backgroundColor: p.cardInner,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: p.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    featureNoticeText: { color: p.textSecondary, fontSize: 13, lineHeight: 19 },
  });
}

export default function SubscriptionScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createSubscriptionStyles(palette, shadow), [palette, shadow]);
  const canGoBack = navigation?.canGoBack?.() ?? false;

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [releaseConfig, setReleaseConfig] = useState<PublicReleaseConfig | null>(null);
  const [phone, setPhone] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorModal, setErrorModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });
  const [infoModal, setInfoModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });
  const [successModal, setSuccessModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });
  const awaitingPaymentRef = useRef(false);
  const pollCancelRef = useRef<(() => void) | null>(null);
  const paymentBaselineRef = useRef<{
    renewalDate: string | null;
    lastPaymentId?: string;
    wasActive: boolean;
  } | null>(null);

  const isSubscriptionActive = (value: Subscription | null) => {
    if (!value || value.status !== 'active') {
      return false;
    }
    return new Date(value.renewalDate).getTime() > Date.now();
  };

  const loadData = async (
    showSpinner = true
  ): Promise<{ subscription: Subscription | null; payments: Payment[] } | null> => {
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const [subscriptionRes, paymentsRes, profile, config] = await Promise.all([
        subscriptionsApi.getMySubscription(),
        paymentsApi.listMyPayments(),
        providerManagementApi.getMyProfile().catch(() => null),
        publicConfigApi.getPublicConfig().catch(() => null),
      ]);

      setSubscription(subscriptionRes);
      setPayments(paymentsRes);
      setReleaseConfig(config);

      if (profile?.mpesaPhone) {
        setPhone(profile.mpesaPhone);
      } else if (profile?.phone) {
        setPhone(profile.phone);
      }

      return { subscription: subscriptionRes, payments: paymentsRes };
    } catch (error: any) {
      setErrorModal({
        visible: true,
        title: 'Subscription Error',
        message: error?.message ?? 'Could not load subscription data.',
      });
      return null;
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  };

  const loadSubscriptionStatus = async (reconcile = false) => {
    try {
      const subscriptionRes = await subscriptionsApi.getMySubscription({ reconcile });
      setSubscription(subscriptionRes);
      return subscriptionRes;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    void loadData();
    return () => {
      pollCancelRef.current?.();
    };
  }, []);

  const isActive = useMemo(() => isSubscriptionActive(subscription), [subscription]);

  const amount = subscription?.amount ?? 1;
  const planAmount = subscription?.planAmount ?? amount;
  const creditBalance = subscription?.creditBalance ?? 0;
  const renewalDate = subscription?.renewalDate ?? null;
  const daysLeft = calculateDaysLeft(renewalDate);
  const confirmedPayments = useMemo(
    () => payments.filter((payment) => payment.status === 'success'),
    [payments]
  );
  const mpesaEnabled = releaseConfig?.featureFlags.mpesaEnabled ?? true;

  const paymentConfirmed = (latest: Subscription | null, baseline: NonNullable<typeof paymentBaselineRef.current>) => {
    if (!isSubscriptionActive(latest)) {
      return false;
    }

    if (latest?.lastPaymentId && latest.lastPaymentId !== baseline.lastPaymentId) {
      return true;
    }
    if (latest?.renewalDate && latest.renewalDate !== baseline.renewalDate) {
      return true;
    }
    return !baseline.wasActive;
  };

  const pollForActivation = () => {
    pollCancelRef.current?.();
    let cancelled = false;
    const pollIntervalsMs = [4000, 7000, 10000, 15000, 20000, 25000];

    pollCancelRef.current = () => {
      cancelled = true;
    };

    void (async () => {
      for (const intervalMs of pollIntervalsMs) {
        await delay(intervalMs);
        if (cancelled) {
          return;
        }

        const latestSubscription = await loadSubscriptionStatus(true);
        if (cancelled || !latestSubscription) {
          return;
        }

        const baseline = paymentBaselineRef.current;
        if (awaitingPaymentRef.current && baseline && paymentConfirmed(latestSubscription, baseline)) {
          awaitingPaymentRef.current = false;
          paymentBaselineRef.current = null;
          setInfoModal((current) => ({ ...current, visible: false }));
          await loadData(false);
          setSuccessModal({
            visible: true,
            title: 'Payment Successful',
            message: 'Your subscription is active and your listing is now visible to customers.',
          });
          return;
        }
      }

      awaitingPaymentRef.current = false;
      paymentBaselineRef.current = null;
      setInfoModal({
        visible: true,
        title: 'Payment Still Pending',
        message: 'We have not received M-Pesa confirmation yet. If you already approved the prompt, give it a little more time and refresh this page shortly.',
      });
    })();
  };

  const handlePayment = async () => {
    if (!phone.trim()) {
      setErrorModal({
        visible: true,
        title: 'Missing Number',
        message: 'Enter an M-Pesa phone number first.',
      });
      return;
    }

    const normalizedPhone = normalizeMpesaPhoneNumber(phone.trim());
    if (!normalizedPhone) {
      setErrorModal({
        visible: true,
        title: 'Invalid Number',
        message: 'Use a valid M-Pesa number in 07..., 01..., or 254... format.',
      });
      return;
    }

    try {
      setPaying(true);
      if (normalizedPhone !== phone.trim()) {
        setPhone(normalizedPhone);
      }
      paymentBaselineRef.current = {
        renewalDate: subscription?.renewalDate ?? null,
        lastPaymentId: subscription?.lastPaymentId,
        wasActive: isSubscriptionActive(subscription),
      };
      const response = await subscriptionsApi.initiatePayment(normalizedPhone);
      awaitingPaymentRef.current = true;
      setInfoModal({
        visible: true,
        title: 'STK Push Sent',
        message: response.message ?? 'STK push sent. Please complete payment on your phone.',
      });
      await loadData(false);
      pollForActivation();
    } catch (error: any) {
      awaitingPaymentRef.current = false;
      paymentBaselineRef.current = null;
      setErrorModal({
        visible: true,
        title: 'Payment Failed',
        message: error?.message ?? 'Could not start payment. Please try again.',
      });
    } finally {
      setPaying(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onDismiss={() => setErrorModal((current) => ({ ...current, visible: false }))}
      />
      <InfoModal
        visible={infoModal.visible}
        title={infoModal.title}
        message={infoModal.message}
        onDismiss={() => setInfoModal((current) => ({ ...current, visible: false }))}
        buttonLabel="Okay"
      />
      <SuccessModal
        visible={successModal.visible}
        title={successModal.title}
        message={successModal.message}
        onDismiss={() => setSuccessModal((current) => ({ ...current, visible: false }))}
        buttonLabel="Great"
      />

      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={18} color={palette.textPrimary} />
          </TouchableOpacity>
        ) : null}
        <Text style={styles.heading}>Subscription</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={palette.gold} />
          <Text style={styles.loadingText}>Loading subscription...</Text>
        </View>
      ) : (
        <KeyboardAwareScrollView contentContainerStyle={styles.scroll} bottomPadding={40}>
          <View style={[styles.statusCard, isActive ? styles.statusCardActive : styles.statusCardExpired]}>
            <View style={styles.statusTop}>
              <View
                style={[
                  styles.statusIconWrap,
                  { backgroundColor: isActive ? palette.goldDim : 'rgba(239,68,68,0.1)' },
                ]}
              >
                <Feather
                  name={isActive ? 'check-circle' : 'alert-circle'}
                  size={24}
                  color={isActive ? palette.gold : palette.error}
                />
              </View>
              <View>
                <Text style={styles.statusLabel}>{isActive ? 'Active Subscription' : 'Subscription Inactive'}</Text>
                <Text style={[styles.statusSub, { color: isActive ? palette.success : palette.error }]}>
                  {isActive ? 'Your listing is live' : 'Renew to restore visibility'}
                </Text>
              </View>
            </View>
            <View style={styles.statusDetails}>
              <View style={styles.statusDetailItem}>
                <Text style={styles.statusDetailLabel}>Monthly Fee</Text>
                <Text style={styles.statusDetailValue}>Ksh {planAmount.toLocaleString()}</Text>
              </View>
              <View style={styles.statusDetailItem}>
                <Text style={styles.statusDetailLabel}>Renewal Date</Text>
                <Text style={styles.statusDetailValue}>{formatDate(renewalDate)}</Text>
              </View>
              <View style={styles.statusDetailItem}>
                <Text style={styles.statusDetailLabel}>Days Left</Text>
                <Text style={styles.statusDetailValue}>{daysLeft}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{isActive ? 'Renew Early' : 'Activate Subscription'}</Text>
            <View style={styles.paymentCard}>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Amount due after credit</Text>
                <Text style={styles.amountValue}>Ksh {amount.toLocaleString()}</Text>
              </View>
              {creditBalance > 0 ? (
                <View style={styles.creditRow}>
                  <Text style={styles.creditLabel}>Credit carried forward</Text>
                  <Text style={styles.creditValue}>Ksh {creditBalance.toLocaleString()}</Text>
                </View>
              ) : null}

              <View style={styles.phoneRow}>
                <View style={styles.mpesaLogo}>
                  <Feather name="smartphone" size={16} color={palette.success} />
                </View>
                {editingPhone ? (
                  <TextInput
                    style={styles.phoneInput}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoFocus
                    placeholder="07XXXXXXXX or +2547XXXXXXXX"
                    placeholderTextColor={palette.textMuted}
                  />
                ) : (
                  <View style={styles.phoneInfo}>
                    <Text style={styles.phoneLabel}>M-Pesa Number</Text>
                    <Text style={styles.phoneNumber}>{phone || 'Not set'}</Text>
                  </View>
                )}
                {editingPhone ? (
                  <TouchableOpacity style={styles.savePhoneBtn} onPress={() => setEditingPhone(false)}>
                    <Text style={styles.savePhoneText}>Done</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => setEditingPhone(true)} style={styles.editPhoneBtn}>
                    <Feather name="edit-2" size={14} color={palette.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              {!mpesaEnabled ? (
                <View style={styles.featureNotice}>
                  <Text style={styles.featureNoticeText}>
                    M-Pesa activation is not live yet on this environment. The app can launch now, and payments can
                    be switched on later from backend configuration.
                  </Text>
                </View>
              ) : null}

              <GoldButton
                label={amount > 0 ? `Pay via M-Pesa - Ksh ${amount.toLocaleString()}` : 'Credit covers renewal'}
                onPress={handlePayment}
                loading={paying}
                style={styles.payBtn}
                size="lg"
                disabled={amount <= 0 || !mpesaEnabled}
              />
            </View>
          </View>

          <View style={[styles.section, { marginBottom: 32 }]}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {confirmedPayments.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No confirmed payments recorded yet.</Text>
              </View>
            ) : (
              confirmedPayments.map((payment) => (
                <View key={payment.id} style={styles.historyCard}>
                  <View style={styles.historyIcon}>
                    <Feather
                      name="check-circle"
                      size={16}
                      color={palette.success}
                    />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyDate}>{formatDate(payment.createdAt)}</Text>
                    <Text style={styles.historyRef}>{payment.mpesaReceiptNumber ?? payment.checkoutRequestId}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyAmount}>Ksh {payment.amount.toLocaleString()}</Text>
                    <Text style={styles.historyStatus}>{payment.status}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </KeyboardAwareScrollView>
      )}
    </View>
  );
}


