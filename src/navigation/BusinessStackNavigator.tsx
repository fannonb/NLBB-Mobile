import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

type LazyModule<TProps = any> = {
  default: React.ComponentType<TProps>;
};

const Stack = createNativeStackNavigator();

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

const BusinessDashboardScreen = lazyScreen(() => require('../screens/provider/BusinessHubScreen'));
const ServicesScreen = lazyScreen(() => require('../screens/provider/ServicesScreen'));
const ReviewsScreen = lazyScreen(() => require('../screens/provider/ProviderReviewsScreen'));
const NotificationsScreen = lazyScreen(() => require('../screens/provider/ProviderNotificationsScreen'));
const SubscriptionScreen = lazyScreen(() => require('../screens/provider/SubscriptionScreen'));

export default function BusinessStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BusinessDashboard" component={BusinessDashboardScreen} />
      <Stack.Screen name="Services" component={ServicesScreen} />
      <Stack.Screen name="BusinessReviews" component={ReviewsScreen} />
      <Stack.Screen name="BusinessNotifications" component={NotificationsScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
    </Stack.Navigator>
  );
}
