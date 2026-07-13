import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeedbackModalHost from '../../components/FeedbackModalHost';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import { useModalManager } from '../../hooks/useModalManager';
import { DEFAULT_NOTIFICATION_SETTINGS, NotificationSettings, preferencesApi } from '../../lib/api/preferences';
import { notificationsApi } from '../../lib/api/notifications';
import { useAppStore } from '../../store/appStore';

type NotificationSettingId = keyof NotificationSettings;

interface NotificationSettingMeta {
  id: NotificationSettingId;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Feather>['name'];
}

interface NotificationSection {
  title: string;
  data: NotificationSettingMeta[];
}

const SECTIONS: NotificationSection[] = [
  {
    title: 'Booking Notifications',
    data: [
      {
        id: 'bookingConfirmation',
        label: 'Booking Confirmation',
        description: 'Get notified when a booking is confirmed',
        icon: 'check-circle',
      },
      {
        id: 'bookingReminder',
        label: 'Booking Reminder',
        description: 'Reminder 24 hours before your appointment',
        icon: 'clock',
      },
      {
        id: 'bookingUpdate',
        label: 'Booking Updates',
        description: 'Changes or cancellations to your bookings',
        icon: 'edit-3',
      },
    ],
  },
  {
    title: 'Provider Updates',
    data: [
      {
        id: 'providerMessage',
        label: 'Direct Messages',
        description: 'Messages from your service providers',
        icon: 'message-circle',
      },
      {
        id: 'providerPromo',
        label: 'Special Offers',
        description: 'Promotions and discounts from providers',
        icon: 'gift',
      },
      {
        id: 'providerReview',
        label: 'Review Requests',
        description: 'Requests to review completed services',
        icon: 'star',
      },
    ],
  },
  {
    title: 'General Notifications',
    data: [
      {
        id: 'appUpdate',
        label: 'App Updates',
        description: 'News about new features and improvements',
        icon: 'package',
      },
      {
        id: 'accountAlert',
        label: 'Account Alerts',
        description: 'Security and account-related notifications',
        icon: 'alert-circle',
      },
    ],
  },
];

function createNotificationSettingsStyles(p: ColorPalette, s: ShadowPalette) {
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
      ...s.soft,
    },
    heading: { flex: 1, textAlign: 'center', fontFamily: Fonts.serifMedium, fontSize: 18, color: p.textPrimary },
    scroll: { paddingHorizontal: 24, paddingBottom: 32 },
    topSection: { marginTop: 16, marginBottom: 24 },
    topText: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20, marginBottom: 16 },
    buttonRow: { flexDirection: 'row', gap: 10 },
    quickBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: p.gold,
      borderRadius: Radius.md,
      paddingVertical: 10,
      ...s.gold,
    },
    quickBtnSecondary: {
      backgroundColor: p.card,
      ...s.soft,
    },
    quickBtnText: { color: p.bg, fontFamily: Fonts.sansMedium, fontSize: 13 },
    quickBtnTextSecondary: { color: p.textPrimary },
    testPushBtn: {
      marginTop: 10,
      backgroundColor: p.textPrimary,
      ...s.soft,
    },
    sectionTitle: {
      fontFamily: Fonts.serifMedium,
      fontSize: 15,
      color: p.textPrimary,
      marginTop: 20,
      marginBottom: 12,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: p.card,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: p.border,
    },
    settingBorder: { borderBottomWidth: 0 },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    settingIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: p.goldDim,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    settingContent: { flex: 1 },
    settingLabel: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 13 },
    settingDescription: { color: p.textMuted, fontFamily: Fonts.sans, fontSize: 11, marginTop: 4 },
    bottomSection: { marginTop: 28 },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: p.goldDim,
      borderRadius: Radius.lg,
      padding: 14,
      gap: 12,
    },
    infoContent: { flex: 1 },
    infoTitle: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 12 },
    infoText: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 11, marginTop: 2, lineHeight: 16 },
    loadingState: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 24,
    },
    loadingText: {
      color: p.textSecondary,
      fontFamily: Fonts.sans,
      fontSize: 13,
    },
  });
}

