import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { mergeCategoriesWithDefaults } from '../../constants/serviceCategories';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import { useCurrentDeviceLocation } from '../../hooks/useCurrentDeviceLocation';
import SearchBar from '../../components/SearchBar';
import ExploreFilterSheet, {
  DEFAULT_EXPLORE_FILTERS,
  ExploreFilters,
  hasActiveFilters,
} from '../../components/ExploreFilterSheet';
import EmptyState from '../../components/EmptyState';
import ExploreCardSkeleton from '../../components/ExploreCardSkeleton';
import CustomerAppHeader from '../../components/CustomerAppHeader';
import { providerApi } from '../../lib/api/providers';
import { withProviderDistances } from '../../lib/location/providerDistance';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { Category, Provider } from '../../types';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop';

function createExploreStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    heroSection: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: 'transparent',
    },
    searchWrap: { paddingHorizontal: 24, marginBottom: 16 },
    filtersContainer: { marginBottom: 16, flexGrow: 0, flexShrink: 0 },
    filtersScroll: {
      paddingHorizontal: 24,
      gap: 10,
      alignItems: 'center',
      flexGrow: 0,
    },
    filterChip: {
      alignSelf: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: Radius.full,
      backgroundColor: p.card,
      borderWidth: 1.5,
      borderColor: p.border,
    },
    filterChipActive: {
      backgroundColor: p.gold,
      borderColor: p.gold,
      shadowColor: p.gold,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
    filterText: { color: p.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 13 },
    filterTextActive: { color: p.bg, fontFamily: Fonts.sansBold, fontWeight: '700' },
    list: { paddingHorizontal: 24, paddingBottom: 24 },
    resultCount: { color: p.textMuted, fontFamily: Fonts.sans, fontSize: 13, marginBottom: 16, marginTop: 4 },
    listCard: {
      flexDirection: 'row',
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      marginBottom: 14,
      borderWidth: 1,
      borderColor: p.border,
      ...s.card,
    },
    listImg: { width: 90, height: 110, resizeMode: 'cover' },
    listInfo: { flex: 1, padding: 14 },
    listTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
    listName: { color: p.textPrimary, fontFamily: Fonts.serifMedium, fontSize: 15, flex: 1 },
    listCat: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 12, marginBottom: 8 },
    listMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 12 },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: p.border },
    listFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    listPrice: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 13 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontFamily: Fonts.sansMedium, fontSize: 11 },
  });
}

