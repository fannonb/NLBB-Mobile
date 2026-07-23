import { apiClient } from './client';
import { Provider, Service } from '../../types';
import { normalizeProviderMedia } from '../media';
import { resolveImageUrl } from '../config';
import { clearProviderDirectoryCache } from './providers';

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

const PROFILE_CACHE_MS = 45_000;
const SERVICES_CACHE_MS = 30_000;

let profileCache: { data: Provider; loadedAt: number } | null = null;
let profileRequest: Promise<Provider> | null = null;
let servicesCache: { data: ProviderService[]; loadedAt: number } | null = null;
let servicesRequest: Promise<ProviderService[]> | null = null;

const normalizeService = (service: Service): ProviderService => ({
  ...service,
  isActive: service.isActive !== false,
});

const invalidateProviderCaches = () => {
  profileCache = null;
  servicesCache = null;
  clearProviderDirectoryCache();
};

export const providerManagementApi = {
  getMyProfile: async (options: { force?: boolean } = {}) => {
    if (!options.force && profileCache && Date.now() - profileCache.loadedAt < PROFILE_CACHE_MS) {
      return profileCache.data;
    }
    if (!options.force && profileRequest) {
      return profileRequest;
    }

    const request = apiClient.get<Provider>('providers/me/profile').then((provider) => {
      const normalized = normalizeProviderMedia(provider);
      profileCache = { data: normalized, loadedAt: Date.now() };
      return normalized;
    }).finally(() => {
      if (profileRequest === request) {
        profileRequest = null;
      }
    });
    profileRequest = request;
    return request;
  },
  saveMyProfile: async (payload: ProviderProfilePayload) => {
    const provider = normalizeProviderMedia(await apiClient.post<Provider>('providers/me/profile', payload));
    profileCache = { data: provider, loadedAt: Date.now() };
    clearProviderDirectoryCache();
    return provider;
  },
  saveMyRegistrationDetails: async (payload: ProviderRegistrationDetailsPayload) => {
    const provider = normalizeProviderMedia(
      await apiClient.post<Provider>('providers/me/registration-details', payload)
    );
    profileCache = { data: provider, loadedAt: Date.now() };
    clearProviderDirectoryCache();
    return provider;
  },
  setMyOpenState: async (isOpen: boolean) => {
    const provider = normalizeProviderMedia(
      await apiClient.patch<Provider>('providers/me/open-state', { isOpen })
    );
    profileCache = { data: provider, loadedAt: Date.now() };
    clearProviderDirectoryCache();
    return provider;
  },
  uploadMyMedia: async (payload: ProviderMediaUploadPayload) => {
    const uploaded = await apiClient.post<{ url: string }>('providers/me/media', payload);
    return resolveImageUrl(uploaded.url);
  },
  listMyServices: async (options: { force?: boolean } = {}) => {
    if (!options.force && servicesCache && Date.now() - servicesCache.loadedAt < SERVICES_CACHE_MS) {
      return servicesCache.data;
    }
    if (!options.force && servicesRequest) {
      return servicesRequest;
    }

    const request = apiClient.get<Service[]>('providers/me/services').then((services) => {
      const normalized = services.map(normalizeService);
      servicesCache = { data: normalized, loadedAt: Date.now() };
      return normalized;
    }).finally(() => {
      if (servicesRequest === request) {
        servicesRequest = null;
      }
    });
    servicesRequest = request;
    return request;
  },
  createMyService: async (payload: ServicePayload) => {
    const service = await apiClient.post<Service>('providers/me/services', payload);
    invalidateProviderCaches();
    return normalizeService(service);
  },
  updateMyService: async (serviceId: string, payload: Partial<ServicePayload>) => {
    const service = await apiClient.patch<Service>(`providers/me/services/${serviceId}`, payload);
    invalidateProviderCaches();
    return normalizeService(service);
  },
  setMyServiceActive: async (serviceId: string, isActive: boolean) => {
    const service = await apiClient.patch<Service>(`providers/me/services/${serviceId}/active`, {
      isActive,
    });
    invalidateProviderCaches();
    return normalizeService(service);
  },
  deleteMyService: async (serviceId: string) => {
    const result = await apiClient.delete<{ deleted: true; id: string }>(`providers/me/services/${serviceId}`);
    invalidateProviderCaches();
    return result;
  },
};
