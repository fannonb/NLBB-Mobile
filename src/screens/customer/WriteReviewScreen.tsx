import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import FeedbackModalHost from '../../components/FeedbackModalHost';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
import { useModalManager } from '../../hooks/useModalManager';
import { reviewsApi } from '../../lib/api/reviews';

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

function createWriteReviewStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    closeBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: p.card, alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
      flex: 1, textAlign: 'center',
      fontFamily: Fonts.serifMedium, fontSize: 18, color: p.textPrimary,
    },
    scroll: { padding: 24, flex: 1 },
    providerCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: p.card, borderRadius: Radius.lg, padding: 16,
      borderWidth: 1, borderColor: p.border, marginBottom: 28, ...s.soft,
    },
    providerImg: { width: 52, height: 52, borderRadius: 26, resizeMode: 'cover' },
    providerImgPlaceholder: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: p.goldDim, alignItems: 'center', justifyContent: 'center',
    },
    providerName: { color: p.textPrimary, fontFamily: Fonts.serifMedium, fontSize: 16 },
    serviceName: { color: p.textSecondary, fontSize: 13, marginTop: 2 },
    sectionLabel: {
      color: p.textMuted, fontFamily: Fonts.sansMedium, fontSize: 12,
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14,
    },
    starsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    starBtn: { padding: 4 },
    ratingLabel: {
      color: p.gold, fontFamily: Fonts.sansBold, fontSize: 16,
      textAlign: 'center', letterSpacing: 0.3,
    },
    commentBox: {
      backgroundColor: p.card, borderRadius: Radius.lg, borderWidth: 1,
      borderColor: p.border, padding: 14, minHeight: 120,
    },
    commentInput: { color: p.textPrimary, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 22, flex: 1 },
    charCount: { color: p.textMuted, fontSize: 11, textAlign: 'right', marginTop: 8 },
    submitBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      backgroundColor: p.gold, borderRadius: Radius.lg, paddingVertical: 16,
      marginTop: 24, ...s.gold,
    },
    submitBtnDisabled: { opacity: 0.45 },
    submitBtnText: { color: p.bg, fontFamily: Fonts.sansBold, fontSize: 16 },
    privacyNote: {
      color: p.textMuted, fontSize: 12, textAlign: 'center',
      lineHeight: 18, marginTop: 12,
    },
    successWrap: {
      flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
    },
    successCircle: {
      width: 88, height: 88, borderRadius: 44, backgroundColor: p.gold,
      alignItems: 'center', justifyContent: 'center', marginBottom: 24, ...s.gold,
    },
    successTitle: { fontFamily: Fonts.serifMedium, fontSize: 28, color: p.textPrimary, marginBottom: 10 },
    successSub: { color: p.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    doneBtn: {
      backgroundColor: p.gold, borderRadius: Radius.lg, paddingVertical: 14,
      paddingHorizontal: 40, ...s.gold,
    },
    doneBtnText: { color: p.bg, fontFamily: Fonts.sansBold, fontSize: 16 },
  });
}

export default function WriteReviewScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createWriteReviewStyles(palette, shadow), [palette, shadow]);
  const { providerId, providerName, providerImage, serviceName, bookingId } = route.params ?? {};

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { modal, showError, showInfo, hideModal } = useModalManager();

  const displayRating = hovered || rating;

  const handleSubmit = async () => {
    if (rating === 0) {
      return;
    }
    if (!providerId || !bookingId) {
      showError('Missing Details', 'Provider or booking details are missing. Please try again from My Bookings.');
      return;
    }
    if (comment.trim().length < 2) {
      showInfo('Add a Short Comment', 'Please write at least 2 characters about your experience.');
      return;
    }

    setLoading(true);
    try {
      await reviewsApi.createReview({
        providerId,
        bookingId,
        serviceName,
        rating,
        comment: comment.trim(),
      });
      setSubmitted(true);
    } catch (error: any) {
      showError('Could Not Submit Review', error?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.successWrap}>
          <View style={styles.successCircle}>
            <Feather name="star" size={36} color={palette.bg} />
          </View>
          <Text style={styles.successTitle}>Thank you!</Text>
          <Text style={styles.successSub}>
            Your review helps other customers discover great providers.
          </Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'CustomerApp' }] })}
          >
            <Text style={styles.doneBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Feather name="x" size={20} color={palette.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write a Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAwareScrollView contentContainerStyle={styles.scroll} bottomPadding={32}>
        <View style={styles.providerCard}>
          {providerImage ? (
            <Image source={{ uri: providerImage }} style={styles.providerImg} />
          ) : (
            <View style={styles.providerImgPlaceholder}>
              <Feather name="scissors" size={20} color={palette.gold} />
            </View>
          )}
          <View>
            <Text style={styles.providerName}>{providerName}</Text>
            <Text style={styles.serviceName}>{serviceName}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Your Rating</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => { setRating(star); setHovered(0); }}
              onPressIn={() => setHovered(star)}
              onPressOut={() => setHovered(0)}
              activeOpacity={0.8}
              style={styles.starBtn}
            >
              <Feather
                name="star"
                size={40}
                color={star <= displayRating ? palette.gold : palette.border}
              />
            </TouchableOpacity>
          ))}
        </View>
        {displayRating > 0 && (
          <Text style={styles.ratingLabel}>{STAR_LABELS[displayRating]}</Text>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Your Experience</Text>
        <View style={styles.commentBox}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Tell others about your experience. What did you like? Was the service worth it?"
            placeholderTextColor={palette.textMuted}
            style={styles.commentInput}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, (rating === 0 || loading) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0 || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={palette.bg} />
          ) : (
            <>
              <Feather name="send" size={16} color={palette.bg} />
              <Text style={styles.submitBtnText}>Submit Review</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.privacyNote}>
          Reviews are public and tied to your account. Be honest and respectful.
        </Text>
      </KeyboardAwareScrollView>
      <FeedbackModalHost modal={modal} onDismiss={hideModal} />
    </View>
  );
}
