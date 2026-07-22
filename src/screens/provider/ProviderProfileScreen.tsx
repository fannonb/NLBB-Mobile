import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_SERVICE_CATEGORY_NAMES } from '../../constants/serviceCategories';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import { resolveImageUrl } from '../../lib/config';
import {
  getSocialDisplayValue,
  normalizeFacebookLink,
  normalizeInstagramLink,
  normalizeSocialLink,
  SocialPlatform,
} from '../../lib/socialLinks';
import InputFocusWrap from '../../components/InputFocusWrap';
import ProviderLocationPicker, { PickedProviderLocation } from '../../components/ProviderLocationPicker';
import ProviderNotifButton from '../../components/ProviderNotifButton';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
import { useAuthStore } from '../../store/authStore';
import { useAppStore, ProviderProfile, WorkingHours } from '../../store/appStore';
import Toast from '../../components/Toast';
import ChangePasswordModal, { ChangePasswordResult } from '../../components/ChangePasswordModal';
import FeedbackModalHost from '../../components/FeedbackModalHost';
import ActionSheetModal, { ActionSheetOption } from '../../components/ActionSheetModal';
import { useModalManager } from '../../hooks/useModalManager';
import { Category, Provider } from '../../types';
import { isApiClientError } from '../../lib/api/client';
import { providerManagementApi, ProviderProfilePayload } from '../../lib/api/providerManagement';
import { authApi } from '../../lib/api/auth';
import { providerApi } from '../../lib/api/providers';
import { openExternalUrl } from '../../lib/contactActions';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop';
const DEFAULT_WORKING_HOURS: WorkingHours[] = [
  { day: 'Monday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Tuesday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Wednesday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Thursday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Friday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Saturday', isOpen: true, openTime: '10:00 AM', closeTime: '6:00 PM' },
  { day: 'Sunday', isOpen: false, openTime: '10:00 AM', closeTime: '4:00 PM' },
];
type ProfileSection = 'basics' | 'media' | 'hours' | 'social';

