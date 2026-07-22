import React, { useEffect, useMemo, useState } from 'react';
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
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../constants/theme';
import { useThemedColors, useThemedShadows } from '../hooks/useThemedColors';
import { useAuthStore } from '../store/authStore';
import { AUTH_GATE_COPY, useAuthGateStore } from '../store/authGateStore';
import { navigate } from '../lib/navigationRef';
import InputFocusWrap from './InputFocusWrap';
import LoginErrorModal from './LoginErrorModal';
import KeyboardAwareSheet from './KeyboardAwareSheet';

type AuthMode = 'login' | 'signup';
type LoginErrorType = 'invalid_credentials' | 'empty_fields';

function createAuthGateStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: p.overlayDark,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: p.card,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingHorizontal: 24,
      paddingTop: 12,
      maxHeight: '92%',
      ...s.card,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: p.border,
      alignSelf: 'center',
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    headerText: { flex: 1, paddingRight: 12 },
    logo: { width: 120, height: 46, marginBottom: 12 },
    title: {
      fontFamily: Fonts.serifMedium,
      fontSize: 22,
      color: p.textPrimary,
      marginBottom: 6,
    },
    subtitle: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      color: p.textSecondary,
      lineHeight: 21,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: p.cardInner,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modeToggle: {
      flexDirection: 'row',
      backgroundColor: p.cardInner,
      borderRadius: Radius.lg,
      padding: 4,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: p.border,
    },
    modeBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center' },
    modeBtnActive: { backgroundColor: p.gold, ...s.gold },
    modeText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: p.textSecondary },
    modeTextActive: { color: p.bg, fontFamily: Fonts.sansBold },
    field: { gap: 6, marginBottom: 14 },
    label: { color: p.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 12, marginLeft: 2 },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: p.bg,
      borderRadius: Radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
      borderWidth: 1,
      borderColor: p.border,
    },
    input: {
      flex: 1,
      minWidth: 0,
      alignSelf: 'stretch',
      color: p.textPrimary,
      fontFamily: Fonts.sans,
      fontSize: 14,
      padding: 0,
    },
    primaryBtn: {
      backgroundColor: p.gold,
      borderRadius: Radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
      ...s.gold,
    },
    primaryBtnDisabled: { opacity: 0.6 },
    primaryBtnText: { color: p.bg, fontFamily: Fonts.sansBold, fontSize: 15 },
    secondaryBtn: {
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    forgotBtn: {
      alignSelf: 'flex-end',
      marginTop: -4,
      marginBottom: 6,
    },
    forgotText: {
      color: p.gold,
      fontFamily: Fonts.sansMedium,
      fontSize: 13,
    },
    secondaryBtnText: { color: p.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 14 },
    providerLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 8,
      paddingVertical: 8,
    },
    providerLinkText: { color: p.gold, fontFamily: Fonts.sansMedium, fontSize: 13 },
    terms: {
      color: p.textMuted,
      fontFamily: Fonts.sans,
      fontSize: 11,
      textAlign: 'center',
      lineHeight: 17,
      marginTop: 12,
    },
  });
}

