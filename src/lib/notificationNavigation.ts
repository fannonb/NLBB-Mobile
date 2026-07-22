import { Notification } from '../types';
import { navigationRef } from './navigationRef';
import { PushNotificationPayload } from './push';

type Notifiable = Pick<Notification, 'type' | 'actionType' | 'actionId'> | PushNotificationPayload | null | undefined;
type AppRole = 'customer' | 'provider' | 'admin';

const go = (name: string, params?: object) => {
  if (!navigationRef.isReady()) {
    return false;
  }
  navigationRef.navigate(name, params);
  return true;
};

/** Resolve deep-link target from in-app or push notification payload. */
export const navigateFromNotificationPayload = (
  payload: Notifiable,
  options?: { role?: AppRole | null }
): boolean => {
  if (!payload) {
    return false;
  }

  const actionType = payload.actionType;
  const actionId = 'actionId' in payload ? payload.actionId : undefined;
  const type = 'type' in payload ? payload.type : undefined;
  const role = options?.role;

  switch (actionType) {
    case 'customer_bookings':
      return go('CustomerApp', {
        screen: 'Bookings',
        params: actionId ? { bookingId: actionId } : undefined,
      });
    case 'provider_appointment_detail':
      if (actionId) {
        return go('AppointmentDetail', { appointmentId: actionId });
      }
      return go('ProviderApp', { screen: 'Appointments' });
    case 'provider_subscription':
      return go('ProviderApp', {
        screen: 'Business',
        params: { screen: 'Subscription' },
      });
    case 'provider_reviews':
      return go('ProviderReviews');
    default:
      break;
  }

  // Fallback when older rows lack actionType but still have type/actionId.
  if (role === 'customer' && type === 'booking') {
    return go('CustomerApp', {
      screen: 'Bookings',
      params: actionId ? { bookingId: actionId } : undefined,
    });
  }

  if (role === 'provider' || !role) {
    if (type === 'booking') {
      if (actionId) {
        return go('AppointmentDetail', { appointmentId: actionId });
      }
      return go('ProviderApp', { screen: 'Appointments' });
    }
    if (type === 'review') {
      return go('ProviderReviews');
    }
    if (type === 'payment' || type === 'subscription') {
      return go('ProviderApp', {
        screen: 'Business',
        params: { screen: 'Subscription' },
      });
    }
  }

  return false;
};
