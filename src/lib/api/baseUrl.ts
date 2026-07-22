import { API_BASE_URLS } from '../config';

/** Per-candidate timeout once a healthy base is known */
const DEFAULT_TIMEOUT_MS = 15000;
/** Short probe timeout while discovering which base URL works */
const PROBE_TIMEOUT_MS = 4000;
/** Fast fail when health probe recently failed (backend offline) */
const OFFLINE_TIMEOUT_MS = 5000;
const OFFLINE_RETRY_MS = 20_000;

let lastKnownGoodBaseUrl: string | null = API_BASE_URLS[0] ?? null;
let probingPromise: Promise<string | null> | null = null;
let discoveryDone = false;
let backendUnavailableUntil = 0;

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
    backendUnavailableUntil = 0;
  }
};

const probeHealthyBaseUrl = async (): Promise<string | null> => {
  if (probingPromise) {
    return probingPromise;
  }

  probingPromise = (async () => {
    const candidates = [...API_BASE_URLS];
    if (candidates.length === 0) {
      return null;
    }

    if (lastKnownGoodBaseUrl && candidates.includes(lastKnownGoodBaseUrl)) {
      try {
        await withTimeout(
          buildUrl(lastKnownGoodBaseUrl, 'health'),
          { method: 'GET', headers: { Accept: 'application/json' } },
          PROBE_TIMEOUT_MS
        );
        return lastKnownGoodBaseUrl;
      } catch {
        // Fall through to parallel probe.
      }
    }

    return await new Promise<string | null>((resolve) => {
      let settled = false;
      let remaining = candidates.length;

      candidates.forEach((candidate) => {
        void withTimeout(
          buildUrl(candidate, 'health'),
          { method: 'GET', headers: { Accept: 'application/json' } },
          PROBE_TIMEOUT_MS
        )
          .then(() => {
            if (!settled) {
              settled = true;
              markApiBaseUrlHealthy(candidate);
              resolve(candidate);
            }
          })
          .catch(() => {
            remaining -= 1;
            if (!settled && remaining === 0) {
              resolve(null);
            }
          });
      });
    });
  })().finally(() => {
    probingPromise = null;
  });

  return probingPromise;
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
  const errors: string[] = [];
  let backendRecentlyUnavailable = Date.now() < backendUnavailableUntil;

  if (!discoveryDone || backendRecentlyUnavailable) {
    discoveryDone = true;
    const probed = await probeHealthyBaseUrl();
    if (probed) {
      markApiBaseUrlHealthy(probed);
    } else {
      backendUnavailableUntil = Date.now() + OFFLINE_RETRY_MS;
    }
    backendRecentlyUnavailable = Date.now() < backendUnavailableUntil;
  }

  const attemptedBaseUrls = backendRecentlyUnavailable
    ? [API_BASE_URLS[0] ?? getApiBaseUrlCandidates()[0]].filter(Boolean) as string[]
    : getApiBaseUrlCandidates();

  const effectiveTimeout = backendRecentlyUnavailable ? OFFLINE_TIMEOUT_MS : timeoutMs;

  for (let index = 0; index < attemptedBaseUrls.length; index += 1) {
    const candidateBaseUrl = attemptedBaseUrls[index];
    const candidateTimeout = index === 0 ? effectiveTimeout : PROBE_TIMEOUT_MS;
    try {
      const response = await withTimeout(buildUrl(candidateBaseUrl, path), init, candidateTimeout);
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

  discoveryDone = false;
  lastKnownGoodBaseUrl = null;
  backendUnavailableUntil = Date.now() + OFFLINE_RETRY_MS;

  return {
    response: null,
    resolvedBaseUrl: null,
    attemptedBaseUrls,
    errors,
  };
};
