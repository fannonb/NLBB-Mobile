import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import { useAuthStore } from '../../store/authStore';
import ChangePasswordModal, { ChangePasswordResult } from '../../components/ChangePasswordModal';
import FeedbackModalHost from '../../components/FeedbackModalHost';
import ActionSheetModal, { ActionSheetOption } from '../../components/ActionSheetModal';
import { useModalManager } from '../../hooks/useModalManager';
import { authApi } from '../../lib/api/auth';
import { isApiClientError } from '../../lib/api/client';

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

function createEditProfileStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: p.card,
      alignItems: 'center',
      justifyContent: 'center',
      ...s.soft,
    },
    heading: { flex: 1, textAlign: 'center', fontFamily: Fonts.serifMedium, fontSize: 18, color: p.textPrimary },
    scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
    avatarSection: { alignItems: 'center', marginBottom: 32 },
    avatarWrap: { position: 'relative', marginBottom: 12 },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 2,
      borderColor: p.gold,
      padding: 4,
    },
    avatarPlaceholder: {
      backgroundColor: p.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: p.gold,
    },
    avatarInitial: {
      color: p.textPrimary,
      fontFamily: Fonts.serifMedium,
      fontSize: 30,
    },
    cameraBtn: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: p.gold,
      alignItems: 'center',
      justifyContent: 'center',
      ...s.gold,
    },
    avatarHint: { color: p.textMuted, fontFamily: Fonts.sans, fontSize: 12 },
    formSection: { marginBottom: 24 },
    formGroup: { marginBottom: 20 },
    label: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14, marginBottom: 8 },
    input: {
      backgroundColor: p.card,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: p.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      fontFamily: Fonts.sans,
      color: p.textPrimary,
      ...s.soft,
    },
    inputError: { borderColor: p.error, backgroundColor: 'rgba(220,38,38,0.08)' },
    errorText: { color: p.error, fontFamily: Fonts.sans, fontSize: 12, marginTop: 6 },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: p.goldDim,
      borderRadius: Radius.md,
      padding: 12,
      gap: 10,
      marginBottom: 32,
    },
    infoText: { color: p.textPrimary, fontFamily: Fonts.sans, fontSize: 12, flex: 1, lineHeight: 18 },
    buttonGroup: { gap: 12 },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: p.gold,
      borderRadius: Radius.md,
      paddingVertical: 14,
      ...s.gold,
    },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { color: p.bg, fontFamily: Fonts.sansBold, fontSize: 14 },
    cancelBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.card,
    },
    cancelBtnText: { color: p.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 14 },
    divider: {
      height: 1,
      backgroundColor: p.borderLight,
      marginVertical: 24,
    },
    securitySection: {
      marginBottom: 24,
    },
    sectionLabel: {
      fontFamily: Fonts.serifMedium,
      fontSize: 16,
      color: p.textPrimary,
      marginBottom: 16,
    },
    changePasswordBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: p.card,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: p.border,
      padding: 16,
      gap: 12,
    },
    changePasswordIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: p.cardInner,
      alignItems: 'center',
      justifyContent: 'center',
    },
    changePasswordContent: {
      flex: 1,
    },
    changePasswordTitle: {
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      color: p.textPrimary,
      marginBottom: 4,
    },
    changePasswordSub: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: p.textSecondary,
    },
  });
}

