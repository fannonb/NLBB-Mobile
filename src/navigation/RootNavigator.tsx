import React, { useEffect, useMemo, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import AuthGateSheet from '../components/AuthGateSheet';
import BookingSheet from '../components/BookingSheet';
import { useInitializeTheme } from '../hooks/useInitializeTheme';
import { getThemeColors } from '../constants/theme';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator();

type LazyModule<TProps = any> = {
  default: React.ComponentType<TProps>;
};

const lazyScreen = <TProps extends object = any>(loader: () => LazyModule<TProps>) => {
  const LazyComponent = (props: TProps) => {
    const loadedModule = loader() as LazyModule<TProps> | React.ComponentType<TProps>;
    const ScreenComponent =
      (loadedModule as LazyModule<TProps>).default ?? (loadedModule as React.ComponentType<TProps>);

    if (!ScreenComponent) {
      return null;
    }

    return <ScreenComponent {...props} />;
  };

  return LazyComponent;
};

const SplashScreen = lazyScreen(() => require('../screens/auth/SplashScreen'));
const OnboardingScreen = lazyScreen(() => require('../screens/auth/OnboardingScreen'));
const LoginScreen = lazyScreen(() => require('../screens/auth/LoginScreen'));
const SignupScreen = lazyScreen(() => require('../screens/auth/SignupScreen'));
const ProviderSignupScreen = lazyScreen(() => require('../screens/auth/ProviderSignupScreen'));
const ForgotPasswordScreen = lazyScreen(() => require('../screens/auth/ForgotPasswordScreen'));
const ResetPasswordScreen = lazyScreen(() => require('../screens/auth/ResetPasswordScreen'));

const ProviderDetailsScreen = lazyScreen(() => require('../screens/customer/ProviderDetailsScreen'));
const NotificationsScreen = lazyScreen(() => require('../screens/customer/NotificationsScreen'));
const FavoritesScreen = lazyScreen(() => require('../screens/customer/FavoritesScreen'));
const WriteReviewScreen = lazyScreen(() => require('../screens/customer/WriteReviewScreen'));
const EditProfileScreen = lazyScreen(() => require('../screens/customer/EditProfileScreen'));
const DarkModeScreen = lazyScreen(() => require('../screens/customer/DarkModeScreen'));
const NotificationSettingsScreen = lazyScreen(() => require('../screens/customer/NotificationSettingsScreen'));

const AppointmentDetailScreen = lazyScreen(() => require('../screens/provider/AppointmentDetailScreen'));
const ProviderReviewsScreen = lazyScreen(() => require('../screens/provider/ProviderReviewsScreen'));
const ProviderNotificationsScreen = lazyScreen(() => require('../screens/provider/ProviderNotificationsScreen'));

const CustomerTabNavigator = lazyScreen(() => require('./CustomerTabNavigator'));
const ProviderTabNavigator = lazyScreen(() => require('./ProviderTabNavigator'));
const AdminTabNavigator = lazyScreen(() => require('./AdminTabNavigator'));

const RouteLoadingState = ({ colors }: { colors: ReturnType<typeof getThemeColors> }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
    <ActivityIndicator size="small" color={colors.gold} />
  </View>
);

const GuestOrCustomerRoute = ({ component: Component, ...props }: { component: React.ComponentType<any>; [key: string]: any }) => {
  const user = useAuthStore((state) => state.user);
  const isReady = useAuthStore((state) => state.isReady);
  const theme = useAppStore((state) => state.theme);
  const colors = useMemo(() => getThemeColors(theme), [theme]);

  useEffect(() => {
    if (isReady && user?.role === 'provider') {
      props.navigation.replace('ProviderApp');
    }
    if (isReady && user?.role === 'admin') {
      props.navigation.replace('AdminApp');
    }
  }, [isReady, props.navigation, user?.role]);

  if (!isReady) {
    return <RouteLoadingState colors={colors} />;
  }

  if (user?.role === 'provider' || user?.role === 'admin') {
    return <RouteLoadingState colors={colors} />;
  }

  return <Component {...props} />;
};

const ProviderOnlyRoute = ({ component: Component, ...props }: { component: React.ComponentType<any>; [key: string]: any }) => {
  const user = useAuthStore((state) => state.user);
  const isReady = useAuthStore((state) => state.isReady);
  const theme = useAppStore((state) => state.theme);
  const colors = useMemo(() => getThemeColors(theme), [theme]);

  useEffect(() => {
    if (isReady && user?.role === 'customer') {
      props.navigation.replace('CustomerApp');
    }
    if (isReady && user?.role === 'admin') {
      props.navigation.replace('AdminApp');
    }
    if (isReady && !user) {
      props.navigation.replace('Login', { role: 'provider' });
    }
  }, [isReady, props.navigation, user]);

  if (!isReady) {
    return <RouteLoadingState colors={colors} />;
  }

  if (!user || user.role !== 'provider') {
    return <RouteLoadingState colors={colors} />;
  }

  return <Component {...props} />;
};

const withGuestOrCustomerRoute = (Component: React.ComponentType<any>) => (props: any) =>
  <GuestOrCustomerRoute component={Component} {...props} />;

const withProviderOnlyRoute = (Component: React.ComponentType<any>) => (props: any) =>
  <ProviderOnlyRoute component={Component} {...props} />;

const GuardedCustomerTabNavigator = withGuestOrCustomerRoute(CustomerTabNavigator);
const GuardedProviderDetailsScreen = withGuestOrCustomerRoute(ProviderDetailsScreen);
const GuardedNotificationsScreen = withGuestOrCustomerRoute(NotificationsScreen);
const GuardedFavoritesScreen = withGuestOrCustomerRoute(FavoritesScreen);
const GuardedWriteReviewScreen = withGuestOrCustomerRoute(WriteReviewScreen);
const GuardedEditProfileScreen = withGuestOrCustomerRoute(EditProfileScreen);
const GuardedDarkModeScreen = withGuestOrCustomerRoute(DarkModeScreen);
const GuardedNotificationSettingsScreen = withGuestOrCustomerRoute(NotificationSettingsScreen);

const GuardedProviderTabNavigator = withProviderOnlyRoute(ProviderTabNavigator);
const GuardedAppointmentDetailScreen = withProviderOnlyRoute(AppointmentDetailScreen);
const GuardedProviderReviewsScreen = withProviderOnlyRoute(ProviderReviewsScreen);
const GuardedProviderNotificationsScreen = withProviderOnlyRoute(ProviderNotificationsScreen);

export default function RootNavigator() {
  useInitializeTheme();
  const theme = useAppStore((s) => s.theme);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPortalReady(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: getThemeColors(theme).bg },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="ProviderSignup" component={ProviderSignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        <Stack.Screen name="CustomerApp" component={GuardedCustomerTabNavigator} />
        <Stack.Screen name="ProviderDetails" component={GuardedProviderDetailsScreen} />
        <Stack.Screen name="Notifications" component={GuardedNotificationsScreen} />
        <Stack.Screen name="Favorites" component={GuardedFavoritesScreen} />
        <Stack.Screen name="WriteReview" component={GuardedWriteReviewScreen} />
        <Stack.Screen name="EditProfile" component={GuardedEditProfileScreen} />
        <Stack.Screen name="DarkMode" component={GuardedDarkModeScreen} />
        <Stack.Screen name="NotificationSettings" component={GuardedNotificationSettingsScreen} />

        <Stack.Screen name="ProviderApp" component={GuardedProviderTabNavigator} />
        <Stack.Screen name="AppointmentDetail" component={GuardedAppointmentDetailScreen} />
        <Stack.Screen name="ProviderReviews" component={GuardedProviderReviewsScreen} />
        <Stack.Screen name="ProviderNotifications" component={GuardedProviderNotificationsScreen} />

        <Stack.Screen name="AdminApp" component={AdminTabNavigator} />
      </Stack.Navigator>
      {portalReady ? <AuthGateSheet /> : null}
      {portalReady ? <BookingSheet /> : null}
    </>
  );
}
