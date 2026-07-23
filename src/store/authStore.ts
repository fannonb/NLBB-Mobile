import { create } from 'zustand';
import { User, UserRole } from '../types';
import { applyThemeMode } from '../constants/theme';
import { isApiClientError } from '../lib/api/client';
import { authApi, AuthSessionResponse, BackendUserProfile } from '../lib/api/auth';
import {
  clearStoredAuth,
  getStoredSession,
  getStoredUser,
  setStoredSession,
  setStoredUser,
} from '../lib/authSession';
import { preferencesApi } from '../lib/api/preferences';
import { saveThemePreference } from '../lib/themePreference';
import {
  DEMO_PASSWORD,
  DEMO_USERS,
  demoTokenFor,
  getDemoUserFromToken,
  isDemoEmail,
} from '../lib/demo/demoSession';
import { ALLOW_SEEDED_IDENTITIES, ENABLE_DEMO_MODE } from '../lib/demo/config';
import { resetDemoState } from '../lib/demo/demoState';
import { registerForPushNotificationsAsync } from '../lib/push';
import { useAppStore } from './appStore';
import { useBookingDataStore } from './bookingDataStore';
import { resolveImageUrl } from '../lib/config';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isInitializing: boolean;
  isReady: boolean;
  initialize: () => Promise<void>;
  refreshCurrentUser: (options?: { force?: boolean }) => Promise<void>;
  login: (
    email: string,
    password: string,
    expectedRole?: UserRole
  ) => Promise<{ success: boolean; role: UserRole | null; error?: string }>;
  signupCustomer: (payload: SignupPayload) => Promise<{ success: boolean; error?: string }>;
  signupProvider: (payload: SignupPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

interface SignupPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  location?: string;
}

// ─── Demo credentials (offline — full UI with dummy content) ─────────────────
// See src/lib/demo/demoData.ts · Login with demo@customer.com or demo@provider.com / demo1234

const SEEDED_PROFILE_NAMES = new Set(['amani wanjiku']);
const SEEDED_PROFILE_EMAILS = new Set(['customer@test.com']);

const normalizeIdentityValue = (value: string | null | undefined) =>
  (value ?? '').trim().toLowerCase();

const isSeededProfile = (profile: BackendUserProfile) => {
  const normalizedName = normalizeIdentityValue(profile.name);
  const normalizedEmail = normalizeIdentityValue(profile.email);
  return SEEDED_PROFILE_NAMES.has(normalizedName) || SEEDED_PROFILE_EMAILS.has(normalizedEmail);
};

const isBlockedSeededProfile = (profile: BackendUserProfile) =>
  !ALLOW_SEEDED_IDENTITIES && isSeededProfile(profile);

const mapBackendUserToAppUser = (profile: BackendUserProfile): User => ({
  id: profile.id,
  name: profile.name,
  email: profile.email ?? '',
  phone: profile.phone,
  avatar: resolveImageUrl(profile.avatar) || undefined,
  role: profile.role,
  location: profile.location ?? undefined,
});

const normalizeStoredUser = (user: User): User => ({
  ...user,
  avatar: resolveImageUrl(user.avatar) || undefined,
});

let initialized = false;
let initializePromise: Promise<void> | null = null;
let refreshUserPromise: Promise<void> | null = null;
let lastUserRefreshAt = 0;
const USER_REFRESH_COOLDOWN_MS = 30_000;

const persistSession = async (session: AuthSessionResponse) => {
  await setStoredSession({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresIn: session.expiresIn,
  });
};

const hydrateUserPreferences = async () => {
  try {
    const preferences = await preferencesApi.getMyPreferences();
    useAppStore.setState((state) => ({
      theme: preferences.themeMode,
      notificationSettings: {
        ...state.notificationSettings,
        ...preferences.notificationSettings,
      },
    }));
    applyThemeMode(preferences.themeMode);
    await saveThemePreference(preferences.themeMode);
  } catch {
    // Keep local preferences if backend preferences are unavailable.
  }

  void registerForPushNotificationsAsync();
};

