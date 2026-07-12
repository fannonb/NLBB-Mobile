import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';

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

const AdminDashboardScreen = lazyScreen(() => require('../screens/admin/AdminDashboardScreen'));
const AdminProvidersScreen = lazyScreen(() => require('../screens/admin/AdminProvidersScreen'));
const AdminUsersScreen = lazyScreen(() => require('../screens/admin/AdminUsersScreen'));
const AdminRevenueScreen = lazyScreen(() => require('../screens/admin/AdminRevenueScreen'));

const TABS = [
  { name: 'AdminHome', label: 'Overview', icon: 'grid' as const },
  { name: 'AdminProviders', label: 'Providers', icon: 'briefcase' as const },
  { name: 'AdminUsers', label: 'Users', icon: 'users' as const },
  { name: 'AdminRevenue', label: 'Revenue', icon: 'dollar-sign' as const },
];

function createAdminTabStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    tabBar: {
      flexDirection: 'row',
      backgroundColor: p.card,
      borderTopWidth: 1,
      borderTopColor: p.border,
      paddingTop: 10,
      paddingHorizontal: 12,
      ...s.soft,
    },
    tabItem: { flex: 1, alignItems: 'center', gap: 4 },
    tabIconWrap: {
      width: 44,
      height: 36,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabIconWrapActive: {
      backgroundColor: p.gold,
      ...s.gold,
    },
    tabLabel: { color: p.textMuted, fontFamily: Fonts.sans, fontSize: 10 },
    tabLabelActive: { color: p.gold, fontFamily: Fonts.sansMedium },
  });
}

function AdminTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createAdminTabStyles(palette, shadow), [palette, shadow]);

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 8 }]}> 
      {state.routes.map((route: any, index: number) => {
        const tab = TABS.find((t) => t.name === route.name) ?? TABS[0];
        const isFocused = state.index === index;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tabItem}
            activeOpacity={0.85}
          >
            <View style={[styles.tabIconWrap, isFocused && styles.tabIconWrapActive]}>
              <Feather name={tab.icon} size={20} color={isFocused ? palette.bg : palette.textMuted} />
            </View>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <AdminTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="AdminHome" component={AdminDashboardScreen} />
      <Tab.Screen name="AdminProviders" component={AdminProvidersScreen} />
      <Tab.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Tab.Screen name="AdminRevenue" component={AdminRevenueScreen} />
    </Tab.Navigator>
  );
}