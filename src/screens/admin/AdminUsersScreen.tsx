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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Radius, Shadow } from '../../constants/theme';
import { adminApi, AdminUserRecord, AdminUserStatus } from '../../lib/api/admin';
import { confirmAction } from '../../lib/confirmAction';

type Filter = 'all' | 'customer' | 'provider' | 'disabled';

const FILTER_OPTIONS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Customers', value: 'customer' },
  { label: 'Providers', value: 'provider' },
  { label: 'Disabled', value: 'disabled' },
];

export default function AdminUsersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await adminApi.listUsers();
      setUsers(result.filter((user) => user.role === 'customer' || user.role === 'provider'));
    } catch (error: any) {
      setUsers([]);
      setLoadError(error?.message ?? 'Could not load users from backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadUsers();
    }, [loadUsers])
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [user.name, user.email, user.phone]
          .join(' ')
          .toLowerCase()
          .includes(query);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'disabled'
          ? user.status === 'disabled'
          : user.role === filter && user.status === 'active');

      return matchesSearch && matchesFilter;
    });
  }, [filter, search, users]);

  const setUserStatus = async (id: string, status: AdminUserStatus) => {
    try {
      await adminApi.updateUserStatus(id, status);
      setUsers((current) =>
        current.map((user) => (user.id === id ? { ...user, status } : user))
      );
    } catch (error: any) {
      Alert.alert('Could not update user', error?.message ?? 'Please try again.');
    }
  };

  const handleToggleStatus = (id: string, currentStatus: AdminUserStatus) => {
    const isDisabling = currentStatus === 'active';
    confirmAction({
      title: isDisabling ? 'Disable Account' : 'Re-enable Account',
      message: isDisabling
        ? 'This user will no longer be able to access the app.'
        : 'This will restore full access for this user.',
      confirmText: isDisabling ? 'Disable' : 'Enable',
      destructive: isDisabling,
      onConfirm: () => {
        void setUserStatus(id, isDisabling ? 'disabled' : 'active');
      },
    });
  };

  const handleDelete = (id: string) => {
    confirmAction({
      title: 'Delete Account',
      message: 'This action is permanent and cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => {
        void (async () => {
          try {
            await adminApi.deleteUser(id);
            setUsers((current) => current.filter((user) => user.id !== id));
          } catch (error: any) {
            Alert.alert('Could not delete user', error?.message ?? 'Please try again.');
          }
        })();
      },
    });
  };

  const disabledCount = users.filter((user) => user.status === 'disabled').length;
  const customerCount = users.filter((user) => user.role === 'customer').length;
  const providerCount = users.filter((user) => user.role === 'provider').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.heading}>All Users</Text>
        <TouchableOpacity onPress={loadUsers} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={16} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{users.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.gold }]}>{customerCount}</Text>
          <Text style={styles.statLabel}>Customers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.success }]}>{providerCount}</Text>
          <Text style={styles.statLabel}>Providers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.error }]}>{disabledCount}</Text>
          <Text style={styles.statLabel}>Disabled</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or email..."
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
        />
        {search.length > 0 ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => setFilter(option.value)}
            style={[styles.filterChip, filter === option.value && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === option.value && styles.filterTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading && filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="small" color={Colors.gold} />
            <Text style={styles.emptyText}>Loading users...</Text>
          </View>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name={loadError ? 'alert-circle' : 'users'} size={36} color={loadError ? Colors.error : Colors.textMuted} />
            <Text style={styles.emptyText}>{loadError ?? 'No users found'}</Text>
          </View>
        ) : null}

        {filtered.map((user) => (
          <View key={user.id} style={[styles.userCard, user.status === 'disabled' && styles.userCardDisabled]}>
            <View style={styles.cardTop}>
              <View style={styles.avatarWrap}>
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
                {user.status === 'disabled' ? (
                  <View style={styles.disabledOverlay}>
                    <Feather name="slash" size={12} color="#fff" />
                  </View>
                ) : null}
              </View>
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <View style={[styles.roleBadge, user.role === 'provider' && styles.roleBadgeProvider]}>
                    <Text style={[styles.roleText, user.role === 'provider' && styles.roleTextProvider]}>
                      {user.role === 'customer' ? 'Customer' : 'Provider'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.userMeta}>
                  <Feather name="map-pin" size={11} color={Colors.textMuted} />
                  <Text style={styles.userMetaText}>{user.location}</Text>
                  <Text style={styles.userMetaDot}>·</Text>
                  <Feather name="calendar" size={11} color={Colors.textMuted} />
                  <Text style={styles.userMetaText}>{user.joinedAt}</Text>
                </View>
              </View>
            </View>

            <View style={styles.userStats}>
              <View style={styles.userStatItem}>
                <Feather name={user.role === 'customer' ? 'calendar' : 'briefcase'} size={13} color={Colors.textMuted} />
                <Text style={styles.userStatText}>
                  {user.bookingsCount} {user.role === 'customer' ? 'bookings' : 'appointments served'}
                </Text>
              </View>
              <View style={styles.userStatItem}>
                <Feather name="phone" size={13} color={Colors.textMuted} />
                <Text style={styles.userStatText}>{user.phone}</Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => handleToggleStatus(user.id, user.status)}
                style={user.status === 'active' ? styles.disableBtn : styles.enableBtn}
              >
                <Feather
                  name={user.status === 'active' ? 'slash' : 'refresh-cw'}
                  size={13}
                  color={user.status === 'active' ? Colors.error : Colors.success}
                />
                <Text style={[styles.actionBtnText, { color: user.status === 'active' ? Colors.error : Colors.success }]}>
                  {user.status === 'active' ? 'Disable' : 'Enable'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(user.id)} style={styles.deleteBtn}>
                <Feather name="trash-2" size={13} color={Colors.textMuted} />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
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
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    backgroundColor: Colors.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statValue: { fontFamily: Fonts.serifMedium, fontSize: 18, color: Colors.textPrimary, marginBottom: 2 },
  statLabel: { color: Colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontFamily: Fonts.sans, fontSize: 14, padding: 0 },
  filterScroll: { paddingHorizontal: 24, gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.goldDim, borderColor: Colors.goldBorder },
  filterText: { color: Colors.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 12 },
  filterTextActive: { color: Colors.gold },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 14 },
  userCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.soft,
  },
  userCardDisabled: { opacity: 0.65, borderColor: Colors.error + '30' },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26, resizeMode: 'cover' },
  disabledOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.card,
  },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' },
  userName: { color: Colors.textPrimary, fontFamily: Fonts.sansBold, fontSize: 14 },
  roleBadge: { backgroundColor: Colors.goldDim, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  roleBadgeProvider: { backgroundColor: 'rgba(34,197,94,0.1)' },
  roleText: { color: Colors.gold, fontSize: 10, fontFamily: Fonts.sansBold },
  roleTextProvider: { color: Colors.success },
  userEmail: { color: Colors.textSecondary, fontSize: 12, marginBottom: 6 },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  userMetaText: { color: Colors.textMuted, fontSize: 11 },
  userMetaDot: { color: Colors.textMuted, fontSize: 11 },
  userStats: { gap: 6, marginBottom: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  userStatItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userStatText: { color: Colors.textSecondary, fontSize: 12 },
  cardActions: { flexDirection: 'row', gap: 10 },
  disableBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.md,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.error + '60',
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  enableBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.md,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.success + '60',
    backgroundColor: 'rgba(34,197,94,0.05)',
  },
  actionBtnText: { fontFamily: Fonts.sansBold, fontSize: 13 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardInner,
  },
  deleteBtnText: { color: Colors.textMuted, fontFamily: Fonts.sansMedium, fontSize: 13 },
});

