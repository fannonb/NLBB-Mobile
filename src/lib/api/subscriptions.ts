import { apiClient } from './client';
import { Subscription } from '../../types';

export interface InitiateSubscriptionPaymentResponse {
  checkoutRequestId: string;
  message?: string;
}

export const subscriptionsApi = {
  getMySubscription: () => apiClient.get<Subscription | null>('subscriptions/me'),
  initiatePayment: (phoneNumber: string) =>
    apiClient.post<InitiateSubscriptionPaymentResponse>('subscriptions/me/pay', {
      phoneNumber,
    }),
};

