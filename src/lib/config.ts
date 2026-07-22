import Constants from 'expo-constants';
import { Platform } from 'react-native';

const normalizeBaseUrl = (value: string) =>
  value
    .trim()
    .replace(/\/+$/, '')
    .replace(/\.+$/, '')
    .replace(/\/+$/, '');
const appendUnique = (list: string[], value: string | null | undefined) => {
  if (!value) {
    return;
  }

  const normalized = normalizeBaseUrl(value);
  if (!normalized || list.includes(normalized)) {
    return;
  }

  list.push(normalized);
};

const resolveExpoHost = () => {
  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;

  if (!hostUri) {
    return null;
  }

  const host = hostUri.split(':')[0]?.trim();
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  return host;
};

const fallbackApiBaseUrl = () => {
  // Android emulator cannot reliably reach host via localhost/LAN; 10.0.2.2 maps to host machine.
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return 'http://10.0.2.2:4000/api';
  }

  const expoHost = resolveExpoHost();
  if (expoHost) {
    return `http://${expoHost}:4000/api`;
  }

  return 'http://localhost:4000/api';
};

const buildApiBaseUrls = () => {
  const urls: string[] = [];
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? null;
  const appEnv = (process.env.EXPO_PUBLIC_APP_ENV ?? 'development').trim().toLowerCase();
  const expoHost = resolveExpoHost();
  const isPhysicalDevice = Constants.isDevice === true;
  const isAndroidEmulator = Platform.OS === 'android' && !isPhysicalDevice;
  const preferHostedApi =
    appEnv === 'production' || (envBaseUrl ?? '').trim().toLowerCase().startsWith('https://');

  if (preferHostedApi) {
    appendUnique(urls, envBaseUrl);
    return urls;
  }

  // When dev API URL is explicitly configured, use it as the single source of truth.
  if (envBaseUrl) {
    appendUnique(urls, envBaseUrl);
    return urls;
  }

  if (expoHost) {
    appendUnique(urls, `http://${expoHost}:4000/api`);
  }

  if (isAndroidEmulator) {
    appendUnique(urls, 'http://10.0.2.2:4000/api');
  }

  if (!isPhysicalDevice) {
    appendUnique(urls, fallbackApiBaseUrl());
    appendUnique(urls, 'http://localhost:4000/api');
    appendUnique(urls, 'http://127.0.0.1:4000/api');
  }

  return urls;
};

export const API_BASE_URLS = buildApiBaseUrls();
export const API_BASE_URL = API_BASE_URLS[0] ?? 'http://localhost:4000/api';

console.log('[config] API_BASE_URLS', API_BASE_URLS);

export const resolveImageUrl = (value: string | null | undefined, fallback?: string): string => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback ?? '';
  }

  if (Platform.OS === 'android') {
    if (trimmed.includes('localhost:54321')) {
      return trimmed.replace('localhost:54321', '10.0.2.2:54321');
    }
    if (trimmed.includes('127.0.0.1:54321')) {
      return trimmed.replace('127.0.0.1:54321', '10.0.2.2:54321');
    }
    if (trimmed.includes('localhost:4000')) {
      return trimmed.replace('localhost:4000', '10.0.2.2:4000');
    }
    if (trimmed.includes('127.0.0.1:4000')) {
      return trimmed.replace('127.0.0.1:4000', '10.0.2.2:4000');
    }
  }

  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  const expoHost = hostUri ? hostUri.split(':')[0]?.trim() : null;

  if (expoHost && expoHost !== 'localhost' && expoHost !== '127.0.0.1') {
    if (trimmed.includes('localhost:54321')) {
      return trimmed.replace('localhost:54321', `${expoHost}:54321`);
    }
    if (trimmed.includes('127.0.0.1:54321')) {
      return trimmed.replace('127.0.0.1:54321', `${expoHost}:54321`);
    }
  }

  return trimmed;
};
