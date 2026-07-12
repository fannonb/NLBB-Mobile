import { apiClient } from './client';
import { Notification } from '../../types';
import { formatReadableDateTime } from '../dateTime';

const normalizeNotification = (notification: Notification): Notification => ({
  ...notification,
  createdAt: formatReadableDateTime(notification.createdAt, notification.createdAt),
});

export const notificationsApi = {
  listMyNotifications: async () => {
    const notifications = await apiClient.get<Notification[]>('notifications/me');
    return notifications.map(normalizeNotification);
  },
  markNotificationRead: (notificationId: string) =>
    apiClient.patch<Notification>(`notifications/${notificationId}/read`, {}).then(normalizeNotification),
  markAllNotificationsRead: () =>
    apiClient.patch<{ updated: number }>('notifications/me/read-all', {}),
};
