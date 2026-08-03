import { Provider, Review } from '../types';
import { coalesceImageUri, isValidImageUri, resolveImageUrl } from './config';

type AvatarRecord = {
  avatar?: string | null;
};

type BookingImageRecord = {
  providerImage?: string | null;
  customerAvatar?: string | null;
};

const normalizeImageList = (images?: Array<string | null | undefined>) =>
  (images ?? [])
    .map((image) => resolveImageUrl(image))
    .filter((image): image is string => isValidImageUri(image));

const normalizeAvatarValue = (avatar: string | null | undefined) => {
  const resolved = resolveImageUrl(avatar);
  return isValidImageUri(resolved) ? resolved : undefined;
};

const normalizeImageValue = (value: string | null | undefined) => {
  const resolved = resolveImageUrl(value);
  return isValidImageUri(resolved) ? resolved : undefined;
};

export const normalizeProviderMedia = (provider: Provider): Provider => ({
  ...provider,
  avatar: normalizeAvatarValue(provider.avatar),
  coverImage: coalesceImageUri(provider.coverImage),
  images: normalizeImageList(provider.images),
  galleryImages: normalizeImageList(provider.galleryImages),
});

export const normalizeReviewMedia = (review: Review): Review => ({
  ...review,
  userAvatar: normalizeAvatarValue(review.userAvatar) ?? undefined,
});

export const normalizeAvatarRecord = <T extends AvatarRecord>(record: T): T => ({
  ...record,
  avatar: normalizeAvatarValue(record.avatar) as T['avatar'],
});

export const normalizeBookingImageRecord = <T extends BookingImageRecord>(record: T): T => ({
  ...record,
  providerImage: normalizeImageValue(record.providerImage) as T['providerImage'],
  customerAvatar: normalizeImageValue(record.customerAvatar) as T['customerAvatar'],
});
