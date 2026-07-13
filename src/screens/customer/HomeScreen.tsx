import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette, Spacing } from '../../constants/theme';
import { mergeCategoriesWithDefaults } from '../../constants/serviceCategories';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import { useCurrentDeviceLocation } from '../../hooks/useCurrentDeviceLocation';
import SearchBar from '../../components/SearchBar';
import CategoryTile from '../../components/CategoryTile';
import ProviderCard from '../../components/ProviderCard';
import ProviderCardSkeleton from '../../components/ProviderCardSkeleton';
import SectionHeader from '../../components/SectionHeader';
import CustomerAppHeader from '../../components/CustomerAppHeader';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useOpenBooking } from '../../hooks/useOpenBooking';
import { providerApi } from '../../lib/api/providers';
import { toCustomerBookingCard } from '../../lib/api/bookings';
import { withProviderDistances } from '../../lib/location/providerDistance';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { useBookingDataStore } from '../../store/bookingDataStore';
import { Category, Provider } from '../../types';

const SCREEN_W = Dimensions.get('window').width;
// Width of each tile in a 3-column grid (24px padding each side, 10px gap × 2)
const TILE_W = (SCREEN_W - 48 - 20) / 3;

type BookAgainItem = {
  providerId: string;
  providerName: string;
  providerImage?: string;
  serviceName: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createHomeStyles(palette: ColorPalette, _shadow: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.bg },
    scroll: { paddingBottom: 32 },

    // ── Sticky search strip (outside ScrollView) ──────────────
    searchStrip: {
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: 14,
      backgroundColor: palette.bg,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },

    // ── Greeting ──────────────────────────────────────────────
    greetingSection: {
      paddingHorizontal: 24,
      paddingTop: 22,
      paddingBottom: 24,
      alignItems: 'center',
    },
    greetingText: {
      fontFamily: Fonts.serifBold,
      fontSize: 24,
      color: palette.textPrimary,
      lineHeight: 32,
      letterSpacing: -0.4,
      marginBottom: 5,
      textAlign: 'center',
    },
    greetingSub: {
      fontSize: 13,
      fontFamily: Fonts.sans,
      color: palette.textMuted,
      lineHeight: 19,
      textAlign: 'center',
    },

    // ── Shared ────────────────────────────────────────────────
    section: { marginBottom: Spacing.section },
    hScroll: { paddingHorizontal: 24, gap: 16, paddingBottom: 4 },

    // ── Category 3×3 grid ─────────────────────────────────────
    catGrid: {
      paddingHorizontal: 24,
      marginBottom: Spacing.section,
      gap: 10,
    },
    catRow: {
      flexDirection: 'row',
      gap: 10,
    },
    catCell: {
      width: TILE_W,
    },

    // ── Book Again ────────────────────────────────────────────
    bookAgainScroll: { paddingHorizontal: 24, gap: 14, paddingBottom: 4 },
    bookAgainItem: { alignItems: 'center', width: 72 },
    bookAgainRing: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: palette.goldBorder,
      overflow: 'hidden',
      marginBottom: 8,
      backgroundColor: palette.cardInner,
    },
    bookAgainImg: { width: '100%', height: '100%' },
    bookAgainPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.goldDim,
    },
    bookAgainName: {
      color: palette.textPrimary,
      fontSize: 11,
      fontFamily: Fonts.sansMedium,
      textAlign: 'center',
    },
    bookAgainService: {
      color: palette.textMuted,
      fontSize: 10,
      fontFamily: Fonts.sans,
      textAlign: 'center',
      marginTop: 2,
    },

    // ── No Results ────────────────────────────────────────────
    noResults: { alignItems: 'center', paddingVertical: 32, gap: 8, paddingHorizontal: 24 },
    noResultsText: { color: palette.textMuted, fontFamily: Fonts.sansMedium, fontSize: 14 },
    noResultsClear: { color: palette.gold, fontFamily: Fonts.sansMedium, fontSize: 13 },

    // ── Explore CTA card ──────────────────────────────────────
    padH: { paddingHorizontal: 24, marginBottom: Spacing.section },
    exploreCta: {
      borderRadius: 18,
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 1,
      borderColor: palette.goldBorder,
      backgroundColor: palette.cardInner,
    },
    exploreCtaGlow: {
      position: 'absolute',
      right: -24,
      top: -24,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(184,146,42,0.15)',
    },
    exploreCtaInner: {
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    exploreCtaLeft: { flex: 1 },
    exploreCtaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    exploreCtaDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: palette.gold,
    },
    exploreCtaLabel: {
      fontSize: 10,
      fontFamily: Fonts.sansBold,
      color: palette.gold,
      letterSpacing: 1,
    },
    exploreCtaTitle: {
      fontSize: 16,
      fontFamily: Fonts.serifMedium,
      color: palette.textPrimary,
      lineHeight: 22,
      marginBottom: 5,
    },
    exploreCtaSub: {
      fontSize: 11,
      fontFamily: Fonts.sans,
      color: palette.textSecondary,
      marginBottom: 14,
      lineHeight: 16,
    },
    exploreCtaBtn: {
      backgroundColor: palette.gold,
      borderRadius: 9,
      paddingHorizontal: 14,
      paddingVertical: 8,
      alignSelf: 'flex-start',
    },
    exploreCtaBtnText: {
      color: '#FFFFFF',
      fontFamily: Fonts.sansBold,
      fontSize: 12,
    },
    exploreCtaIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'rgba(184,146,42,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(184,146,42,0.2)',
      flexShrink: 0,
    },

    // ── Favourites ────────────────────────────────────────────
    favItem: { alignItems: 'center', gap: 8, width: 64, marginLeft: 24 },
    favRingActive: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: palette.gold,
      overflow: 'hidden',
    },
    favAddRing: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    favImg: { width: '100%', height: '100%' },
    favName: {
      color: palette.textSecondary,
      fontSize: 11,
      fontFamily: Fonts.sansMedium,
      textAlign: 'center',
    },

    // ── Favourites empty (guest) ──────────────────────────────
    favGuestCard: {
      marginHorizontal: 24,
      backgroundColor: palette.cardInner,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: palette.border,
      borderStyle: 'dashed',
      marginBottom: 8,
    },
    favGuestIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: palette.goldDim,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    favGuestTitle: {
      fontSize: 14,
      fontFamily: Fonts.sansBold,
      color: palette.textPrimary,
      marginBottom: 5,
      textAlign: 'center',
    },
    favGuestSub: {
      fontSize: 12,
      fontFamily: Fonts.sans,
      color: palette.textMuted,
      lineHeight: 18,
      textAlign: 'center',
      marginBottom: 16,
    },
    favGuestBtn: {
      paddingHorizontal: 20,
      paddingVertical: 9,
      borderRadius: Radius.full,
      borderWidth: 1.5,
      borderColor: palette.gold,
    },
    favGuestBtnText: {
      color: palette.gold,
      fontFamily: Fonts.sansBold,
      fontSize: 13,
    },

    // ── Logged-in empty ───────────────────────────────────────
    favEmpty: { paddingHorizontal: 24, paddingBottom: 8 },
    favEmptyText: {
      color: palette.textMuted,
      fontFamily: Fonts.sans,
      fontSize: 13,
      lineHeight: 20,
    },
  });
}

