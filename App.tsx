import 'react-native-gesture-handler';
import React, { useEffect, useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/lib/navigationRef';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import * as Font from 'expo-font';
import { applyThemeMode, getThemeColors, ThemeMode } from './src/constants/theme';
import { loadThemePreference } from './src/lib/themePreference';
import { useAppStore } from './src/store/appStore';
import { useAuthStore } from './src/store/authStore';
import RootNavigator from './src/navigation/RootNavigator';
import { PushNotificationPayload, subscribeToPushNotifications } from './src/lib/push';

const THEME_BOOTSTRAP_TIMEOUT_MS = 1500;

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const loadThemeWithTimeout = async (): Promise<ThemeMode> => {
  try {
    const savedTheme = await Promise.race<ThemeMode | null>([
      loadThemePreference(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), THEME_BOOTSTRAP_TIMEOUT_MS)),
    ]);

    return savedTheme ?? 'light';
  } catch {
    return 'light';
  }
};

const parseRecoveryTokenFromUrl = (url: string | null): string | null => {
  if (!url) {
    return null;
  }

  const [baseUrl, hashFragment] = url.split('#');
  const queryFragment = baseUrl.includes('?') ? baseUrl.split('?')[1] ?? '' : '';
  const rawParams = hashFragment?.trim() ? hashFragment : queryFragment;
  const params = new URLSearchParams(rawParams);
  const token = params.get('access_token') ?? params.get('token');
  const type = params.get('type');
  const includesResetPath = (baseUrl ?? '').toLowerCase().includes('reset-password');

  if (!token) {
    return null;
  }

  if (type && type !== 'recovery') {
    return null;
  }

  return includesResetPath || type === 'recovery' ? token : null;
};

const hydrateNotificationsForSignedInUser = async () => {
  const role = useAuthStore.getState().user?.role;
  const appState = useAppStore.getState();

  if (role === 'provider') {
    await appState.hydrateProviderNotifications();
    return;
  }

  if (role === 'customer') {
    await appState.hydrateCustomerNotifications();
  }
};

const navigateFromPushPayload = (payload: PushNotificationPayload | null) => {
  const role = useAuthStore.getState().user?.role;
  if (!role || !navigationRef.isReady()) {
    return false;
  }

  switch (payload?.actionType) {
    case 'customer_bookings':
      navigationRef.navigate('CustomerApp', {
        screen: 'Bookings',
        params: payload.actionId ? { bookingId: payload.actionId } : undefined,
      });
      return true;
    case 'provider_appointment_detail':
      if (payload.actionId) {
        navigationRef.navigate('AppointmentDetail', { appointmentId: payload.actionId });
      } else {
        navigationRef.navigate('ProviderNotifications');
      }
      return true;
    case 'provider_subscription':
      navigationRef.navigate('ProviderApp', {
        screen: 'Business',
        params: { screen: 'Subscription' },
      });
      return true;
    case 'provider_reviews':
      navigationRef.navigate('ProviderReviews');
      return true;
    default:
      if (role === 'provider') {
        navigationRef.navigate('ProviderNotifications');
        return true;
      }
      if (role === 'customer') {
        navigationRef.navigate('Notifications');
        return true;
      }
      return false;
  }
};

export default function App() {
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [navigationReady, setNavigationReady] = useState(false);
  const [pendingRecoveryToken, setPendingRecoveryToken] = useState<string | null>(null);
  const [pendingPushPayload, setPendingPushPayload] = useState<PushNotificationPayload | null | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    const bootstrapTheme = async () => {
      try {
        const savedTheme = await loadThemeWithTimeout();
        applyThemeMode(savedTheme);
        useAppStore.setState({ theme: savedTheme });

        // Load custom fonts
        try {
          await Font.loadAsync({
            'PlayfairDisplay-Regular': require('./assets/fonts/PlayfairDisplay-Regular.ttf'),
            'PlayfairDisplay-Medium': require('./assets/fonts/PlayfairDisplay-Medium.ttf'),
            'PlayfairDisplay-SemiBold': require('./assets/fonts/PlayfairDisplay-SemiBold.ttf'),
            'PlayfairDisplay-Bold': require('./assets/fonts/PlayfairDisplay-Bold.ttf'),
          });
        } catch (fontError) {
          console.warn('[App] Failed to load local fonts:', fontError);
        }

        if (!isMounted) {
          return;
        }

        setThemeMode(savedTheme);
        setIsBootstrapped(true);
        void SplashScreen.hideAsync().catch(() => undefined);
      } catch (error) {
        console.error('[App] Error during theme bootstrapping:', error);
        if (isMounted) {
          setIsBootstrapped(true); // Fail-safe: mount the navigator anyway
          void SplashScreen.hideAsync().catch(() => undefined);
        }
      }
    };

    void bootstrapTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      const token = parseRecoveryTokenFromUrl(url);
      if (token) {
        setPendingRecoveryToken(token);
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    void Linking.getInitialURL().then(handleUrl).catch(() => undefined);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!pendingRecoveryToken || !navigationReady || !navigationRef.isReady()) {
      return;
    }

    navigationRef.navigate('ResetPassword', { token: pendingRecoveryToken });
    setPendingRecoveryToken(null);
  }, [navigationReady, pendingRecoveryToken]);

  useEffect(() => {
    const unsubscribe = subscribeToPushNotifications({
      onReceive: () => {
        void hydrateNotificationsForSignedInUser();
      },
      onResponse: (payload) => {
        void hydrateNotificationsForSignedInUser();
        setPendingPushPayload(payload ?? null);
      },
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!navigationReady || !navigationRef.isReady() || pendingPushPayload === undefined) {
      return;
    }

    const handled = navigateFromPushPayload(pendingPushPayload);
    if (handled) {
      setPendingPushPayload(null);
    }
  }, [navigationReady, pendingPushPayload]);

  const themeColors = useMemo(() => getThemeColors(themeMode), [themeMode]);

  if (!isBootstrapped) {
    return (
      <GestureHandlerRootView style={[styles.root, { backgroundColor: themeColors.bg }]}>
        <SafeAreaProvider>
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={themeColors.gold} />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: themeColors.bg }]}>
      <SafeAreaProvider>
        <NavigationContainer
          ref={navigationRef}
          key={themeMode}
          onReady={() => setNavigationReady(true)}
        >
          <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