export default function EditProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createEditProfileStyles(palette, shadow), [palette, shadow]);
  const { user, refreshCurrentUser } = useAuthStore();
  const [form, setForm] = useState<ProfileForm>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    avatar: user?.avatar,
  });
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const { modal, showSuccess, showError, showInfo, showActionSheet, hideModal } = useModalManager();

  const canSave = form.name.trim().length > 0 && form.email.trim().length > 0 && form.phone.trim().length >= 9;
  const hasChanges =
    form.name !== user?.name || form.email !== user?.email || form.phone !== user?.phone || form.avatar !== user?.avatar;

  const ensureMediaPermission = async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showInfo('Permission Required', 'Camera permission is required to take a photo.');
        return false;
      }
      return true;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showInfo('Permission Required', 'Gallery permission is required to select a photo.');
      return false;
    }
    return true;
  };

  const uploadPickedAvatar = async (source: 'camera' | 'gallery') => {
    const allowed = await ensureMediaPermission(source);
    if (!allowed) {
      return;
    }

    const pickerOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    };

    try {
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.base64) {
        showError('Error', 'Could not process selected image. Please try another image.');
        return;
      }

      const mimeType =
        asset.mimeType && asset.mimeType.startsWith('image/')
          ? asset.mimeType
          : asset.uri.toLowerCase().endsWith('.png')
            ? 'image/png'
            : 'image/jpeg';

      setUploadingAvatar(true);
      const dataUri = `data:${mimeType};base64,${asset.base64}`;
      const updatedUser = await authApi.uploadAvatar({ dataUri });
      setForm((f) => ({ ...f, avatar: updatedUser.avatar ?? f.avatar }));
      await refreshCurrentUser();
    } catch (error) {
      const message =
        isApiClientError(error) ? error.message : error instanceof Error ? error.message : 'Failed to upload image';
      showError('Error', message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePickAvatar = () => {
    const options: ActionSheetOption[] = [
      {
        id: 'camera',
        label: 'Take Photo',
        icon: 'camera',
        onPress: () => {
          void uploadPickedAvatar('camera');
        },
      },
      {
        id: 'gallery',
        label: 'Choose from Gallery',
        icon: 'image',
        onPress: () => {
          void uploadPickedAvatar('gallery');
        },
      },
    ];
    showActionSheet('Update Photo', options);
  };

  const handleSave = async () => {
    if (!canSave) {
      showError('Validation Error', 'Name, email, and a valid phone number are required.');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await authApi.upsertProfile({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        role: user?.role ?? 'customer',
        avatar: form.avatar,
      });
      setForm({
        name: updatedUser.name,
        email: updatedUser.email ?? '',
        phone: updatedUser.phone ?? '',
        avatar: updatedUser.avatar ?? undefined,
      });
      await refreshCurrentUser();
      showSuccess('Success', 'Profile updated successfully');
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      const message =
        isApiClientError(error) ? error.message : error instanceof Error ? error.message : 'Failed to save profile';
      showError('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const avatarInitial = (form.name?.trim()?.charAt(0) ?? 'U').toUpperCase();

  const handleChangePassword = async (currentPassword: string, newPassword: string): Promise<ChangePasswordResult> => {
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.heading}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {form.avatar ? (
              <Image source={{ uri: form.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{avatarInitial}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={handlePickAvatar}
              disabled={uploadingAvatar}
              activeOpacity={0.7}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={palette.bg} />
              ) : (
                <Feather name="camera" size={12} color={palette.bg} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Tap camera icon to change photo</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={[styles.input, touched.name && !form.name && styles.inputError]}
              placeholder="Enter your full name"
              placeholderTextColor={palette.textMuted}
              value={form.name}
              onChangeText={(text) => setForm((f) => ({ ...f, name: text }))}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            />
            {touched.name && !form.name && <Text style={styles.errorText}>Name is required</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={[styles.input, touched.email && !form.email && styles.inputError]}
              placeholder="Enter your email"
              placeholderTextColor={palette.textMuted}
              keyboardType="email-address"
              value={form.email}
              onChangeText={(text) => setForm((f) => ({ ...f, email: text }))}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            />
            {touched.email && !form.email && <Text style={styles.errorText}>Email is required</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor={palette.textMuted}
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => setForm((f) => ({ ...f, phone: text }))}
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Feather name="info" size={16} color={palette.gold} />
          <Text style={styles.infoText}>Your email is used for login and important account notifications</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.securitySection}>
          <Text style={styles.sectionLabel}>Security</Text>

          <TouchableOpacity
            style={styles.changePasswordBtn}
            onPress={() => setChangePasswordVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.changePasswordIcon}>
              <Feather name="shield" size={20} color={palette.gold} />
            </View>
            <View style={styles.changePasswordContent}>
              <Text style={styles.changePasswordTitle}>Change Password</Text>
              <Text style={styles.changePasswordSub}>Update your password to keep your account secure</Text>
            </View>
            <Feather name="chevron-right" size={20} color={palette.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.saveBtn, !canSave || !hasChanges ? styles.saveBtnDisabled : {}]}
            onPress={handleSave}
            disabled={!canSave || !hasChanges || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={palette.bg} />
            ) : (
              <>
                <Feather name="check" size={16} color={palette.bg} />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    </KeyboardAvoidingView>
  );
}
