import { apiClient } from './client';
import { Subscription } from '../../types';

export interface InitiateSubscriptionPaymentResponse {
  checkoutRequestId: string;
  message?: string;
}

export const subscriptionsApi = {
  getMySubscription: (options?: { reconcile?: boolean }) =>
    apiClient.get<Subscription | null>(options?.reconcile ? 'subscriptions/me?reconcile=true' : 'subscriptions/me'),
  initiatePayment: (phoneNumber: string) =>
    apiClient.post<InitiateSubscriptionPaymentResponse>('subscriptions/me/pay', {
      phoneNumber,
    }),
};
