import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { mergeCategoriesWithDefaults } from '../constants/serviceCategories';
import { providerApi } from '../lib/api/providers';
import { Category, Provider } from '../types';

type ProviderDirectoryState = {
  providers: Provider[];
  categories: Category[];
  loading: boolean;
  refreshing: boolean;
  loadedAt: number;
  error: string | null;
};

// Tab focus refetches at most once a minute; app resume always refetches (see below).
const REFRESH_INTERVAL_MS = 60_000;

let sharedState: ProviderDirectoryState = {
  providers: [],
  categories: mergeCategoriesWithDefaults([]),
  loading: true,
  refreshing: false,
  loadedAt: 0,
  error: null,
};

let inFlightLoad: Promise<void> | null = null;
const listeners = new Set<(state: ProviderDirectoryState) => void>();
let appStateSubscription: { remove: () => void } | null = null;

const sameSerialized = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

const prefetchProviderImages = (providers: Provider[]) => {
  const urls = new Set<string>();
  providers.slice(0, 30).forEach((provider) => {
    if (provider.coverImage) urls.add(provider.coverImage);
    if (provider.avatar) urls.add(provider.avatar);
    provider.galleryImages?.slice(0, 3).forEach((image) => {
      if (image) urls.add(image);
    });
  });

  urls.forEach((url) => {
    void Image.prefetch(url).catch(() => undefined);
  });
};

const emitState = (next: Partial<ProviderDirectoryState>) => {
  sharedState = { ...sharedState, ...next };
  listeners.forEach((listener) => listener(sharedState));
};

export const loadProviderDirectory = async (options: { force?: boolean } = {}) => {
  const hasWarmData = sharedState.providers.length > 0;
  const isFresh = sharedState.loadedAt > 0 && Date.now() - sharedState.loadedAt < REFRESH_INTERVAL_MS;

  if (!options.force && isFresh) {
    return;
  }

  // A request already on the wire answers forced refreshes too; several screens and the
  // resume handler often ask at the same moment.
  if (inFlightLoad) {
    return inFlightLoad;
  }

  const request = (async () => {
    // Background refreshes stay silent: only the very first load shows a loading state,
    // so mounted screens don't re-render twice per refresh.
    if (!hasWarmData && !sharedState.loading) {
      emitState({ loading: true, error: null });
    }

    try {
      const [providers, fetchedCategories] = await Promise.all([
        providerApi.listProviders({}, { force: options.force }),
        providerApi.listCategories({ force: options.force }),
      ]);
      const categories = mergeCategoriesWithDefaults(fetchedCategories);

      const unchanged =
        hasWarmData &&
        !sharedState.loading &&
        sharedState.error === null &&
        sameSerialized(sharedState.providers, providers) &&
        sameSerialized(sharedState.categories, categories);

      if (unchanged) {
        sharedState = { ...sharedState, loadedAt: Date.now() };
        return;
      }

      emitState({
        providers,
        categories,
        loading: false,
        refreshing: false,
        loadedAt: Date.now(),
        error: null,
      });
      prefetchProviderImages(providers);
    } catch (error) {
      emitState({
        loading: false,
        refreshing: false,
        categories: sharedState.categories.length > 0 ? sharedState.categories : mergeCategoriesWithDefaults([]),
        error: error instanceof Error ? error.message : 'Unable to load providers',
      });
    }
  })().finally(() => {
    if (inFlightLoad === request) {
      inFlightLoad = null;
    }
  });

  inFlightLoad = request;
  return request;
};

export const useProviderDirectory = () => {
  const [state, setState] = useState(sharedState);

  useEffect(() => {
    listeners.add(setState);
    setState(sharedState);
    void loadProviderDirectory();

    // One resume listener for the whole directory, not one per mounted screen.
    if (!appStateSubscription) {
      appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          // Always re-fetch on resume so unpaid providers do not linger after payment.
          void loadProviderDirectory({ force: true });
        }
      });
    }

    return () => {
      listeners.delete(setState);
      if (listeners.size === 0 && appStateSubscription) {
        appStateSubscription.remove();
        appStateSubscription = null;
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Respect the short TTL unless the directory is empty.
      void loadProviderDirectory({ force: sharedState.providers.length === 0 });
    }, [])
  );

  const refresh = useCallback(() => loadProviderDirectory({ force: true }), []);

  return { ...state, refresh };
};
