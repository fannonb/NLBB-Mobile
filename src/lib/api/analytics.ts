import { apiClient } from './client';

export interface ProviderAnalyticsSummary {
  providerId: string;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
}

export const analyticsApi = {
  getMyProviderAnalytics: () =>
    apiClient.get<ProviderAnalyticsSummary | null>('analytics/provider/me'),
};

