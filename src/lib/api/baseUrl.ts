import { API_BASE_URLS } from '../config';

const DEFAULT_TIMEOUT_MS = 12000;

let lastKnownGoodBaseUrl: string | null = API_BASE_URLS[0] ?? null;

const normalizePath = (path: string) => (path.startsWith('/') ? path.slice(1) : path);

const buildUrl = (baseUrl: string, path: string) => `${baseUrl}/${normalizePath(path)}`;

const withTimeout = async (url: string, init: RequestInit, timeoutMs: number): Promise<Response> => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      fetch(url, init),
      new Promise<Response>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
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