export default function AuthGateSheet() {
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createAuthGateStyles(palette, shadow), [palette, shadow]);

  const visible = useAuthGateStore((state) => state.visible);
  const reason = useAuthGateStore((state) => state.reason);
  const close = useAuthGateStore((state) => state.close);
  const consumePendingAction = useAuthGateStore((state) => state.consumePendingAction);

  const { login, signupCustomer } = useAuthStore();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorType, setErrorType] = useState<LoginErrorType>('empty_fields');
  const [errorTitle, setErrorTitle] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [errorHint, setErrorHint] = useState<string | undefined>(undefined);

  const copy = AUTH_GATE_COPY[reason] ?? AUTH_GATE_COPY.generic;

  useEffect(() => {
    if (isLoggedIn && visible) {
      const onSuccess = consumePendingAction();
      onSuccess?.();
    }
  }, [isLoggedIn, visible, consumePendingAction]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setShowPassword(false);
    setLoading(false);
    setMode('login');
    setErrorVisible(false);
    setErrorType('empty_fields');
    setErrorTitle(undefined);
    setErrorMessage(undefined);
    setErrorHint(undefined);
  };

  const showAuthError = ({
    type,
    title,
    message,
    hint,
  }: {
    type: LoginErrorType;
    title?: string;
    message?: string;
    hint?: string;
  }) => {
    setErrorType(type);
    setErrorTitle(title);
    setErrorMessage(message);
    setErrorHint(hint);
    setErrorVisible(true);
  };

  const handleClose = () => {
    resetForm();
    close();
  };

  const handleSubmit = async () => {
    if (mode === 'login') {
      if (!email.trim() || !password) {
        showAuthError({ type: 'empty_fields' });
        return;
      }

      setLoading(true);
      const result = await login(email, password, 'customer');
      setLoading(false);

      if (!result.success) {
        showAuthError({
          type: 'invalid_credentials',
          title: 'Sign In Failed',
          message: result.error ?? 'Unable to sign in. Please try again.',
          hint:
            result.error?.includes('registered as')
              ? 'Use the matching sign in option for this account type.'
              : undefined,
        });
      }
      return;
    }

    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      showAuthError({
        type: 'empty_fields',
        title: 'Missing Information',
        message: 'Please complete all fields to create your account.',
        hint: 'Full name, email, phone, and password are all required.',
      });
      return;
    }

    if (password.length < 8) {
      showAuthError({
        type: 'invalid_credentials',
        title: 'Weak Password',
        message: 'Password must be at least 8 characters.',
        hint: 'Use a longer password before creating your account.',
      });
      return;
    }

    setLoading(true);
    const result = await signupCustomer({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
    });
    setLoading(false);

    if (!result.success) {
      showAuthError({
        type: 'invalid_credentials',
        title: 'Signup Failed',
        message: result.error ?? 'Unable to create your account. Please try again.',
        hint:
          result.error?.toLowerCase().includes('already')
            ? 'Try signing in instead if this email is already registered.'
            : undefined,
      });
    }
  };

  const openProviderLogin = () => {
    handleClose();
    navigate('Login', { role: 'provider' });
  };

  return (
    <>
      <KeyboardAwareSheet
        visible={visible}
        onClose={handleClose}
        sheetStyle={styles.sheet}
        overlayStyle={styles.overlay}
        bottomPadding={16}
      >
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Image
              source={require('../../assets/transparent_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} accessibilityLabel="Close">
            <Feather name="x" size={18} color={palette.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
            onPress={() => setMode('signup')}
          >
            <Text style={[styles.modeText, mode === 'signup' && styles.modeTextActive]}>Create account</Text>
          </TouchableOpacity>
        </View>

        {mode === 'signup' && (
          <View style={styles.field}>
            <Text style={styles.label}>Full name</Text>
            <InputFocusWrap style={styles.inputWrap}>
              <Feather name="user" size={16} color={palette.textMuted} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
              />
            </InputFocusWrap>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <InputFocusWrap style={styles.inputWrap}>
            <Feather name="mail" size={16} color={palette.textMuted} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={palette.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </InputFocusWrap>
        </View>

        {mode === 'signup' && (
          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            <InputFocusWrap style={styles.inputWrap}>
              <Feather name="phone" size={16} color={palette.textMuted} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+254..."
                placeholderTextColor={palette.textMuted}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </InputFocusWrap>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <InputFocusWrap style={styles.inputWrap}>
            <Feather name="lock" size={16} color={palette.textMuted} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="********"
              placeholderTextColor={palette.textMuted}
              secureTextEntry={!showPassword}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={palette.textMuted} />
            </TouchableOpacity>
          </InputFocusWrap>
        </View>

        {mode === 'login' ? (
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => {
              handleClose();
              navigate('ForgotPassword');
            }}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          onPress={() => void handleSubmit()}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color={palette.bg} />
          ) : (
            <Text style={styles.primaryBtnText}>
              {mode === 'login' ? 'Sign in' : 'Create account'} - {copy.cta}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleClose}>
          <Text style={styles.secondaryBtnText}>Not now - keep browsing</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.providerLink} onPress={openProviderLogin}>
          <Feather name="briefcase" size={14} color={palette.gold} />
          <Text style={styles.providerLinkText}>I'm a service provider</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing you agree to NLBB Terms of Service and Privacy Policy.
        </Text>
      </KeyboardAwareSheet>

      <LoginErrorModal
        visible={errorVisible}
        errorType={errorType}
        titleOverride={errorTitle}
        messageOverride={errorMessage}
        hintOverride={errorHint}
        onDismiss={() => {
          setErrorVisible(false);
          setErrorTitle(undefined);
          setErrorMessage(undefined);
          setErrorHint(undefined);
        }}
      />
    </>
  );
}
