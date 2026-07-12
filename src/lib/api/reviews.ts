import { apiClient } from './client';

export interface ReviewRecord {
  id: string;
  providerId: string;
  customerId: string;
  bookingId: string;
  userName: string;
  userAvatar?: string;
  serviceName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewPayload {
  providerId: string;
  bookingId: string;
  serviceName?: string;
  rating: number;
  comment: string;
}

export const reviewsApi = {
  createReview: (payload: CreateReviewPayload) =>
    apiClient.post<ReviewRecord>('reviews', payload),
};
