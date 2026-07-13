import { create } from 'zustand';
import { User, UserRole } from '../types';
import { applyThemeMode } from '../constants/theme';
import { isApiClientError } from '../lib/api/client';
import { authApi, AuthSessionResponse, BackendUserProfile } from '../lib/api/auth';
import { clearStoredSession, getStoredSession, setStoredSession } from '../lib/authSession';
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

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isInitializing: boolean;
  isReady: boolean;
  initialize: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
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
  avatar: profile.avatar ?? undefined,
  role: profile.role,
  location: profile.location ?? undefined,
});

const LOGOUT_NETWORK_TIMEOUT_MS = 1500;

let initialized = false;
let initializePromise: Promise<void> | null = null;

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

const syncSignedInAppState = async (user: User) => {
  const appState = useAppStore.getState();
  const bookingState = useBookingDataStore.getState();
  appState.resetSessionState();
  bookingState.resetBookings();
  await hydrateUserPreferences();
  await Promise.allSettled([
    appState.hydrateSessionState(user.role),
    bookingState.loadMyBookings({ force: true }),
  ]);
};

const resetSignedOutState = () => {
  useAppStore.getState().resetSessionState();
  useBookingDataStore.getState().resetBookings();
};

const applySession = async (set: (state: Partial<AuthState>) => void, session: AuthSessionResponse) => {
  if (!session.user) {
    await clearStoredSession();
    set({ user: null, isLoggedIn: false });
    return null;
  }

  if (isBlockedSeededProfile(session.user)) {
    await clearStoredSession();
    set({ user: null, isLoggedIn: false });
    return null;
  }

  await persistSession(session);

  const user = mapBackendUserToAppUser(session.user);
  set({ user, isLoggedIn: true });
  await syncSignedInAppState(user);
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
        const session = await getStoredSession();
        if (!session) {
          set({ user: null, isLoggedIn: false });
          return;
        }

        const demoUser = ENABLE_DEMO_MODE ? getDemoUserFromToken(session.accessToken) : null;
        if (demoUser) {
          resetDemoState();
          set({ user: demoUser, isLoggedIn: true });
          return;
        }

        const profile = await authApi.getMe();
        if (!profile) {
          await clearStoredSession();
          set({ user: null, isLoggedIn: false });
          return;
        }

        if (isBlockedSeededProfile(profile)) {
          await clearStoredSession();
          set({ user: null, isLoggedIn: false });
          return;
        }

        const user = mapBackendUserToAppUser(profile);
        set({ user, isLoggedIn: true });
        await syncSignedInAppState(user);
      } catch {
        await clearStoredSession();
        set({ user: null, isLoggedIn: false });
        resetSignedOutState();
      } finally {
        set({ isInitializing: false, isReady: true });
      }
    })();

    await initializePromise;
  },

  refreshCurrentUser: async () => {
    const session = await getStoredSession();
    if (!session) {
      set({ user: null, isLoggedIn: false });
      return;
    }

    try {
      const profile = await authApi.getMe();
      if (!profile) {
        await clearStoredSession();
        set({ user: null, isLoggedIn: false });
        return;
      }

      if (isBlockedSeededProfile(profile)) {
        await clearStoredSession();
        set({ user: null, isLoggedIn: false });
        return;
      }

      const user = mapBackendUserToAppUser(profile);
      set({ user, isLoggedIn: true });
      await syncSignedInAppState(user);
    } catch {
      await clearStoredSession();
      set({ user: null, isLoggedIn: false });
      resetSignedOutState();
    }
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
      const user = await applySession(set, session);
      const role = user?.role ?? session.user?.role ?? null;

      if (session.user && isBlockedSeededProfile(session.user)) {
        return {
          success: false,
          role: null,
          error: 'This app build blocks seeded test identities. Use a live backend account.',
        };
      }

      if (expectedRole && role && role !== expectedRole) {
        await authApi.logout().catch(() => undefined);
        await clearStoredSession();
        set({ user: null, isLoggedIn: false });
        resetSignedOutState();
        return {
          success: false,
          role: null,
          error: `This account is registered as ${role}.`,
        };
      }

      return { success: true, role };
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
    const session = await getStoredSession();
    const isDemo = ENABLE_DEMO_MODE && session ? getDemoUserFromToken(session.accessToken) !== null : false;

    const logoutPromise =
      !isDemo && session?.accessToken
        ? Promise.race([
            authApi.logoutWithAccessToken(session.accessToken),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), LOGOUT_NETWORK_TIMEOUT_MS)),
          ]).catch(() => undefined)
        : Promise.resolve();

    await clearStoredSession();
    set({ user: null, isLoggedIn: false });
    resetSignedOutState();

    void logoutPromise;
  },
}));
