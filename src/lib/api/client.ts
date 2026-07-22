import { User } from '../../types';
import { API_BASE_URLS } from '../config';
import { getAccessToken, refreshStoredSession } from '../authSession';
import { fetchWithApiBaseUrlFallback } from './baseUrl';
import { getDemoUserFromToken } from '../demo/demoSession';
import { handleDemoRequest } from '../demo/demoApi';
import { ENABLE_DEMO_MODE } from '../demo/config';

interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
}

interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T;
  error?: ApiErrorPayload;
}

export type ApiClientError = Error & {
  name: 'ApiClientError';
  status: number;
  code?: string;
  details?: unknown;
};

const isPublicDemoPath = (path: string) => {
  const raw = path.split('?')[0];
  return (
    raw === 'categories' ||
    raw === 'providers' ||
    /^providers\/[^/]+$/.test(raw) ||
    /^providers\/[^/]+\/reviews$/.test(raw)
  );
};

const guestDemoUser = (): User => ({
  id: 'guest',
  name: 'Guest',
  email: '',
  phone: '',
  role: 'customer',
});

export const createApiClientError = (
  message: string,
  status: number,
  code?: string,
  details?: unknown
): ApiClientError => {
  const error = new Error(message) as ApiClientError;
  error.name = 'ApiClientError';
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
};

export const isApiClientError = (error: unknown): error is ApiClientError =>
  error instanceof Error &&
  error.name === 'ApiClientError' &&
  typeof (error as ApiClientError).status === 'number';

const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const canRefreshAfterUnauthorized = (path: string) =>
  ![
    'auth/login',
    'auth/register',
    'auth/refresh',
    'auth/forgot-password',
    'auth/reset-password',
  ].some((publicAuthPath) => path.startsWith(publicAuthPath));

const request = async <T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
  retryOnUnauthorized = true
) => {
  const token = await getAccessToken();
  const demoUser = ENABLE_DEMO_MODE ? getDemoUserFromToken(token) : null;

  if (demoUser) {
    return handleDemoRequest<T>(method, path, body, demoUser);
  }

  if (ENABLE_DEMO_MODE && method === 'GET' && isPublicDemoPath(path)) {
    return handleDemoRequest<T>(method, path, body, guestDemoUser());
  }

  const { response, resolvedBaseUrl, attemptedBaseUrls, errors: networkErrors } =
    await fetchWithApiBaseUrlFallback(path, {
      method,
      headers: {
        ...defaultHeaders,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  if (!response) {
    if (ENABLE_DEMO_MODE && method === 'GET' && isPublicDemoPath(path)) {
      return handleDemoRequest<T>(method, path, body, guestDemoUser());
    }
    console.warn('[apiClient] backend unreachable', {
      method,
      path,
      attemptedBaseUrls,
      networkErrors,
      hint:
        networkErrors.some((entry) => entry.includes('timed out'))
          ? 'Backend responded too slowly or is offline. Ensure `npm run backend:dev` is running and phone/PC share Wi‑Fi.'
          : 'Backend is offline or wrong API URL. Ensure `npm run backend:dev` is running.',
    });
    throw createApiClientError(
      networkErrors.some((entry) => entry.includes('timed out'))
        ? `Backend timed out. Start it with: npm run backend:dev`
        : `Cannot reach backend. Start it with: npm run backend:dev`,
      0,
      'BACKEND_UNREACHABLE',
      {
        attemptedBaseUrls,
        errors: networkErrors,
      }
    );
  }

  let payload: ApiResponseEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponseEnvelope<T>;
  } catch {
    payload = null;
  }

  if (response.status === 401 && retryOnUnauthorized && canRefreshAfterUnauthorized(path)) {
    const refreshed = await refreshStoredSession();
    if (refreshed) {
      return request<T>(method, path, body, false);
    }
  }

  if (!response.ok || !payload?.success) {
    const error = payload?.error;
    throw createApiClientError(
      error?.message ?? `Request failed (${response.status}) via ${resolvedBaseUrl ?? 'unknown-base-url'}`,
      response.status,
      error?.code,
      error?.details
    );
  }

  return payload.data;
};

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
