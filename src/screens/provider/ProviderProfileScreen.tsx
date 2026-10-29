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
import { ImageSource, pickImageAsDataUri } from '../../lib/imagePicker';
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
import ChangePasswordModal from '../../components/ChangePasswordModal';
import ConfirmModal from '../../components/ConfirmModal';
import AccountSettingsSection from '../../components/AccountSettingsSection';
import { submitPasswordChange } from '../../lib/changePassword';
import { parseBookingTimeSlot } from '../../lib/bookingFlowUtils';
import FeedbackModalHost from '../../components/FeedbackModalHost';
import LegalLinksSection from '../../components/LegalLinksSection';
import AccountDangerZone from '../../components/AccountDangerZone';
import DeleteAccountModal from '../../components/DeleteAccountModal';
import ActionSheetModal, { ActionSheetOption } from '../../components/ActionSheetModal';
import { useModalManager } from '../../hooks/useModalManager';
import { Category, Provider } from '../../types';
import { isApiClientError } from '../../lib/api/client';
import { providerManagementApi, ProviderProfilePayload } from '../../lib/api/providerManagement';
import { authApi } from '../../lib/api/auth';
import { providerApi } from '../../lib/api/providers';
import { openExternalUrl } from '../../lib/contactActions';
import FieldRow from './providerProfile/FieldRow';
import { createProfileStyles, fieldStyles } from './providerProfile/styles';
import {
  DEFAULT_COVER,
  DEFAULT_WORKING_HOURS,
  MAX_GALLERY_IMAGES,
  ProfileSection,
  PROFILE_SECTIONS,
  TIME_OPTIONS,
  toMinutesOfDay,
  findInvalidHoursDay,
  ProfileGap,
  collectProfileGaps,
  EMPTY_PROVIDER_PROFILE,
  resolveImageUri,
  hasImageUri,
  sanitizeGalleryImages,
  parseCategoryList,
  serializeCategoryList,
  toggleCategorySelection,
  getInitials,
  pickPreferredString,
  getValidationMessage,
  toStoreProfile,
  toPickedLocation,
  ensureProfileMedia,
  hydrateProfileAvatar,
  buildFreshImageUri,
  deriveWorkDays,
  getDefaultTimesForDay,
  normalizeWorkingHoursForSave,
  cloneHours,
  MediaTarget,
  MediaSource,
} from './providerProfile/helpers';

