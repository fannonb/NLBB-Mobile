import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import { useCurrentDeviceLocation } from '../../hooks/useCurrentDeviceLocation';
import { useProviderDirectory } from '../../hooks/useProviderDirectory';
import EmptyState from '../../components/EmptyState';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { withProviderDistances } from '../../lib/location/providerDistance';
import { useAppStore } from '../../store/appStore';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop';

function createFavoritesStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: p.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heading: { flex: 1, textAlign: 'center', fontFamily: Fonts.serifMedium, fontSize: 20, color: p.textPrimary },
    spacer: { width: 40 },
    list: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, gap: 14 },
    card: {
      flexDirection: 'row',
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: p.border,
      ...s.card,
    },
    img: { width: 90, height: 110, resizeMode: 'cover' },
    info: { flex: 1, padding: 14 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
    name: { color: p.textPrimary, fontFamily: Fonts.serifMedium, fontSize: 15, flex: 1 },
    cat: { color: p.textSecondary, fontSize: 12, marginBottom: 8 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { color: p.textSecondary, fontSize: 12 },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: p.border },
    actions: { padding: 12, justifyContent: 'space-between', alignItems: 'center' },
    heartBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: p.goldDim,
      borderWidth: 1,
      borderColor: p.goldBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bookBtn: {
      backgroundColor: p.gold,
      borderRadius: Radius.sm,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    bookText: { color: p.bg, fontFamily: Fonts.sansBold, fontSize: 12 },
    emptyState: { alignItems: 'center', paddingTop: 100, gap: 12 },
    emptyTitle: { color: p.textPrimary, fontFamily: Fonts.serifMedium, fontSize: 20 },
    emptyText: { color: p.textMuted, fontFamily: Fonts.sans, fontSize: 14 },
  });
}

export default function FavoritesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createFavoritesStyles(palette, shadow), [palette, shadow]);
  const currentLocation = useCurrentDeviceLocation();
  const { favorites, removeFavorite, hydrateFavorites } = useAppStore();
  const { isLoggedIn, requireAuth } = useRequireAuth();
  const { providers, loading } = useProviderDirectory();
  const [favoritesLoading, setFavoritesLoading] = useState(isLoggedIn);

  useEffect(() => {
    let active = true;

    if (!isLoggedIn) {
      setFavoritesLoading(false);
      return () => {
        active = false;
      };
    }

    setFavoritesLoading(true);
    hydrateFavorites().finally(() => {
      if (active) {
        setFavoritesLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [hydrateFavorites, isLoggedIn]);

  const favoriteProviders = useMemo(() => {
    return withProviderDistances(
      providers.filter((provider) => favorites.includes(provider.id)),
      currentLocation,
    );
  }, [providers, favorites, currentLocation]);

  const emptyTitle =
    favoritesLoading || (loading && favorites.length > 0)
      ? 'Loading favorites...'
      : 'No Favorites Yet';
  const emptyText =
    favoritesLoading || (loading && favorites.length > 0)
      ? 'Fetching your saved providers'
      : 'Heart a provider to save them here';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.heading}>Favorites</Text>
        <View style={styles.spacer} />
      </View>

      {!isLoggedIn ? (
        <EmptyState
          icon="heart"
          title="Sign in to see favorites"
          message="Save your go-to barbers and salons once you create a free account."
          ctaLabel="Sign in to continue"
          onCta={() => requireAuth('favorites')}
        />
      ) : (
      <FlatList
        data={favoriteProviders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="heart" size={48} color={palette.border} />
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('ProviderDetails', { providerId: item.id })}
            style={styles.card}
            activeOpacity={0.85}
          >
            <Image source={{ uri: item.coverImage ?? FALLBACK_COVER }} style={styles.img} />
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                {item.isVerified && <Feather name="check-circle" size={13} color={palette.gold} />}
              </View>
              <Text style={styles.cat}>{item.category}</Text>
              <View style={styles.meta}>
                <Feather name="star" size={11} color={palette.gold} />
                <Text style={styles.metaText}>{item.rating}</Text>
                <View style={styles.dot} />
                <Feather name="map-pin" size={11} color={palette.textMuted} />
                <Text style={styles.metaText}>{item.distance ?? item.location}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => removeFavorite(item.id)}
                style={styles.heartBtn}
              >
                <Feather name="heart" size={16} color={palette.gold} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('ProviderDetails', { providerId: item.id })}>
                <Text style={styles.bookText}>Book</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
      )}
    </View>
  );
}
