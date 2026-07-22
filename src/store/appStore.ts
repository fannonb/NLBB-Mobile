import { create } from 'zustand';
import { ThemeMode } from '../constants/theme';
import { Service, Booking, Review, Notification, UserRole } from '../types';
import { getStoredSession, getStoredUser } from '../lib/authSession';
import { safeStorage } from '../lib/safeStorage';
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
/** Favorites / bookings can stay warm longer; notifications need fresher pulls. */
const HYDRATION_COOLDOWN_MS = 30_000;
const NOTIFICATION_HYDRATION_COOLDOWN_MS = 8_000;
const FAVORITES_SNAPSHOT_KEY = 'nlbb_favorites_snapshot_v1';
const CUSTOMER_NOTIFICATIONS_SNAPSHOT_KEY = 'nlbb_customer_notifications_snapshot_v1';
const PROVIDER_NOTIFICATIONS_SNAPSHOT_KEY = 'nlbb_provider_notifications_snapshot_v1';

interface AccountSnapshot<T> {
  userId: string;
  data: T;
  savedAt: number;
}

let favoritesHydrationPromise: Promise<void> | null = null;
let customerNotificationsHydrationPromise: Promise<void> | null = null;
let providerNotificationsHydrationPromise: Promise<void> | null = null;
let lastFavoritesHydratedAt = 0;
let lastCustomerNotificationsHydratedAt = 0;
let lastProviderNotificationsHydratedAt = 0;
let favoritesMutationVersion = 0;
let customerNotificationsMutationVersion = 0;
let providerNotificationsMutationVersion = 0;
let favoritesSnapshotUserId: string | null = null;
let customerNotificationsSnapshotUserId: string | null = null;
let providerNotificationsSnapshotUserId: string | null = null;

const readAccountSnapshot = async <T>(key: string, userId: string): Promise<AccountSnapshot<T> | null> => {
  const raw = await safeStorage.getItem(key);
  if (!raw) return null;
  try {
    const snapshot = JSON.parse(raw) as AccountSnapshot<T>;
    return snapshot.userId === userId ? snapshot : null;
  } catch {
    return null;
  }
};

const persistAccountSnapshot = async <T>(key: string, data: T) => {
  const user = await getStoredUser();
  if (!user) return;
  const snapshot: AccountSnapshot<T> = { userId: user.id, data, savedAt: Date.now() };
  await safeStorage.setItem(key, JSON.stringify(snapshot));
};

const hasFreshData = (lastHydratedAt: number, cooldownMs = HYDRATION_COOLDOWN_MS) =>
  lastHydratedAt > 0 && Date.now() - lastHydratedAt < cooldownMs;

const resetHydrationState = () => {
  favoritesHydrationPromise = null;
  customerNotificationsHydrationPromise = null;
  providerNotificationsHydrationPromise = null;
  lastFavoritesHydratedAt = 0;
  lastCustomerNotificationsHydratedAt = 0;
  lastProviderNotificationsHydratedAt = 0;
  // Never reuse a generation. Requests from a previous session must not be
  // allowed to write into the next signed-in user's state.
  favoritesMutationVersion += 1;
  customerNotificationsMutationVersion += 1;
  providerNotificationsMutationVersion += 1;
  favoritesSnapshotUserId = null;
  customerNotificationsSnapshotUserId = null;
  providerNotificationsSnapshotUserId = null;
};

const noteFavoritesMutation = () => {
  favoritesMutationVersion += 1;
  lastFavoritesHydratedAt = Date.now();
};

const noteCustomerNotificationsMutation = () => {
  // Bump generation for optimistic concurrency, but do NOT refresh the hydrate
  // timestamp — mark-read must not block discovering newly created notifications.
  customerNotificationsMutationVersion += 1;
};