export default function ProviderProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createProfileStyles(palette, shadow), [palette, shadow]);
  const fStyles = useMemo(() => fieldStyles(palette), [palette]);
  const logout = useAuthStore((s) => s.logout);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
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
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [ownerName, setOwnerName] = useState('');
  // Login email is read-only in the app (it lives in Supabase Auth).
  const [accountEmail, setAccountEmail] = useState('');
  const [lastSavedOwnerName, setLastSavedOwnerName] = useState('');
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
        setOwnerName(nextOwnerName);
        setAccountEmail(me?.email ?? user?.email ?? '');
        setLastSavedOwnerName(nextOwnerName);
        setCategories(categoryResult);

        updateProviderProfile({ ...nextForm, workingHours: nextHours });
        updateWorkingHours(cloneHours(nextHours));
        setLoadError(false);
      } catch {
        if (!active) return;

        // Don't fall back to an empty editable form: the business name is locked, so it
        // could never be saved. Show a retry state instead.
        setBackendProfile(null);
        setIsEditing(false);
        setLoadError(true);
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
  }, [updateProviderProfile, updateWorkingHours, user?.email, user?.name, reloadKey]);

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
    if (!profileReady || loadError) {
      return [] as ProfileGap[];
    }
    return collectProfileGaps(form, selectedCategories, ownerName, hours);
  }, [profileReady, loadError, form, selectedCategories, ownerName, hours]);

  const incompleteSections = useMemo(
    () => new Set(profileGaps.map((gap) => gap.section)),
    [profileGaps]
  );

  const hasUnsavedChanges = useMemo(() => {
    if (ownerName !== lastSavedOwnerName) {
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
    selectedLocation,
    lastSavedSelectedLocation,
  ]);

  const handleSave = async () => {
    // Exit edit mode quietly when nothing changed — don't force filling every field.
    if (!hasUnsavedChanges) {
      setIsEditing(false);
      return;
    }

    const gaps = collectProfileGaps(form, selectedCategories, ownerName, hours);
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
      ownerName: ownerName.trim(),
    };

    try {
      setSaving(true);
      const saved = await providerManagementApi.saveMyProfile(payload);

      // The profile save also updates the owner's account (name, phone, avatar) server-side.
      await refreshCurrentUser({ force: true });
      const updatedUser = useAuthStore.getState().user;

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
      const savedOwnerName = updatedUser?.name ?? ownerName.trim();
      setOwnerName(savedOwnerName);
      setAccountEmail(updatedUser?.email ?? accountEmail);
      setLastSavedOwnerName(savedOwnerName);

      updateProviderProfile({ ...nextForm, workingHours: nextHours });
      updateWorkingHours(cloneHours(nextHours));

      setIsEditing(false);
      setToast({ visible: true, message: 'Profile updated successfully.', type: 'success' });
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
    setIsEditing(false);
  };

  const openTimePicker = (idx: number, key: 'openTime' | 'closeTime') => {
    const current = hours[idx]?.[key];
    const options: ActionSheetOption[] = TIME_OPTIONS.map((time) => ({
      id: time,
      label: time,
      icon: time === current ? 'check' : 'clock',
      onPress: () => updateDayTime(idx, key, time),
    }));
    showActionSheet(`${hours[idx]?.day ?? ''} ${key === 'openTime' ? 'opening' : 'closing'} time`, options);
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

  const uploadPickedImage = async (target: MediaTarget, source: MediaSource) => {
    const picked = await pickImageAsDataUri(source, {
      allowsEditing: target !== 'gallery',
      quality: 0.75,
      aspect: target === 'avatar' ? [1, 1] : target === 'cover' ? [16, 9] : undefined,
    });
    if (picked.status === 'permission-denied') {
      setToast({
        visible: true,
        message: `${source === 'camera' ? 'Camera' : 'Gallery'} permission is required to add photos.`,
        type: 'error',
      });
      return;
    }
    if (picked.status === 'unreadable') {
      setToast({ visible: true, message: 'Could not process selected image. Please try another image.', type: 'error' });
      return;
    }
    if (picked.status !== 'picked') {
      return;
    }

    setUploadingMedia(true);
    try {
      const uploadedUrl = await providerManagementApi.uploadMyMedia({ kind: target, dataUri: picked.dataUri });

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

  const showSection = (section: ProfileSection) => !loadError && (!isEditing || activeSection === section);
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
              style={[styles.editBtn, (loading || loadError) && { opacity: 0.5 }]}
              disabled={loading || loadError}
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

        {loadError && !loading ? (
          <View style={styles.loadErrorCard}>
            <Feather name="wifi-off" size={22} color={palette.gold} />
            <Text style={styles.loadErrorTitle}>Couldn't load your business profile</Text>
            <Text style={styles.loadErrorText}>
              Check your connection and try again. Your saved details are safe.
            </Text>
            <TouchableOpacity
              style={styles.loadErrorBtn}
              onPress={() => setReloadKey((key) => key + 1)}
              activeOpacity={0.85}
            >
              <Feather name="refresh-cw" size={14} color={palette.bg} />
              <Text style={styles.loadErrorBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loadError ? (
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
        ) : null}

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
                            {(['openTime', 'closeTime'] as const).map((key, keyIndex) => {
                              const invalid = findInvalidHoursDay([day]) !== undefined;
                              return (
                                <React.Fragment key={key}>
                                  {keyIndex === 1 ? <Text style={styles.dayHours}>-</Text> : null}
                                  <TouchableOpacity
                                    onPress={() => openTimePicker(idx, key)}
                                    style={[styles.timeInput, invalid && styles.inputNeedsAttention]}
                                    activeOpacity={0.8}
                                  >
                                    <Text style={styles.timeInputText}>{day[key] || 'Set time'}</Text>
                                  </TouchableOpacity>
                                </React.Fragment>
                              );
                            })}
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
              <Text style={styles.groupLabel}>
                Portfolio Gallery{isEditing ? ` (${form.galleryImages.length}/${MAX_GALLERY_IMAGES})` : ''}
              </Text>
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
                {isEditing && form.galleryImages.length < MAX_GALLERY_IMAGES && (
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
            </>
              ) : null}

          {showSection('account') ? (
            <>
              <Text style={styles.groupLabel}>Account</Text>
              <View style={styles.card}>
                <FieldRow label="Owner Name" fStyles={fStyles} palette={palette} isEditable={isEditing}>
                  <TextInput
                    placeholder="Full name"
                    value={ownerName}
                    onChangeText={setOwnerName}
                    style={[styles.input, isEditing && !ownerName.trim() ? styles.inputNeedsAttention : null]}
                    placeholderTextColor={palette.textMuted}
                    editable={isEditing}
                  />
                </FieldRow>
                <FieldRow label="Login Email" icon="mail" fStyles={fStyles} palette={palette} isLocked={isEditing}>
                  <Text style={styles.dayHours} numberOfLines={1}>{accountEmail || 'No email on file'}</Text>
                </FieldRow>
                <FieldRow label="Login Phone" icon="phone" noBorder fStyles={fStyles} palette={palette}>
                  <Text style={styles.dayHours}>{form.phone || 'No phone set'}</Text>
                </FieldRow>
              </View>
              <Text style={styles.lockedFieldNote}>
                Login phone follows your business phone in Basics. Contact support to change your login email.
              </Text>
            </>
          ) : null}

              {!isEditing && !loadError ? (
                <AccountSettingsSection
                  navigation={navigation}
                  onChangePasswordPress={() => setChangePasswordVisible(true)}
                />
              ) : null}

              {!isEditing ? <LegalLinksSection navigation={navigation} /> : null}

              {!isEditing ? (
                <AccountDangerZone role="provider" onDeletePress={() => setDeleteVisible(true)} />
              ) : null}

              {!isEditing ? (
                <TouchableOpacity
                  onPress={() => setLogoutConfirmVisible(true)}
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
        onChangePassword={submitPasswordChange}
        onSuccess={showSuccess}
        onError={showError}
      />

      <ConfirmModal
        visible={logoutConfirmVisible}
        title="Log out?"
        message="You won't get booking alerts on this device until you sign in again."
        confirmLabel="Log Out"
        isDanger
        onCancel={() => setLogoutConfirmVisible(false)}
        onConfirm={() => {
          setLogoutConfirmVisible(false);
          void logout();
        }}
      />

      <DeleteAccountModal
        visible={deleteVisible}
        role="provider"
        onDismiss={() => setDeleteVisible(false)}
        onDeleteAccount={deleteAccount}
        onSuccess={() => {
          setDeleteVisible(false);
          navigation.getParent()?.reset({
            index: 0,
            routes: [{ name: 'Login', params: { role: 'provider' } }],
          });
        }}
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
