import { create } from 'zustand';
import { ThemeMode } from '../constants/theme';
import { Service, Booking, Review, Notification, UserRole } from '../types';
import { getStoredSession } from '../lib/authSession';
import { favoritesApi } from '../lib/api/favorites';
import { notificationsApi } from '../lib/api/notifications';
import { DEFAULT_NOTIFICATION_SETTINGS, NotificationSettings } from '../lib/api/preferences';

export interface WorkingHours {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface ProviderProfile {
  businessName: string;
  description: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  location: string;
  category: string;
  coverImage: string;
  avatar: string;
  workingHours: WorkingHours[];
  galleryImages: string[];
  mpesaPhone: string;
  isOpen: boolean;
}

export interface ProviderNotification {
  id: string;
  title: string;
  body: string;
  type: 'booking' | 'payment' | 'subscription' | 'review' | 'general';
  isRead: boolean;
  createdAt: string;
  actionType?: Notification['actionType'];
  actionId?: string;
}

const DEFAULT_WORKING_HOURS: WorkingHours[] = [
  { day: 'Monday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Tuesday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Wednesday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Thursday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Friday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Saturday', isOpen: true, openTime: '10:00 AM', closeTime: '6:00 PM' },
  { day: 'Sunday', isOpen: false, openTime: '10:00 AM', closeTime: '4:00 PM' },
];

const DEFAULT_PROVIDER_COVER =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop';
const HYDRATION_COOLDOWN_MS = 10_000;

let favoritesHydrationPromise: Promise<void> | null = null;
let customerNotificationsHydrationPromise: Promise<void> | null = null;
let providerNotificationsHydrationPromise: Promise<void> | null = null;
let lastFavoritesHydratedAt = 0;
let lastCustomerNotificationsHydratedAt = 0;
let lastProviderNotificationsHydratedAt = 0;
let favoritesMutationVersion = 0;
let customerNotificationsMutationVersion = 0;
let providerNotificationsMutationVersion = 0;

const hasFreshData = (lastHydratedAt: number) =>
  lastHydratedAt > 0 && Date.now() - lastHydratedAt < HYDRATION_COOLDOWN_MS;

const resetHydrationState = () => {
  favoritesHydrationPromise = null;
  customerNotificationsHydrationPromise = null;
  providerNotificationsHydrationPromise = null;
  lastFavoritesHydratedAt = 0;
  lastCustomerNotificationsHydratedAt = 0;
  lastProviderNotificationsHydratedAt = 0;
  favoritesMutationVersion = 0;
  customerNotificationsMutationVersion = 0;
  providerNotificationsMutationVersion = 0;
};

const noteFavoritesMutation = () => {
  favoritesMutationVersion += 1;
  lastFavoritesHydratedAt = Date.now();
};

const noteCustomerNotificationsMutation = () => {
  customerNotificationsMutationVersion += 1;
  lastCustomerNotificationsHydratedAt = Date.now();
};

const noteProviderNotificationsMutation = () => {
  providerNotificationsMutationVersion += 1;
  lastProviderNotificationsHydratedAt = Date.now();
};

const EMPTY_PROVIDER_PROFILE: ProviderProfile = {
  businessName: '',
  description: '',
  phone: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
  location: '',
  category: '',
  coverImage: DEFAULT_PROVIDER_COVER,
  avatar: '',
  workingHours: DEFAULT_WORKING_HOURS,
  galleryImages: [],
  mpesaPhone: '',
  isOpen: true,
};

const toProviderNotification = (notification: Notification): ProviderNotification => ({
  id: notification.id,
  title: notification.title,
  body: notification.body,
  type: notification.type,
  isRead: notification.isRead,
  createdAt: notification.createdAt,
  actionType: notification.actionType,
  actionId: notification.actionId,
});

interface AppState {
  favorites: string[];
  bookings: Booking[];
  customerNotifications: Notification[];
  theme: ThemeMode;
  notificationSettings: {
    bookingConfirmation: boolean;
    bookingReminder: boolean;
    bookingUpdate: boolean;
    providerMessage: boolean;
    providerPromo: boolean;
    providerReview: boolean;
    appUpdate: boolean;
    accountAlert: boolean;
  };

  addFavorite: (providerId: string) => Promise<void>;
  removeFavorite: (providerId: string) => Promise<void>;
  toggleFavorite: (providerId: string) => Promise<void>;
  hydrateFavorites: () => Promise<void>;

  addBooking: (booking: Booking) => void;
  setBookings: (bookings: Booking[]) => void;
  updateCustomerBookingStatus: (id: string, status: Booking['status']) => void;

