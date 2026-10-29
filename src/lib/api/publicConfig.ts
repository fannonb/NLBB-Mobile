import { apiClient } from './client';

export interface PublicReleaseConfig {
  appEnv: 'development' | 'staging' | 'production';
  featureFlags: {
    paymentsEnabled: boolean;
    mpesaEnabled: boolean;
    subscriptionsPaused?: boolean;
  };
}

export const publicConfigApi = {
  getPublicConfig: () => apiClient.get<PublicReleaseConfig>('config/public'),
};
