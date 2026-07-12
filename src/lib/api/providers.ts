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

export const providerApi = {
  listProviders: (filters: ProviderListFilters = {}) => {
    const query = buildQueryString(filters);
    return apiClient.get<Provider[]>(`providers${query ? `?${query}` : ''}`);
  },
  getProvider: (providerId: string) => apiClient.get<Provider>(`providers/${providerId}`),
  listCategories: () => apiClient.get<Category[]>('categories'),
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
