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

const REFRESH_INTERVAL_MS = 15_000;

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

  if (inFlightLoad && !options.force) {
    return inFlightLoad;
  }

  const request = (async () => {
    emitState({
      loading: !hasWarmData,
      refreshing: hasWarmData,
      error: null,
    });

    try {
      const [providers, categories] = await Promise.all([
        providerApi.listProviders({}, { force: options.force }),
        providerApi.listCategories({ force: options.force }),
      ]);

      emitState({
        providers,
        categories: mergeCategoriesWithDefaults(categories),
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
    void loadProviderDirectory();

    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void loadProviderDirectory({ force: sharedState.providers.length === 0 });
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      listeners.delete(setState);
      subscription.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProviderDirectory({ force: sharedState.providers.length === 0 });
    }, [])
  );

  const refresh = useCallback(() => loadProviderDirectory({ force: true }), []);

  return { ...state, refresh };
};
