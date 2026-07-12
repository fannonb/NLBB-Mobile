import { apiClient } from './client';
import { Provider, Service } from '../../types';

export type ProviderService = Service & { isActive: boolean };

export type ProviderWorkingHours = {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

export type ProviderMediaUploadPayload = {
  kind: 'cover' | 'avatar' | 'gallery';
  dataUri: string;
};

export type ProviderProfilePayload = {
  name: string;
  category: string;
  categories?: string[];
  description: string;
  location: string;
  address: string;
  phone: string;
  whatsapp?: string;
  openTime: string;
  closeTime: string;
  workDays: string;
  priceFrom: number;
  services?: Service[];
  coordinates?: { lat: number; lng: number };
  coverImage?: string;
  avatar?: string;
  images?: string[];
  galleryImages?: string[];
  workingHours?: ProviderWorkingHours[];
  instagram?: string;
  facebook?: string;
  mpesaPhone?: string;
};

export type ProviderRegistrationDetailsPayload = {
  name: string;
  category: string;
  categories?: string[];
  location: string;
  address?: string;
  phone?: string;
  coordinates?: { lat: number; lng: number };
};

type ServicePayload = {
  name: string;
  description: string;
  duration?: number;
  price: number;
  category: string;
  isActive?: boolean;
};

const normalizeService = (service: Service): ProviderService => ({
  ...service,
  isActive: service.isActive !== false,
});

export const providerManagementApi = {
  getMyProfile: async () => {
    const provider = await apiClient.get<Provider>('providers/me/profile');
    return provider;
  },
  saveMyProfile: async (payload: ProviderProfilePayload) => {
    const provider = await apiClient.post<Provider>('providers/me/profile', payload);
    return provider;
  },
  saveMyRegistrationDetails: async (payload: ProviderRegistrationDetailsPayload) => {
    const provider = await apiClient.post<Provider>('providers/me/registration-details', payload);
    return provider;
  },
  setMyOpenState: async (isOpen: boolean) => {
    const provider = await apiClient.patch<Provider>('providers/me/open-state', { isOpen });
    return provider;
  },
  uploadMyMedia: async (payload: ProviderMediaUploadPayload) => {
    const uploaded = await apiClient.post<{ url: string }>('providers/me/media', payload);
    return uploaded.url;
  },
  listMyServices: async () => {
    const services = await apiClient.get<Service[]>('providers/me/services');
    return services.map(normalizeService);
  },
  createMyService: async (payload: ServicePayload) => {
    const service = await apiClient.post<Service>('providers/me/services', payload);
    return normalizeService(service);
  },
  updateMyService: async (serviceId: string, payload: Partial<ServicePayload>) => {
    const service = await apiClient.patch<Service>(`providers/me/services/${serviceId}`, payload);
    return normalizeService(service);
  },
  setMyServiceActive: async (serviceId: string, isActive: boolean) => {
    const service = await apiClient.patch<Service>(`providers/me/services/${serviceId}/active`, {
      isActive,
    });
    return normalizeService(service);
  },
  deleteMyService: (serviceId: string) =>
    apiClient.delete<{ deleted: true; id: string }>(`providers/me/services/${serviceId}`),
};