const PROFILE_SECTIONS: { key: ProfileSection; label: string }[] = [
  { key: 'basics', label: 'Basics' },
  { key: 'media', label: 'Media' },
  { key: 'hours', label: 'Hours' },
  { key: 'social', label: 'Social' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ProfileGap = { section: ProfileSection; label: string };

const collectProfileGaps = (
  form: ProviderProfile,
  selectedCategories: string[],
  ownerName: string,
  accountEmail: string
): ProfileGap[] => {
  const gaps: ProfileGap[] = [];
  if (!form.businessName.trim()) gaps.push({ section: 'basics', label: 'Business name' });
  if (selectedCategories.length === 0) gaps.push({ section: 'basics', label: 'Category' });
  if (!form.location.trim()) gaps.push({ section: 'basics', label: 'Location' });
  if (form.description.trim().length < 10) gaps.push({ section: 'basics', label: 'Description (10+ chars)' });
  if (!form.phone.trim()) gaps.push({ section: 'basics', label: 'Phone number' });
  if (!ownerName.trim()) gaps.push({ section: 'social', label: 'Owner name' });
  if (!accountEmail.trim() || !EMAIL_RE.test(accountEmail.trim())) {
    gaps.push({ section: 'social', label: 'Account email' });
  }
  return gaps;
};
const EMPTY_PROVIDER_PROFILE: ProviderProfile = {
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

const resolveImageUri = (value: string | null | undefined, fallback: string) =>
  resolveImageUrl(value, fallback);

const hasImageUri = (value: string | null | undefined) => Boolean(value?.trim());

const sanitizeGalleryImages = (images: string[] | undefined) =>
  (images ?? []).filter((image) => image?.trim().length > 0);

const parseCategoryList = (value: string | null | undefined) =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const serializeCategoryList = (categories: string[]) =>
  categories.map((item) => item.trim()).filter(Boolean).join(', ');

const toggleCategorySelection = (categories: string[], category: string) =>
  categories.includes(category)
    ? categories.filter((item) => item !== category)
    : [...categories, category];

const getInitials = (...values: Array<string | null | undefined>) => {
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

const pickPreferredString = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

const getValidationMessage = (error: unknown) => {
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

const toStoreProfile = (provider: Provider): ProviderProfile => ({
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

const toPickedLocation = (provider: Provider | null): PickedProviderLocation | null => {
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

const ensureProfileMedia = (profile: ProviderProfile): ProviderProfile => ({
  ...profile,
  coverImage: resolveImageUri(profile.coverImage, DEFAULT_COVER),
  avatar: profile.avatar?.trim() ?? '',
  galleryImages: sanitizeGalleryImages(profile.galleryImages),
});

const hydrateProfileAvatar = (
  profile: ProviderProfile,
  ...avatarCandidates: Array<string | null | undefined>
): ProviderProfile => ({
  ...profile,
  avatar: pickPreferredString(profile.avatar, ...avatarCandidates),
});

const buildFreshImageUri = (uri: string | null | undefined, version?: string | null) => {
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

const deriveWorkDays = (hours: WorkingHours[]) => {
  const openDays = hours.filter((day) => day.isOpen).map((day) => day.day.slice(0, 3));
  if (openDays.length === 0) {
    return 'Mon - Sun';
  }
  return `${openDays[0]} - ${openDays[openDays.length - 1]}`;
};

const getDefaultTimesForDay = (dayName: string) =>
  DEFAULT_WORKING_HOURS.find((day) => day.day.toLowerCase() === dayName.toLowerCase()) ?? DEFAULT_WORKING_HOURS[0];

const normalizeWorkingHoursForSave = (hours: WorkingHours[]) =>
  hours.map((day) => {
    const defaults = getDefaultTimesForDay(day.day);
    return {
      ...day,
      openTime: day.openTime.trim() || defaults.openTime,
      closeTime: day.closeTime.trim() || defaults.closeTime,
    };
  });

const cloneHours = (hours: WorkingHours[]) => hours.map((day) => ({ ...day }));

type MediaTarget = 'cover' | 'avatar' | 'gallery';
type MediaSource = 'camera' | 'gallery';

export default function ProviderProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createProfileStyles(palette, shadow), [palette, shadow]);
  const fStyles = useMemo(() => fieldStyles(palette), [palette]);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const refreshCurrentUser = useAuthStore((s) => s.refreshCurrentUser);
  const updateProviderProfile = useAppStore((s) => s.updateProviderProfile);
  const updateWorkingHours = useAppStore((s) => s.updateWorkingHours);

  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<ProfileSection>('basics');
  const [form, setForm] = useState<ProviderProfile>(EMPTY_PROVIDER_PROFILE);
  const [hours, setHours] = useState<WorkingHours[]>(cloneHours(DEFAULT_WORKING_HOURS));
  const [lastSavedForm, setLastSavedForm] = useState<ProviderProfile>(EMPTY_PROVIDER_PROFILE);
  const [lastSavedHours, setLastSavedHours] = useState<WorkingHours[]>(cloneHours(DEFAULT_WORKING_HOURS));
  const [backendProfile, setBackendProfile] = useState<Provider | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<PickedProviderLocation | null>(null);
  const [lastSavedSelectedLocation, setLastSavedSelectedLocation] = useState<PickedProviderLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [lastSavedOwnerName, setLastSavedOwnerName] = useState('');
  const [lastSavedAccountEmail, setLastSavedAccountEmail] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const { modal, showSuccess, showError, showInfo, showActionSheet, hideModal } = useModalManager();

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const [provider, me, categoryResult] = await Promise.all([
          providerManagementApi.getMyProfile(),
          authApi.getMe().catch(() => null),
          providerApi.listCategories().catch(() => []),
        ]);
        if (!active) return;

        const nextForm = hydrateProfileAvatar(
          ensureProfileMedia(toStoreProfile(provider)),
          provider.avatar,
          me?.avatar,
          user?.avatar
        );
        const nextHours = nextForm.workingHours.length > 0 ? nextForm.workingHours : DEFAULT_WORKING_HOURS;

        setForm({ ...nextForm, workingHours: nextHours });
        setHours(cloneHours(nextHours));
        setLastSavedForm({ ...nextForm, workingHours: nextHours });
        setLastSavedHours(cloneHours(nextHours));
        setBackendProfile(provider);
        const nextSelectedLocation = toPickedLocation(provider);
        setSelectedLocation(nextSelectedLocation);
        setLastSavedSelectedLocation(nextSelectedLocation);
        const nextOwnerName = me?.name ?? user?.name ?? '';
        const nextAccountEmail = me?.email ?? user?.email ?? '';
        setOwnerName(nextOwnerName);
        setAccountEmail(nextAccountEmail);
        setLastSavedOwnerName(nextOwnerName);
        setLastSavedAccountEmail(nextAccountEmail);
        setCategories(categoryResult);

        updateProviderProfile({ ...nextForm, workingHours: nextHours });
        updateWorkingHours(cloneHours(nextHours));
      } catch {
        if (!active) return;

        setBackendProfile(null);
        setForm(EMPTY_PROVIDER_PROFILE);
        setHours(cloneHours(DEFAULT_WORKING_HOURS));
        setLastSavedForm(EMPTY_PROVIDER_PROFILE);
        setLastSavedHours(cloneHours(DEFAULT_WORKING_HOURS));
        const fallbackOwner = user?.name ?? '';
        const fallbackEmail = user?.email ?? '';
        setOwnerName(fallbackOwner);
        setAccountEmail(fallbackEmail);
        setLastSavedOwnerName(fallbackOwner);
        setLastSavedAccountEmail(fallbackEmail);
        setSelectedLocation(null);
        setLastSavedSelectedLocation(null);
        setCategories([]);
        setToast({
          visible: true,
          message: 'Could not load profile from backend. You can still edit and save.',
          type: 'error',
        });
      } finally {
        if (active) {
          setLoading(false);
          setProfileReady(true);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [updateProviderProfile, updateWorkingHours, user?.email, user?.name]);

  const categoryOptions = useMemo(() => {
    const source = [...DEFAULT_SERVICE_CATEGORY_NAMES, ...categories.map((category) => category.name)];
    const options = source.filter((value, index) => source.indexOf(value) === index);

    for (const selected of parseCategoryList(form.category)) {
      if (!options.includes(selected)) {
        options.unshift(selected);
      }
    }

    return options;
  }, [categories, form.category]);

  const selectedCategories = useMemo(() => parseCategoryList(form.category), [form.category]);

  const handleOpenSocial = async (platform: SocialPlatform, value: string) => {
    const url = normalizeSocialLink(platform, value);
    if (!url) {
      showInfo('No Link Added', `No ${platform} link has been added yet.`);
      return;
    }

    const opened = await openExternalUrl(url);
    if (!opened) {
      showError('Unable to Open', `This ${platform} link is not supported on your device.`);
    }
  };

  const profileGaps = useMemo(() => {
    if (!profileReady) {
      return [] as ProfileGap[];
    }
    return collectProfileGaps(form, selectedCategories, ownerName, accountEmail);
  }, [profileReady, form, selectedCategories, ownerName, accountEmail]);

  const incompleteSections = useMemo(
    () => new Set(profileGaps.map((gap) => gap.section)),
    [profileGaps]
  );

  const hasUnsavedChanges = useMemo(() => {
    if (ownerName !== lastSavedOwnerName || accountEmail !== lastSavedAccountEmail) {
      return true;
    }
    if (form.businessName !== lastSavedForm.businessName) return true;
    if (form.description !== lastSavedForm.description) return true;
    if (form.phone !== lastSavedForm.phone) return true;
    if (form.whatsapp !== lastSavedForm.whatsapp) return true;
    if (form.instagram !== lastSavedForm.instagram) return true;
    if (form.facebook !== lastSavedForm.facebook) return true;
    if (form.location !== lastSavedForm.location) return true;
    if (form.category !== lastSavedForm.category) return true;
    if (form.coverImage !== lastSavedForm.coverImage) return true;
    if (form.avatar !== lastSavedForm.avatar) return true;
    if (form.mpesaPhone !== lastSavedForm.mpesaPhone) return true;
    if (form.galleryImages.length !== lastSavedForm.galleryImages.length) return true;
    if (form.galleryImages.some((uri, index) => uri !== lastSavedForm.galleryImages[index])) return true;
    if (hours.length !== lastSavedHours.length) return true;
    if (
      hours.some((day, index) => {
        const saved = lastSavedHours[index];
        return (
          !saved ||
          day.day !== saved.day ||
          day.isOpen !== saved.isOpen ||
          day.openTime !== saved.openTime ||
          day.closeTime !== saved.closeTime
        );
      })
    ) {
      return true;
    }
    const locLabel = selectedLocation?.label ?? '';
    const savedLocLabel = lastSavedSelectedLocation?.label ?? '';
    const locLat = selectedLocation?.coordinates?.lat;
    const savedLocLat = lastSavedSelectedLocation?.coordinates?.lat;
    const locLng = selectedLocation?.coordinates?.lng;
    const savedLocLng = lastSavedSelectedLocation?.coordinates?.lng;
    return locLabel !== savedLocLabel || locLat !== savedLocLat || locLng !== savedLocLng;
  }, [
    form,
    lastSavedForm,
    hours,
    lastSavedHours,
    ownerName,
    lastSavedOwnerName,
    accountEmail,
    lastSavedAccountEmail,
    selectedLocation,
    lastSavedSelectedLocation,
  ]);

  const handleSave = async () => {
    // Exit edit mode quietly when nothing changed — don't force filling every field.
    if (!hasUnsavedChanges) {
      setIsEditing(false);
      return;
    }

    const gaps = collectProfileGaps(form, selectedCategories, ownerName, accountEmail);
    if (gaps.length > 0) {
      setActiveSection(gaps[0].section);
      setToast({
        visible: true,
        message: `Complete: ${gaps.map((gap) => gap.label).join(', ')}.`,
        type: 'error',
      });
      return;
    }
    const normalizedLocationValue = form.location.trim().toLowerCase();
    const pinnedLocation =
      selectedLocation && selectedLocation.label.trim().toLowerCase() === normalizedLocationValue
        ? selectedLocation
        : null;
    const isSameAsBackendLocation =
      normalizedLocationValue.length > 0 &&
      normalizedLocationValue === (backendProfile?.location ?? '').trim().toLowerCase();
    const existingLocationLabel = pickPreferredString(backendProfile?.location, form.location);
    const existingLocationAddress = pickPreferredString(backendProfile?.address, backendProfile?.location, form.location);
    const canReuseBackendLocation = isSameAsBackendLocation && !!existingLocationLabel;
    const resolvedLocationLabel = pinnedLocation?.label ?? (canReuseBackendLocation ? existingLocationLabel : '');
    const resolvedLocationAddress = pinnedLocation?.address ?? (canReuseBackendLocation ? existingLocationAddress : '');
    const resolvedCoordinates = pinnedLocation?.coordinates ?? (canReuseBackendLocation ? backendProfile?.coordinates : undefined);

    if (!resolvedLocationLabel || !resolvedLocationAddress) {
      setToast({
        visible: true,
        message: 'Pick a suggested location, resolve the typed place, or use your current location before saving a new location.',
        type: 'error',
      });
      return;
    }

    const normalizedHours = normalizeWorkingHoursForSave(hours);
    const firstOpenDay = normalizedHours.find((day) => day.isOpen);
    const derivedWorkDays = deriveWorkDays(normalizedHours);
    const payload: ProviderProfilePayload = {
      name: form.businessName.trim(),
      category: selectedCategories[0],
      categories: selectedCategories,
      description: form.description.trim(),
      location: resolvedLocationLabel,
      address: resolvedLocationAddress,
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim() || form.phone.trim(),
      openTime: pickPreferredString(firstOpenDay?.openTime, backendProfile?.openTime, '9:00 AM'),
      closeTime: pickPreferredString(firstOpenDay?.closeTime, backendProfile?.closeTime, '8:00 PM'),
      workDays: pickPreferredString(derivedWorkDays, backendProfile?.workDays, 'Closed'),
      priceFrom: backendProfile?.priceFrom ?? 0,
      coordinates: resolvedCoordinates,
      coverImage: resolveImageUri(form.coverImage, DEFAULT_COVER),
      avatar: form.avatar.trim() || undefined,
      images: sanitizeGalleryImages(form.galleryImages),
      galleryImages: sanitizeGalleryImages(form.galleryImages),
      workingHours: normalizedHours,
      instagram: normalizeInstagramLink(form.instagram) || undefined,
      facebook: normalizeFacebookLink(form.facebook) || undefined,
      mpesaPhone: form.mpesaPhone.trim() || form.phone.trim(),
    };

    try {
      setSaving(true);
      const saved = await providerManagementApi.saveMyProfile(payload);

      let updatedUser: Awaited<ReturnType<typeof authApi.upsertProfile>> | null = null;
      let accountSyncError: string | null = null;
      try {
        updatedUser = await authApi.upsertProfile({
          name: ownerName.trim(),
          email: accountEmail.trim().toLowerCase(),
          phone: form.phone.trim(),
          role: 'provider',
          location: resolvedLocationLabel || undefined,
          avatar: form.avatar.trim() || undefined,
        });
        await refreshCurrentUser({ force: true });
      } catch (error: any) {
        accountSyncError = error?.message ?? 'Account details could not be saved.';
      }

      const nextForm = hydrateProfileAvatar(
        ensureProfileMedia(toStoreProfile(saved)),
        saved.avatar,
        form.avatar,
        updatedUser?.avatar,
        user?.avatar
      );
      const nextHours = nextForm.workingHours.length > 0 ? nextForm.workingHours : hours;
      const nextSelectedLocation = toPickedLocation(saved);

      setForm({ ...nextForm, workingHours: nextHours });
      setHours(cloneHours(nextHours));
      setLastSavedForm({ ...nextForm, workingHours: nextHours });
      setLastSavedHours(cloneHours(nextHours));
      setBackendProfile(saved);
      setSelectedLocation(nextSelectedLocation);
      setLastSavedSelectedLocation(nextSelectedLocation);
      if (updatedUser) {
        setOwnerName(updatedUser.name);
        setAccountEmail(updatedUser.email ?? accountEmail.trim().toLowerCase());
        setLastSavedOwnerName(updatedUser.name);
        setLastSavedAccountEmail(updatedUser.email ?? accountEmail.trim().toLowerCase());
      }

      updateProviderProfile({ ...nextForm, workingHours: nextHours });
      updateWorkingHours(cloneHours(nextHours));

      setIsEditing(false);
      setToast({
        visible: true,
        message: accountSyncError ?? 'Profile updated successfully.',
        type: accountSyncError ? 'info' : 'success',
      });
    } catch (error: unknown) {
      showError('Could Not Save Profile', getValidationMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(lastSavedForm);
    setHours(cloneHours(lastSavedHours));
    setSelectedLocation(lastSavedSelectedLocation);
    setOwnerName(lastSavedOwnerName);
    setAccountEmail(lastSavedAccountEmail);
    setIsEditing(false);
  };

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<ChangePasswordResult> => {
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      if (isApiClientError(error) && (error.code === 'INVALID_CREDENTIALS' || error.status === 401)) {
        return {
          success: false,
          field: 'currentPassword',
          errorMessage: 'Current password is incorrect',
        };
      }

      return {
        success: false,
        errorMessage:
          isApiClientError(error) ? error.message : error instanceof Error ? error.message : 'Failed to change password',
      };
    }
  };

  const toggleDay = (idx: number) => {
    const updated = [...hours];
    updated[idx] = { ...updated[idx], isOpen: !updated[idx].isOpen };
    setHours(updated);
  };

  const updateDayTime = (idx: number, key: 'openTime' | 'closeTime', value: string) => {
    setHours((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [key]: value };
      return updated;
    });
  };

  const ensureMediaPermission = async (source: MediaSource) => {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setToast({
          visible: true,
          message: 'Camera permission is required to take photos.',
          type: 'error',
        });
        return false;
      }
      return true;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setToast({
        visible: true,
        message: 'Gallery permission is required to select photos.',
        type: 'error',
      });
      return false;
    }
    return true;
  };

  const uploadPickedImage = async (target: MediaTarget, source: MediaSource) => {
    const allowed = await ensureMediaPermission(source);
    if (!allowed) return;

    const pickerOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: target !== 'gallery',
      quality: 0.75,
      base64: true,
      ...(target === 'avatar' ? { aspect: [1, 1] as [number, number] } : {}),
      ...(target === 'cover' ? { aspect: [16, 9] as [number, number] } : {}),
    };

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      setToast({
        visible: true,
        message: 'Could not process selected image. Please try another image.',
        type: 'error',
      });
      return;
    }

    const mimeType =
      asset.mimeType && asset.mimeType.startsWith('image/')
        ? asset.mimeType
        : asset.uri.toLowerCase().endsWith('.png')
          ? 'image/png'
          : 'image/jpeg';

    setUploadingMedia(true);
    try {
      const dataUri = `data:${mimeType};base64,${asset.base64}`;
      const uploadedUrl = await providerManagementApi.uploadMyMedia({ kind: target, dataUri });

      if (target === 'cover') {
        setForm((prev) => ({ ...prev, coverImage: uploadedUrl }));
      } else if (target === 'avatar') {
        setForm((prev) => ({ ...prev, avatar: uploadedUrl }));
      } else {
        setForm((prev) => ({ ...prev, galleryImages: [...prev.galleryImages, uploadedUrl] }));
      }

      setToast({ visible: true, message: 'Image selected. Tap Save to persist changes.', type: 'success' });
    } catch (error: any) {
      setToast({
        visible: true,
        message: error?.message ?? 'Image upload failed. Please try again.',
        type: 'error',
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  const openMediaPicker = (target: MediaTarget) => {
    if (!isEditing) return;
    const options: ActionSheetOption[] = [
      {
        id: 'camera',
        label: 'Take Photo',
        icon: 'camera',
        onPress: () => {
          void uploadPickedImage(target, 'camera');
        },
      },
      {
        id: 'gallery',
        label: 'Choose from Gallery',
        icon: 'image',
        onPress: () => {
          void uploadPickedImage(target, 'gallery');
        },
      },
    ];
    showActionSheet('Update Image', options);
  };

  const f = (key: keyof typeof form) => ({
    value: String(form[key] ?? ''),
    onChangeText: (v: string) => setForm((p) => ({ ...p, [key]: v })),
    style: styles.input,
    placeholderTextColor: palette.textMuted,
    editable: isEditing,
  });

  const showSection = (section: ProfileSection) => !isEditing || activeSection === section;
  const avatarInitials = getInitials(form.businessName, ownerName, user?.name);
  const resolvedAvatarUri = pickPreferredString(form.avatar, backendProfile?.avatar, user?.avatar);
  const avatarImageUri = buildFreshImageUri(
    resolvedAvatarUri,
    backendProfile?.updatedAt ?? user?.id ?? null
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast((t) => ({ ...t, visible: false }))} />

      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.heading}>Business Profile</Text>
          {isEditing ? (
            <Text style={styles.editingHint}>
              {hasUnsavedChanges ? 'Unsaved changes' : 'No changes yet — Cancel anytime'}
            </Text>
          ) : null}
        </View>
        {isEditing ? (
          <TouchableOpacity onPress={handleCancel} style={styles.cancelEditBtn} disabled={saving || uploadingMedia}>
            <Text style={styles.cancelEditText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerActions}>
            <ProviderNotifButton />
            <TouchableOpacity
              onPress={() => {
                setIsEditing(true);
                setActiveSection(profileGaps[0]?.section ?? 'basics');
              }}
              style={styles.editBtn}
            >
              <Feather name="edit-2" size={16} color={palette.gold} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isEditing ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sectionTabsContainer}
          contentContainerStyle={styles.sectionTabs}
        >
          {PROFILE_SECTIONS.map((section) => {
            const incomplete = incompleteSections.has(section.key);
            const active = activeSection === section.key;
            return (
              <TouchableOpacity
                key={section.key}
                onPress={() => setActiveSection(section.key)}
                style={[
                  styles.sectionTab,
                  active && styles.sectionTabActive,
                  incomplete && styles.sectionTabIncomplete,
                ]}
              >
                <Text
                  style={[
                    styles.sectionTabText,
                    active && styles.sectionTabTextActive,
                    incomplete && styles.sectionTabTextIncomplete,
                  ]}
                >
                  {section.label}
                </Text>
                {incomplete ? <View style={styles.sectionTabDot} /> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={palette.gold} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      )}
      {uploadingMedia && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={palette.gold} />
          <Text style={styles.loadingText}>Uploading image...</Text>
        </View>
      )}

      <KeyboardAwareScrollView
        style={styles.mainScroll}
        contentContainerStyle={[styles.scroll, isEditing && { paddingBottom: 120 }]}
        bottomPadding={40}
      >
        {profileReady && !isEditing && profileGaps.length > 0 ? (
          <TouchableOpacity
            style={styles.completenessCard}
            onPress={() => {
              setIsEditing(true);
              setActiveSection(profileGaps[0].section);
            }}
            activeOpacity={0.85}
          >
            <View style={styles.completenessIcon}>
              <Feather name="alert-circle" size={18} color={palette.warning} />
            </View>
            <View style={styles.completenessBody}>
              <Text style={styles.completenessTitle}>
                {profileGaps.length} detail{profileGaps.length === 1 ? '' : 's'} still needed
              </Text>
              <Text style={styles.completenessText}>
                Missing: {profileGaps.map((gap) => gap.label).join(', ')}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={palette.textMuted} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.coverWrap}>
          <Image source={{ uri: resolveImageUri(form.coverImage, DEFAULT_COVER) }} style={styles.cover} />
          {isEditing && (
            <TouchableOpacity style={styles.changeCoverBtn} onPress={() => openMediaPicker('cover')} disabled={uploadingMedia}>
              <Feather name="camera" size={16} color="#fff" />
              <Text style={styles.changeCoverText}>Change Cover</Text>
            </TouchableOpacity>
          )}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrap}>
              {hasImageUri(avatarImageUri) ? (
                <Image key={avatarImageUri} source={{ uri: avatarImageUri }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>{avatarInitials}</Text>
                </View>
              )}
            </View>
            {isEditing && (
              <TouchableOpacity style={styles.changeAvatarBtn} onPress={() => openMediaPicker('avatar')} disabled={uploadingMedia}>
                <Feather name="camera" size={12} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {showSection('basics') ? (
            <>
          <Text style={styles.groupLabel}>Business Info</Text>
          <View style={styles.card}>
            <FieldRow label="Business Name" fStyles={fStyles} palette={palette} isLocked={isEditing}>
              <TextInput
                value={form.businessName}
                style={[styles.input, styles.inputReadOnly]}
                placeholder="Business name"
                placeholderTextColor={palette.textMuted}
                editable={false}
              />
            </FieldRow>
            <Text style={styles.lockedFieldNote}>Business name is locked after registration.</Text>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>Categories</Text>
              <View style={styles.categoryGrid}>
                {categoryOptions.map((category) => {
                  const isActive = selectedCategories.includes(category);
                  return (
                    <TouchableOpacity
                      key={category}
                      onPress={() =>
                        isEditing &&
                        setForm((prev) => ({
                          ...prev,
                          category: serializeCategoryList(toggleCategorySelection(parseCategoryList(prev.category), category)),
                        }))
                      }
                      style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                      disabled={!isEditing}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={[styles.locationPickerWrap, isEditing && { paddingBottom: 16 }]}>
              {isEditing ? (
                <ProviderLocationPicker
                  label="Location"
                  value={form.location}
                  selectedLocation={selectedLocation}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, location: value }))}
                  onLocationSelected={setSelectedLocation}
                  placeholder="Search estate, area, or exact business location"
                />
              ) : (
                <FieldRow label="Location" noBorder fStyles={fStyles} palette={palette}>
                  <Text style={styles.dayHours}>{form.location || 'No location set'}</Text>
                </FieldRow>
              )}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Description{isEditing ? ' *' : ''}
                {isEditing && form.description.trim().length < 10 ? (
                  <Text style={styles.fieldHintBad}> · add at least 10 characters</Text>
                ) : null}
              </Text>
              <TextInput
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholder="Tell customers about your business..."
                {...f('description')}
                style={[
                  styles.input,
                  styles.textArea,
                  isEditing ? styles.inputEditableArea : styles.inputReadOnly,
                  isEditing && form.description.trim().length < 10 && styles.inputNeedsAttention,
                ]}
              />
            </View>
          </View>

          <Text style={styles.groupLabel}>Customer Contact{isEditing ? ' *' : ''}</Text>
          <View style={styles.card}>
            <FieldRow
              label="Phone"
              icon="phone"
              fStyles={fStyles}
              palette={palette}
              isEditable={isEditing}
            >
              <TextInput
                placeholder="+254 712 345 678"
                keyboardType="phone-pad"
                {...f('phone')}
                style={[
                  styles.input,
                  isEditing && !form.phone.trim() ? styles.inputNeedsAttention : null,
                ]}
              />
            </FieldRow>
            <FieldRow
              label="WhatsApp"
              icon="message-circle"
              noBorder
              fStyles={fStyles}
              palette={palette}
              isEditable={isEditing}
            >
              <TextInput
                placeholder="Defaults to phone if empty"
                keyboardType="phone-pad"
                {...f('whatsapp')}
              />
            </FieldRow>
          </View>
            </>
          ) : null}

          {showSection('hours') ? (
            <>
              <Text style={styles.groupLabel}>Working Hours</Text>
              <View style={styles.card}>
                {hours.map((day, idx) => (
                  <View key={day.day} style={[styles.dayRow, idx === hours.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={styles.dayName}>{day.day}</Text>
                    {isEditing ? (
                      <View style={styles.dayEdit}>
                        <Switch
                          value={day.isOpen}
                          onValueChange={() => toggleDay(idx)}
                          trackColor={{ false: palette.border, true: palette.goldBorder }}
                          thumbColor={day.isOpen ? palette.gold : palette.textMuted}
                        />
                        {day.isOpen ? (
                          <View style={styles.timeInputs}>
                            <TextInput
                              value={day.openTime}
                              onChangeText={(value) => updateDayTime(idx, 'openTime', value)}
                              style={styles.timeInput}
                              placeholder="9:00 AM"
                              placeholderTextColor={palette.textMuted}
                              editable={isEditing}
                            />
                            <Text style={styles.dayHours}>-</Text>
                            <TextInput
                              value={day.closeTime}
                              onChangeText={(value) => updateDayTime(idx, 'closeTime', value)}
                              style={styles.timeInput}
                              placeholder="8:00 PM"
                              placeholderTextColor={palette.textMuted}
                              editable={isEditing}
                            />
                          </View>
                        ) : (
                          <Text style={[styles.dayHours, { color: palette.textMuted }]}>Closed</Text>
                        )}
                      </View>
                    ) : (
                      <Text style={[styles.dayHours, !day.isOpen && { color: palette.textMuted }]}>
                        {day.isOpen ? `${day.openTime} - ${day.closeTime}` : 'Closed'}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {showSection('media') ? (
            <>
              <Text style={styles.groupLabel}>Portfolio Gallery</Text>
              <View style={styles.gallery}>
                {sanitizeGalleryImages(form.galleryImages).map((uri, i) => (
                  <View key={i} style={styles.galleryImgWrap}>
                    <Image source={{ uri: resolveImageUrl(uri) }} style={styles.galleryImg} />
                    {isEditing && (
                      <TouchableOpacity
                        style={styles.removeImgBtn}
                        onPress={() => setForm((p) => ({
                          ...p,
                          galleryImages: p.galleryImages.filter((_, idx) => idx !== i),
                        }))}
                      >
                        <Feather name="x" size={12} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {isEditing && (
                  <TouchableOpacity style={styles.addImgBtn} onPress={() => openMediaPicker('gallery')} disabled={uploadingMedia}>
                    <Feather name="plus" size={22} color={palette.gold} />
                    <Text style={styles.addImgText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : null}

          {showSection('social') ? (
            <>
              <Text style={styles.groupLabel}>Social Links</Text>
              <View style={styles.card}>
                <FieldRow label="Instagram" icon="instagram" fStyles={fStyles} palette={palette} isEditable={isEditing}>
                  {isEditing ? (
                    <TextInput placeholder="https://instagram.com/yourbusiness" autoCapitalize="none" {...f('instagram')} />
                  ) : form.instagram ? (
                    <TouchableOpacity onPress={() => void handleOpenSocial('instagram', form.instagram)} activeOpacity={0.8}>
                      <Text style={styles.linkText}>{getSocialDisplayValue('instagram', form.instagram)}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.dayHours}>No Instagram link</Text>
                  )}
                </FieldRow>
                <FieldRow label="Facebook" icon="facebook" noBorder fStyles={fStyles} palette={palette} isEditable={isEditing}>
                  {isEditing ? (
                    <TextInput placeholder="https://facebook.com/yourpage" autoCapitalize="none" {...f('facebook')} />
                  ) : form.facebook ? (
                    <TouchableOpacity onPress={() => void handleOpenSocial('facebook', form.facebook)} activeOpacity={0.8}>
                      <Text style={styles.linkText}>{getSocialDisplayValue('facebook', form.facebook)}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.dayHours}>No Facebook link</Text>
                  )}
                </FieldRow>
              </View>

              <Text style={styles.groupLabel}>Account</Text>
              <View style={styles.card}>
                <FieldRow label="Owner Name" fStyles={fStyles} palette={palette} isEditable={isEditing}>
                  <TextInput
                    placeholder="Full name"
                    value={ownerName}
                    onChangeText={setOwnerName}
                    style={styles.input}
                    placeholderTextColor={palette.textMuted}
                    editable={isEditing}
                  />
                </FieldRow>
                <FieldRow label="Email" icon="mail" fStyles={fStyles} palette={palette} isEditable={isEditing}>
                  <TextInput
                    placeholder="business@email.com"
                    value={accountEmail}
                    onChangeText={setAccountEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    placeholderTextColor={palette.textMuted}
                    editable={isEditing}
                  />
                </FieldRow>
                <FieldRow label="Phone" icon="phone" noBorder fStyles={fStyles} palette={palette} isLocked={isEditing}>
                  <Text style={styles.dayHours}>{form.phone || 'No phone set'}</Text>
                </FieldRow>
              </View>

              {!isEditing ? (
                <TouchableOpacity
                  style={styles.settingsBtn}
                  onPress={() => setChangePasswordVisible(true)}
                  activeOpacity={0.85}
                >
                  <Feather name="shield" size={18} color={palette.gold} />
                  <View style={styles.settingsBtnContent}>
                    <Text style={styles.settingsBtnLabel}>Change Password</Text>
                    <Text style={styles.settingsBtnSub}>Update your password to keep your provider account secure</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={palette.textMuted} />
                </TouchableOpacity>
              ) : null}
            </>
          ) : null}



          {!isEditing ? (
            <TouchableOpacity
              onPress={async () => {
                await logout();
                navigation.replace('Login', { role: 'provider' });
              }}
              style={styles.logoutBtn}
            >
              <Feather name="log-out" size={18} color={palette.error} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardAwareScrollView>

      {isEditing ? (
        <View style={[styles.editFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.footerCancelBtn}
            disabled={saving || uploadingMedia}
          >
            <Text style={styles.footerCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.footerSaveBtn, !hasUnsavedChanges && styles.footerSaveBtnMuted]}
            disabled={saving || uploadingMedia}
          >
            {saving ? (
              <ActivityIndicator size="small" color={palette.bg} />
            ) : (
              <Feather name={hasUnsavedChanges ? 'check' : 'check-circle'} size={16} color={palette.bg} />
            )}
            <Text style={styles.footerSaveText}>
              {hasUnsavedChanges ? 'Save Changes' : 'Done'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ChangePasswordModal
        visible={changePasswordVisible}
        onDismiss={() => setChangePasswordVisible(false)}
        onChangePassword={handleChangePassword}
        onSuccess={showSuccess}
        onError={showError}
      />

      <FeedbackModalHost modal={modal} onDismiss={hideModal} />

      <ActionSheetModal
        visible={modal.visible && modal.type === 'actionSheet'}
        title={modal.title}
        options={modal.data ?? []}
        onDismiss={hideModal}
      />
    </View>
  );
}

function FieldRow({
  label, children, icon, noBorder, fStyles, palette, isLocked, isEditable,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ComponentProps<typeof Feather>['name'];
  noBorder?: boolean;
  fStyles: any;
  palette: ColorPalette;
  isLocked?: boolean;
  isEditable?: boolean;
}) {
  const valueStyle = [
    fStyles.valueWrap,
    isEditable && {
      backgroundColor: palette.cardInner,
      borderColor: palette.border,
      borderWidth: 1,
      borderRadius: Radius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginVertical: -4,
    },
    isLocked && {
      opacity: 0.65,
    },
  ];

  return (
    <View style={[fStyles.row, noBorder && { borderBottomWidth: 0 }]}>
      <Text style={fStyles.label}>{label}</Text>
      {isEditable ? (
        <InputFocusWrap style={valueStyle}>
          {icon ? <Feather name={icon} size={13} color={palette.textMuted} style={{ marginRight: 6 }} /> : null}
          {children}
          <Feather name="edit-2" size={12} color={palette.gold} style={{ marginLeft: 8 }} />
        </InputFocusWrap>
      ) : (
        <View style={valueStyle}>
          {icon ? <Feather name={icon} size={13} color={palette.textMuted} style={{ marginRight: 6 }} /> : null}
          {children}
          {isLocked ? (
            <Feather name="lock" size={12} color={palette.textMuted} style={{ marginLeft: 8 }} />
          ) : null}
        </View>
      )}
    </View>
  );
}

const fieldStyles = (p: ColorPalette) => StyleSheet.create({
  row: {
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.border,
  },
  label: { color: p.textMuted, fontSize: 11, fontFamily: Fonts.sansMedium, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  valueWrap: { flexDirection: 'row', alignItems: 'center' },
});

const createProfileStyles = (p: ColorPalette, s: ShadowPalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: p.bg },
  mainScroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 12,
  },
  headerTitleWrap: { flex: 1, paddingRight: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  editingHint: {
    color: p.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 11,
    marginTop: 2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  loadingText: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 13 },
  heading: { fontFamily: Fonts.serifMedium, fontSize: 22, color: p.textPrimary },
  completenessCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(212,132,26,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,132,26,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completenessIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: p.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completenessBody: { flex: 1 },
  completenessTitle: {
    color: p.textPrimary,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    marginBottom: 2,
  },
  completenessText: {
    color: p.textSecondary,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  sectionTabsContainer: {
    height: 42,
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 12,
  },
  sectionTabs: {
    paddingHorizontal: 24,
    gap: 8,
    alignItems: 'center',
  },
  sectionTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: p.cardInner,
    borderWidth: 1,
    borderColor: p.border,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTabActive: {
    backgroundColor: p.goldDim,
    borderColor: p.goldBorder,
  },
  sectionTabIncomplete: {
    borderColor: 'rgba(212,132,26,0.55)',
  },
  sectionTabText: {
    color: p.textSecondary,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
  },
  sectionTabTextActive: {
    color: p.gold,
    fontFamily: Fonts.sansBold,
  },
  sectionTabTextIncomplete: {
    color: p.warning,
  },
  sectionTabDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: p.warning,
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.md, borderWidth: 1, borderColor: p.goldBorder,
  },
  editBtnText: { color: p.gold, fontFamily: Fonts.sansMedium, fontSize: 13 },
  cancelEditBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.md, borderWidth: 1, borderColor: p.border,
  },
  cancelEditText: { color: p.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 13 },
  editFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: p.bg,
    borderTopWidth: 1,
    borderTopColor: p.border,
  },
  footerCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: p.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: p.card,
  },
  footerCancelText: {
    color: p.textSecondary,
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
  },
  footerSaveBtn: {
    flex: 1.4,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: p.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...s.gold,
  },
  footerSaveBtnMuted: {
    opacity: 0.85,
  },
  footerSaveText: {
    color: p.bg,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
  },
  fieldHintBad: {
    color: p.warning,
    fontFamily: Fonts.sans,
    fontSize: 11,
    textTransform: 'none',
    letterSpacing: 0,
  },
  inputNeedsAttention: {
    borderWidth: 1,
    borderColor: 'rgba(212,132,26,0.65)',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(212,132,26,0.06)',
  },
  scroll: { paddingBottom: 40 },
  coverWrap: { height: 180, position: 'relative', marginBottom: 36 },
  cover: { width: '100%', height: '100%', resizeMode: 'cover' },
  changeCoverBtn: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  changeCoverText: { color: '#fff', fontFamily: Fonts.sansMedium, fontSize: 13 },
  avatarContainer: {
    position: 'absolute',
    bottom: -28,
    left: 24,
    width: 60,
    height: 60,
    zIndex: 2,
    elevation: 4,
  },
  avatarWrap: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    borderWidth: 3,
    borderColor: p.bg,
    overflow: 'hidden',
    backgroundColor: p.cardInner,
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 30, resizeMode: 'cover' },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: p.goldDim,
  },
  avatarFallbackText: {
    color: p.gold,
    fontFamily: Fonts.serifMedium,
    fontSize: 18,
  },
  changeAvatarBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: p.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: p.bg,
    ...s.gold,
  },
  content: { paddingHorizontal: 24 },
  section: { marginBottom: 24 },
  groupLabel: {
    color: p.textMuted, fontFamily: Fonts.sansMedium, fontSize: 11,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, marginTop: 20,
  },
  card: {
    backgroundColor: p.card, borderRadius: Radius.lg, paddingHorizontal: 16,
    borderWidth: 1, borderColor: p.border, marginBottom: 16,
  },
  categoryRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: p.border,
  },
  categoryLabel: {
    color: p.textMuted,
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: p.cardInner,
    borderWidth: 1,
    borderColor: p.border,
  },
  categoryChipActive: {
    backgroundColor: p.goldDim,
    borderColor: p.goldBorder,
  },
  categoryChipText: {
    color: p.textSecondary,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
  },
  categoryChipTextActive: {
    color: p.gold,
  },
  lockedFieldNote: {
    color: p.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    paddingBottom: 12,
  },
  locationPickerWrap: {
    paddingTop: 12,
  },
  field: { paddingVertical: 12 },
  fieldLabel: { color: p.textMuted, fontSize: 11, fontFamily: Fonts.sansMedium, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  input: {
    color: p.textPrimary,
    fontFamily: Fonts.sans,
    fontSize: 14,
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  linkText: {
    color: p.gold,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  inputReadOnly: { color: p.textSecondary },
  inputEditableArea: {
    backgroundColor: p.cardInner,
    borderColor: p.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  textArea: { minHeight: 64, lineHeight: 22 },
  dayRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.border,
  },
  dayName: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14, width: 90 },
  dayHours: { color: p.textSecondary, fontSize: 13 },
  dayEdit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeInputs: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeInput: {
    minWidth: 82,
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: p.textPrimary,
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  galleryImgWrap: { width: 100, height: 100, borderRadius: Radius.md, overflow: 'hidden', position: 'relative' },
  galleryImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeImgBtn: {
    position: 'absolute', top: 4, right: 4, width: 20, height: 20,
    borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  addImgBtn: {
    width: 100, height: 100, borderRadius: Radius.md, backgroundColor: p.card,
    borderWidth: 1, borderColor: p.goldBorder, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addImgText: { color: p.gold, fontSize: 11, fontFamily: Fonts.sansMedium },
  settingsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: p.card, borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: p.border, marginBottom: 12, ...s.soft,
  },
  settingsBtnContent: { flex: 1 },
  settingsBtnLabel: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14, marginBottom: 2 },
  settingsBtnSub: { color: p.textSecondary, fontSize: 12 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: p.card, borderRadius: Radius.lg, paddingVertical: 16,
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)', marginTop: 4, marginBottom: 32, ...s.soft,
  },
  logoutText: { color: p.error, fontFamily: Fonts.sansMedium, fontSize: 14 },
});
