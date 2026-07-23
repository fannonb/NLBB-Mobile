import { apiClient } from './client';
import { Provider } from '../../types';
import { normalizeProviderMedia } from '../media';

export interface FavoritePayload {
  providerId: string;
}

export const favoritesApi = {
  listFavorites: () =>
    apiClient.get<Provider[]>('favorites/me').then((providers) => providers.map(normalizeProviderMedia)),
  addFavorite: (providerId: string) =>
    apiClient.post<{ providerId: string }>('favorites/me', { providerId } satisfies FavoritePayload),
  removeFavorite: (providerId: string) => apiClient.delete<{ providerId: string }>(`favorites/me/${providerId}`),
};
