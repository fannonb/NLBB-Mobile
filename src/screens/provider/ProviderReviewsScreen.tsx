import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import { Review } from '../../types';
import EmptyState from '../../components/EmptyState';
import { providerManagementApi } from '../../lib/api/providerManagement';
import { providerApi } from '../../lib/api/providers';

type SortType = 'recent' | 'highest' | 'lowest';

function createReviewsStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 24, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: p.border,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: p.card, alignItems: 'center', justifyContent: 'center',
    },
    heading: {
      flex: 1, textAlign: 'center',
      fontFamily: Fonts.serifMedium, fontSize: 18, color: p.textPrimary,
    },
    list: { paddingHorizontal: 24, paddingBottom: 40 },
    summaryCard: {
      flexDirection: 'row', gap: 20, backgroundColor: p.card,
      borderRadius: Radius.xl, padding: 20, borderWidth: 1,
      borderColor: p.border, marginTop: 20, marginBottom: 20, ...s.soft,
    },
    ratingBig: { alignItems: 'center', justifyContent: 'center', width: 90 },
    ratingNumber: { fontFamily: Fonts.serifMedium, fontSize: 44, color: p.textPrimary, lineHeight: 52 },
    stars: { flexDirection: 'row', gap: 2, marginBottom: 4 },
    reviewCountLabel: { color: p.textMuted, fontSize: 11 },
    barBreakdown: { flex: 1, gap: 6, justifyContent: 'center' },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    barStar: { color: p.textSecondary, fontSize: 12, width: 8, textAlign: 'right' },
    barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: p.cardInner, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3, backgroundColor: p.gold },
    barCount: { color: p.textMuted, fontSize: 11, width: 16, textAlign: 'right' },
    sortRow: {
      flexDirection: 'row', gap: 8, marginBottom: 16,
      backgroundColor: p.card, borderRadius: Radius.lg, padding: 4,
    },
    sortBtn: { flex: 1, paddingVertical: 8, borderRadius: Radius.md, alignItems: 'center' },
    sortBtnActive: { backgroundColor: p.gold },
    sortText: { color: p.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 13 },
    sortTextActive: { color: p.bg, fontWeight: '700' },
    reviewCard: {
      backgroundColor: p.card, borderRadius: Radius.lg, padding: 18,
      borderWidth: 1, borderColor: p.border, marginBottom: 12, ...s.soft,
    },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    reviewUser: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    reviewAvatar: { width: 40, height: 40, borderRadius: 20 },
    reviewAvatarPlaceholder: { backgroundColor: p.cardInner, alignItems: 'center', justifyContent: 'center' },
    reviewAvatarLetter: { color: p.textPrimary, fontFamily: Fonts.serifMedium, fontSize: 16 },
    reviewName: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14 },
    reviewMeta: { color: p.textMuted, fontSize: 11, marginTop: 2 },
    reviewRatingBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: p.goldDim, paddingHorizontal: 8, paddingVertical: 4,
      borderRadius: 6, borderWidth: 1, borderColor: p.goldBorder,
    },
    reviewRatingText: { color: p.gold, fontFamily: Fonts.sansBold, fontSize: 12 },
    reviewComment: { color: p.textSecondary, fontSize: 13, lineHeight: 21 },
  });
}

export default function ProviderReviewsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createReviewsStyles(palette, shadow), [palette, shadow]);
  const [providerReviews, setProviderReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortType>('recent');

  useEffect(() => {
    let active = true;

    const loadReviews = async () => {
      setLoading(true);
      try {
        const provider = await providerManagementApi.getMyProfile();
        const reviews = await providerApi.listReviews(provider.id);
        if (!active) {
          return;
        }
        setProviderReviews(reviews);
      } catch {
        if (active) {
          setProviderReviews([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      active = false;
    };
  }, []);

  const avgRating =
    providerReviews.length > 0
      ? providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length
      : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: providerReviews.filter((r) => Math.round(r.rating) === star).length,
    pct: providerReviews.length > 0
      ? (providerReviews.filter((r) => Math.round(r.rating) === star).length / providerReviews.length) * 100
      : 0,
  }));

  const sorted = useMemo(() => {
    const arr = [...providerReviews];
    if (sort === 'highest') return arr.sort((a, b) => b.rating - a.rating);
    if (sort === 'lowest') return arr.sort((a, b) => a.rating - b.rating);
    return arr;
  }, [providerReviews, sort]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.heading}>Customer Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(r) => r.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, sorted.length === 0 && { flex: 1 }]}
        ListHeaderComponent={
          <>
            {/* Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.ratingBig}>
                <Text style={styles.ratingNumber}>{avgRating.toFixed(1)}</Text>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Feather
                      key={s}
                      name="star"
                      size={16}
                      color={s <= Math.round(avgRating) ? palette.gold : palette.border}
                    />
                  ))}
                </View>
                <Text style={styles.reviewCountLabel}>{providerReviews.length} reviews</Text>
              </View>
              <View style={styles.barBreakdown}>
                {ratingCounts.map(({ star, count, pct }) => (
                  <View key={star} style={styles.barRow}>
                    <Text style={styles.barStar}>{star}</Text>
                    <Feather name="star" size={10} color={palette.gold} />
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.barCount}>{count}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Sort */}
            <View style={styles.sortRow}>
              {(['recent', 'highest', 'lowest'] as SortType[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSort(s)}
                  style={[styles.sortBtn, sort === s && styles.sortBtnActive]}
                >
                  <Text style={[styles.sortText, sort === s && styles.sortTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        renderItem={({ item }) => <ReviewCard review={item} styles={styles} palette={palette} />}
        refreshing={loading}
        onRefresh={() => {
          setLoading(true);
          providerManagementApi
            .getMyProfile()
            .then((provider) => providerApi.listReviews(provider.id))
            .then((reviews) => setProviderReviews(reviews))
            .catch(() => setProviderReviews([]))
            .finally(() => setLoading(false));
        }}
        ListEmptyComponent={
          <EmptyState
            icon="star"
            title="No reviews yet"
            message="Your reviews from customers will appear here once they complete bookings and submit feedback."
          />
        }
      />
    </View>
  );
}

function ReviewCard({ review, styles, palette }: { review: Review; styles: any; palette: ColorPalette }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUser}>
          {review.userAvatar ? (
            <Image source={{ uri: review.userAvatar }} style={styles.reviewAvatar} />
          ) : (
            <View style={[styles.reviewAvatar, styles.reviewAvatarPlaceholder]}>
              <Text style={styles.reviewAvatarLetter}>{review.userName[0]}</Text>
            </View>
          )}
          <View>
            <Text style={styles.reviewName}>{review.userName}</Text>
            <Text style={styles.reviewMeta}>{review.date} · {review.serviceName}</Text>
          </View>
        </View>
        <View style={styles.reviewRatingBadge}>
          <Feather name="star" size={11} color={palette.gold} />
          <Text style={styles.reviewRatingText}>{review.rating}</Text>
        </View>
      </View>
      <Text style={styles.reviewComment}>"{review.comment}"</Text>
    </View>
  );
}


