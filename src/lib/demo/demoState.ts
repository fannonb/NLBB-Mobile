import { Notification } from '../../types';
import { BookingRecord } from '../api/bookings';
import { ProviderService } from '../api/providerManagement';
import {
  createDemoBookings,
  createDemoNotifications,
  createDemoProviderServices,
  createProviderDemoNotifications,
  DEMO_FAVORITE_IDS,
  DEMO_PROVIDERS,
  DEMO_SUBSCRIPTION,
} from './demoData';

type DemoState = {
  favoriteIds: string[];
  bookings: BookingRecord[];
  customerNotifications: Notification[];
  providerNotifications: Notification[];
  services: ProviderService[];
  nextBookingRef: number;
  nextServiceRef: number;
};

let state: DemoState | null = null;

export const resetDemoState = () => {
  state = {
    favoriteIds: [...DEMO_FAVORITE_IDS],
    bookings: createDemoBookings(),
    customerNotifications: createDemoNotifications(),
    providerNotifications: createProviderDemoNotifications(),
    services: createDemoProviderServices(),
    nextBookingRef: 1100,
    nextServiceRef: 100,
  };
};

export const getDemoState = (): DemoState => {
  if (!state) {
    resetDemoState();
  }
  return state!;
};

export const getDemoProvider = () => DEMO_PROVIDERS[0];

export const getDemoSubscription = () => ({ ...DEMO_SUBSCRIPTION });