  hydrateCustomerNotifications: (options?: { force?: boolean }) => Promise<void>;
  markCustomerNotificationRead: (id: string) => Promise<void>;
  markAllCustomerNotificationsRead: () => Promise<void>;

  setTheme: (theme: ThemeMode) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  resetSessionState: () => void;
  hydrateSessionState: (role: UserRole) => Promise<void>;

  providerServices: (Service & { isActive: boolean })[];
  providerReviews: Review[];
  providerNotifications: ProviderNotification[];
  providerProfile: ProviderProfile;

  setProviderServices: (services: (Service & { isActive: boolean })[]) => void;
  setProviderReviews: (reviews: Review[]) => void;
  hydrateProviderNotifications: (options?: { force?: boolean }) => Promise<void>;

  addService: (service: Service) => void;
  updateService: (service: Service) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;

  updateProviderProfile: (profile: Partial<ProviderProfile>) => void;
  updateWorkingHours: (hours: WorkingHours[]) => void;

  markProviderNotificationRead: (id: string) => Promise<void>;
  markAllProviderNotificationsRead: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  favorites: [],
  bookings: [],
  customerNotifications: [],
  theme: 'light',
  notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },

  addFavorite: async (providerId) => {
    const previous = get().favorites;
    noteFavoritesMutation();
    set((state) => ({
      favorites: state.favorites.includes(providerId) ? state.favorites : [...state.favorites, providerId],
    }));
    try {
      await favoritesApi.addFavorite(providerId);
    } catch (err) {
      console.warn('[appStore] addFavorite failed, reverting optimistic update:', err);
      noteFavoritesMutation();
      set({ favorites: previous });
    }
  },

  removeFavorite: async (providerId) => {
    const previous = get().favorites;
    noteFavoritesMutation();
    set((state) => ({ favorites: state.favorites.filter((id) => id !== providerId) }));
    try {
      await favoritesApi.removeFavorite(providerId);
    } catch (err) {
      console.warn('[appStore] removeFavorite failed, reverting optimistic update:', err);
      noteFavoritesMutation();
      set({ favorites: previous });
    }
  },

  toggleFavorite: async (providerId) => {
    const { favorites } = get();
    if (favorites.includes(providerId)) {
      await get().removeFavorite(providerId);
      return;
    }
    await get().addFavorite(providerId);
  },

  hydrateFavorites: async () => {
    if (favoritesHydrationPromise) {
      return favoritesHydrationPromise;
    }

    favoritesHydrationPromise = (async () => {
      const startedAtVersion = favoritesMutationVersion;
      try {
        const session = await getStoredSession();
        if (!session?.accessToken) {
          return;
        }

        if (hasFreshData(lastFavoritesHydratedAt)) {
          return;
        }

        const backendFavorites = await favoritesApi.listFavorites();
        if (startedAtVersion === favoritesMutationVersion) {
          set({ favorites: backendFavorites.map((provider) => provider.id) });
        }
        lastFavoritesHydratedAt = Date.now();
      } catch {
        // Ignore load failures and keep current state.
      } finally {
        favoritesHydrationPromise = null;
      }
    })();

    return favoritesHydrationPromise;
  },

  addBooking: (booking) =>
    set((state) => ({ bookings: [booking, ...state.bookings] })),

  setBookings: (bookings) => set({ bookings }),

  updateCustomerBookingStatus: (id, status) =>
    set((state) => ({
      bookings: state.bookings.map((booking) => (booking.id === id ? { ...booking, status } : booking)),
    })),

  hydrateCustomerNotifications: async (options) => {
    if (customerNotificationsHydrationPromise) {
      return customerNotificationsHydrationPromise;
    }

    customerNotificationsHydrationPromise = (async () => {
      const startedAtVersion = customerNotificationsMutationVersion;
      try {
        const session = await getStoredSession();
        if (!session?.accessToken) {
          return;
        }

        if (!options?.force && hasFreshData(lastCustomerNotificationsHydratedAt)) {
          return;
        }

        const notifications = await notificationsApi.listMyNotifications();
        if (startedAtVersion === customerNotificationsMutationVersion) {
          set({ customerNotifications: notifications });
        }
        lastCustomerNotificationsHydratedAt = Date.now();
      } catch {
        // Ignore load failures and keep current state.
      } finally {
        customerNotificationsHydrationPromise = null;
      }
    })();

    return customerNotificationsHydrationPromise;
  },

  markCustomerNotificationRead: async (id) => {
    const previous = get().customerNotifications;
    noteCustomerNotificationsMutation();
    set((state) => ({
      customerNotifications: state.customerNotifications.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      ),
    }));

