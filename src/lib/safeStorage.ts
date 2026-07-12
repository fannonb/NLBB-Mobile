import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_TIMEOUT_MS = 1500;

const withTimeout = async <T>(promise: Promise<T>, fallback: T, operationName: string): Promise<T> => {
  let didTimeout = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => {
          didTimeout = true;
          resolve(fallback);
        }, STORAGE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }

    if (didTimeout) {
      console.warn(`[SafeStorage] ${operationName} timed out after ${STORAGE_TIMEOUT_MS}ms. Returning fallback.`);
    }
  }
};

export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await withTimeout(AsyncStorage.getItem(key), null, `getItem(${key})`);
    } catch (error) {
      console.error(`[SafeStorage] Error in getItem(${key}):`, error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await withTimeout(AsyncStorage.setItem(key, value), undefined, `setItem(${key})`);
    } catch (error) {
      console.error(`[SafeStorage] Error in setItem(${key}):`, error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await withTimeout(AsyncStorage.removeItem(key), undefined, `removeItem(${key})`);
    } catch (error) {
      console.error(`[SafeStorage] Error in removeItem(${key}):`, error);
    }
  },

  clear: async (): Promise<void> => {
    try {
      await withTimeout(AsyncStorage.clear(), undefined, 'clear');
    } catch (error) {
      console.error('[SafeStorage] Error in clear:', error);
    }
  },
};