const warmSignedInAppState = (user: User) => {
  const appState = useAppStore.getState();
  const bookingState = useBookingDataStore.getState();
  appState.resetSessionState();
  bookingState.resetBookings();
  void Promise.allSettled([
    hydrateUserPreferences(),
    appState.hydrateSessionState(user.role),
    bookingState.loadMyBookings(),
  ]);
};

const resetSignedOutState = () => {
  useAppStore.getState().resetSessionState();
  useBookingDataStore.getState().resetBookings();
};

const persistUser = (user: User) => {
  void setStoredUser(user);
};

const invalidateLocalSession = (set: (state: Partial<AuthState>) => void) => {
  lastUserRefreshAt = 0;
  set({ user: null, isLoggedIn: false, isInitializing: false, isReady: true });
  resetSignedOutState();
  void clearStoredAuth();
};

const applySession = async (set: (state: Partial<AuthState>) => void, session: AuthSessionResponse) => {
  if (!session.user) {
    void clearStoredAuth();
    set({ user: null, isLoggedIn: false });
    return null;
  }

  if (isBlockedSeededProfile(session.user)) {
    void clearStoredAuth();
    set({ user: null, isLoggedIn: false });
    return null;
  }

  const user = mapBackendUserToAppUser(session.user);
  lastUserRefreshAt = Date.now();
  set({ user, isLoggedIn: true });
  void persistSession(session);
  persistUser(user);
  warmSignedInAppState(user);
  return user;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  isInitializing: false,
  isReady: false,

  initialize: async () => {
    if (initialized && get().isReady) {
      return;
    }

    if (initializePromise) {
      await initializePromise;
      return;
    }

    initialized = true;
    set({ isInitializing: true });

    initializePromise = (async () => {
      try {
        const [session, cachedUser] = await Promise.all([
          getStoredSession(),
          getStoredUser(),
        ]);
        if (!session) {
          set({ user: null, isLoggedIn: false, isReady: true, isInitializing: false });
          void setStoredUser(null);
          return;
        }

        const demoUser = ENABLE_DEMO_MODE ? getDemoUserFromToken(session.accessToken) : null;
        if (demoUser) {
          resetDemoState();
          set({ user: demoUser, isLoggedIn: true, isReady: true, isInitializing: false });
          return;
        }

        set({
          user: cachedUser ? normalizeStoredUser(cachedUser) : null,
          isLoggedIn: cachedUser !== null,
          isReady: true,
          isInitializing: false,
        });
        if (cachedUser) {
          lastUserRefreshAt = Date.now();
          warmSignedInAppState(normalizeStoredUser(cachedUser));
        }

        void (async () => {
          try {
            const profile = await authApi.getMe();
            const currentSession = await getStoredSession();
            if (currentSession?.accessToken !== session.accessToken) {
              return;
            }
            if (!profile || isBlockedSeededProfile(profile)) {
              invalidateLocalSession(set);
              return;
            }

            const user = mapBackendUserToAppUser(profile);
            set({ user, isLoggedIn: true });
            lastUserRefreshAt = Date.now();
            persistUser(user);
            if (!cachedUser) {
              warmSignedInAppState(user);
            }
          } catch (error) {
            const currentSession = await getStoredSession();
            if (
              currentSession?.accessToken === session.accessToken &&
              isApiClientError(error) &&
              (error.status === 401 || error.status === 403)
            ) {
              invalidateLocalSession(set);
            }
          }
        })();
      } catch {
        set({ user: null, isLoggedIn: false, isReady: true, isInitializing: false });
      } finally {
        set({ isInitializing: false, isReady: true });
      }
    })();

    await initializePromise;
  },

  refreshCurrentUser: async (options) => {
    if (!options?.force && Date.now() - lastUserRefreshAt < USER_REFRESH_COOLDOWN_MS) {
      return;
    }
    if (refreshUserPromise) {
      return refreshUserPromise;
    }

    refreshUserPromise = (async () => {
    const session = await getStoredSession();
    if (!session) {
      set({ user: null, isLoggedIn: false });
      return;
    }

    try {
      const profile = await authApi.getMe();
      const currentSession = await getStoredSession();
      if (currentSession?.accessToken !== session.accessToken) {
        return;
      }
      if (!profile) {
        invalidateLocalSession(set);
        return;
      }

      if (isBlockedSeededProfile(profile)) {
        invalidateLocalSession(set);
        return;
      }

      const user = mapBackendUserToAppUser(profile);
      set({ user, isLoggedIn: true });
      persistUser(user);
      lastUserRefreshAt = Date.now();
    } catch (error) {
      const currentSession = await getStoredSession();
      if (
        currentSession?.accessToken === session.accessToken &&
        isApiClientError(error) &&
        (error.status === 401 || error.status === 403)
      ) {
        invalidateLocalSession(set);
      }
      } finally {
        refreshUserPromise = null;
      }
    })();

    return refreshUserPromise;
  },

  login: async (email: string, password: string, expectedRole?: UserRole) => {
    // Demo shortcut — works entirely offline, no backend required.
    const normalizedEmail = email.trim().toLowerCase();
    if (ENABLE_DEMO_MODE && isDemoEmail(normalizedEmail)) {
      if (password !== DEMO_PASSWORD) {
        return { success: false, role: null, error: 'Invalid email or password' };
      }
      const demoUser = DEMO_USERS[normalizedEmail]!;
      if (expectedRole && demoUser.role !== expectedRole) {
        return { success: false, role: null, error: `This account is registered as ${demoUser.role}.` };
      }
      resetDemoState();
      await setStoredSession({ accessToken: demoTokenFor(normalizedEmail), refreshToken: '', expiresIn: 86400 });
      set({ user: demoUser, isLoggedIn: true });
      resetSignedOutState();
      return { success: true, role: demoUser.role };
    }

    try {
      const session = await authApi.login({
        email: email.trim(),
        password,
      });
      const role = session.user?.role ?? null;

      if (session.user && isBlockedSeededProfile(session.user)) {
        return {
          success: false,
          role: null,
          error: 'This app build blocks seeded test identities. Use a live backend account.',
        };
      }

      if (expectedRole && role && role !== expectedRole) {
        void authApi.logoutWithAccessToken(session.accessToken).catch(() => undefined);
        void clearStoredAuth();
        set({ user: null, isLoggedIn: false });
        resetSignedOutState();
        return {
          success: false,
          role: null,
          error: `This account is registered as ${role}.`,
        };
      }

      const user = await applySession(set, session);

      return { success: true, role: user?.role ?? role };
    } catch (error) {
      const message =
        isApiClientError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unable to sign in. Please try again.';
      return { success: false, role: null, error: message };
    }
  },

  signupCustomer: async (payload: SignupPayload) => {
    try {
      const session = await authApi.register({
        fullName: payload.name,
        email: payload.email.trim(),
        password: payload.password,
        phone: payload.phone,
        role: 'customer',
        location: payload.location,
      });
      await applySession(set, session);
      return { success: true };
    } catch (error) {
      const message =
        isApiClientError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unable to create your account. Please try again.';
      return { success: false, error: message };
    }
  },

  signupProvider: async (payload: SignupPayload) => {
    try {
      const session = await authApi.register({
        fullName: payload.name,
        email: payload.email.trim(),
        password: payload.password,
        phone: payload.phone,
        role: 'provider',
        location: payload.location,
      });
      await applySession(set, session);
      return { success: true };
    } catch (error) {
      const message =
        isApiClientError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unable to create provider account. Please try again.';
      return { success: false, error: message };
    }
  },

  logout: async () => {
    lastUserRefreshAt = 0;
    const sessionPromise = getStoredSession();
    set({ user: null, isLoggedIn: false, isInitializing: false, isReady: true });
    resetSignedOutState();
    void clearStoredAuth();

    void sessionPromise.then((session) => {
      const isDemo = ENABLE_DEMO_MODE && session
        ? getDemoUserFromToken(session.accessToken) !== null
        : false;
      if (!isDemo && session?.accessToken) {
        void authApi.logoutWithAccessToken(session.accessToken).catch(() => undefined);
      }
    });
  },
}));
