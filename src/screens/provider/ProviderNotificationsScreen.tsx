import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { navigateFromNotificationPayload } from '../../lib/notificationNavigation';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import { useAppStore, ProviderNotification } from '../../store/appStore';
import EmptyState from '../../components/EmptyState';

const getTypeConfig = (p: ColorPalette): Record<ProviderNotification['type'], {
  icon: React.ComponentProps<typeof Feather>['name'];
  color: string;
  bg: string;
}> => ({
  booking: { icon: 'calendar', color: p.gold, bg: p.goldDim },
  payment: { icon: 'credit-card', color: p.success, bg: 'rgba(22,163,74,0.1)' },
  subscription: { icon: 'shield', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
  review: { icon: 'star', color: p.gold, bg: p.goldDim },
  general: { icon: 'bell', color: p.textSecondary, bg: p.cardInner },
});

function createNotificationsStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 24, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: p.border,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: p.card, alignItems: 'center', justifyContent: 'center',
    },
    heading: {
      flex: 1, textAlign: 'center',
      fontFamily: Fonts.serifMedium, fontSize: 18, color: p.textPrimary,
    },
    markAllBtn: { paddingHorizontal: 4 },
    markAllText: { color: p.gold, fontFamily: Fonts.sansMedium, fontSize: 12 },
    list: { padding: 16 },
    item: {
      flexDirection: 'row', gap: 14, alignItems: 'flex-start',
      backgroundColor: p.card, borderRadius: Radius.lg, padding: 16,
      marginBottom: 10, borderWidth: 1, borderColor: p.border, ...s.soft,
    },
    itemUnread: { borderColor: p.goldBorder, backgroundColor: p.bg },
    iconWrap: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    itemContent: { flex: 1 },
    itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    itemTitle: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14, flex: 1 },
    itemTitleUnread: { fontFamily: Fonts.sansBold },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: p.gold, marginLeft: 8 },
    itemBody: { color: p.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 6 },
    itemTime: { color: p.textMuted, fontSize: 11 },
  });
}

export default function ProviderNotificationsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createNotificationsStyles(palette, shadow), [palette, shadow]);
  const typeConfig = useMemo(() => getTypeConfig(palette), [palette]);
  const providerNotifications = useAppStore((s) => s.providerNotifications);
  const markProviderNotificationRead = useAppStore((s) => s.markProviderNotificationRead);
  const markAllProviderNotificationsRead = useAppStore((s) => s.markAllProviderNotificationsRead);
  const hydrateProviderNotifications = useAppStore((s) => s.hydrateProviderNotifications);

  const unreadCount = providerNotifications.filter((n) => !n.isRead).length;

  useFocusEffect(
    useCallback(() => {
      void hydrateProviderNotifications({ force: true });
    }, [hydrateProviderNotifications])
  );

  const handleNotificationPress = async (notification: ProviderNotification) => {
    await markProviderNotificationRead(notification.id);

    const navigated = navigateFromNotificationPayload(notification, { role: 'provider' });
    if (!navigated) {
      // Stay on the list for general/test notifications with no destination.
      return;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.heading}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllProviderNotificationsRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <FlatList
        data={providerNotifications}
        keyExtractor={(n) => n.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, providerNotifications.length === 0 && { flex: 1 }]}
        renderItem={({ item }) => (
          <NotificationItem
            notif={item}
            typeConfig={typeConfig}
            styles={styles}
            onPress={() => {
              void handleNotificationPress(item);
            }}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="bell"
            title="No notifications"
            message="You'll be notified about new booking requests, reviews, and subscription updates here."
          />
        }
      />
    </View>
  );
}

function NotificationItem({ notif, onPress, typeConfig, styles }: { notif: ProviderNotification; onPress: () => void; typeConfig: any; styles: any }) {
  const cfg = typeConfig[notif.type];
  return (
    <TouchableOpacity
      style={[styles.item, !notif.isRead && styles.itemUnread]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
        <Feather name={cfg.icon} size={18} color={cfg.color} />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, !notif.isRead && styles.itemTitleUnread]}>
            {notif.title}
          </Text>
          {!notif.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.itemBody} numberOfLines={2}>{notif.body}</Text>
        <Text style={styles.itemTime}>{notif.createdAt}</Text>
      </View>
    </TouchableOpacity>
  );
}
