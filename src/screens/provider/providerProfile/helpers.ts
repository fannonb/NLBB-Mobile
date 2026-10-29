import { WorkingHours, ProviderProfile } from '../../../store/appStore';
import { Provider } from '../../../types';
import { isApiClientError } from '../../../lib/api/client';
import { resolveImageUrl } from '../../../lib/config';
import { normalizeFacebookLink, normalizeInstagramLink } from '../../../lib/socialLinks';
import { parseBookingTimeSlot } from '../../../lib/bookingFlowUtils';
import { ImageSource } from '../../../lib/imagePicker';
import { PickedProviderLocation } from '../../../components/ProviderLocationPicker';

/* Constants and pure helpers for ProviderProfileScreen. */
export const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop';
export const DEFAULT_WORKING_HOURS: WorkingHours[] = [
  { day: 'Monday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Tuesday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Wednesday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Thursday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Friday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Saturday', isOpen: true, openTime: '10:00 AM', closeTime: '6:00 PM' },
  { day: 'Sunday', isOpen: false, openTime: '10:00 AM', closeTime: '4:00 PM' },
];
// Matches the backend limit (MAX_GALLERY_IMAGES in backend/src/utils/mediaUrl.ts).
export const MAX_GALLERY_IMAGES = 12;

export type ProfileSection = 'basics' | 'media' | 'hours' | 'social' | 'account';

export const PROFILE_SECTIONS: { key: ProfileSection; label: string }[] = [
  { key: 'basics', label: 'Basics' },
  { key: 'media', label: 'Media' },
  { key: 'hours', label: 'Hours' },
  { key: 'social', label: 'Social' },
  { key: 'account', label: 'Account' },
];