// Chunk an array into groups of n
function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createHomeStyles(palette, shadow), [palette, shadow]);
  const { user } = useAuthStore();
  const currentLocation = useCurrentDeviceLocation();
  const { isLoggedIn, requireAuth } = useRequireAuth();
  const { openBooking } = useOpenBooking();
  const {
    favorites,
    toggleFavorite,
    hydrateFavorites,
    customerNotifications,
    hydrateCustomerNotifications,
  } = useAppStore();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const bookingRecords = useBookingDataStore((state) => state.records);
  const loadMyBookings = useBookingDataStore((state) => state.loadMyBookings);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [provs, cats] = await Promise.all([
          providerApi.listProviders(),
          providerApi.listCategories(),
        ]);
        if (!active) return;
        setProviders(provs);
        setCategories(mergeCategoriesWithDefaults(cats));
      } catch {
        if (active) { setProviders([]); setCategories(mergeCategoriesWithDefaults([])); }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    hydrateFavorites();
    hydrateCustomerNotifications();
  }, [hydrateFavorites, hydrateCustomerNotifications]);

  useEffect(() => {
    if (isLoggedIn) {
      void loadMyBookings();
    }
  }, [isLoggedIn, loadMyBookings]);

  const bookAgain = useMemo(() => {
    if (!isLoggedIn) return [];
    const seen = new Set<string>();
    const recent: BookAgainItem[] = [];
    for (const raw of bookingRecords) {
      const b = toCustomerBookingCard(raw);
      if (seen.has(b.providerId)) continue;
      seen.add(b.providerId);
      recent.push({
        providerId: b.providerId,
        providerName: b.providerName,
        providerImage: b.providerImage,
        serviceName: b.serviceName,
      });
      if (recent.length >= 6) break;
    }
    return recent;
  }, [bookingRecords, isLoggedIn]);

  const rankedProviders = useMemo(
    () => withProviderDistances(providers, currentLocation),
    [providers, currentLocation]
  );

  const filteredProviders = useMemo(() => {
    return rankedProviders.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q || [p.name, p.category, p.location].join(' ').toLowerCase().includes(q);
      const matchCat = !activeCategory || p.category.toLowerCase().includes(activeCategory.toLowerCase());
      return matchSearch && matchCat;
    });
  }, [rankedProviders, search, activeCategory]);

  const favoriteProviders = rankedProviders.filter((p) => favorites.includes(p.id));
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const unreadCount = isLoggedIn ? customerNotifications.filter((n) => !n.isRead).length : 0;

  const handleBookAgain = async (item: BookAgainItem) => {
    try {
      const provider = await providerApi.getProvider(item.providerId);
      if (!provider) { navigation.navigate('ProviderDetails', { providerId: item.providerId }); return; }
      openBooking({
        providerId: provider.id,
        providerName: provider.name,
        providerPhone: provider.phone,
        providerWhatsapp: provider.whatsapp,
        services: provider.services,
        preselectedServiceId: provider.services.find((s) => s.name === item.serviceName)?.id,
      });
    } catch {
      navigation.navigate('ProviderDetails', { providerId: item.providerId });
    }
  };

  const displayedCategories = useMemo(() => categories.slice(0, 9), [categories]);
  const catRows = useMemo(() => chunk(displayedCategories, 3), [displayedCategories]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ───────────────────────────────────────────── */}
      <CustomerAppHeader
        variant="home"
        navigation={navigation}
        unreadCount={unreadCount}
        locationLabel={user?.location ?? 'Nairobi'}
        avatarUri={user?.avatar}
        onAvatarPress={() => navigation.navigate('Profile')}
        onNotifPress={() =>
          requireAuth('notifications', () => navigation.navigate('Notifications'))
        }
        noBorder
        transparentBg
      />

      {/* ── Sticky search bar ────────────────────────────────── */}
      <View style={styles.searchStrip}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onFilterPress={() => navigation.navigate('Explore')}
          placeholder="Search barbers, salons, spas…"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Greeting ─────────────────────────────────────────── */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>
            {isLoggedIn ? (
              `${greeting}, ${firstName} 👋`
            ) : (
              <Text>
                Discover beauty near you{' '}
                <Feather name="map-pin" size={20} color={palette.gold} />
              </Text>
            )}
          </Text>
          <Text style={styles.greetingSub}>
            {isLoggedIn
              ? 'What are you getting done today?'
              : 'Browse & book — no account needed to explore'}
          </Text>
        </View>

        {/* ── Book Again ───────────────────────────────────────── */}
        {isLoggedIn && bookAgain.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Book again" onSeeAll={() => navigation.navigate('Bookings')} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bookAgainScroll}
            >
              {bookAgain.map((item) => (
                <TouchableOpacity
                  key={item.providerId}
                  style={styles.bookAgainItem}
                  onPress={() => handleBookAgain(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.bookAgainRing}>
                    {item.providerImage ? (
                      <Image source={{ uri: item.providerImage }} style={styles.bookAgainImg} />
                    ) : (
                      <View style={styles.bookAgainPlaceholder}>
                        <Feather name="user" size={22} color={palette.gold} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.bookAgainName} numberOfLines={1}>{item.providerName}</Text>
                  <Text style={styles.bookAgainService} numberOfLines={1}>{item.serviceName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Services 3×3 grid ────────────────────────────────── */}
        {categories.length > 0 && (
          <>
            <SectionHeader
              title="Services"
              onSeeAll={() => navigation.navigate('AllServices')}
            />
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
                  {/* Fill trailing empty cells to maintain grid shape */}
                  {row.length < 3 &&
                    Array(3 - row.length)
                      .fill(null)
                      .map((_, i) => (
                        <View key={`empty-${i}`} style={styles.catCell} />
                      ))}
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Near You ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader
            title={activeCategory || search ? 'Results' : 'Near you'}
            onSeeAll={() => navigation.navigate('Explore')}
          />
          {loading && providers.length === 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}
            >
              {[1, 2, 3].map((k) => <ProviderCardSkeleton key={k} />)}
            </ScrollView>
          ) : filteredProviders.length === 0 ? (
            <View style={styles.noResults}>
              <Feather name="search" size={28} color={palette.border} />
              <Text style={styles.noResultsText}>No providers found</Text>
              <TouchableOpacity onPress={() => { setSearch(''); setActiveCategory(null); }}>
                <Text style={styles.noResultsClear}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}
            >
              {filteredProviders.map((provider) => (
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
          )}
        </View>

        {/* ── Explore Providers CTA ─────────────────────────────── */}
        <View style={styles.padH}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Explore')}
            style={styles.exploreCta}
          >
            <View style={styles.exploreCtaInner}>
              <View style={styles.exploreCtaGlow} />
              <View style={styles.exploreCtaLeft}>
                <View style={styles.exploreCtaBadge}>
                  <View style={styles.exploreCtaDot} />
                  <Text style={styles.exploreCtaLabel}>NEAR YOU</Text>
                </View>
                <Text style={styles.exploreCtaTitle}>Discover Professionals{'\n'}Near You</Text>
                <Text style={styles.exploreCtaSub}>
                  Browse nearby providers, compare services, and book quickly.
                </Text>
                <View style={styles.exploreCtaBtn}>
                  <Text style={styles.exploreCtaBtnText}>Open Explore →</Text>
                </View>
              </View>
              <View style={styles.exploreCtaIconWrap}>
                <Feather name="search" size={24} color="rgba(184,146,42,0.75)" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Favourites ───────────────────────────────────────── */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <SectionHeader
            title="Favourites"
            onSeeAll={isLoggedIn ? () => navigation.navigate('Favorites') : undefined}
          />

          {favoriteProviders.length === 0 ? (
            isLoggedIn ? (
              <View style={styles.favEmpty}>
                <Text style={styles.favEmptyText}>
                  Tap the heart on any provider to save them here.
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.favGuestCard}
                activeOpacity={0.85}
                onPress={() => requireAuth('favorites', () => {})}
              >
                <View style={styles.favGuestIconWrap}>
                  <Feather name="heart" size={22} color={palette.gold} />
                </View>
                <Text style={styles.favGuestTitle}>Save Your Favourites</Text>
                <Text style={styles.favGuestSub}>
                  Log in to bookmark providers and quickly rebook your go-to spots
                </Text>
                <View style={styles.favGuestBtn}>
                  <Text style={styles.favGuestBtnText}>Log In — It's Free</Text>
                </View>
              </TouchableOpacity>
            )
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}
            >
              {favoriteProviders.map((fav) => (
                <TouchableOpacity
                  key={fav.id}
                  style={styles.favItem}
                  onPress={() => navigation.navigate('ProviderDetails', { providerId: fav.id })}
                >
                  <View style={styles.favRingActive}>
                    <Image source={{ uri: fav.coverImage }} style={styles.favImg} />
                  </View>
                  <Text style={styles.favName} numberOfLines={1}>{fav.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.favItem}
                onPress={() => navigation.navigate('Explore')}
              >
                <View style={styles.favAddRing}>
                  <Feather name="plus" size={20} color={palette.textSecondary} />
                </View>
                <Text style={styles.favName}>Explore</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
