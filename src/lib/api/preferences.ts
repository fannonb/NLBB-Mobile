import { apiClient } from './client';
import { ThemeMode } from '../../constants/theme';

export interface NotificationSettings {
  bookingConfirmation: boolean;
  bookingReminder: boolean;
  bookingUpdate: boolean;
  providerMessage: boolean;
  providerPromo: boolean;
  providerReview: boolean;
  appUpdate: boolean;
  accountAlert: boolean;
}

export interface CustomerPreferences {
  themeMode: ThemeMode;
  notificationSettings: NotificationSettings;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  bookingConfirmation: true,
  bookingReminder: true,
  bookingUpdate: true,
  providerMessage: true,
  providerPromo: false,
  providerReview: true,
  appUpdate: false,
  accountAlert: true,
};

export const DEFAULT_CUSTOMER_PREFERENCES: CustomerPreferences = {
  themeMode: 'light',
  notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
};

export const preferencesApi = {
  getMyPreferences: () => apiClient.get<CustomerPreferences>('auth/preferences'),
  updateMyPreferences: (payload: Partial<CustomerPreferences>) =>
    apiClient.patch<CustomerPreferences>('auth/preferences', payload),
};
