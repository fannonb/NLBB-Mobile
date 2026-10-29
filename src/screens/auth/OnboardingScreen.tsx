import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, ColorPalette, Fonts, ShadowPalette } from '../../constants/theme';
import { MAX_CONTENT_WIDTH } from '../../constants/layout';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import { NLBBButton } from '../../components/ui';
import { markOnboardingComplete } from '../../lib/onboardingPreference';

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
  // Slide width must follow the viewport: the app is not orientation-locked, and on a
  // tablet/landscape foldable the content column is narrower than the window.
  const { width, height } = useWindowDimensions();
  const slideWidth = Math.min(width, MAX_CONTENT_WIDTH);
  // Landscape phones are only ~360-420dp tall: shrink the chrome instead of letting the
  // slide content get squeezed into a scrollable sliver.
  const compact = height < 560;

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Re-anchor the carousel when the viewport changes (rotation, resize, fold/unfold).
  useEffect(() => {
    flatListRef.current?.scrollToOffset({
      offset: currentIndex * slideWidth,
      animated: false,
    });
  }, [currentIndex, slideWidth]);

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
      <View style={[styles.heroHeader, compact && styles.heroHeaderCompact]}>
        <Image
          source={require('../../../assets/transparent_logo.png')}
          style={[styles.logo, compact && styles.logoCompact]}
          resizeMode="contain"
        />
        {compact ? null : <Text style={styles.tagline}>{Brand.tagline}</Text>}
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        getItemLayout={(_, index) => ({
          length: slideWidth,
          offset: slideWidth * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: slideWidth }]}>
            {/* Scrollable so the slide never clips on short/landscape viewports. */}
            <ScrollView
              style={styles.slideScroll}
              contentContainerStyle={styles.slideContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.iconRing, compact && styles.iconRingCompact, shadow.gold]}>
                <View style={[styles.iconBadge, compact && styles.iconBadgeCompact]}>
                  <Feather name={item.icon} size={compact ? 20 : 32} color={palette.bg} />
                </View>
              </View>
              <Text style={[styles.title, compact && styles.titleCompact]}>{item.title}</Text>
              <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>{item.subtitle}</Text>
            </ScrollView>
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

      <View
        style={[
          styles.footer,
          compact && styles.footerCompact,
          { paddingBottom: insets.bottom + (compact ? 12 : 24) },
        ]}
      >
        <View style={[styles.footerActions, compact && styles.footerActionsCompact]}>
          <NLBBButton
            label={currentIndex === SLIDES.length - 1 ? 'Browse as Guest' : 'Next'}
            onPress={goNext}
            size={compact ? 'md' : 'lg'}
            style={compact ? styles.nextBtnCompact : styles.nextBtn}
          />
          {currentIndex < SLIDES.length - 1 && (
            <NLBBButton
              label="Skip"
              onPress={() => void finishOnboarding('browse')}
              variant="ghost"
              style={compact ? styles.skipBtnCompact : styles.skipBtn}
            />
          )}
        </View>
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
    heroHeaderCompact: {
      paddingTop: 6,
      paddingBottom: 4,
    },
    logo: {
      width: 180,
      height: 70,
      marginBottom: 8,
    },
    logoCompact: {
      width: 120,
      height: 44,
      marginBottom: 0,
    },
    tagline: {
      color: p.gold,
      fontFamily: Fonts.sansMedium,
      fontSize: 10,
      letterSpacing: 2.2,
      textTransform: 'uppercase',
    },
    slide: {
      flex: 1,
    },
    slideScroll: {
      flex: 1,
    },
    slideContent: {
      flexGrow: 1,
      // Full width + stretch (not center) so long subtitles wrap inside the column
      // instead of overflowing it; the text itself stays centred via textAlign.
      width: '100%',
      alignItems: 'stretch',
      justifyContent: 'center',
      paddingHorizontal: 36,
      paddingVertical: 24,
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
      alignSelf: 'center',
    },
    iconRingCompact: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginBottom: 14,
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
    iconBadgeCompact: {
      width: 42,
      height: 42,
      borderRadius: 21,
    },
    title: {
      fontFamily: Fonts.serif,
      fontSize: 28,
      color: p.textPrimary,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 34,
      width: '100%',
    },
    titleCompact: {
      fontSize: 21,
      lineHeight: 26,
      marginBottom: 8,
    },
    subtitle: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      color: p.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      width: '100%',
    },
    subtitleCompact: {
      fontSize: 13,
      lineHeight: 18,
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
    footerCompact: {
      gap: 0,
    },
    footerActions: {
      gap: 8,
    },
    footerActionsCompact: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 10,
    },
    nextBtn: {
      width: '100%',
    },
    nextBtnCompact: {
      flex: 2,
    },
    skipBtn: {
      width: '100%',
    },
    skipBtnCompact: {
      flex: 1,
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
