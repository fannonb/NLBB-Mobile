import { apiClient } from './client';
import { Category, Provider, Review } from '../../types';
import { formatReadableDateTime } from '../dateTime';

export interface ProviderListFilters {
  search?: string;
  category?: string;
  onlySubscribed?: boolean;
}

const buildQueryString = (filters: ProviderListFilters) => {
  const params: string[] = [];

  if (filters.search) {
    params.push(`search=${encodeURIComponent(filters.search)}`);
  }

  if (filters.category) {
    params.push(`category=${encodeURIComponent(filters.category)}`);
  }

  if (filters.onlySubscribed !== undefined) {
    params.push(`onlySubscribed=${filters.onlySubscribed ? 'true' : 'false'}`);
  }

  return params.join('&');
};

const DIRECTORY_CACHE_MS = 60_000;
const providerCache = new Map<string, { data: Provider[]; loadedAt: number }>();
const providerRequests = new Map<string, Promise<Provider[]>>();
let categoryCache: { data: Category[]; loadedAt: number } | null = null;
let categoryRequest: Promise<Category[]> | null = null;

const listProvidersCached = (filters: ProviderListFilters = {}) => {
  const query = buildQueryString(filters);
  const path = `providers${query ? `?${query}` : ''}`;
  const cached = providerCache.get(path);
  if (cached && Date.now() - cached.loadedAt < DIRECTORY_CACHE_MS) {
    return Promise.resolve(cached.data);
  }

  const existing = providerRequests.get(path);
  if (existing) return existing;

  const request = apiClient.get<Provider[]>(path)
    .then((data) => {
      providerCache.set(path, { data, loadedAt: Date.now() });
      return data;
    })
    .finally(() => {
      if (providerRequests.get(path) === request) {
        providerRequests.delete(path);
      }
    });
  providerRequests.set(path, request);
  return request;
};

const listCategoriesCached = () => {
  if (categoryCache && Date.now() - categoryCache.loadedAt < DIRECTORY_CACHE_MS) {
    return Promise.resolve(categoryCache.data);
  }
  if (categoryRequest) return categoryRequest;

  const request = apiClient.get<Category[]>('categories')
    .then((data) => {
      categoryCache = { data, loadedAt: Date.now() };
      return data;
    })
    .finally(() => {
      if (categoryRequest === request) {
        categoryRequest = null;
      }
    });
  categoryRequest = request;
  return request;
};

export const providerApi = {
  listProviders: listProvidersCached,
  getProvider: (providerId: string) => apiClient.get<Provider>(`providers/${providerId}`),
  listCategories: listCategoriesCached,
  listReviews: async (providerId: string) => {
    const reviews = await apiClient.get<Array<{
      id: string;
      customerId?: string;
      userName: string;
      userAvatar?: string;
      serviceName: string;
      rating: number;
      comment: string;
      createdAt?: string;
      updatedAt?: string;
    }>>(`providers/${providerId}/reviews`);

    return reviews.map((review) => ({
      id: review.id,
      userId: review.customerId ?? review.id,
      userName: review.userName,
      userAvatar: review.userAvatar,
      serviceName: review.serviceName,
      rating: review.rating,
      comment: review.comment,
      date: formatReadableDateTime(review.createdAt ?? review.updatedAt, 'Recently'),
    })) as Review[];
  },
};
