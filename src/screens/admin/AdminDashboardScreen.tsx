import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Radius, Shadow } from '../../constants/theme';
import { adminApi, AdminDashboardData, AdminProviderStatus } from '../../lib/api/admin';
import { confirmAction } from '../../lib/confirmAction';
import Toast from '../../components/Toast';

const PERIODS = ['Today', '7 Days', '30 Days', 'All Time'];

const formatNumber = (value: number) => value.toLocaleString('en-US');

const formatAppliedAt = (value?: string) => {
  if (!value) {
    return 'Recently';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hr ago`;
  return `${Math.floor(diff / 86_400_000)} days ago`;
};

const activityIcon = (type: string): React.ComponentProps<typeof Feather>['name'] => {
  if (type === 'signup') return 'user-plus';
  if (type === 'subscription') return 'credit-card';
  if (type === 'verification') return 'user-check';
  if (type === 'suspension') return 'slash';
  if (type === 'payment') return 'dollar-sign';
  if (type === 'dispute') return 'alert-circle';
  if (type === 'booking') return 'calendar';
  return 'activity';
};

export default function AdminDashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [activePeriod, setActivePeriod] = useState(2);
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioningProviderId, setActioningProviderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getDashboard();
      setDashboard(result);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard])
  );

  const metrics = useMemo(() => {
    if (!dashboard) {
      return [] as Array<{ label: string; value: string; note: string; icon: React.ComponentProps<typeof Feather>['name']; up: boolean }>;
    }

    return [
      {
        label: 'Total Users',
        value: formatNumber(dashboard.metrics.totalUsers),
        note: `${formatNumber(dashboard.metrics.totalBookings)} bookings`,
        icon: 'users' as const,
        up: true,
      },
      {
        label: 'Providers',
        value: formatNumber(dashboard.metrics.activeProviders),
        note: `${formatNumber(dashboard.metrics.pendingProviders)} pending`,
        icon: 'briefcase' as const,
        up: true,
      },
      {
        label: 'Monthly Revenue',
        value: dashboard.metrics.monthlyRevenue,
        note: 'Current month',
        icon: 'trending-up' as const,
        up: true,
      },
      {
        label: 'Active Subs',
        value: formatNumber(dashboard.metrics.activeSubscriptions),
        note: 'Paying providers',
        icon: 'credit-card' as const,
        up: true,
      },
    ];
  }, [dashboard]);

  const recentActivity = useMemo(() => (dashboard?.activity ?? []).slice(0, 10), [dashboard]);

  const signupSeries = dashboard?.weeklySignups ?? [];
  const maxSignup = Math.max(
    1,
    ...signupSeries.map((item) => Math.max(item.customers, item.providers))
  );

  const updateProviderStatus = async (providerId: string, status: AdminProviderStatus) => {
    try {
      setActioningProviderId(providerId);
      await adminApi.updateProviderStatus(providerId, status);
      await loadDashboard();
      setToast({
        visible: true,
        message:
          status === 'approved'
            ? 'Provider approved successfully.'
            : status === 'suspended'
              ? 'Provider suspended successfully.'
              : 'Provider updated successfully.',
        type: 'success',
      });
    } catch (error: any) {
      const message = error?.message ?? 'Please try again.';
      if (Platform.OS === 'web') {
        setToast({
          visible: true,
          message: `Could not update provider. ${message}`,
          type: 'error',
        });
      } else {
        Alert.alert('Could not update provider', message);
      }
    } finally {
      setActioningProviderId(null);
    }
  };

  const confirmApprove = (providerId: string) => {
    if (Platform.OS === 'web') {
      void updateProviderStatus(providerId, 'approved');
      return;
    }

    confirmAction({
      title: 'Approve Provider',
      message: 'Approve this provider account?',
      confirmText: 'Approve',
      onConfirm: () => {
        void updateProviderStatus(providerId, 'approved');
      },
    });
  };

  const confirmReject = (providerId: string) => {
    if (Platform.OS === 'web') {
      void updateProviderStatus(providerId, 'suspended');
      return;
    }

    confirmAction({
      title: 'Reject Provider',
      message: 'Reject and suspend this provider account?',
      confirmText: 'Reject',
      destructive: true,
      onConfirm: () => {
        void updateProviderStatus(providerId, 'suspended');
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((current) => ({ ...current, visible: false }))}
      />
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Panel</Text>
          <Text style={styles.subGreeting}>NLBB Beauty - Overview</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} onPress={loadDashboard}>
          <Feather name="refresh-cw" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.periodRow}>
          {PERIODS.map((period, idx) => (
            <TouchableOpacity
              key={period}
              onPress={() => setActivePeriod(idx)}
              style={[styles.periodChip, activePeriod === idx && styles.periodChipActive]}
            >
              <Text style={[styles.periodText, activePeriod === idx && styles.periodTextActive]}>{period}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={Colors.gold} />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : null}

        {!loading && !dashboard ? (
          <View style={styles.loadingWrap}>
            <Feather name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.loadingText}>Could not load dashboard data.</Text>
          </View>
        ) : null}

        {dashboard ? (
          <>
            <View style={styles.metricsGrid}>
              {metrics.map((metric) => (
                <View key={metric.label} style={styles.metricCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: metric.up ? Colors.goldDim : 'rgba(239,68,68,0.1)' }]}>
                    <Feather name={metric.icon} size={18} color={metric.up ? Colors.gold : Colors.error} />
                  </View>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <View style={styles.metricChangeRow}>
                    <Feather name="minus" size={11} color={Colors.textSecondary} />
                    <Text style={styles.metricChange}>{metric.note}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>New Sign-ups</Text>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.gold }]} />
                    <Text style={styles.legendText}>Customers</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                    <Text style={styles.legendText}>Providers</Text>
                  </View>
                </View>
              </View>
              <View style={styles.chart}>
                {signupSeries.map((item) => (
                  <View key={item.day} style={styles.chartColumn}>
                    <View style={styles.barsWrap}>
                      <View
                        style={[
                          styles.bar,
                          styles.barProvider,
                          { height: (item.providers / maxSignup) * 90 },
                        ]}
                      />
                      <View
                        style={[
                          styles.bar,
                          styles.barCustomer,
                          { height: (item.customers / maxSignup) * 90 },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartDayLabel}>{item.day}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>Pending Verifications</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{dashboard.pendingProviders.length}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('AdminProviders')}>
                  <Text style={styles.seeAll}>Review All</Text>
                </TouchableOpacity>
              </View>
              {dashboard.pendingProviders.map((provider) => (
                <View key={provider.id} style={styles.pendingCard}>
                  <Image source={{ uri: provider.avatar }} style={styles.pendingAvatar} />
                  <View style={styles.pendingInfo}>
                    <Text style={styles.pendingName}>{provider.name}</Text>
                    <Text style={styles.pendingMeta}>{provider.category} - {provider.location}</Text>
                    <Text style={styles.pendingTime}>{formatAppliedAt(provider.appliedAt)}</Text>
                  </View>
                  {actioningProviderId === provider.id ? (
                    <ActivityIndicator size="small" color={Colors.gold} />
                  ) : (
                    <View style={styles.pendingActions}>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => confirmApprove(provider.id)}>
                        <Feather name="check" size={14} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => confirmReject(provider.id)}>
                        <Feather name="x" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <View style={styles.activityCard}>
                {recentActivity.map((item, idx) => (
                  <View key={item.id} style={[styles.activityItem, idx < recentActivity.length - 1 && styles.activityBorder]}>
                    <View style={[styles.activityIconWrap, { backgroundColor: `${item.color}20` }]}>
                      <Feather name={activityIcon(item.type)} size={14} color={item.color || Colors.gold} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activityText}>{item.text}</Text>
                      <Text style={styles.activityTime}>{item.time}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { icon: 'user-check' as const, label: 'Verify Providers', screen: 'AdminProviders' },
              { icon: 'users' as const, label: 'Manage Users', screen: 'AdminUsers' },
              { icon: 'dollar-sign' as const, label: 'Revenue', screen: 'AdminRevenue' },
              { icon: 'refresh-cw' as const, label: 'Refresh', onPress: loadDashboard },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                onPress={action.onPress ?? (() => navigation.navigate(action.screen))}
                style={styles.actionBtn}
                activeOpacity={0.85}
              >
                <View style={styles.actionIconWrap}>
                  <Feather name={action.icon} size={20} color={Colors.gold} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  greeting: { fontFamily: Fonts.serifMedium, fontSize: 24, color: Colors.textPrimary },
  subGreeting: { color: Colors.textSecondary, fontFamily: Fonts.sans, fontSize: 13, marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  periodChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  periodChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  periodText: { color: Colors.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 12 },
  periodTextActive: { color: Colors.bg, fontWeight: '700' },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 16 },
  loadingText: { color: Colors.textSecondary, fontFamily: Fonts.sans, fontSize: 13 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.soft,
  },
  metricIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  metricValue: { fontFamily: Fonts.serifMedium, fontSize: 22, color: Colors.textPrimary, marginBottom: 2 },
  metricLabel: { color: Colors.textSecondary, fontSize: 11, fontFamily: Fonts.sansMedium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  metricChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricChange: { fontSize: 11, fontFamily: Fonts.sansMedium, color: Colors.textSecondary },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.soft,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartTitle: { fontFamily: Fonts.serifMedium, fontSize: 17, color: Colors.textPrimary },
  legendRow: { flexDirection: 'row', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: Colors.textSecondary, fontSize: 11 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110 },
  chartColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barsWrap: { flexDirection: 'row', gap: 3, alignItems: 'flex-end', marginBottom: 8 },
  bar: { width: 8, borderRadius: 4 },
  barCustomer: { backgroundColor: Colors.gold },
  barProvider: { backgroundColor: Colors.success },
  chartDayLabel: { color: Colors.textMuted, fontSize: 10, fontFamily: Fonts.sans },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontFamily: Fonts.serifMedium, fontSize: 18, color: Colors.textPrimary, marginBottom: 16 },
  seeAll: { color: Colors.gold, fontFamily: Fonts.sansMedium, fontSize: 12 },
  badge: { backgroundColor: Colors.error, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, minWidth: 22, alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontFamily: Fonts.sansBold },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
    ...Shadow.soft,
  },
  pendingAvatar: { width: 48, height: 48, borderRadius: 24, resizeMode: 'cover' },
  pendingInfo: { flex: 1 },
  pendingName: { color: Colors.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14, marginBottom: 3 },
  pendingMeta: { color: Colors.textSecondary, fontSize: 12, marginBottom: 3 },
  pendingTime: { color: Colors.textMuted, fontSize: 11 },
  pendingActions: { flexDirection: 'column', gap: 6 },
  approveBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center' },
  activityCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.soft,
  },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  activityIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  activityText: { color: Colors.textPrimary, fontFamily: Fonts.sans, fontSize: 13, marginBottom: 3 },
  activityTime: { color: Colors.textMuted, fontSize: 11 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 10,
    ...Shadow.soft,
  },
  actionIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.goldDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.goldBorder },
  actionLabel: { color: Colors.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 13 },
});
