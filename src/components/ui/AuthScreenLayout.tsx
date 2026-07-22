import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, ColorPalette, Fonts } from '../../constants/theme';
import { useThemedColors } from '../../hooks/useThemedColors';
import KeyboardAwareScrollView from '../KeyboardAwareScrollView';

interface AuthScreenLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showLogo?: boolean;
}

function createLayoutStyles(p: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: p.bg,
    },
    circle1: {
      position: 'absolute',
      width: 280,
      height: 280,
      borderRadius: 140,
      borderWidth: 1.5,
      borderColor: p.brotherhoodRing,
      top: -80,
      right: -90,
    },
    circle2: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 90,
      borderWidth: 1.5,
      borderColor: p.brotherhoodRingDim,
      bottom: 120,
      left: -60,
    },
    scroll: { flexGrow: 1, paddingHorizontal: 20 },
    header: {
      alignItems: 'center',
      marginBottom: 28,
      marginTop: 12,
    },
    logo: {
      width: 200,
      height: 78,
      marginBottom: 20,
    },
    title: {
      fontFamily: Fonts.serif,
      fontSize: 28,
      color: p.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      color: p.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 12,
    },
    tagline: {
      marginTop: 14,
      color: p.gold,
      fontFamily: Fonts.sansMedium,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    footer: {
      paddingHorizontal: 10,
      marginTop: 24,
      alignItems: 'center',
    },
  });
}

export default function AuthScreenLayout({
  title,
  subtitle,
  children,
  footer,
  showLogo = true,
}: AuthScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const styles = useMemo(() => createLayoutStyles(palette), [palette]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.bg} />
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24 }]}
        bottomPadding={24}
        includeSafeArea
      >
        <View style={styles.header}>
          {showLogo ? (
            <Image
              source={require('../../../assets/transparent_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : null}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={styles.tagline}>{Brand.tagline}</Text>
        </View>

        {children}

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAwareScrollView>
    </View>
  );
}
