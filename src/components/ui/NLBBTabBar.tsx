import React, { useEffect, useMemo, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, ShadowPalette, Radius } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';

export type NLBBTabConfig = {
  name: string;
  icon: keyof typeof Feather.glyphMap;
  label?: string;
  isFab?: boolean;
  fabIcon?: keyof typeof Feather.glyphMap;
  accessibilityLabel?: string;
};

interface NLBBTabBarProps {
  state: any;
  navigation: any;
  tabs: NLBBTabConfig[];
}

function createTabBarStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    tabBar: {
      flexDirection: 'row',
      backgroundColor: p.card,
      borderTopWidth: 1,
      borderTopColor: p.border,
      paddingTop: 12,
      alignItems: 'center',
      justifyContent: 'space-around',
      ...s.soft,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingTop: 4,
    },
    tabIndicator: {
      position: 'absolute',
      top: -2,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: p.goldDim,
      borderWidth: 1,
      borderColor: p.goldBorder,
    },
    tabLabel: {
      fontFamily: Fonts.sansMedium,
      fontSize: 10,
    },
    tabLabelActive: {
      fontFamily: Fonts.sansBold,
    },
    fabWrapper: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -28,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: p.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

// ─── Sub-Component for Animated Tab Items ───────────────────────────────────
interface TabItemProps {
  tab: NLBBTabConfig;
  isFocused: boolean;
  onPress: () => void;
  palette: ColorPalette;
  styles: any;
}

function TabItem({ tab, isFocused, onPress, palette, styles }: TabItemProps) {
  const focusAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(focusAnim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  }, [isFocused, focusAnim]);

  const showLabel = Boolean(tab.label);

  const iconScale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.14],
  });

  const indicatorOpacity = focusAnim;
  const indicatorScale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const activeColor = palette.gold;
  const inactiveColor = palette.textMuted;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.tabItem}
      accessibilityRole="button"
      accessibilityLabel={tab.label ?? tab.name}
    >
      <Animated.View
        style={[
          styles.tabIndicator,
          {
            opacity: indicatorOpacity,
            transform: [{ scale: indicatorScale }],
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: iconScale }] }}>
        <Feather
          name={tab.icon ?? 'circle'}
          size={21}
          color={isFocused ? activeColor : inactiveColor}
        />
      </Animated.View>
      {showLabel ? (
        <Text
          style={[
            styles.tabLabel,
            { color: isFocused ? activeColor : inactiveColor },
            isFocused && styles.tabLabelActive,
          ]}
        >
          {tab.label}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function NLBBTabBar({ state, navigation, tabs }: NLBBTabBarProps) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createTabBarStyles(palette, shadow), [palette, shadow]);

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 16 }]}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tab = tabs.find((t) => t.name === route.name);
        const isFab = tab?.isFab ?? false;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isFab) {
          // Keep FAB springy on tap too
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.85}
              style={styles.fabWrapper}
              accessibilityRole="button"
              accessibilityLabel={tab?.accessibilityLabel ?? tab?.label ?? 'Action'}
            >
              <Animated.View style={[styles.fab, shadow.gold]}>
                <Feather
                  name={tab?.fabIcon ?? tab?.icon ?? 'plus-circle'}
                  size={24}
                  color={palette.bg}
                />
              </Animated.View>
            </TouchableOpacity>
          );
        }

        if (!tab) return null;

        return (
          <TabItem
            key={route.key}
            tab={tab}
            isFocused={isFocused}
            onPress={onPress}
            palette={palette}
            styles={styles}
          />
        );
      })}
    </View>
  );
}
