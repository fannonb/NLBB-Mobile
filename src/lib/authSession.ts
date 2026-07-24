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
const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const SESSION_REFRESH_SKEW_MS = 60 * 1000;
const SESSION_ACTIVITY_PERSIST_THROTTLE_MS = 60 * 1000;

let memorySession: SessionTokens | null | undefined;
let sessionLoadPromise: Promise<SessionTokens | null> | null = null;
let sessionVersion = 0;
let memoryStoredSession: StoredSession | null | undefined;
let memoryUser: User | null | undefined;
let userLoadPromise: Promise<User | null> | null = null;
let userVersion = 0;
let refreshPromise: Promise<SessionTokens | null> | null = null;
let lastPersistedActivityAt = 0;

type StoredSession = SessionTokens & {
  updatedAt: string;
  lastActivityAt: string;
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
  lastActivityAt: new Date().toISOString(),
});

const toSessionTokens = (stored: StoredSession): SessionTokens => ({
  accessToken: stored.accessToken,
  refreshToken: stored.refreshToken,
  expiresIn: stored.expiresIn,
});

const normalizeStoredSession = (parsed: StoredSession | (SessionTokens & { updatedAt?: string; lastActivityAt?: string })) => {
  const updatedAt = parsed.updatedAt ?? new Date().toISOString();
  const lastActivityAt = parsed.lastActivityAt ?? updatedAt;

  return {
    accessToken: parsed.accessToken,
    refreshToken: parsed.refreshToken,
    expiresIn: parsed.expiresIn,
    updatedAt,
    lastActivityAt,
  } satisfies StoredSession;
};

const getStoredSessionExpiryAt = (stored: StoredSession) =>
  new Date(stored.updatedAt).getTime() + stored.expiresIn * 1000;

const shouldRefreshSession = (stored: StoredSession, now = Date.now()) =>
  getStoredSessionExpiryAt(stored) - SESSION_REFRESH_SKEW_MS <= now;

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

      const stored = normalizeStoredSession(parsed);
      const session = toSessionTokens(stored);
      if (startedAtVersion === sessionVersion) {
        memorySession = session;
        memoryStoredSession = stored;
      }
      return session;
    } catch {
      if (startedAtVersion === sessionVersion) {
        memorySession = null;
        memoryStoredSession = null;
      }
      return null;
    } finally {
      sessionLoadPromise = null;
    }
  })();

  return sessionLoadPromise;
};

export const getStoredSessionMeta = async (): Promise<StoredSession | null> => {
  if (memoryStoredSession !== undefined) {
    return memoryStoredSession;
  }

  const session = await getStoredSession();
  if (!session) {
    memoryStoredSession = null;
    return null;
  }

  const raw = await safeStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    memoryStoredSession = null;
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredSession;
    const stored = normalizeStoredSession(parsed);
    memoryStoredSession = stored;
    memorySession = toSessionTokens(stored);
    return stored;
  } catch {
    memoryStoredSession = null;
    return null;
  }
};

export const setStoredSession = async (session: SessionTokens | null): Promise<void> => {
  sessionVersion += 1;
  memorySession = session;
  memoryStoredSession = session ? normalizeSession(session) : null;
  if (!session) {
    lastPersistedActivityAt = 0;
    await safeStorage.removeItem(AUTH_SESSION_KEY);
    return;
  }

  lastPersistedActivityAt = Date.now();
  await safeStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(memoryStoredSession));
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
  memoryStoredSession = null;
  memoryUser = null;
  sessionVersion += 1;
  userVersion += 1;
  lastPersistedActivityAt = 0;
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

export type StoredSessionState = 'missing' | 'active' | 'idle_timeout' | 'token_expired';

export const getStoredSessionState = async (now = Date.now()): Promise<StoredSessionState> => {
  const stored = await getStoredSessionMeta();
  if (!stored) {
    return 'missing';
  }

  const lastActivityAt = new Date(stored.lastActivityAt).getTime();
  if (Number.isFinite(lastActivityAt) && now - lastActivityAt >= SESSION_IDLE_TIMEOUT_MS) {
    return 'idle_timeout';
  }

  if (getStoredSessionExpiryAt(stored) <= now) {
    return 'token_expired';
  }

  return 'active';
};

export const touchStoredSessionActivity = async (): Promise<void> => {
  const stored = await getStoredSessionMeta();
  if (!stored) {
    return;
  }

  const now = Date.now();
  const next = {
    ...stored,
    lastActivityAt: new Date(now).toISOString(),
  } satisfies StoredSession;

  memoryStoredSession = next;
  memorySession = toSessionTokens(next);

  if (now - lastPersistedActivityAt < SESSION_ACTIVITY_PERSIST_THROTTLE_MS) {
    return;
  }

  lastPersistedActivityAt = now;
  await safeStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(next));
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

export const refreshStoredSessionIfNeeded = async (): Promise<SessionTokens | null> => {
  const state = await getStoredSessionState();
  if (state === 'missing' || state === 'idle_timeout') {
    return null;
  }

  const stored = await getStoredSessionMeta();
  if (!stored) {
    return null;
  }

  if (!shouldRefreshSession(stored)) {
    return toSessionTokens(stored);
  }

  return refreshStoredSession();
};