// 30-minute steps from 5:00 AM to 11:30 PM, in the "h:mm AM" format bookings parse.
export const TIME_OPTIONS = Array.from({ length: 38 }, (_, index) => {
  const totalMinutes = 5 * 60 + index * 30;
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${hours24 >= 12 ? 'PM' : 'AM'}`;
});

export const toMinutesOfDay = (value: string) => {
  const parsed = parseBookingTimeSlot(value);
  return parsed ? parsed.hours * 60 + parsed.minutes : null;
};

export const findInvalidHoursDay = (hours: WorkingHours[]) =>
  hours.find((day) => {
    if (!day.isOpen) return false;
    const open = toMinutesOfDay(day.openTime);
    const close = toMinutesOfDay(day.closeTime);
    return open === null || close === null || close <= open;
  });

export type ProfileGap = { section: ProfileSection; label: string };

export const collectProfileGaps = (
  form: ProviderProfile,
  selectedCategories: string[],
  ownerName: string,
  hours: WorkingHours[]
): ProfileGap[] => {
  const gaps: ProfileGap[] = [];
  if (!form.businessName.trim()) gaps.push({ section: 'basics', label: 'Business name' });
  if (selectedCategories.length === 0) gaps.push({ section: 'basics', label: 'Category' });
  if (!form.location.trim()) gaps.push({ section: 'basics', label: 'Location' });
  if (form.description.trim().length < 10) gaps.push({ section: 'basics', label: 'Description (10+ chars)' });
  if (!form.phone.trim()) gaps.push({ section: 'basics', label: 'Phone number' });
  const invalidDay = findInvalidHoursDay(hours);
  if (invalidDay) gaps.push({ section: 'hours', label: `${invalidDay.day} hours (closing must be after opening)` });
  if (!ownerName.trim()) gaps.push({ section: 'account', label: 'Owner name' });
  return gaps;
};
export const EMPTY_PROVIDER_PROFILE: ProviderProfile = {
  businessName: '',
  description: '',
  phone: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
  location: '',
  category: '',
  coverImage: DEFAULT_COVER,
  avatar: '',
  workingHours: DEFAULT_WORKING_HOURS,
  galleryImages: [],
  mpesaPhone: '',
  isOpen: true,
};

export const resolveImageUri = (value: string | null | undefined, fallback: string) =>
  resolveImageUrl(value, fallback);

export const hasImageUri = (value: string | null | undefined) => Boolean(value?.trim());

export const sanitizeGalleryImages = (images: string[] | undefined) =>
  (images ?? []).filter((image) => image?.trim().length > 0);

export const parseCategoryList = (value: string | null | undefined) =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const serializeCategoryList = (categories: string[]) =>
  categories.map((item) => item.trim()).filter(Boolean).join(', ');

export const toggleCategorySelection = (categories: string[], category: string) =>
  categories.includes(category)
    ? categories.filter((item) => item !== category)
    : [...categories, category];

export const getInitials = (...values: Array<string | null | undefined>) => {
  const source = values.find((value) => value?.trim())?.trim();
  if (!source) {
    return 'SP';
  }
  const parts = source.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const pickPreferredString = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

export const getValidationMessage = (error: unknown) => {
  if (!isApiClientError(error)) {
    return error instanceof Error ? error.message : 'Please try again.';
  }

  if (error.code !== 'VALIDATION_ERROR' || !error.details || typeof error.details !== 'object') {
    return error.message;
  }

  const details = error.details as {
    fieldErrors?: Record<string, string[] | undefined>;
    formErrors?: string[];
  };
  const fieldMessage = Object.values(details.fieldErrors ?? {}).find(
    (messages) => Array.isArray(messages) && messages.length > 0
  )?.[0];

  return fieldMessage ?? details.formErrors?.[0] ?? error.message;
};

export const toStoreProfile = (provider: Provider): ProviderProfile => ({
  businessName: provider.name,
  description: provider.description,
  phone: provider.phone ?? '',
  whatsapp: provider.whatsapp ?? provider.phone ?? '',
  instagram: normalizeInstagramLink(provider.instagram),
  facebook: normalizeFacebookLink(provider.facebook),
  location: provider.location,
  category: provider.category,
  coverImage: resolveImageUri(provider.coverImage, DEFAULT_COVER),
  avatar: provider.avatar?.trim() ?? '',
  workingHours: provider.workingHours ?? [],
  galleryImages: sanitizeGalleryImages(provider.galleryImages ?? provider.images),
  mpesaPhone: provider.mpesaPhone ?? provider.phone ?? '',
  isOpen: provider.isOpen ?? true,
});

export const toPickedLocation = (provider: Provider | null): PickedProviderLocation | null => {
  if (!provider?.coordinates) {
    return null;
  }

  const label = pickPreferredString(provider.location, provider.address);
  const address = pickPreferredString(provider.address, provider.location);

  if (!label) {
    return null;
  }

  return {
    label,
    address: address || label,
    coordinates: provider.coordinates,
    source: 'geocode',
  };
};

export const ensureProfileMedia = (profile: ProviderProfile): ProviderProfile => ({
  ...profile,
  coverImage: resolveImageUri(profile.coverImage, DEFAULT_COVER),
  avatar: profile.avatar?.trim() ?? '',
  galleryImages: sanitizeGalleryImages(profile.galleryImages),
});

export const hydrateProfileAvatar = (
  profile: ProviderProfile,
  ...avatarCandidates: Array<string | null | undefined>
): ProviderProfile => ({
  ...profile,
  avatar: pickPreferredString(profile.avatar, ...avatarCandidates),
});

export const buildFreshImageUri = (uri: string | null | undefined, version?: string | null) => {
  const resolved = resolveImageUrl(uri);
  if (!resolved) {
    return '';
  }
  const token = (version ?? '').trim();
  if (!token) {
    return resolved;
  }
  return `${resolved}${resolved.includes('?') ? '&' : '?'}v=${encodeURIComponent(token)}`;
};

export const deriveWorkDays = (hours: WorkingHours[]) => {
  const openDays = hours.filter((day) => day.isOpen).map((day) => day.day.slice(0, 3));
  if (openDays.length === 0) {
    return 'Mon - Sun';
  }
  return `${openDays[0]} - ${openDays[openDays.length - 1]}`;
};

export const getDefaultTimesForDay = (dayName: string) =>
  DEFAULT_WORKING_HOURS.find((day) => day.day.toLowerCase() === dayName.toLowerCase()) ?? DEFAULT_WORKING_HOURS[0];

export const normalizeWorkingHoursForSave = (hours: WorkingHours[]) =>
  hours.map((day) => {
    const defaults = getDefaultTimesForDay(day.day);
    return {
      ...day,
      openTime: day.openTime.trim() || defaults.openTime,
      closeTime: day.closeTime.trim() || defaults.closeTime,
    };
  });

export const cloneHours = (hours: WorkingHours[]) => hours.map((day) => ({ ...day }));

export type MediaTarget = 'cover' | 'avatar' | 'gallery';
export type MediaSource = ImageSource;
