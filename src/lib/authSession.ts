import { safeStorage } from './safeStorage';
import { fetchWithApiBaseUrlFallback } from './api/baseUrl';
import { User } from '../types';

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const AUTH_SESSION_KEY = 'nlbb_auth_session';
const AUTH_USER_KEY = 'nlbb_auth_user';

let memorySession: SessionTokens | null | undefined;
let sessionLoadPromise: Promise<SessionTokens | null> | null = null;
let sessionVersion = 0;
let memoryUser: User | null | undefined;
let userLoadPromise: Promise<User | null> | null = null;
let userVersion = 0;
let refreshPromise: Promise<SessionTokens | null> | null = null;

type StoredSession = SessionTokens & {
  updatedAt: string;
};

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: {
    code?: string;
    message?: string;
  };
}

const normalizeSession = (session: SessionTokens): StoredSession => ({
  ...session,
  updatedAt: new Date().toISOString(),
});

export const getStoredSession = async (): Promise<SessionTokens | null> => {
  if (memorySession !== undefined) {
    return memorySession;
  }

  if (sessionLoadPromise) {
    return sessionLoadPromise;
  }

  const startedAtVersion = sessionVersion;
  sessionLoadPromise = (async () => {
    const raw = await safeStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) {
      if (startedAtVersion === sessionVersion) {
        memorySession = null;
      }
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as StoredSession;
      if (
        typeof parsed.accessToken !== 'string' ||
        typeof parsed.refreshToken !== 'string' ||
        typeof parsed.expiresIn !== 'number'
      ) {
        if (startedAtVersion === sessionVersion) {
          memorySession = null;
        }
        return null;
      }

      const session = {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        expiresIn: parsed.expiresIn,
      };
      if (startedAtVersion === sessionVersion) {
        memorySession = session;
      }
      return session;
    } catch {
      if (startedAtVersion === sessionVersion) {
        memorySession = null;
      }
      return null;
    } finally {
      sessionLoadPromise = null;
    }
  })();

  return sessionLoadPromise;
};

export const setStoredSession = async (session: SessionTokens | null): Promise<void> => {
  sessionVersion += 1;
  memorySession = session;
  if (!session) {
    await safeStorage.removeItem(AUTH_SESSION_KEY);
    return;
  }

  await safeStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(normalizeSession(session)));
};

export const clearStoredSession = async (): Promise<void> => {
  await setStoredSession(null);
};

export const getStoredUser = async (): Promise<User | null> => {
  if (memoryUser !== undefined) {
    return memoryUser;
  }

  if (userLoadPromise) {
    return userLoadPromise;
  }

  const startedAtVersion = userVersion;
  userLoadPromise = (async () => {
    const raw = await safeStorage.getItem(AUTH_USER_KEY);
    let user: User | null = null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as User;
        if (parsed && typeof parsed.id === 'string' && typeof parsed.role === 'string') {
          user = parsed;
        }
      } catch {
        user = null;
      }
    }

    if (startedAtVersion === userVersion) {
      memoryUser = user;
    }
    userLoadPromise = null;
    return user;
  })();

  return userLoadPromise;
};

export const setStoredUser = async (user: User | null): Promise<void> => {
  userVersion += 1;
  memoryUser = user;
  if (!user) {
    await safeStorage.removeItem(AUTH_USER_KEY);
    return;
  }
  await safeStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = async (): Promise<void> => {
  memorySession = null;
  memoryUser = null;
  sessionVersion += 1;
  userVersion += 1;
  await Promise.all([
    safeStorage.removeItem(AUTH_SESSION_KEY),
    safeStorage.removeItem(AUTH_USER_KEY),
  ]);
};

export const getAccessToken = async (): Promise<string | null> => {
  const session = await getStoredSession();
  return session?.accessToken ?? null;
};

export const getRefreshToken = async (): Promise<string | null> => {
  const session = await getStoredSession();
  return session?.refreshToken ?? null;
};

export const refreshStoredSession = async (): Promise<SessionTokens | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const startedAtVersion = sessionVersion;
  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const { response } = await fetchWithApiBaseUrlFallback('auth/refresh', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response) {
        return null;
      }

      const payload = (await response.json()) as ApiEnvelope<SessionTokens> | null;
      if (!response.ok || !payload?.success) {
        if (response.status === 401 || response.status === 403) {
          await clearStoredSession();
        }
        return null;
      }

      if (startedAtVersion !== sessionVersion || memorySession === null) {
        return null;
      }

      await setStoredSession(payload.data);
      return payload.data;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};
