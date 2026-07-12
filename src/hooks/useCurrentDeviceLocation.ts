import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Coordinates } from '../lib/location/providerDistance';

export type DeviceLocationStatus = 'loading' | 'available' | 'permission-denied' | 'unavailable';

export type DeviceLocationState = {
  coordinates: Coordinates | null;
  status: DeviceLocationStatus;
};

export function useCurrentDeviceLocationState(): DeviceLocationState {
  const [state, setState] = useState<DeviceLocationState>({
    coordinates: null,
    status: 'loading',
  });

  useEffect(() => {
    let active = true;

    const loadLocation = async () => {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!active) {
          return;
        }
        if (!servicesEnabled) {
          setState({ coordinates: null, status: 'unavailable' });
          return;
        }

        const existing = await Location.getForegroundPermissionsAsync();
        const permission =
          existing.status === 'granted'
            ? existing
            : existing.canAskAgain
              ? await Location.requestForegroundPermissionsAsync()
              : existing;

        if (!active || permission.status !== 'granted') {
          if (active) {
            setState({ coordinates: null, status: 'permission-denied' });
          }
          return;
        }

        const lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: 5 * 60 * 1000,
          requiredAccuracy: 1000,
        });

        if (active && lastKnown) {
          setState({
            coordinates: {
              lat: lastKnown.coords.latitude,
              lng: lastKnown.coords.longitude,
            },
            status: 'available',
          });
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!active) {
          return;
        }

        setState({
          coordinates: {
            lat: current.coords.latitude,
            lng: current.coords.longitude,
          },
          status: 'available',
        });
      } catch {
        if (active) {
          setState((previous) => ({
            coordinates: previous.coordinates,
            status: previous.coordinates ? 'available' : 'unavailable',
          }));
        }
      }
    };

    void loadLocation();

    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function useCurrentDeviceLocation() {
  return useCurrentDeviceLocationState().coordinates;
}
