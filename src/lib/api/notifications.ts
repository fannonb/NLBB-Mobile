import { apiClient } from './client';
import { Notification } from '../../types';
import { formatReadableDateTime } from '../dateTime';

const coerceBoolean = (value: unknown): boolean =>
  value === true || value === 1 || value === '1' || value === 'true' || value === 't';

const normalizeNotification = (notification: Notification): Notification => {
  const raw = notification as Notification & {
    is_read?: unknown;
    action_type?: Notification['actionType'];
    action_id?: string;
  };

  return {
    ...notification,
    isRead: coerceBoolean(raw.isRead ?? raw.is_read),
    actionType: raw.actionType ?? raw.action_type,
    actionId: raw.actionId ?? raw.action_id,
    createdAt: formatReadableDateTime(notification.createdAt, notification.createdAt),
  };
};

export const notificationsApi = {
  listMyNotifications: async () => {
    const notifications = await apiClient.get<Notification[]>('notifications/me');
    return notifications.map(normalizeNotification);
  },
  sendTestPush: (payload?: { title?: string; body?: string }) =>
    apiClient.post<Notification>('notifications/test-push', payload ?? {}),
  markNotificationRead: (notificationId: string) =>
    apiClient.patch<Notification>(`notifications/${notificationId}/read`, {}).then(normalizeNotification),
  markAllNotificationsRead: () =>
    apiClient.patch<{ updated: number }>('notifications/me/read-all', {}),
};
