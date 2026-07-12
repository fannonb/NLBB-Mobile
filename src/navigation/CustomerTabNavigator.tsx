import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NLBBTabBar, NLBBTabConfig } from '../components/ui';

const Tab = createBottomTabNavigator();

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

const HomeScreen = lazyScreen(() => require('../screens/customer/HomeScreen'));
const ExploreScreen = lazyScreen(() => require('../screens/customer/ExploreScreen'));
const MyBookingsScreen = lazyScreen(() => require('../screens/customer/MyBookingsScreen'));
const ProfileScreen = lazyScreen(() => require('../screens/customer/ProfileScreen'));
const AllServicesScreen = lazyScreen(() => require('../screens/customer/AllServicesScreen'));

const CUSTOMER_TABS: NLBBTabConfig[] = [
  { name: 'Home', icon: 'home', label: 'Home' },
  { name: 'Explore', icon: 'search', label: 'Explore' },
  { name: 'Bookings', icon: 'calendar', label: 'Bookings' },
  { name: 'Profile', icon: 'user', label: 'Profile' },
];

export default function CustomerTabNavigator() {

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <NLBBTabBar {...props} tabs={CUSTOMER_TABS} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Bookings" component={MyBookingsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="AllServices" component={AllServicesScreen} />
    </Tab.Navigator>
  );
}
