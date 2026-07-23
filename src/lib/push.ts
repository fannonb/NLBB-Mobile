import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { authApi } from './api/auth';
import type { Notification } from '../types';

// Detect if we are running inside Expo Go client (which doesn't support remote notifications in SDK 53+)
const isExpoGo =
  Constants.expoGoConfig != null ||
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === 'storeClient';

if (!isExpoGo) {
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn('[Push] Failed to set notification handler:', err);
  }
}

export interface PushNotificationPayload {
  notificationId?: string;
  type?: Notification['type'];
  actionType?: Notification['actionType'];
  actionId?: string;
}

const readOptionalString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const parsePushNotificationPayload = (data: unknown): PushNotificationPayload | null => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const payload = data as Record<string, unknown>;
  const normalized: PushNotificationPayload = {
    notificationId: readOptionalString(payload.notificationId),
    type: readOptionalString(payload.type) as Notification['type'] | undefined,
    actionType: readOptionalString(payload.actionType) as Notification['actionType'] | undefined,
    actionId: readOptionalString(payload.actionId),
  };

  return normalized.notificationId || normalized.type || normalized.actionType || normalized.actionId
    ? normalized
    : null;
};

export const registerForPushNotificationsAsync = async () => {
  try {
    if (isExpoGo) {
      return null;
    }

    const Notifications = require('expo-notifications');

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#B68C18',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push] Notification permission was not granted:', finalStatus);
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('[Push] Missing EAS project ID; cannot request Expo push token.');
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    await authApi.registerPushToken({
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      token,
    });
    console.log('[Push] Push token registered with backend.');

    return token;
  } catch (error) {
    // Push registration is best-effort; never block the app on it.
    console.warn('[Push] Push notification registration failed:', error);
    return null;
  }
};

export const subscribeToPushNotifications = (handlers: {
  onReceive?: (payload: PushNotificationPayload | null) => void;
  onResponse?: (payload: PushNotificationPayload | null) => void;
}) => {
  if (isExpoGo) {
    return () => undefined;
  }

  try {
    const Notifications = require('expo-notifications');

    const notificationListener = Notifications.addNotificationReceivedListener((notification: any) => {
      handlers.onReceive?.(parsePushNotificationPayload(notification.request.content.data));
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response: any) => {
      handlers.onResponse?.(parsePushNotificationPayload(response.notification.request.content.data));
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  } catch (error) {
    console.warn('[Push] Failed to attach notification listeners:', error);
    return () => undefined;
  }
};
