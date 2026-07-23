import { apiClient } from './client';
import { normalizeAvatarRecord } from '../media';

export type AdminProviderStatus = 'pending' | 'approved' | 'suspended';
export type AdminProviderSubscriptionStatus = 'active' | 'expired' | 'none';
export type AdminUserStatus = 'active' | 'disabled';
export type AdminUserRole = 'customer' | 'provider' | 'admin';

export interface AdminProviderRecord {
  id: string;
  name: string;
  category: string;
  location: string;
  appliedAt: string;
  phone: string;
  email: string;
  status: AdminProviderStatus;
  subscriptionStatus: AdminProviderSubscriptionStatus;
  subscriptionPlan?: string;
  bookingsCount: number;
  rating: number;
  avatar: string;
  bio?: string | null;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  joinedAt: string;
  bookingsCount: number;
  avatar: string;
  location: string;
}

export interface AdminDashboardData {
  metrics: {
    totalUsers: number;
    activeProviders: number;
    monthlyRevenue: string;
    activeSubscriptions: number;
    totalBookings: number;
    pendingProviders: number;
  };
  pendingProviders: AdminProviderRecord[];
  activity: Array<{
    id: string;
    type: string;
    text: string;
    time: string;
    color: string;
  }>;
  weeklySignups: Array<{
    day: string;
    customers: number;
    providers: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    amount: number;
  }>;
}

export interface AdminRevenueReport {
  summary: {
    totalRevenueRaw: number;
    totalRevenue: string;
    thisMonth: string;
    activeSubscribers: number;
    failedAmount: string;
    pendingAmount: string;
  };
  plans: Array<{
    name: string;
    price: string;
    count: number;
    revenue: string;
    percent: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    amount: number;
  }>;
  payments: Array<{
    id: string;
    provider: string;
    plan: string;
    amount: string;
    amountRaw: number;
    date: string;
    status: 'pending' | 'success' | 'failed';
  }>;
}

interface AdminListQuery {
  status?: string;
  q?: string;
}

const toQueryString = (query: AdminListQuery) => {
  const params = new URLSearchParams();
  if (query.status) {
    params.append('status', query.status);
  }
  if (query.q) {
    params.append('q', query.q);
  }
  const output = params.toString();
  return output ? `?${output}` : '';
};

export const adminApi = {
  getDashboard: () =>
    apiClient.get<AdminDashboardData>('admin/dashboard').then((data) => ({
      ...data,
      pendingProviders: data.pendingProviders.map(normalizeAvatarRecord),
    })),
  listProviders: (query: AdminListQuery = {}) =>
    apiClient
      .get<AdminProviderRecord[]>(`admin/providers${toQueryString(query)}`)
      .then((records) => records.map(normalizeAvatarRecord)),
  updateProviderStatus: (providerId: string, status: AdminProviderStatus) =>
    apiClient.patch<AdminProviderRecord>(`admin/providers/${providerId}/status`, { status }),
  deleteProvider: (providerId: string) =>
    apiClient.delete<{ id: string; deleted: boolean }>(`admin/providers/${providerId}`),
  listUsers: (query: AdminListQuery = {}) =>
    apiClient
      .get<AdminUserRecord[]>(`admin/users${toQueryString(query)}`)
      .then((records) => records.map(normalizeAvatarRecord)),
  updateUserStatus: (userId: string, status: AdminUserStatus) =>
    apiClient.patch<AdminUserRecord>(`admin/users/${userId}/status`, { status }),
  deleteUser: (userId: string) => apiClient.delete<{ id: string; deleted: boolean }>(`admin/users/${userId}`),
  getRevenue: () => apiClient.get<AdminRevenueReport>('admin/revenue'),
};
