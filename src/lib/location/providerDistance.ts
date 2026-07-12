import { Provider } from '../../types';
import { inferCoordinatesFromText } from './nairobiLocations';

export type Coordinates = {
  lat: number;
  lng: number;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

export const calculateDistanceKm = (from: Coordinates, to: Coordinates) => {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDistanceLabel = (distanceKm: number) => {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    return undefined;
  }

  if (distanceKm < 1) {
    return `${Math.max(50, Math.round(distanceKm * 1000))} m`;
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }

  return `${Math.round(distanceKm)} km`;
};

export const withProviderDistance = (provider: Provider, origin?: Coordinates | null): Provider => {
  const providerCoordinates =
    provider.coordinates ?? inferCoordinatesFromText(provider.location, provider.address);

  if (!providerCoordinates) {
    return {
      ...provider,
      distanceKm: undefined,
    };
  }

  if (!origin) {
    return {
      ...provider,
      coordinates: provider.coordinates ?? providerCoordinates,
      distanceKm: undefined,
    };
  }

  const distanceKm = calculateDistanceKm(origin, providerCoordinates);

  return {
    ...provider,
    coordinates: provider.coordinates ?? providerCoordinates,
    distanceKm,
    distance: formatDistanceLabel(distanceKm),
  };
};

export const withProviderDistances = (providers: Provider[], origin?: Coordinates | null) =>
  providers
    .map((provider) => withProviderDistance(provider, origin))
    .sort((left, right) => {
      const leftDistance = left.distanceKm;
      const rightDistance = right.distanceKm;

      if (leftDistance === undefined && rightDistance === undefined) {
        return left.name.localeCompare(right.name);
      }
      if (leftDistance === undefined) {
        return 1;
      }
      if (rightDistance === undefined) {
        return -1;
      }

      return leftDistance - rightDistance || left.name.localeCompare(right.name);
    });
