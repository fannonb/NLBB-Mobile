import React, { useCallback, useMemo, useState } from 'react';
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
import FeedbackModalHost from '../../components/FeedbackModalHost';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { notificationsApi } from '../../lib/api/notifications';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import { useModalManager } from '../../hooks/useModalManager';
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
    actionsRow: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 },
    testPushBtn: {
      alignSelf: 'flex-start',
      backgroundColor: p.textPrimary,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: Radius.md,
    },
    testPushText: { color: p.bg, fontFamily: Fonts.sansMedium, fontSize: 12 },
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
  const { modal, showSuccess, showError, hideModal } = useModalManager();
  const [sendingTestPush, setSendingTestPush] = useState(false);
  const {
    providerNotifications,
    markProviderNotificationRead,
    markAllProviderNotificationsRead,
    hydrateProviderNotifications,
  } = useAppStore();

  const unreadCount = providerNotifications.filter((n) => !n.isRead).length;

  useFocusEffect(
    useCallback(() => {
      void hydrateProviderNotifications({ force: true });
    }, [hydrateProviderNotifications])
  );

  const handleNotificationPress = async (notification: ProviderNotification) => {
    await markProviderNotificationRead(notification.id);

    switch (notification.actionType) {
      case 'provider_appointment_detail':
        if (notification.actionId) {
          navigation.navigate('AppointmentDetail', { appointmentId: notification.actionId });
        } else {
          navigation.navigate('ProviderApp', { screen: 'Appointments' });
        }
        break;
      case 'provider_subscription':
        navigation.navigate('ProviderApp', {
          screen: 'Business',
          params: { screen: 'Subscription' },
        });
        break;
      case 'provider_reviews':
        navigation.navigate('ProviderReviews');
        break;
      default:
        break;
    }
  };

  const sendTestPush = async () => {
    setSendingTestPush(true);
    try {
      await notificationsApi.sendTestPush({
        title: 'NLBB push test',
        body: 'If this appears, push notifications are working correctly on your device.',
      });
      showSuccess('Test Push Sent', 'We sent a test notification to this device. Watch for it now.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send the test push right now.';
      showError('Push Test Failed', message);
    } finally {
      setSendingTestPush(false);
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

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.testPushBtn} onPress={sendTestPush} disabled={sendingTestPush}>
          <Text style={styles.testPushText}>{sendingTestPush ? 'Sending...' : 'Send Test Push'}</Text>
        </TouchableOpacity>
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
      <FeedbackModalHost modal={modal} onDismiss={hideModal} />
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
