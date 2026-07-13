import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import { Notification } from '../../types';
import { useAppStore } from '../../store/appStore';
import EmptyState from '../../components/EmptyState';

function iconMetaFor(
  type: Notification['type'],
  p: ColorPalette,
): { icon: React.ComponentProps<typeof Feather>['name']; color: string; bg: string } {
  switch (type) {
    case 'booking':
      return { icon: 'calendar', color: p.gold, bg: p.goldDim };
    case 'payment':
      return { icon: 'credit-card', color: p.success, bg: 'rgba(34,197,94,0.12)' };
    case 'subscription':
      return { icon: 'refresh-cw', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' };
    case 'review':
      return { icon: 'star', color: p.gold, bg: p.goldDim };
    default:
      return { icon: 'bell', color: p.textSecondary, bg: p.cardInner };
  }
}

function createNotificationsStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: p.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heading: { fontFamily: Fonts.serifMedium, fontSize: 20, color: p.textPrimary },
    markAll: { color: p.gold, fontFamily: Fonts.sansMedium, fontSize: 13 },
    scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32, gap: 12 },
    card: {
      flexDirection: 'row',
      gap: 14,
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: p.border,
    },
    cardUnread: { borderColor: p.goldBorder, backgroundColor: p.goldDim },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    content: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    title: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14, flex: 1 },
    titleUnread: { fontFamily: Fonts.sansBold },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: p.gold },
    body: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20, marginBottom: 8 },
    time: { color: p.textMuted, fontFamily: Fonts.sans, fontSize: 11 },
  });
}

export default function NotificationsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createNotificationsStyles(palette, shadow), [palette, shadow]);
  const {
    customerNotifications,
    markCustomerNotificationRead,
    markAllCustomerNotificationsRead,
    hydrateCustomerNotifications,
  } = useAppStore();
  const unreadCount = customerNotifications.filter((n) => !n.isRead).length;

  useFocusEffect(
    useCallback(() => {
      void hydrateCustomerNotifications({ force: true });
    }, [hydrateCustomerNotifications])
  );

  const handleNotificationPress = async (notification: Notification) => {
    await markCustomerNotificationRead(notification.id);

    switch (notification.actionType) {
      case 'customer_bookings':
        navigation.navigate('CustomerApp', {
          screen: 'Bookings',
          params: notification.actionId ? { bookingId: notification.actionId } : undefined,
        });
        break;
      default:
        break;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.heading}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllCustomerNotificationsRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 80 }} />}
      </View>

      <FlatList
        data={customerNotifications}
        keyExtractor={(n) => n.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, customerNotifications.length === 0 && { flex: 1 }]}
        renderItem={({ item: notif }) => {
          const ic = iconMetaFor(notif.type, palette);
          return (
            <TouchableOpacity
              key={notif.id}
              style={[styles.card, !notif.isRead && styles.cardUnread]}
              activeOpacity={0.8}
              onPress={() => {
                void handleNotificationPress(notif);
              }}
            >
              <View style={[styles.iconWrap, { backgroundColor: ic.bg }]}>
                <Feather name={ic.icon} size={18} color={ic.color} />
              </View>
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, !notif.isRead && styles.titleUnread]}>{notif.title}</Text>
                  {!notif.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.body}>{notif.body}</Text>
                <Text style={styles.time}>{notif.createdAt}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="bell"
            title="No notifications"
            message="You'll see booking confirmations, reminders, and updates here."
          />
        }
      />
    </View>
  );
}
