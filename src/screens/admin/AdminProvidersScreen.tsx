import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Radius, Shadow } from '../../constants/theme';
import { adminApi, AdminProviderRecord, AdminProviderStatus } from '../../lib/api/admin';
import { confirmAction } from '../../lib/confirmAction';
import Toast from '../../components/Toast';

const TABS: { label: string; status: AdminProviderStatus }[] = [
  { label: 'Pending', status: 'pending' },
  { label: 'Approved', status: 'approved' },
  { label: 'Suspended', status: 'suspended' },
];

const STATUS_COLORS: Record<AdminProviderStatus, string> = {
  pending: Colors.warning,
  approved: Colors.success,
  suspended: Colors.error,
};

const SUB_COLORS: Record<string, string> = {
  active: Colors.success,
  expired: Colors.error,
  none: Colors.textMuted,
};

export default function AdminProvidersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [providers, setProviders] = useState<AdminProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actioningProviderId, setActioningProviderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const loadProviders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.listProviders();
      setProviders(result);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProviders();
      setRefreshKey((k) => k + 1);
    }, [loadProviders])
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const activeStatus = TABS[activeTab].status;

    return providers.filter((provider) => {
      const matchesTab = provider.status === activeStatus;
      const matchesSearch =
        !query ||
        [provider.name, provider.category, provider.location, provider.email]
          .join(' ')
          .toLowerCase()
          .includes(query);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, providers, search]);

  const updateStatus = async (id: string, status: AdminProviderStatus) => {
    const previousProviders = providers;
    try {
      setActioningProviderId(id);
      setProviders((current) =>
        current.map((provider) =>
          provider.id === id
            ? {
                ...provider,
                status,
              }
            : provider
        )
      );
      await adminApi.updateProviderStatus(id, status);
      void loadProviders();
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
      setProviders(previousProviders);
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

  const deleteProvider = async (id: string) => {
    const previousProviders = providers;
    try {
      setActioningProviderId(id);
      setProviders((current) => current.filter((provider) => provider.id !== id));
      await adminApi.deleteProvider(id);
      void loadProviders();
      setToast({
        visible: true,
        message: 'Provider deleted successfully.',
        type: 'success',
      });
    } catch (error: any) {
      setProviders(previousProviders);
      const message = error?.message ?? 'Please try again.';
      if (Platform.OS === 'web') {
        setToast({
          visible: true,
          message: `Could not delete provider. ${message}`,
          type: 'error',
        });
      } else {
        Alert.alert('Could not delete provider', message);
      }
    } finally {
      setActioningProviderId(null);
    }
  };

  const handleApprove = (id: string) => {
    if (Platform.OS === 'web') {
      void updateStatus(id, 'approved');
      return;
    }

    confirmAction({
      title: 'Approve Provider',
      message: 'Are you sure you want to approve this provider?',
      confirmText: 'Approve',
      onConfirm: () => {
        void updateStatus(id, 'approved');
      },
    });
  };

  const handleReject = (id: string) => {
    if (Platform.OS === 'web') {
      void updateStatus(id, 'suspended');
      return;
    }

    confirmAction({
      title: 'Reject Provider',
      message: 'This provider will be marked suspended and can be reviewed later.',
      confirmText: 'Reject',
      destructive: true,
      onConfirm: () => {
        void updateStatus(id, 'suspended');
      },
    });
  };

  const handleSuspend = (id: string) => {
    if (Platform.OS === 'web') {
      void updateStatus(id, 'suspended');
      return;
    }

    confirmAction({
      title: 'Suspend Account',
      message: 'This will disable the provider account immediately.',
      confirmText: 'Suspend',
      destructive: true,
      onConfirm: () => {
        void updateStatus(id, 'suspended');
      },
    });
  };

  const handleRestore = (id: string) => {
    if (Platform.OS === 'web') {
      void updateStatus(id, 'approved');
      return;
    }

    confirmAction({
      title: 'Restore Account',
      message: 'This will re-enable the provider account.',
      confirmText: 'Restore',
      onConfirm: () => {
        void updateStatus(id, 'approved');
      },
    });
  };

  const handleDelete = (id: string) => {
    confirmAction({
      title: 'Delete Provider',
      message: 'This will permanently remove the provider from the platform and disable the linked account.',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => {
        void deleteProvider(id);
      },
    });
  };

  return (
    <View key={refreshKey} style={[styles.container, { paddingTop: insets.top }]}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((current) => ({ ...current, visible: false }))}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.heading}>Providers</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search providers..."
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab, idx) => {
          const count = providers.filter((provider) => provider.status === tab.status).length;
          return (
            <TouchableOpacity
              key={tab.label}
              onPress={() => setActiveTab(idx)}
              style={[styles.tab, activeTab === idx && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>{tab.label}</Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: STATUS_COLORS[tab.status] }]}>
                  <Text style={styles.tabBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading && filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="small" color={Colors.gold} />
            <Text style={styles.emptyText}>Loading providers...</Text>
          </View>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="briefcase" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No providers in this category</Text>
          </View>
        ) : null}

        {filtered.map((provider) => (
          <View key={provider.id} style={styles.providerCard}>
            <View style={styles.cardTop}>
              <Image source={{ uri: provider.avatar }} style={styles.avatar} />
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <Text style={styles.providerMeta}>{provider.category} · {provider.location}</Text>
                <Text style={styles.providerApplied}>Applied: {provider.appliedAt}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[provider.status]}20` }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[provider.status] }]}>
                  {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Feather name="phone" size={12} color={Colors.textMuted} />
                <Text style={styles.detailText}>{provider.phone}</Text>
              </View>
              <View style={styles.detailItem}>
                <Feather name="mail" size={12} color={Colors.textMuted} />
                <Text style={styles.detailText}>{provider.email}</Text>
              </View>
            </View>

            {provider.status === 'approved' && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{provider.bookingsCount}</Text>
                  <Text style={styles.statLabel}>Bookings</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{provider.rating > 0 ? provider.rating.toFixed(1) : 'N/A'}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: SUB_COLORS[provider.subscriptionStatus] }]}>
                    {provider.subscriptionStatus.charAt(0).toUpperCase() + provider.subscriptionStatus.slice(1)}
                  </Text>
                  <Text style={styles.statLabel}>Subscription</Text>
                </View>
              </View>
            )}

            <View style={styles.cardActions}>
              {actioningProviderId === provider.id ? (
                <View style={styles.actionLoadingWrap}>
                  <ActivityIndicator size="small" color={Colors.gold} />
                  <Text style={styles.actionLoadingText}>Updating provider...</Text>
                </View>
              ) : (
                <>
                  {provider.status === 'pending' ? (
                    <>
                      <TouchableOpacity onPress={() => handleApprove(provider.id)} style={styles.approveBtn}>
                        <Feather name="check" size={14} color="#fff" />
                        <Text style={styles.approveBtnText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleReject(provider.id)} style={styles.rejectBtn}>
                        <Feather name="x" size={14} color={Colors.error} />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(provider.id)} style={styles.deleteBtn}>
                        <Feather name="trash-2" size={14} color={Colors.error} />
                        <Text style={styles.deleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}

                  {provider.status === 'approved' ? (
                    <>
                      <TouchableOpacity onPress={() => handleSuspend(provider.id)} style={styles.suspendBtn}>
                        <Feather name="slash" size={14} color={Colors.error} />
                        <Text style={styles.suspendBtnText}>Suspend Account</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(provider.id)} style={styles.deleteBtnCompact}>
                        <Feather name="trash-2" size={14} color={Colors.error} />
                        <Text style={styles.deleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}

                  {provider.status === 'suspended' ? (
                    <>
                      <TouchableOpacity onPress={() => handleRestore(provider.id)} style={styles.restoreBtn}>
                        <Feather name="refresh-cw" size={14} color={Colors.success} />
                        <Text style={styles.restoreBtnText}>Restore Account</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(provider.id)} style={styles.deleteBtnCompact}>
                        <Feather name="trash-2" size={14} color={Colors.error} />
                        <Text style={styles.deleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, textAlign: 'center', fontFamily: Fonts.serifMedium, fontSize: 18, color: Colors.textPrimary },
  spacer: { width: 40 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontFamily: Fonts.sans, fontSize: 14, padding: 0 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 16 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.goldDim, borderColor: Colors.goldBorder },
  tabText: { color: Colors.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 12 },
  tabTextActive: { color: Colors.gold },
  tabBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, minWidth: 18, alignItems: 'center' },
  tabBadgeText: { color: '#fff', fontSize: 10, fontFamily: Fonts.sansBold },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 14 },
  providerCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.soft,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, resizeMode: 'cover' },
  providerInfo: { flex: 1 },
  providerName: { color: Colors.textPrimary, fontFamily: Fonts.sansBold, fontSize: 15, marginBottom: 3 },
  providerMeta: { color: Colors.textSecondary, fontSize: 12, marginBottom: 3 },
  providerApplied: { color: Colors.textMuted, fontSize: 11 },
  statusBadge: { borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontFamily: Fonts.sansBold },
  detailRow: { gap: 8, marginBottom: 14 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { color: Colors.textSecondary, fontSize: 12 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.cardInner,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: Colors.textPrimary, fontFamily: Fonts.sansBold, fontSize: 15, marginBottom: 2 },
  statLabel: { color: Colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 8 },
  cardActions: { flexDirection: 'row', gap: 10 },
  actionLoadingWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  actionLoadingText: { color: Colors.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 12 },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.success,
    borderRadius: Radius.md,
    paddingVertical: 10,
  },
  approveBtnText: { color: '#fff', fontFamily: Fonts.sansBold, fontSize: 13 },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.md,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  rejectBtnText: { color: Colors.error, fontFamily: Fonts.sansBold, fontSize: 13 },
  suspendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.md,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  suspendBtnText: { color: Colors.error, fontFamily: Fonts.sansBold, fontSize: 13 },
  restoreBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.md,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.success,
  },
  restoreBtnText: { color: Colors.success, fontFamily: Fonts.sansBold, fontSize: 13 },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.md,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.error + '66',
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  deleteBtnCompact: {
    minWidth: 112,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: Colors.error + '66',
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  deleteBtnText: { color: Colors.error, fontFamily: Fonts.sansBold, fontSize: 13 },
});
