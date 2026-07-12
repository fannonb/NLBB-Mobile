import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette, Spacing } from '../../constants/theme';
import { mergeCategoriesWithDefaults } from '../../constants/serviceCategories';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import CategoryTile from '../../components/CategoryTile';
import ProviderCard from '../../components/ProviderCard';
import SectionHeader from '../../components/SectionHeader';
import { providerApi } from '../../lib/api/providers';
import { Category, Provider } from '../../types';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { useRequireAuth } from '../../hooks/useRequireAuth';

const SCREEN_W = Dimensions.get('window').width;
const TILE_W = (SCREEN_W - 48 - 20) / 3;

function createAllServicesStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
      backgroundColor: p.bg,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: p.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: p.border,
      ...s.soft,
    },
    heading: {
      flex: 1,
      textAlign: 'center',
      fontFamily: Fonts.serifMedium,
      fontSize: 20,
      color: p.textPrimary,
    },
    spacer: { width: 40 },
    scroll: {
      paddingTop: 24,
      paddingBottom: 100, // extra spacing for the bottom tab navigator bar
    },
    padH: {
      paddingHorizontal: 24,
    },
    subtitle: {
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      color: p.textSecondary,
      marginBottom: 24,
      lineHeight: 20,
    },
    catGrid: {
      gap: 10,
      marginBottom: Spacing.section,
    },
    catRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    catCell: {
      width: TILE_W,
    },
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      color: p.textMuted,
    },

    // ── Design improvements: bottom sections ─────────────────
    divider: {
      height: 1,
      backgroundColor: p.border,
      marginHorizontal: 24,
      marginVertical: Spacing.section,
    },
    hScroll: {
      paddingHorizontal: 24,
      gap: 16,
      paddingBottom: 4,
    },
    sectionTitle: {
      marginBottom: 14,
    },

  });
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export default function AllServicesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createAllServicesStyles(palette, shadow), [palette, shadow]);
  const { isLoggedIn, requireAuth } = useRequireAuth();
  const { favorites, toggleFavorite, hydrateFavorites } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProviders, setFeaturedProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      providerApi.listCategories(),
      providerApi.listProviders(),
    ])
      .then(([cats, provs]) => {
        if (active) {
          setCategories(mergeCategoriesWithDefaults(cats));
          setFeaturedProviders(provs.slice(0, 3));
        }
      })
      .catch(() => {
        if (active) {
          setCategories(mergeCategoriesWithDefaults([]));
          setFeaturedProviders([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    hydrateFavorites();
  }, [hydrateFavorites]);

  const catRows = useMemo(() => chunk(categories, 3), [categories]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.heading}>All Services</Text>
        <View style={styles.spacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={palette.gold} />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Subtitle & Grid */}
          <View style={styles.padH}>
            <Text style={styles.subtitle}>
              Select a service category to discover local barbers, salons, spas, and wellness providers near you.
            </Text>
            
            <View style={styles.catGrid}>
              {catRows.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.catRow}>
                  {row.map((cat) => (
                    <View key={cat.id} style={styles.catCell}>
                      <CategoryTile
                        category={cat}
                        onPress={() => {
                          navigation.navigate('Explore', { category: cat.name });
                        }}
                      />
                    </View>
                  ))}
                  {row.length < 3 &&
                    Array(3 - row.length)
                      .fill(null)
                      .map((_, i) => (
                        <View key={`empty-${i}`} style={styles.catCell} />
                      ))}
                </View>
              ))}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Featured providers slider */}
          {featuredProviders.length > 0 && (
            <View>
              <View style={[styles.padH, styles.sectionTitle]}>
                <SectionHeader
                  title="Featured Studios"
                  onSeeAll={() => navigation.navigate('Explore')}
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hScroll}
              >
                {featuredProviders.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    onPress={() => navigation.navigate('ProviderDetails', { providerId: provider.id })}
                    onBookPress={() => navigation.navigate('ProviderDetails', { providerId: provider.id })}
                    onFavoritePress={() => requireAuth('favorite', () => toggleFavorite(provider.id))}
                    isFavorited={isLoggedIn && favorites.includes(provider.id)}
                  />
                ))}
              </ScrollView>
            </View>
          )}        </ScrollView>
      )}
    </View>
  );
}
