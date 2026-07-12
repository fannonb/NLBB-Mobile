import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';

interface ChangePasswordModalProps {
  visible: boolean;
  onDismiss: () => void;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<ChangePasswordResult | boolean>;
  onSuccess?: (title: string, message: string) => void;
  onError?: (title: string, message: string) => void;
}

export interface ChangePasswordResult {
  success: boolean;
  errorMessage?: string;
  field?: 'currentPassword' | 'newPassword' | 'confirmPassword';
}

function createChangePasswordStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: p.bg,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 32,
      width: '100%',
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    title: {
      fontFamily: Fonts.serifMedium,
      fontSize: 22,
      color: p.textPrimary,
      flex: 1,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: p.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subtitle: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      color: p.textSecondary,
      marginBottom: 24,
      lineHeight: 20,
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      color: p.textPrimary,
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      marginBottom: 8,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: p.card,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: p.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
    },
    inputWrapError: {
      borderColor: p.error,
      backgroundColor: 'rgba(220,38,38,0.08)',
    },
    input: {
      flex: 1,
      color: p.textPrimary,
      fontFamily: Fonts.sans,
      fontSize: 14,
      padding: 0,
    },
    eyeBtn: {
      padding: 4,
    },
    errorText: {
      color: p.error,
      fontFamily: Fonts.sans,
      fontSize: 12,
      marginTop: 6,
    },
    hint: {
      backgroundColor: p.cardInner,
      borderRadius: Radius.md,
      padding: 12,
      marginBottom: 24,
      flexDirection: 'row',
      gap: 10,
    },
    hintText: {
      color: p.textSecondary,
      fontFamily: Fonts.sans,
      fontSize: 12,
      flex: 1,
      lineHeight: 18,
    },
    buttonGroup: {
      flexDirection: 'row',
      gap: 12,
    },
    changeBtn: {
      flex: 1,
      backgroundColor: p.gold,
      borderRadius: Radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      ...s.gold,
    },
    changeBtnDisabled: {
      opacity: 0.5,
    },
    changeBtnText: {
      color: p.bg,
      fontFamily: Fonts.sansBold,
      fontSize: 14,
      fontWeight: '700',
    },
    cancelBtn: {
      flex: 1,
      backgroundColor: p.card,
      borderRadius: Radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: p.border,
    },
    cancelBtnText: {
      color: p.textSecondary,
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
    },
  });
}

const PASSWORD_REQUIREMENTS = [
  { text: 'At least 8 characters', regex: /.{8,}/ },
  { text: 'One uppercase letter', regex: /[A-Z]/ },
  { text: 'One number', regex: /[0-9]/ },
  { text: 'One special character', regex: /[!@#$%^&*]/ },
];

function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  PASSWORD_REQUIREMENTS.forEach((req) => {
    if (!req.regex.test(password)) {
      errors.push(req.text);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default function ChangePasswordModal({
  visible,
  onDismiss,
  onChangePassword,
  onSuccess,
  onError,
}: ChangePasswordModalProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createChangePasswordStyles(palette, shadow), [palette, shadow]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validation = validatePassword(newPassword);
  const canSubmit =
    currentPassword.trim().length > 0 &&
    newPassword.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    validation.isValid &&
    newPassword === confirmPassword;

  const handleChangePassword = async () => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (!validation.isValid) {
      newErrors.newPassword = validation.errors.join(', ');
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await onChangePassword(currentPassword, newPassword);
      const outcome: ChangePasswordResult =
        typeof result === 'boolean' ? { success: result } : result;

      if (outcome.success) {
        onSuccess?.('Password Updated', 'Your password has been changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
        onDismiss();
      } else {
        if (outcome.field) {
          setErrors({ [outcome.field]: outcome.errorMessage ?? 'Please check this field.' });
          return;
        }
        onError?.('Password Change Failed', outcome.errorMessage ?? 'Failed to change password.');
      }
    } catch (error: any) {
      onError?.('Password Change Failed', error?.message ?? 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Change Password</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Feather name="x" size={18} color={palette.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            For your security, create a strong password with a mix of characters.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={[styles.inputWrap, errors.currentPassword && styles.inputWrapError]}>
              <Feather name="lock" size={16} color={palette.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor={palette.textMuted}
                secureTextEntry={!showCurrent}
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  setErrors((e) => ({ ...e, currentPassword: '' }));
                }}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowCurrent(!showCurrent)}
              >
                <Feather name={showCurrent ? 'eye-off' : 'eye'} size={16} color={palette.textSecondary} />
              </TouchableOpacity>
            </View>
            {errors.currentPassword && <Text style={styles.errorText}>{errors.currentPassword}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={[styles.inputWrap, errors.newPassword && styles.inputWrapError]}>
              <Feather name="lock" size={16} color={palette.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Create new password"
                placeholderTextColor={palette.textMuted}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setErrors((e) => ({ ...e, newPassword: '' }));
                }}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowNew(!showNew)}
              >
                <Feather name={showNew ? 'eye-off' : 'eye'} size={16} color={palette.textSecondary} />
              </TouchableOpacity>
            </View>
            {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={[styles.inputWrap, errors.confirmPassword && styles.inputWrapError]}>
              <Feather name="lock" size={16} color={palette.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={palette.textMuted}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrors((e) => ({ ...e, confirmPassword: '' }));
                }}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowConfirm(!showConfirm)}
              >
                <Feather name={showConfirm ? 'eye-off' : 'eye'} size={16} color={palette.textSecondary} />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          <View style={styles.hint}>
            <Feather name="check-circle" size={14} color={palette.success} />
            <Text style={styles.hintText}>
              Your password must contain at least 8 characters, one uppercase letter, one number, and one special character.
            </Text>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.changeBtn, !canSubmit && styles.changeBtnDisabled]}
              onPress={handleChangePassword}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={palette.bg} size="small" />
              ) : (
                <Text style={styles.changeBtnText}>Change Password</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
