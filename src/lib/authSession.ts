import { safeStorage } from './safeStorage';
import { fetchWithApiBaseUrlFallback } from './api/baseUrl';

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const AUTH_SESSION_KEY = 'nlbb_auth_session';

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
  const raw = await safeStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.refreshToken !== 'string' ||
      typeof parsed.expiresIn !== 'number'
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiresIn: parsed.expiresIn,
    };
  } catch {
    return null;
  }
};

export const setStoredSession = async (session: SessionTokens | null): Promise<void> => {
  if (!session) {
    await safeStorage.removeItem(AUTH_SESSION_KEY);
    return;
  }

  await safeStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(normalizeSession(session)));
};

export const clearStoredSession = async (): Promise<void> => {
  await safeStorage.removeItem(AUTH_SESSION_KEY);
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

    await setStoredSession(payload.data);
    return payload.data;
  } catch {
    return null;
  }
};