export default function NotificationSettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createNotificationSettingsStyles(palette, shadow), [palette, shadow]);
  const storeNotificationSettings = useAppStore((state) => state.notificationSettings);
  const updateNotificationSettings = useAppStore((state) => state.updateNotificationSettings);
  const [settings, setSettings] = useState<NotificationSettings>({
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...storeNotificationSettings,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTestPush, setSendingTestPush] = useState(false);
  const { modal, showSuccess, showError, hideModal } = useModalManager();

  useEffect(() => {
    let active = true;

    const loadPreferences = async () => {
      try {
        const preferences = await preferencesApi.getMyPreferences();
        if (!active) {
          return;
        }
        setSettings(preferences.notificationSettings);
        updateNotificationSettings(preferences.notificationSettings);
      } catch {
        if (active) {
          setSettings({
            ...DEFAULT_NOTIFICATION_SETTINGS,
            ...storeNotificationSettings,
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadPreferences();

    return () => {
      active = false;
    };
  }, []);

  const saveNotificationSettings = async (nextSettings: NotificationSettings) => {
    const previous = settings;
    setSettings(nextSettings);
    updateNotificationSettings(nextSettings);
    setSaving(true);

    try {
      const updated = await preferencesApi.updateMyPreferences({
        notificationSettings: nextSettings,
      });
      setSettings(updated.notificationSettings);
      updateNotificationSettings(updated.notificationSettings);
    } catch (error) {
      setSettings(previous);
      updateNotificationSettings(previous);
      const message =
        error instanceof Error ? error.message : 'Failed to save notification settings';
      showError('Save Failed', message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (id: NotificationSettingId) => {
    void saveNotificationSettings({
      ...settings,
      [id]: !settings[id],
    });
  };

  const enableAll = () => {
    const nextSettings = Object.keys(settings).reduce((acc, key) => {
      const typedKey = key as NotificationSettingId;
      acc[typedKey] = true;
      return acc;
    }, {} as NotificationSettings);
    void saveNotificationSettings(nextSettings);
  };

  const disableAll = () => {
    const nextSettings = Object.keys(settings).reduce((acc, key) => {
      const typedKey = key as NotificationSettingId;
      acc[typedKey] = false;
      return acc;
    }, {} as NotificationSettings);
    void saveNotificationSettings(nextSettings);
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

  const renderItem = ({
    item: setting,
    index,
    section,
  }: {
    item: NotificationSettingMeta;
    index: number;
    section: NotificationSection;
  }) => (
    <View
      style={[
        styles.settingRow,
        index < section.data.length - 1 && styles.settingBorder,
      ]}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Feather name={setting.icon} size={14} color={palette.gold} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingLabel}>{setting.label}</Text>
          <Text style={styles.settingDescription}>{setting.description}</Text>
        </View>
      </View>
      <Switch
        value={settings[setting.id]}
        onValueChange={() => toggleSetting(setting.id)}
        trackColor={{ false: palette.border, true: palette.goldDim }}
        thumbColor={settings[setting.id] ? palette.gold : palette.textMuted}
        disabled={saving}
      />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.heading}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <SectionList
        sections={SECTIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.topSection}>
            <Text style={styles.topText}>Manage how and when you receive notifications</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.quickBtn} onPress={enableAll} disabled={saving || loading}>
                <Text style={styles.quickBtnText}>Enable All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickBtn, styles.quickBtnSecondary]}
                onPress={disableAll}
                disabled={saving || loading}
              >
                <Text style={[styles.quickBtnText, styles.quickBtnTextSecondary]}>Disable All</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.quickBtn, styles.testPushBtn]}
              onPress={sendTestPush}
              disabled={saving || loading || sendingTestPush}
            >
              <Text style={styles.quickBtnText}>{sendingTestPush ? 'Sending...' : 'Send Test Push'}</Text>
            </TouchableOpacity>
            {(loading || saving) && (
              <View style={styles.loadingState}>
                <ActivityIndicator size="small" color={palette.gold} />
                <Text style={styles.loadingText}>
                  {loading ? 'Loading preferences...' : 'Saving changes...'}
                </Text>
              </View>
            )}
          </View>
        }
        ListFooterComponent={
          <View style={styles.bottomSection}>
            <View style={styles.infoBox}>
              <Feather name="info" size={16} color={palette.gold} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Push Notifications</Text>
                <Text style={styles.infoText}>
                  To receive push notifications, enable them in your device settings for the NLBB app.
                </Text>
              </View>
            </View>
          </View>
        }
      />
      <FeedbackModalHost modal={modal} onDismiss={hideModal} />
    </View>
  );
}