function ProviderListCard({
  provider,
  onPress,
  styles,
  palette,
}: {
  provider: Provider;
  onPress: () => void;
  styles: ReturnType<typeof createExploreStyles>;
  palette: ColorPalette;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.listCard} activeOpacity={0.85}>
      <Image source={{ uri: provider.coverImage ?? FALLBACK_COVER }} style={styles.listImg} />
      <View style={styles.listInfo}>
        <View style={styles.listTop}>
          <Text style={styles.listName} numberOfLines={1}>{provider.name}</Text>
          {provider.isVerified && <Feather name="check-circle" size={13} color={palette.gold} />}
        </View>
        <Text style={styles.listCat}>{provider.category}</Text>
        <View style={styles.listMeta}>
          <View style={styles.metaItem}>
            <Feather name="star" size={11} color={palette.gold} />
            <Text style={styles.metaText}>{provider.rating} ({provider.reviewCount})</Text>
          </View>
          <View style={styles.dot} />
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={11} color={palette.textMuted} />
            <Text style={styles.metaText}>{provider.distance ?? provider.location}</Text>
          </View>
        </View>
        <View style={styles.listFooter}>
          <Text style={styles.listPrice}>from Ksh {provider.priceFrom.toLocaleString()}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: provider.isOpen ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)' },
            ]}
          >
            <Text style={[styles.statusText, { color: provider.isOpen ? palette.success : palette.textMuted }]}>
              {provider.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ExploreScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createExploreStyles(palette, shadow), [palette, shadow]);
  const currentLocation = useCurrentDeviceLocation();
  const { user } = useAuthStore();
  const { customerNotifications, hydrateCustomerNotifications } = useAppStore();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ExploreFilters>(DEFAULT_EXPLORE_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const unreadCount = customerNotifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (route?.params?.category) {
      setActiveCategory(route.params.category);
      navigation.setParams({ category: undefined });
    }
  }, [route?.params?.category]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [providerResult, categoryResult] = await Promise.all([
          providerApi.listProviders(),
          providerApi.listCategories(),
        ]);
        if (!active) {
          return;
        }
        setProviders(providerResult);
        setCategories(mergeCategoriesWithDefaults(categoryResult));
      } catch {
        if (active) {
          setProviders([]);
          setCategories(mergeCategoriesWithDefaults([]));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    hydrateCustomerNotifications();
  }, [hydrateCustomerNotifications]);

  const rankedProviders = useMemo(
    () => withProviderDistances(providers, currentLocation),
    [providers, currentLocation]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rankedProviders.filter((provider) => {
      const matchesSearch =
        !query ||
        [provider.name, provider.category, provider.location, provider.address]
          .join(' ')
          .toLowerCase()
          .includes(query);
      const matchesCategory =
        !activeCategory || provider.category.toLowerCase().includes(activeCategory.toLowerCase());
      const matchesRating = filters.minRating === null || provider.rating >= filters.minRating;
      const matchesPrice = filters.maxPrice === null || provider.priceFrom <= filters.maxPrice;
      const distanceKm = provider.distanceKm ?? NaN;
      const matchesDistance =
        filters.maxDistanceKm === null || (!Number.isNaN(distanceKm) && distanceKm <= filters.maxDistanceKm);
      const matchesOpenNow = !filters.openNowOnly || provider.isOpen;
      return (
        matchesSearch &&
        matchesCategory &&
        matchesRating &&
        matchesPrice &&
        matchesDistance &&
        matchesOpenNow
      );
    });
  }, [rankedProviders, search, activeCategory, filters]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomerAppHeader
        variant="page"
        navigation={navigation}
        unreadCount={unreadCount}
        avatarUri={user?.avatar}
        title="Explore"
        pageSubtitle="Salons & studios near you"
        noBorder
        transparentBg
      />

      <View style={styles.heroSection}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onFilterPress={() => setFilterSheetVisible(true)}
          filterActive={hasActiveFilters(filters)}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
        style={styles.filtersContainer}
        bounces={false}
      >
        <TouchableOpacity
          onPress={() => setActiveCategory(null)}
          style={[styles.filterChip, !activeCategory && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, !activeCategory && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => setActiveCategory(activeCategory === category.name ? null : category.name)}
            style={[styles.filterChip, activeCategory === category.name && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, activeCategory === category.name && styles.filterTextActive]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={(loading ? [1, 2, 3, 4] : filtered) as any}
        keyExtractor={(item) => (loading ? String(item) : (item as Provider).id)}
        renderItem={({ item }) => {
          if (loading) {
            return <ExploreCardSkeleton />;
          }
          return (
            <ProviderListCard
              provider={item as Provider}
              styles={styles}
              palette={palette}
              onPress={() => navigation.navigate('ProviderDetails', { providerId: item.id })}
            />
          );
        }}
        contentContainerStyle={[styles.list, !loading && filtered.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          loading ? (
            <Text style={styles.resultCount}>Searching nearby providers...</Text>
          ) : filtered.length > 0 ? (
            <Text style={styles.resultCount}>
              {`${filtered.length} provider${filtered.length !== 1 ? 's' : ''} found`}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="search"
              title="No providers found"
              message={`We couldn't find any providers matching "${search || 'your filters'}". Try a different search or category.`}
              ctaLabel="Clear filters"
              onCta={() => {
                setSearch('');
                setActiveCategory(null);
                setFilters(DEFAULT_EXPLORE_FILTERS);
              }}
            />
          )
        }
      />

      <ExploreFilterSheet
        visible={filterSheetVisible}
        initialFilters={filters}
        onApply={setFilters}
        onClose={() => setFilterSheetVisible(false)}
      />
    </View>
  );
}
