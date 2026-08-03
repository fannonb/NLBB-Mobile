import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';
import InputFocusWrap from './InputFocusWrap';
import KeyboardAwareSheet from './KeyboardAwareSheet';

interface DeleteAccountModalProps {
  visible: boolean;
  role: 'customer' | 'provider';
  onDismiss: () => void;
  onDeleteAccount: (password: string) => Promise<{ success: boolean; errorMessage?: string }>;
  onSuccess?: () => void;
}

function createStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: {
      backgroundColor: p.card,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: p.border,
      paddingHorizontal: 24,
      paddingTop: 24,
      width: '100%',
      ...s.card,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
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
    warningBox: {
      backgroundColor: 'rgba(220,38,38,0.08)',
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: 'rgba(220,38,38,0.18)',
      padding: 14,
      marginBottom: 20,
      gap: 8,
    },
    warningTitle: {
      color: p.error,
      fontFamily: Fonts.sansBold,
      fontSize: 13,
    },
    warningText: {
      color: p.textSecondary,
      fontFamily: Fonts.sans,
      fontSize: 12,
      lineHeight: 18,
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
      gap: 10,
      backgroundColor: p.bg,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: p.border,
      paddingHorizontal: 14,
      marginBottom: 8,
    },
    input: {
      flex: 1,
      color: p.textPrimary,
      fontFamily: Fonts.sans,
      fontSize: 14,
      paddingVertical: 14,
    },
    errorText: {
      color: p.error,
      fontFamily: Fonts.sans,
      fontSize: 12,
      marginBottom: 16,
    },
    deleteBtn: {
      backgroundColor: p.error,
      borderRadius: Radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 10,
    },
    deleteBtnText: {
      color: '#FFFFFF',
      fontFamily: Fonts.sansBold,
      fontSize: 15,
    },
    cancelBtn: {
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 8,
    },
    cancelText: {
      color: p.textSecondary,
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
    },
  });
}

export default function DeleteAccountModal({
  visible,
  role,
  onDismiss,
  onDeleteAccount,
  onSuccess,
}: DeleteAccountModalProps) {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createStyles(palette, shadow), [palette, shadow]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDismiss = () => {
    if (busy) {
      return;
    }
    setPassword('');
    setError(null);
    onDismiss();
  };

  const handleDelete = async () => {
    if (!password.trim()) {
      setError('Enter your password to confirm deletion.');
      return;
    }

    setBusy(true);
    setError(null);
    const result = await onDeleteAccount(password);
    setBusy(false);

    if (!result.success) {
      setError(result.errorMessage ?? 'Could not delete your account. Please try again.');
      return;
    }

    setPassword('');
    onSuccess?.();
  };

  const warningCopy =
    role === 'provider'
      ? 'Your provider listing, services, media, and account profile will be permanently removed. This cannot be undone.'
      : 'Your profile, favorites, and account data will be permanently removed. This cannot be undone.';

  return (
    <KeyboardAwareSheet visible={visible} onClose={handleDismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Delete account</Text>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn} disabled={busy}>
            <Feather name="x" size={18} color={palette.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>This action is permanent</Text>
          <Text style={styles.warningText}>{warningCopy}</Text>
        </View>

        <Text style={styles.label}>Confirm with your password</Text>
        <InputFocusWrap style={styles.inputWrap}>
          <Feather name="lock" size={16} color={palette.textSecondary} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={palette.textMuted}
            secureTextEntry={!showPassword}
            style={styles.input}
            editable={!busy}
          />
          <TouchableOpacity onPress={() => setShowPassword((value) => !value)} disabled={busy}>
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={palette.textSecondary} />
          </TouchableOpacity>
        </InputFocusWrap>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.deleteBtn} onPress={() => void handleDelete()} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.deleteBtnText}>Delete my account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={handleDismiss} disabled={busy}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareSheet>
  );
}
