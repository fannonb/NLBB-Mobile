/** "4.8 (12)" for reviewed providers, "New" for providers without reviews (instead of "0 (0)"). */
export const formatRatingSummary = (rating: number, reviewCount: number) =>
  reviewCount > 0 ? `${rating} (${reviewCount})` : 'New';

export const formatReviewCount = (reviewCount: number) =>
  reviewCount === 1 ? '1 review' : `${reviewCount} reviews`;