const noteProviderNotificationsMutation = () => {
  providerNotificationsMutationVersion += 1;
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
  isRead: notification.isRead === true,
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
    const operationVersion = favoritesMutationVersion;
    set((state) => ({
      favorites: state.favorites.includes(providerId) ? state.favorites : [...state.favorites, providerId],
    }));
    void persistAccountSnapshot(FAVORITES_SNAPSHOT_KEY, get().favorites);
    try {
      await favoritesApi.addFavorite(providerId);
    } catch (err) {
      console.warn('[appStore] addFavorite failed, reverting optimistic update:', err);
      if (operationVersion !== favoritesMutationVersion) return;
      noteFavoritesMutation();
      set({ favorites: previous });
      void persistAccountSnapshot(FAVORITES_SNAPSHOT_KEY, previous);
    }
  },

  removeFavorite: async (providerId) => {
    const previous = get().favorites;
    noteFavoritesMutation();
    const operationVersion = favoritesMutationVersion;
    set((state) => ({ favorites: state.favorites.filter((id) => id !== providerId) }));
    void persistAccountSnapshot(FAVORITES_SNAPSHOT_KEY, get().favorites);
    try {
      await favoritesApi.removeFavorite(providerId);
    } catch (err) {
      console.warn('[appStore] removeFavorite failed, reverting optimistic update:', err);
      if (operationVersion !== favoritesMutationVersion) return;
      noteFavoritesMutation();
      set({ favorites: previous });
      void persistAccountSnapshot(FAVORITES_SNAPSHOT_KEY, previous);
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

    let request!: Promise<void>;
    request = (async () => {
      const startedAtVersion = favoritesMutationVersion;
      try {
        const session = await getStoredSession();
        if (!session?.accessToken) {
          return;
        }

        const user = await getStoredUser();
        if (user && favoritesSnapshotUserId !== user.id) {
          favoritesSnapshotUserId = user.id;
          const snapshot = await readAccountSnapshot<string[]>(FAVORITES_SNAPSHOT_KEY, user.id);
          if (snapshot && startedAtVersion === favoritesMutationVersion && get().favorites.length === 0) {
            set({ favorites: snapshot.data });
          }
        }

        if (hasFreshData(lastFavoritesHydratedAt)) {
          return;
        }

        const backendFavorites = await favoritesApi.listFavorites();
        if (startedAtVersion === favoritesMutationVersion) {
          const nextFavorites = backendFavorites.map((provider) => provider.id);
          set({ favorites: nextFavorites });
          void persistAccountSnapshot(FAVORITES_SNAPSHOT_KEY, nextFavorites);
          lastFavoritesHydratedAt = Date.now();
        }
      } catch {
        // Ignore load failures and keep current state.
      } finally {
        if (favoritesHydrationPromise === request) {
          favoritesHydrationPromise = null;
        }
      }
    })();
    favoritesHydrationPromise = request;

    return request;
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

    let request!: Promise<void>;
    request = (async () => {
      const startedAtVersion = customerNotificationsMutationVersion;
      try {
        const session = await getStoredSession();
        if (!session?.accessToken) {
          return;
        }

        const user = await getStoredUser();
        if (user && customerNotificationsSnapshotUserId !== user.id) {
          customerNotificationsSnapshotUserId = user.id;
          const snapshot = await readAccountSnapshot<Notification[]>(CUSTOMER_NOTIFICATIONS_SNAPSHOT_KEY, user.id);
          if (snapshot && startedAtVersion === customerNotificationsMutationVersion && get().customerNotifications.length === 0) {
            set({ customerNotifications: snapshot.data });
          }
        }

        if (!options?.force && hasFreshData(lastCustomerNotificationsHydratedAt, NOTIFICATION_HYDRATION_COOLDOWN_MS)) {
          return;
        }

        const notifications = await notificationsApi.listMyNotifications();
        if (startedAtVersion === customerNotificationsMutationVersion) {
          set({ customerNotifications: notifications });
          void persistAccountSnapshot(CUSTOMER_NOTIFICATIONS_SNAPSHOT_KEY, notifications);
          lastCustomerNotificationsHydratedAt = Date.now();
        }
      } catch {
        // Ignore load failures and keep current state.
      } finally {
        if (customerNotificationsHydrationPromise === request) {
          customerNotificationsHydrationPromise = null;
        }
      }
    })();
    customerNotificationsHydrationPromise = request;

    return request;
  },

  markCustomerNotificationRead: async (id) => {
    const previous = get().customerNotifications;
    noteCustomerNotificationsMutation();
    const operationVersion = customerNotificationsMutationVersion;
    set((state) => ({
      customerNotifications: state.customerNotifications.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      ),
    }));
    void persistAccountSnapshot(CUSTOMER_NOTIFICATIONS_SNAPSHOT_KEY, get().customerNotifications);

    try {
      const updated = await notificationsApi.markNotificationRead(id);
      if (operationVersion !== customerNotificationsMutationVersion) return;
      noteCustomerNotificationsMutation();
      set((state) => ({
        customerNotifications: state.customerNotifications.map((notification) =>
          notification.id === id ? updated : notification
        ),
      }));
      void persistAccountSnapshot(CUSTOMER_NOTIFICATIONS_SNAPSHOT_KEY, get().customerNotifications);
    } catch {
      if (operationVersion !== customerNotificationsMutationVersion) return;
      noteCustomerNotificationsMutation();
      set({ customerNotifications: previous });
      void persistAccountSnapshot(CUSTOMER_NOTIFICATIONS_SNAPSHOT_KEY, previous);
    }
  },

  markAllCustomerNotificationsRead: async () => {
    const previous = get().customerNotifications;
    noteCustomerNotificationsMutation();
    const operationVersion = customerNotificationsMutationVersion;
    set((state) => ({
      customerNotifications: state.customerNotifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    }));
    void persistAccountSnapshot(CUSTOMER_NOTIFICATIONS_SNAPSHOT_KEY, get().customerNotifications);

    try {
      await notificationsApi.markAllNotificationsRead();
    } catch {
      if (operationVersion !== customerNotificationsMutationVersion) return;
      noteCustomerNotificationsMutation();
      set({ customerNotifications: previous });
      void persistAccountSnapshot(CUSTOMER_NOTIFICATIONS_SNAPSHOT_KEY, previous);
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

    let request!: Promise<void>;
    request = (async () => {
      const startedAtVersion = providerNotificationsMutationVersion;
      try {
        const session = await getStoredSession();
        if (!session?.accessToken) {
          return;
        }

        const user = await getStoredUser();
        if (user && providerNotificationsSnapshotUserId !== user.id) {
          providerNotificationsSnapshotUserId = user.id;
          const snapshot = await readAccountSnapshot<ProviderNotification[]>(PROVIDER_NOTIFICATIONS_SNAPSHOT_KEY, user.id);
          if (snapshot && startedAtVersion === providerNotificationsMutationVersion && get().providerNotifications.length === 0) {
            set({ providerNotifications: snapshot.data });
          }
        }

        if (!options?.force && hasFreshData(lastProviderNotificationsHydratedAt, NOTIFICATION_HYDRATION_COOLDOWN_MS)) {
          return;
        }

        const notifications = await notificationsApi.listMyNotifications();
        if (startedAtVersion === providerNotificationsMutationVersion) {
          const nextNotifications = notifications.map(toProviderNotification);
          set({ providerNotifications: nextNotifications });
          void persistAccountSnapshot(PROVIDER_NOTIFICATIONS_SNAPSHOT_KEY, nextNotifications);
          lastProviderNotificationsHydratedAt = Date.now();
        }
      } catch {
        // Ignore load failures and keep current state.
      } finally {
        if (providerNotificationsHydrationPromise === request) {
          providerNotificationsHydrationPromise = null;
        }
      }
    })();
    providerNotificationsHydrationPromise = request;

    return request;
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
    const operationVersion = providerNotificationsMutationVersion;
    set((state) => ({
      providerNotifications: state.providerNotifications.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      ),
    }));
    void persistAccountSnapshot(PROVIDER_NOTIFICATIONS_SNAPSHOT_KEY, get().providerNotifications);

    try {
      const updated = await notificationsApi.markNotificationRead(id);
      if (operationVersion !== providerNotificationsMutationVersion) return;
      const normalized = toProviderNotification(updated);
      noteProviderNotificationsMutation();
      set((state) => ({
        providerNotifications: state.providerNotifications.map((notification) =>
          notification.id === id ? normalized : notification
        ),
      }));
      void persistAccountSnapshot(PROVIDER_NOTIFICATIONS_SNAPSHOT_KEY, get().providerNotifications);
    } catch {
      if (operationVersion !== providerNotificationsMutationVersion) return;
      noteProviderNotificationsMutation();
      set({ providerNotifications: previous });
      void persistAccountSnapshot(PROVIDER_NOTIFICATIONS_SNAPSHOT_KEY, previous);
    }
  },

  markAllProviderNotificationsRead: async () => {
    const previous = get().providerNotifications;
    noteProviderNotificationsMutation();
    const operationVersion = providerNotificationsMutationVersion;
    set((state) => ({
      providerNotifications: state.providerNotifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    }));
    void persistAccountSnapshot(PROVIDER_NOTIFICATIONS_SNAPSHOT_KEY, get().providerNotifications);

    try {
      await notificationsApi.markAllNotificationsRead();
    } catch {
      if (operationVersion !== providerNotificationsMutationVersion) return;
      noteProviderNotificationsMutation();
      set({ providerNotifications: previous });
      void persistAccountSnapshot(PROVIDER_NOTIFICATIONS_SNAPSHOT_KEY, previous);
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