    try {
      const updated = await notificationsApi.markNotificationRead(id);
      noteCustomerNotificationsMutation();
      set((state) => ({
        customerNotifications: state.customerNotifications.map((notification) =>
          notification.id === id ? updated : notification
        ),
      }));
    } catch {
      noteCustomerNotificationsMutation();
      set({ customerNotifications: previous });
    }
  },

  markAllCustomerNotificationsRead: async () => {
    const previous = get().customerNotifications;
    noteCustomerNotificationsMutation();
    set((state) => ({
      customerNotifications: state.customerNotifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    }));

    try {
      await notificationsApi.markAllNotificationsRead();
    } catch {
      noteCustomerNotificationsMutation();
      set({ customerNotifications: previous });
    }
  },

  providerServices: [],
  providerReviews: [],
  providerNotifications: [],
  providerProfile: EMPTY_PROVIDER_PROFILE,

  setProviderServices: (services) => set({ providerServices: services }),

  setProviderReviews: (reviews) => set({ providerReviews: reviews }),

  hydrateProviderNotifications: async (options) => {
    if (providerNotificationsHydrationPromise) {
      return providerNotificationsHydrationPromise;
    }

    providerNotificationsHydrationPromise = (async () => {
      const startedAtVersion = providerNotificationsMutationVersion;
      try {
        const session = await getStoredSession();
        if (!session?.accessToken) {
          return;
        }

        if (!options?.force && hasFreshData(lastProviderNotificationsHydratedAt)) {
          return;
        }

        const notifications = await notificationsApi.listMyNotifications();
        if (startedAtVersion === providerNotificationsMutationVersion) {
          set({ providerNotifications: notifications.map(toProviderNotification) });
        }
        lastProviderNotificationsHydratedAt = Date.now();
      } catch {
        // Ignore load failures and keep current state.
      } finally {
        providerNotificationsHydrationPromise = null;
      }
    })();

    return providerNotificationsHydrationPromise;
  },

  addService: (service) =>
    set((state) => ({ providerServices: [...state.providerServices, { ...service, isActive: true }] })),

  updateService: (service) =>
    set((state) => ({
      providerServices: state.providerServices.map((item) =>
        item.id === service.id ? { ...item, ...service } : item
      ),
    })),

  deleteService: (id) =>
    set((state) => ({ providerServices: state.providerServices.filter((item) => item.id !== id) })),

  toggleServiceActive: (id) =>
    set((state) => ({
      providerServices: state.providerServices.map((item) =>
        item.id === id ? { ...item, isActive: !item.isActive } : item
      ),
    })),

  updateProviderProfile: (profile) =>
    set((state) => ({ providerProfile: { ...state.providerProfile, ...profile } })),

  updateWorkingHours: (hours) =>
    set((state) => ({ providerProfile: { ...state.providerProfile, workingHours: hours } })),

  markProviderNotificationRead: async (id) => {
    const previous = get().providerNotifications;
    noteProviderNotificationsMutation();
    set((state) => ({
      providerNotifications: state.providerNotifications.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      ),
    }));

    try {
      const updated = await notificationsApi.markNotificationRead(id);
      const normalized = toProviderNotification(updated);
      noteProviderNotificationsMutation();
      set((state) => ({
        providerNotifications: state.providerNotifications.map((notification) =>
          notification.id === id ? normalized : notification
        ),
      }));
    } catch {
      noteProviderNotificationsMutation();
      set({ providerNotifications: previous });
    }
  },

  markAllProviderNotificationsRead: async () => {
    const previous = get().providerNotifications;
    noteProviderNotificationsMutation();
    set((state) => ({
      providerNotifications: state.providerNotifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    }));

    try {
      await notificationsApi.markAllNotificationsRead();
    } catch {
      noteProviderNotificationsMutation();
      set({ providerNotifications: previous });
    }
  },

  setTheme: (theme) => {
    set({ theme });
  },

  updateNotificationSettings: (settings) => {
    set((state) => ({
      notificationSettings: { ...state.notificationSettings, ...settings },
    }));
  },

  resetSessionState: () =>
    set(() => {
      resetHydrationState();
      return {
        favorites: [],
        bookings: [],
        customerNotifications: [],
        providerNotifications: [],
      };
    }),

  hydrateSessionState: async (role) => {
    if (role === 'customer') {
      await Promise.allSettled([get().hydrateFavorites(), get().hydrateCustomerNotifications()]);
      return;
    }

    if (role === 'provider') {
      await Promise.allSettled([get().hydrateProviderNotifications()]);
    }
  },
}));
