import { apiClient } from './client';
import { API_BASE_URLS } from '../config';
import { UserRole } from '../../types';
import { createApiClientError } from './client';
import { fetchWithApiBaseUrlFallback } from './baseUrl';

export interface BackendUserProfile {
  id: string;
  email: string | null;
  name: string;
  phone: string;
  role: UserRole;
  status?: 'active' | 'disabled';
  avatar?: string | null;
  location?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: BackendUserProfile | null;
}

export interface UpsertProfileInput {
  name: string;
  email?: string;
  phone: string;
  role: UserRole;
  location?: string;
  avatar?: string;
}

const requestAuth = async <T>(path: string, body?: unknown) => {
  const { response, resolvedBaseUrl, attemptedBaseUrls, errors: networkErrors } =
    await fetchWithApiBaseUrlFallback(path, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }, 12000);

  if (!response) {
    console.warn('[authApi] backend unreachable', {
      path,
      attemptedBaseUrls,
      networkErrors,
    });
    throw createApiClientError(
      `Cannot reach backend. Tried: ${API_BASE_URLS.join(', ')}`,
      0,
      'BACKEND_UNREACHABLE',
      {
        attemptedBaseUrls,
        errors: networkErrors,
      }
    );
  }

  type Envelope = { success: boolean; data: T; error?: { code?: string; message?: string } };
  let payload: Envelope | null = null;
  try {
    payload = (await response.json()) as Envelope;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    throw createApiClientError(
      payload?.error?.message ?? `Request failed (${response.status}) via ${resolvedBaseUrl ?? 'unknown-base-url'}`,
      response.status,
      payload?.error?.code,
      undefined
    );
  }

  return payload.data;
};

export const authApi = {
  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: Exclude<UserRole, 'admin'>;
    location?: string;
  }) => requestAuth<AuthSessionResponse>('auth/register', payload),
  login: (payload: { email: string; password: string }) =>
    requestAuth<AuthSessionResponse>('auth/login', payload),
  refresh: (payload: { refreshToken: string }) =>
    requestAuth<Omit<AuthSessionResponse, 'user'>>('auth/refresh', payload),
  logout: () => apiClient.post<{ revoked: boolean }>('auth/logout'),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiClient.post<{ updated: boolean }>('auth/change-password', payload),
  uploadAvatar: (payload: { dataUri: string }) =>
    apiClient.post<BackendUserProfile>('auth/avatar', payload),
  getMe: () => apiClient.get<BackendUserProfile | null>('auth/me'),
  upsertProfile: (payload: UpsertProfileInput) =>
    apiClient.post<BackendUserProfile>('auth/profile', payload),
  registerPushToken: (payload: { platform: 'ios' | 'android'; token: string }) =>
    apiClient.post<{ registered: boolean }>('auth/push-token', payload),
  /** Request a password-reset email. Safe to call even if email is not registered. */
  forgotPassword: (payload: { email: string }) =>
    requestAuth<{ sent: boolean }>('auth/forgot-password', payload),
  /** Complete the reset: exchange OTP token + new password (used from deep link flow). */
  resetPassword: (payload: { token: string; newPassword: string }) =>
    requestAuth<{ reset: boolean }>('auth/reset-password', payload),
};

