import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { getCategoryVisual } from '../constants/categoryVisuals';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';
import ProviderCoverImage from './ProviderCoverImage';
import { formatRatingSummary } from '../lib/ratingLabel';
import { Provider } from '../types';

// Handlers receive the provider id so lists can pass one stable callback for every card,
// which lets React.memo skip re-rendering cards whose data didn't change.
interface ProviderCardProps {
  style?: StyleProp<ViewStyle>;
  provider: Provider;
  onPress: (providerId: string) => void;
  onBookPress?: (providerId: string) => void;
  onFavoritePress?: (providerId: string) => void;
  isFavorited?: boolean;
}

function createProviderCardStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    card: {
      width: 260,
      backgroundColor: p.card,
      borderRadius: Radius.xl,
      overflow: 'hidden',
      flexDirection: 'column',
      borderWidth: 1,
      borderColor: p.borderLight,
      ...s.card,
    },
    imageContainer: {
      height: 178,
      width: '100%',
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    favBtn: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(18,18,18,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
    },
    availBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: Radius.full,
      backgroundColor: 'rgba(18,18,18,0.65)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    availDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    availText: {
      color: '#fff',
      fontSize: 12,
      fontFamily: Fonts.sansMedium,
    },
    ratingBadge: {
      position: 'absolute',
      bottom: 12,
      left: 12,
      backgroundColor: 'rgba(18,18,18,0.88)',
      borderRadius: 8,
      paddingHorizontal: 9,
      paddingVertical: 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: p.goldBorder,
    },
    ratingText: {
      color: '#fff',
      fontSize: 12,
      fontFamily: Fonts.sansBold,
    },
    info: {
      padding: 16,
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    titleLeft: {
      flex: 1,
      marginRight: 8,
    },
    name: {
      color: p.textPrimary,
      fontFamily: Fonts.serifMedium,
      fontSize: 15,
      letterSpacing: -0.2,
    },
    category: {
      color: p.textSecondary,
      fontSize: 12,
      marginTop: 3,
      fontFamily: Fonts.sans,
    },
    catIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 10,
    },
    location: {
      color: p.textSecondary,
      fontSize: 12,
      fontFamily: Fonts.sans,
      marginLeft: 2,
    },
    tagRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 10,
      flexWrap: 'wrap',
    },
    tag: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: Radius.full,
      backgroundColor: p.cardInner,
      borderWidth: 1,
      borderColor: p.borderLight,
    },
    tagText: {
      color: p.textSecondary,
      fontSize: 12,
      fontFamily: Fonts.sansMedium,
    },
    footer: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: p.borderLight,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    priceLabel: {
      color: p.textMuted,
      fontSize: 12,
      fontFamily: Fonts.sans,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 3,
    },
    price: {
      color: p.textPrimary,
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      letterSpacing: -0.2,
    },
    bookBtn: {
      minHeight: 44,
      justifyContent: 'center',
      backgroundColor: p.gold,
      borderRadius: Radius.md,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    bookText: {
      color: p.onGold,
      fontFamily: Fonts.sansBold,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
}

function ProviderCard({
  provider,
  onPress,
  onBookPress,
  onFavoritePress,
  isFavorited = false,
  style,
}: ProviderCardProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createProviderCardStyles(palette, shadow), [palette, shadow]);

  const catVisual = getCategoryVisual(provider.category);

  const topServices = provider.services?.slice(0, 2) ?? [];

  const reviewLabel = formatRatingSummary(provider.rating, provider.reviewCount);

  return (
    <TouchableOpacity onPress={() => onPress(provider.id)} activeOpacity={0.9} style={[styles.card, style]}>
      <View style={styles.imageContainer}>
        <ProviderCoverImage uri={provider.coverImage} category={provider.category} style={styles.image} iconSize={40} />

        {/* Availability badge */}
        <View style={styles.availBadge}>
          <View
            style={[
              styles.availDot,
              { backgroundColor: provider.isOpen ? '#10B981' : '#9CA3AF' },
            ]}
          />
          <Text style={styles.availText}>{provider.isOpen ? 'Open now' : 'Closed'}</Text>
        </View>

        {/* Favourite button */}
        <TouchableOpacity
          onPress={onFavoritePress ? () => onFavoritePress(provider.id) : undefined}
          style={styles.favBtn}
          accessibilityRole="button"
          accessibilityLabel={`${isFavorited ? 'Remove' : 'Save'} ${provider.name} ${isFavorited ? 'from' : 'to'} favourites`}
          accessibilityState={{ selected: isFavorited }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="heart" size={14} color={isFavorited ? palette.gold : '#fff'} />
        </TouchableOpacity>

        {/* Rating + review count */}
        <View style={styles.ratingBadge}>
          <Feather name="star" size={10} color={palette.gold} />
          <Text style={styles.ratingText}>{reviewLabel}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <Text style={styles.name} numberOfLines={1}>
              {provider.name}
            </Text>
            <Text style={styles.category}>{provider.category}</Text>
          </View>
          <View style={[styles.catIcon, { backgroundColor: catVisual.bg, borderColor: catVisual.border }]}>
            <MaterialCommunityIcons name={catVisual.icon} size={14} color={catVisual.color} />
          </View>
        </View>

        <View style={styles.locationRow}>
          <Feather name="map-pin" size={10} color={palette.textMuted} />
          <Text style={styles.location}>
            {provider.location}
            {provider.distance ? ` · ${provider.distance}` : ''}
          </Text>
        </View>

        {topServices.length > 0 && (
          <View style={styles.tagRow}>
            {topServices.map((s, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText} numberOfLines={1}>
                  {s.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>Starts from</Text>
            <Text style={styles.price}>Ksh {provider.priceFrom.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            onPress={onBookPress ? () => onBookPress(provider.id) : undefined}
            style={styles.bookBtn}
            accessibilityRole="button"
            accessibilityLabel={`Book ${provider.name}`}
            activeOpacity={0.85}
          >
            <Text style={styles.bookText}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(ProviderCard);
