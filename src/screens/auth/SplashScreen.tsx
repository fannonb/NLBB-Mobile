import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, StatusBar } from 'react-native';
import { Brand, Fonts } from '../../constants/theme';
import { useThemedColors } from '../../hooks/useThemedColors';
import { useAuthStore } from '../../store/authStore';
import { hasCompletedOnboarding } from '../../lib/onboardingPreference';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const MIN_SPLASH_MS = 600;
const AUTH_INIT_TIMEOUT_MS = 4000;

const waitForAuthInitialization = async (initialize: () => Promise<void>) => {
  try {
    await Promise.race([
      initialize(),
      delay(AUTH_INIT_TIMEOUT_MS),
    ]);
  } catch {
    // Continue booting as guest if auth initialization fails.
  }
};

export default function SplashScreen({ navigation }: any) {
  const palette = useThemedColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const { initialize } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const bootstrap = async () => {
      try {
        const onboardingDonePromise = hasCompletedOnboarding().catch((err) => {
          console.error('[SplashScreen] Onboarding read error:', err);
          return false;
        });
        const initializePromise = waitForAuthInitialization(initialize);
        const [onboardingDone] = await Promise.all([
          onboardingDonePromise,
          initializePromise,
          delay(MIN_SPLASH_MS),
        ]);

        if (!isMounted) {
          return;
        }

        const { isLoggedIn, user } = useAuthStore.getState();

        if (isLoggedIn && user) {
          if (user.role === 'provider') {
            navigation.replace('ProviderApp');
            return;
          }
          if (user.role === 'admin') {
            navigation.replace('AdminApp');
            return;
          }
          navigation.replace('CustomerApp');
          return;
        }

        if (!onboardingDone) {
          navigation.replace('Onboarding');
          return;
        }
        navigation.replace('CustomerApp');
      } catch (error) {
        console.error('[SplashScreen] Fatal error in bootstrap, forcing navigation to CustomerApp:', error);
        if (isMounted) {
          navigation.replace('CustomerApp');
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [fadeAnim, initialize, navigation, scaleAnim]);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.bg} />
      <View style={[styles.circle1, { borderColor: palette.brotherhoodRing }]} />
      <View style={[styles.circle2, { borderColor: palette.brotherhoodRingDim }]} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={require('../../../assets/transparent_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.tagline, { color: palette.gold }]}>{Brand.tagline}</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={[styles.footerText, { color: palette.textMuted }]}>Made in Kenya</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFCF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1.5,
    top: -60,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    bottom: 40,
    left: -50,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    width: 260,
    height: 100,
    marginBottom: 16,
  },
  tagline: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 48,
  },
  footerText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
});