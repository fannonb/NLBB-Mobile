import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, ColorPalette, Fonts, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import { NLBBButton } from '../../components/ui';
import { markOnboardingComplete } from '../../lib/onboardingPreference';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Find local services',
    subtitle: 'Discover verified salons, spas, and beauty professionals near you.',
    icon: 'map-pin' as const,
  },
  {
    id: '2',
    title: 'Book in seconds',
    subtitle: 'Pick your service, choose a time, and get confirmed instantly. No hassle.',
    icon: 'calendar' as const,
  },
  {
    id: '3',
    title: 'Look & feel your best',
    subtitle: 'Connect with premium beauty, styling, and wellness providers dedicated to your care.',
    icon: 'users' as const,
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createOnboardingStyles(palette, shadow), [palette, shadow]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const finishOnboarding = async (destination: 'browse' | 'login') => {
    await markOnboardingComplete();
    navigation.replace(destination === 'login' ? 'Login' : 'CustomerApp');
  };

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      void finishOnboarding('browse');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.heroHeader}>
        <Image
          source={require('../../../assets/transparent_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>{Brand.tagline}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={[styles.iconRing, shadow.gold]}>
              <View style={styles.iconBadge}>
                <Feather name={item.icon} size={32} color={palette.bg} />
              </View>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <NLBBButton
          label={currentIndex === SLIDES.length - 1 ? 'Browse as Guest' : 'Next'}
          onPress={goNext}
          size="lg"
          style={styles.nextBtn}
        />
        {currentIndex < SLIDES.length - 1 && (
          <NLBBButton
            label="Skip"
            onPress={() => void finishOnboarding('browse')}
            variant="ghost"
            style={styles.skipBtn}
          />
        )}
        <TouchableOpacity onPress={() => void finishOnboarding('login')} style={styles.signInBtn}>
          <Text style={styles.signInText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createOnboardingStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: p.bg,
    },
    heroHeader: {
      alignItems: 'center',
      paddingTop: 16,
      paddingBottom: 8,
    },
    logo: {
      width: 180,
      height: 70,
      marginBottom: 8,
    },
    tagline: {
      color: p.gold,
      fontFamily: Fonts.sansMedium,
      fontSize: 10,
      letterSpacing: 2.2,
      textTransform: 'uppercase',
    },
    slide: {
      width,
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 36,
      paddingTop: 32,
    },
    iconRing: {
      width: 88,
      height: 88,
      borderRadius: 44,
      borderWidth: 1.5,
      borderColor: p.brotherhoodRing,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 36,
    },
    iconBadge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: p.gold,
      alignItems: 'center',
      justifyContent: 'center',
      ...s.gold,
    },
    title: {
      fontFamily: Fonts.serif,
      fontSize: 28,
      color: p.textPrimary,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 34,
    },
    subtitle: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      color: p.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 24,
    },
    dot: {
      height: 6,
      borderRadius: 3,
    },
    dotActive: {
      backgroundColor: p.gold,
      width: 20,
    },
    dotInactive: {
      backgroundColor: p.border,
      width: 6,
    },
    footer: {
      paddingHorizontal: 24,
      gap: 8,
    },
    nextBtn: {
      width: '100%',
    },
    skipBtn: {
      width: '100%',
    },
    signInBtn: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    signInText: {
      color: p.gold,
      fontFamily: Fonts.sansMedium,
      fontSize: 13,
    },
  });
}
