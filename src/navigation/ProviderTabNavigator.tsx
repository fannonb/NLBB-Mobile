import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NLBBTabBar, NLBBTabConfig } from '../components/ui';
import ProviderAddFab from '../components/ProviderAddFab';
import BusinessStackNavigator from './BusinessStackNavigator';

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

const ProviderDashboardScreen = lazyScreen(() => require('../screens/provider/DashboardScreen'));
const ProviderAppointmentsScreen = lazyScreen(() => require('../screens/provider/AppointmentsScreen'));
const ProviderProfileScreen = lazyScreen(() => require('../screens/provider/ProviderProfileScreen'));

const PROVIDER_TABS: NLBBTabConfig[] = [
  { name: 'Dashboard', icon: 'sun', label: 'Today' },
  { name: 'Appointments', icon: 'calendar', label: 'Appointments' },
  { name: 'Business', icon: 'scissors', label: 'Services' },
  { name: 'ProviderProfile', icon: 'user', label: 'Profile' },
];

export default function ProviderTabNavigator() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const showAddServiceFab = activeTab !== 'ProviderProfile';

  return (
    <View style={styles.root}>
      <Tab.Navigator
        tabBar={(props) => <NLBBTabBar {...props} tabs={PROVIDER_TABS} />}
        screenOptions={{ headerShown: false }}
        screenListeners={{
          state: (event) => {
            const nextState = event.data.state;
            const route = nextState?.routes?.[nextState.index ?? 0];
            if (route?.name) {
              setActiveTab(route.name);
            }
          },
        }}
      >
        <Tab.Screen name="Dashboard" component={ProviderDashboardScreen} />
        <Tab.Screen name="Appointments" component={ProviderAppointmentsScreen} />
        <Tab.Screen name="Business" component={BusinessStackNavigator} />
        <Tab.Screen name="ProviderProfile" component={ProviderProfileScreen} />
      </Tab.Navigator>
      {showAddServiceFab ? <ProviderAddFab /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
