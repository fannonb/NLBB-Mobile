import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import { Coordinates } from '../lib/location/providerDistance';

export type DeviceLocationStatus = 'loading' | 'available' | 'permission-denied' | 'unavailable';

export type DeviceLocationState = {
  coordinates: Coordinates | null;
  status: DeviceLocationStatus;
};

let sharedState: DeviceLocationState = {
  coordinates: null,
  status: 'loading',
};

const listeners = new Set<(state: DeviceLocationState) => void>();
let inFlightLoad: Promise<void> | null = null;

const emitState = (next: DeviceLocationState) => {
  sharedState = next;
  listeners.forEach((listener) => listener(next));
};

const loadSharedLocation = async (force = false) => {
  if (inFlightLoad && !force) {
    return inFlightLoad;
  }

  const request = (async () => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        emitState({ coordinates: sharedState.coordinates, status: 'unavailable' });
        return;
      }

      const existing = await Location.getForegroundPermissionsAsync();
      const permission =
        existing.status === 'granted'
          ? existing
          : existing.canAskAgain
            ? await Location.requestForegroundPermissionsAsync()
            : existing;

      if (permission.status !== 'granted') {
        emitState({
          coordinates: sharedState.coordinates,
          status: sharedState.coordinates ? 'available' : 'permission-denied',
        });
        return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 5 * 60 * 1000,
        requiredAccuracy: 1000,
      });

      if (lastKnown) {
        emitState({
          coordinates: {
            lat: lastKnown.coords.latitude,
            lng: lastKnown.coords.longitude,
          },
          status: 'available',
        });
      } else if (sharedState.status === 'loading') {
        emitState({
          coordinates: sharedState.coordinates,
          status: sharedState.coordinates ? 'available' : 'unavailable',
        });
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      emitState({
        coordinates: {
          lat: current.coords.latitude,
          lng: current.coords.longitude,
        },
        status: 'available',
      });
    } catch {
      emitState({
        coordinates: sharedState.coordinates,
        status: sharedState.coordinates ? 'available' : 'unavailable',
      });
    }
  })().finally(() => {
    if (inFlightLoad === request) {
      inFlightLoad = null;
    }
  });

  inFlightLoad = request;
  return request;
};

export function useCurrentDeviceLocationState(): DeviceLocationState {
  const [state, setState] = useState<DeviceLocationState>(sharedState);

  useEffect(() => {
    listeners.add(setState);
    void loadSharedLocation();

    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void loadSharedLocation(true);
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      listeners.delete(setState);
      subscription.remove();
    };
  }, []);

  return state;
}

export function useCurrentDeviceLocation() {
  return useCurrentDeviceLocationState().coordinates;
}
