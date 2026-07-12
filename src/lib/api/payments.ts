import { apiClient } from './client';
import { Payment } from '../../types';

export const paymentsApi = {
  listMyPayments: () => apiClient.get<Payment[]>('payments/me'),
};

