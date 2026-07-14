import { API_BASE_URLS } from '../config';

const DEFAULT_TIMEOUT_MS = 12000;

let lastKnownGoodBaseUrl: string | null = API_BASE_URLS[0] ?? null;

const normalizePath = (path: string) => (path.startsWith('/') ? path.slice(1) : path);

const buildUrl = (baseUrl: string, path: string) => `${baseUrl}/${normalizePath(path)}`;

const withTimeout = async (url: string, init: RequestInit, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | null = null;
  const abortFromCaller = () => controller.abort();

  try {
    if (init.signal?.aborted) {
      controller.abort();
    } else {
      init.signal?.addEventListener('abort', abortFromCaller, { once: true });
    }

    timer = setTimeout(() => controller.abort(), timeoutMs);
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && !init.signal?.aborted) {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
    init.signal?.removeEventListener('abort', abortFromCaller);
  }
};

export const getApiBaseUrlCandidates = (): string[] => {
  if (!lastKnownGoodBaseUrl || !API_BASE_URLS.includes(lastKnownGoodBaseUrl)) {
    return [...API_BASE_URLS];
  }

  return [lastKnownGoodBaseUrl, ...API_BASE_URLS.filter((baseUrl) => baseUrl !== lastKnownGoodBaseUrl)];
};

export const markApiBaseUrlHealthy = (baseUrl: string): void => {
  if (API_BASE_URLS.includes(baseUrl)) {
    lastKnownGoodBaseUrl = baseUrl;
  }
};

export interface FetchWithFallbackResult {
  response: Response | null;
  resolvedBaseUrl: string | null;
  attemptedBaseUrls: string[];
  errors: string[];
}

export const fetchWithApiBaseUrlFallback = async (
  path: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<FetchWithFallbackResult> => {
  const attemptedBaseUrls = getApiBaseUrlCandidates();
  const errors: string[] = [];

  for (const candidateBaseUrl of attemptedBaseUrls) {
    try {
      const response = await withTimeout(buildUrl(candidateBaseUrl, path), init, timeoutMs);
      markApiBaseUrlHealthy(candidateBaseUrl);

      return {
        response,
        resolvedBaseUrl: candidateBaseUrl,
        attemptedBaseUrls,
        errors,
      };
    } catch (error) {
      errors.push(`${candidateBaseUrl}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    response: null,
    resolvedBaseUrl: null,
    attemptedBaseUrls,
    errors,
  };
};
