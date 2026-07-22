import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeedbackModalHost from '../../components/FeedbackModalHost';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import { useCurrentDeviceLocationState } from '../../hooks/useCurrentDeviceLocation';
import { useModalManager } from '../../hooks/useModalManager';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useOpenBooking } from '../../hooks/useOpenBooking';
import { useAppStore } from '../../store/appStore';
import { providerApi } from '../../lib/api/providers';
import { withProviderDistance } from '../../lib/location/providerDistance';
import { openExternalUrl, openPhoneNumber, openWhatsAppContact } from '../../lib/contactActions';
import { normalizeFacebookLink, normalizeInstagramLink } from '../../lib/socialLinks';
import { Provider, Review } from '../../types';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop';

export default function ProviderDetailsScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createProviderDetailsStyles(palette, shadow), [palette, shadow]);
  const currentLocation = useCurrentDeviceLocationState();
  const { providerId } = route.params ?? { providerId: '1' };
  const { favorites, toggleFavorite } = useAppStore();
  const { isLoggedIn, requireAuth } = useRequireAuth();
  const { openBooking } = useOpenBooking();
  const { modal, showError, showInfo, hideModal } = useModalManager();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadProvider = async () => {
      try {
        const [providerResult, reviewResult] = await Promise.all([
          providerApi.getProvider(providerId),
          providerApi.listReviews(providerId),
        ]);

        if (!active) {
          return;
        }

        setProvider(providerResult ?? null);
        setReviews(reviewResult);
      } catch {
        if (active) {
          setProvider(null);
          setReviews([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProvider();

    return () => {
      active = false;
    };
  }, [providerId, isLoggedIn]);

  const hydratedProvider = useMemo(
    () => (provider ? withProviderDistance(provider, currentLocation.coordinates) : null),
    [provider, currentLocation.coordinates]
  );

  const serviceCategories = useMemo(() => {
    return [...new Set((hydratedProvider?.services ?? []).map((service) => service.category))];
  }, [hydratedProvider?.services]);

  useEffect(() => {
    if (!selectedCategory && serviceCategories.length > 0) {
      setSelectedCategory(serviceCategories[0]);
      return;
    }
    if (selectedCategory && !serviceCategories.includes(selectedCategory) && serviceCategories.length > 0) {
      setSelectedCategory(serviceCategories[0]);
      setSelectedServiceId(null);
    }
  }, [selectedCategory, serviceCategories]);

  const visibleServices = selectedCategory
    ? (hydratedProvider?.services ?? []).filter((service) => service.category === selectedCategory)
    : hydratedProvider?.services ?? [];

  const selectedService = (hydratedProvider?.services ?? []).find((service) => service.id === selectedServiceId);
  const isFavorited = hydratedProvider ? isLoggedIn && favorites.includes(hydratedProvider.id) : false;
  const distanceLabel = hydratedProvider?.distance
    ?? (hydratedProvider?.coordinates
      ? currentLocation.status === 'loading'
        ? 'Calculating distance'
        : currentLocation.status === 'permission-denied'
          ? 'Enable location for distance'
          : 'Distance unavailable'
      : 'Location pending');

  const handleBook = () => {
    if (!selectedService || !hydratedProvider) return;
    openBooking({
      providerId: hydratedProvider.id,
      providerName: hydratedProvider.name,
      providerPhone: hydratedProvider.phone,
      providerWhatsapp: hydratedProvider.whatsapp,
      services: hydratedProvider.services,
      preselectedServiceId: selectedService.id,
    });
  };

  const handleContact = (open: () => void) => {
    requireAuth('contact', open);
  };

  if (!hydratedProvider) {
    return (
      <View style={styles.container}>
        <View style={styles.heroContainer}>
          <Image source={{ uri: FALLBACK_COVER }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <View style={[styles.topNav, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
              <Feather name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>{loading ? 'Loading provider...' : 'Provider not found'}</Text>
          {!loading ? (
            <Text style={styles.emptyText}>We could not load this provider right now. Please try again.</Text>
          ) : null}
        </View>
      </View>
    );
  }

  const handleDirections = () => {
    requireAuth('contact', () => {
      const target = hydratedProvider.coordinates
        ? `${hydratedProvider.coordinates.lat},${hydratedProvider.coordinates.lng}`
        : hydratedProvider.address;
      void openExternalUrl(
        `https://maps.google.com/?q=${encodeURIComponent(target)}`,
      ).then((opened) => {
        if (!opened) {
          showError('Unable to Open', 'This action is not supported on your device.');
        }
      });
    });
  };

  const resolveContactPhone = async (preferWhatsapp = false) => {
    // Guests get contacts stripped by the API — always re-fetch after auth.
    let phone = preferWhatsapp
      ? hydratedProvider.whatsapp ?? hydratedProvider.phone
      : hydratedProvider.phone ?? hydratedProvider.whatsapp;

    if (!phone) {
      try {
        const fresh = await providerApi.getProvider(providerId);
        if (fresh) {
          setProvider(fresh);
          phone = preferWhatsapp
            ? fresh.whatsapp ?? fresh.phone
            : fresh.phone ?? fresh.whatsapp;
        }
      } catch {
        // Keep existing empty value; caller shows the appropriate message.
      }
    }

    return (phone ?? '').trim();
  };

  const handleCall = () => {
    // Only show "no number" when we know contacts aren't locked and none exist.
    if (!hydratedProvider.contactsLocked && hydratedProvider.hasPhone === false) {
      showInfo('No Phone Number', 'This provider has not added a contact number yet.');
      return;
    }

    // Auth first — guest responses hide phone numbers on purpose.
    handleContact(() => {
      void (async () => {
        const phone = await resolveContactPhone(false);
        if (!phone) {
          showInfo('No Phone Number', 'This provider has not added a contact number yet.');
          return;
        }
        const opened = await openPhoneNumber(phone);
        if (!opened) {
          showError('Unable to Open', 'Phone calling is not supported on your device.');
        }
      })();
    });
  };

  const handleWhatsApp = () => {
    if (!hydratedProvider.contactsLocked && hydratedProvider.hasWhatsapp === false) {
      showInfo('No WhatsApp Number', 'This provider has not added a WhatsApp contact yet.');
      return;
    }

    handleContact(() => {
      void (async () => {
        const phone = await resolveContactPhone(true);
        if (!phone) {
          showInfo('No WhatsApp Number', 'This provider has not added a WhatsApp contact yet.');
          return;
        }
        const opened = await openWhatsAppContact(phone);
        if (!opened) {
          showError('Unable to Open', 'WhatsApp is not available on your device.');
        }
      })();
    });
  };

  const handleInstagram = () => {
    const url = normalizeInstagramLink(hydratedProvider.instagram);
    if (!url) {
      showInfo('No Instagram Link', 'This provider has not added an Instagram link yet.');
      return;
    }

    void openExternalUrl(url).then((opened) => {
      if (!opened) {
        showError('Unable to Open', 'Instagram is not available on your device.');
      }
    });
  };

  const handleFacebook = () => {
    const url = normalizeFacebookLink(hydratedProvider.facebook);
    if (!url) {
      showInfo('No Facebook Link', 'This provider has not added a Facebook link yet.');
      return;
    }

    void openExternalUrl(url).then((opened) => {
      if (!opened) {
        showError('Unable to Open', 'Facebook is not available on your device.');
      }
    });
  };

  const navBgOpacity = scrollY.interpolate({
    inputRange: [180, 260],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Floating solid header that fades in */}
      <Animated.View
        style={[
          styles.solidHeader,
          {
            height: insets.top + 56,
            paddingTop: insets.top,
            backgroundColor: palette.card,
            opacity: navBgOpacity,
            borderBottomWidth: 1,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.solidHeaderBack}>
          <Feather name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.solidHeaderTitle} numberOfLines={1}>
          {hydratedProvider.name}
        </Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={styles.heroContainer}>
          <Animated.Image
            source={{ uri: hydratedProvider.coverImage ?? FALLBACK_COVER }}
            style={[
              styles.heroImage,
              {
                transform: [
                  {
                    scale: scrollY.interpolate({
                      inputRange: [-200, 0, 200],
                      outputRange: [1.6, 1, 1],
                      extrapolate: 'clamp',
                    }),
                  },
                  {
                    translateY: scrollY.interpolate({
                      inputRange: [-200, 0, 200],
                      outputRange: [-100, 0, 50],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.heroOverlay} />
          <View style={[styles.topNav, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
              <Feather name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.navRight}>
              <TouchableOpacity style={styles.navBtn}>
                <Feather name="share-2" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => requireAuth('favorite', () => toggleFavorite(hydratedProvider.id))}
              >
                <Feather name="heart" size={18} color={isFavorited ? palette.gold : '#fff'} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.galDots}>
            <View style={styles.galDotActive} />
            <View style={styles.galDot} />
            <View style={styles.galDot} />
          </View>
        </View>

        <View style={styles.coreInfo}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <Feather name="loader" size={18} color={palette.gold} />
              <Text style={styles.loadingText}>Loading provider details...</Text>
            </View>
          ) : null}

          {hydratedProvider.isVerified && (
            <View style={styles.verifiedBadge}>
              <Feather name="check-circle" size={12} color={palette.gold} />
              <Text style={styles.verifiedText}>Verified Premium</Text>
            </View>
          )}
          <Text style={styles.providerName}>{hydratedProvider.name}</Text>
          <Text style={styles.providerCat}>{hydratedProvider.category}</Text>

          <View style={styles.metaRow}>
            <View style={styles.ratingRow}>
              <Feather name="star" size={14} color={palette.gold} />
              <Text style={styles.rating}>{hydratedProvider.rating}</Text>
              <Text style={styles.reviewCount}>({hydratedProvider.reviewCount} reviews)</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={12} color={palette.gold} />
              <Text style={styles.locationText} numberOfLines={2}>
                {hydratedProvider.location} · {distanceLabel}
              </Text>
            </View>
          </View>

          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.contactAction}
              onPress={handleCall}
            >
              <View style={styles.contactActionIcon}>
                <Feather name="phone" size={18} color={palette.gold} />
              </View>
              <Text style={styles.contactActionLabel}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactAction}
              onPress={handleWhatsApp}
            >
              <View style={[styles.contactActionIcon, styles.contactActionWhatsapp]}>
                <Feather name="message-circle" size={18} color="#25D366" />
              </View>
              <Text style={styles.contactActionLabel}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactAction}
              onPress={handleDirections}
            >
              <View style={[styles.contactActionIcon, styles.contactActionMap]}>
                <Feather name="navigation" size={18} color={palette.gold} />
              </View>
              <Text style={styles.contactActionLabel}>Directions</Text>
            </TouchableOpacity>
          </View>

          {(hydratedProvider.instagram || hydratedProvider.facebook) ? (
            <View style={styles.socialRow}>
              {hydratedProvider.instagram ? (
                <TouchableOpacity style={styles.socialAction} onPress={handleInstagram} activeOpacity={0.85}>
                  <Feather name="instagram" size={16} color={palette.gold} />
                  <Text style={styles.socialActionLabel}>Instagram</Text>
                </TouchableOpacity>
              ) : null}
              {hydratedProvider.facebook ? (
                <TouchableOpacity style={styles.socialAction} onPress={handleFacebook} activeOpacity={0.85}>
                  <Feather name="facebook" size={16} color={palette.gold} />
                  <Text style={styles.socialActionLabel}>Facebook</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <View style={styles.hoursCard}>
            <View style={styles.hoursIcon}>
              <Feather name="clock" size={14} color={palette.gold} />
            </View>
            <View style={styles.hoursText}>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursOpen}>{hydratedProvider.isOpen ? 'Open now' : 'Closed'}</Text>
                <View
                  style={[
                    styles.hoursBadge,
                    {
                      backgroundColor: hydratedProvider.isOpen
                        ? 'rgba(212,175,55,0.1)'
                        : 'rgba(107,114,128,0.1)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.hoursBadgeText,
                      { color: hydratedProvider.isOpen ? palette.gold : palette.textMuted },
                    ]}
                  >
                    Closes {hydratedProvider.closeTime}
                  </Text>
                </View>
              </View>
              <Text style={styles.hoursDays}>
                {hydratedProvider.workDays}, {hydratedProvider.openTime} - {hydratedProvider.closeTime}
              </Text>
            </View>
            <Feather name="chevron-down" size={16} color={palette.textMuted} />
          </View>
        </View>

        <View style={styles.servicesSection}>
          <View style={styles.padH}>
            <Text style={styles.sectionTitle}>Service Menu</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
            {serviceCategories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => {
                  setSelectedCategory(category);
                  setSelectedServiceId(null);
                }}
                style={[styles.servicePill, selectedCategory === category && styles.servicePillActive]}
              >
                <Text
                  style={[
                    styles.servicePillText,
                    selectedCategory === category && styles.servicePillTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.padH}>
            {visibleServices.map((service) => {
              const isSelected = selectedServiceId === service.id;
              return (
                <TouchableOpacity
                  key={service.id}
                  onPress={() => setSelectedServiceId(isSelected ? null : service.id)}
                  style={[styles.serviceItem, isSelected && styles.serviceItemSelected]}
                  activeOpacity={0.85}
                >
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDuration}>
                      {service.duration} mins · {service.description}
                    </Text>
                    <Text style={[styles.servicePrice, { color: isSelected ? palette.gold : palette.textPrimary }]}>
                      Ksh {service.price.toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedServiceId(isSelected ? null : service.id)}
                    style={[styles.serviceSelectBtn, isSelected && styles.serviceSelectBtnActive]}
                  >
                    {isSelected ? (
                      <Feather name="check" size={14} color={palette.bg} />
                    ) : (
                      <Feather name="plus" size={14} color={palette.gold} />
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {hydratedProvider.galleryImages && hydratedProvider.galleryImages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Portfolio</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galScroll}>
              {hydratedProvider.galleryImages.map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={styles.galImage} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.section, styles.padH]}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapPlaceholder}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop' }}
              style={styles.mapBg}
            />
            <View style={styles.mapOverlay} />
            <View style={styles.mapPin}>
              <View style={styles.mapPinOuter}>
                <View style={styles.mapPinInner} />
              </View>
            </View>
          </View>
          <View style={styles.addressCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.addressName}>{hydratedProvider.address.split(',')[0]}</Text>
              <Text style={styles.addressSub}>
                {hydratedProvider.address.split(',').slice(1).join(',').trim()}
              </Text>
            </View>
            <View style={styles.addressBtns}>
              <TouchableOpacity style={styles.addressBtn} onPress={handleCall}>
                <Feather name="phone" size={16} color={palette.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addressBtn, styles.addressBtnGold]}
                onPress={handleDirections}
              >
                <Feather name="navigation" size={16} color={palette.gold} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.section, { marginBottom: 110 }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={14} color={palette.gold} />
              <Text style={styles.rating}>{hydratedProvider.rating}</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galScroll}>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
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
                    <View style={styles.reviewRating}>
                      <Feather name="star" size={10} color={palette.gold} />
                      <Text style={styles.reviewRatingText}>{review.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewComment} numberOfLines={3}>
                    "{review.comment}"
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.reviewCard}>
                <Text style={styles.reviewComment}>No reviews yet for this provider.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Animated.ScrollView>

      <View style={[styles.bookingFooter, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={styles.bookingLabel}>{selectedService ? 'Selected service' : 'Choose a service'}</Text>
          <Text style={styles.bookingPrice}>
            {selectedService ? `Ksh ${selectedService.price.toLocaleString()}` : '—'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, !selectedService && styles.bookBtnDisabled]}
          onPress={handleBook}
          activeOpacity={0.85}
          disabled={!selectedService}
        >
          <Text style={styles.bookBtnText}>{isLoggedIn ? 'Book visit' : 'Sign in to book'}</Text>
          <Feather name="arrow-right" size={16} color={palette.bg} />
        </TouchableOpacity>
      </View>
      <FeedbackModalHost modal={modal} onDismiss={hideModal} />
    </View>
  );
}

function createProviderDetailsStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
  solidHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  solidHeaderBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidHeaderTitle: {
    color: p.textPrimary,
    fontFamily: Fonts.serifMedium,
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
  },
  container: { flex: 1, backgroundColor: p.bg },
  scroll: { paddingBottom: 20 },
  heroContainer: { height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(26,26,26,0.3)' },
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26,26,26,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  navRight: { flexDirection: 'row', gap: 12 },
  galDots: { position: 'absolute', bottom: 16, right: 20, flexDirection: 'row', gap: 6 },
  galDotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: p.gold },
  galDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  coreInfo: { paddingHorizontal: 24, paddingTop: 20, marginBottom: 24 },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  loadingText: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 12 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: p.card,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: p.goldBorder,
    marginBottom: 12,
  },
  verifiedText: {
    color: p.gold,
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerName: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    color: p.textPrimary,
    marginBottom: 4,
    lineHeight: 34,
  },
  providerCat: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 14, marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14 },
  reviewCount: { color: p.textMuted, fontSize: 12, textDecorationLine: 'underline' },
  separator: { width: 4, height: 4, borderRadius: 2, backgroundColor: p.border },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  locationText: { color: p.textSecondary, fontSize: 14, flexShrink: 1 },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  contactAction: { alignItems: 'center', gap: 6, flex: 1 },
  contactActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: p.goldDim,
    borderWidth: 1,
    borderColor: p.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactActionWhatsapp: {
    backgroundColor: 'rgba(37,211,102,0.1)',
    borderColor: 'rgba(37,211,102,0.3)',
  },
  contactActionMap: {},
  contactActionLabel: { color: p.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 11 },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  socialAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: p.card,
    borderWidth: 1,
    borderColor: p.goldBorder,
  },
  socialActionLabel: {
    color: p.gold,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
  },
  hoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: p.card,
    borderRadius: Radius.lg,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: p.borderLight,
  },
  hoursIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: p.cardInner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursText: { flex: 1 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  hoursOpen: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14 },
  hoursBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  hoursBadgeText: { fontSize: 11, fontFamily: Fonts.sansMedium },
  hoursDays: { color: p.textMuted, fontSize: 12 },
  servicesSection: { marginBottom: 32 },
  padH: { paddingHorizontal: 24 },
  sectionTitle: {
    fontFamily: Fonts.serifMedium,
    fontSize: 20,
    color: p.textPrimary,
    marginBottom: 16,
  },
  pillsScroll: { paddingHorizontal: 24, gap: 10, marginBottom: 16 },
  servicePill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: p.card,
    borderWidth: 1,
    borderColor: p.border,
  },
  servicePillActive: {
    backgroundColor: p.gold,
    shadowColor: p.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  servicePillText: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 12 },
  servicePillTextActive: { color: p.bg, fontWeight: '700' },
  serviceItem: {
    backgroundColor: p.card,
    borderRadius: Radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: p.border,
    overflow: 'hidden',
    position: 'relative',
  },
  serviceItemSelected: {
    borderColor: p.gold,
    backgroundColor: p.card,
  },
  serviceInfo: { flex: 1, marginRight: 12 },
  serviceName: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14, marginBottom: 4 },
  serviceDuration: { color: p.textSecondary, fontSize: 12, marginBottom: 6 },
  servicePrice: { fontFamily: Fonts.sansMedium, fontSize: 14 },
  serviceSelectBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: p.bg,
    borderWidth: 1,
    borderColor: p.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceSelectBtnActive: { backgroundColor: p.gold, borderColor: p.gold },
  section: { marginBottom: 32 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  seeAll: { color: p.gold, fontFamily: Fonts.sansMedium, fontSize: 12 },
  galScroll: { paddingHorizontal: 24, gap: 12 },
  galImage: { width: 128, height: 128, borderRadius: Radius.lg, resizeMode: 'cover' },
  mapPlaceholder: {
    height: 140,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  mapBg: { width: '100%', height: '100%', resizeMode: 'cover', opacity: 0.3 },
  mapOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(26,26,26,0.3)' },
  mapPin: { position: 'absolute', top: '50%', left: '50%', marginTop: -24, marginLeft: -24 },
  mapPinOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212,175,55,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: p.gold,
    borderWidth: 2,
    borderColor: p.bg,
  },
  addressCard: {
    backgroundColor: p.card,
    borderRadius: Radius.lg,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: p.borderLight,
    gap: 12,
  },
  addressName: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14, marginBottom: 4 },
  addressSub: { color: p.textSecondary, fontSize: 12 },
  addressBtns: { flexDirection: 'row', gap: 8 },
  addressBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: p.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: p.borderMedium,
  },
  addressBtnGold: { borderColor: p.goldBorder },
  reviewCard: {
    width: 280,
    backgroundColor: p.card,
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: p.borderLight,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reviewUser: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20 },
  reviewAvatarPlaceholder: {
    backgroundColor: p.cardInner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarLetter: { color: p.textPrimary, fontFamily: Fonts.serifMedium, fontSize: 16 },
  reviewName: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14 },
  reviewMeta: { color: p.textMuted, fontSize: 10, marginTop: 2 },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: p.cardInner,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reviewRatingText: { color: p.textPrimary, fontFamily: Fonts.sansBold, fontSize: 12 },
  reviewComment: { color: p.textSecondary, fontSize: 13, lineHeight: 20 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: { color: p.textPrimary, fontFamily: Fonts.serifMedium, fontSize: 22 },
  emptyText: { color: p.textSecondary, fontSize: 14, textAlign: 'center' },
  bookingFooter: {
    backgroundColor: p.card,
    borderTopWidth: 1,
    borderTopColor: p.border,
    paddingTop: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...s.soft,
  },
  bookingLabel: {
    color: p.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bookingPrice: { color: p.textPrimary, fontFamily: Fonts.serifMedium, fontSize: 22 },
  bookBtn: {
    backgroundColor: p.gold,
    borderRadius: Radius.md,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...s.gold,
  },
  bookBtnDisabled: { opacity: 0.4 },
  bookBtnText: { color: p.bg, fontFamily: Fonts.sansBold, fontSize: 14, fontWeight: '700' },
  });
}

