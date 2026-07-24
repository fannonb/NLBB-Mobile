import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import LoginErrorModal from '../../components/LoginErrorModal';
import { AuthScreenLayout, NLBBButton, NLBBInput, NLBBCard } from '../../components/ui';
import { ColorPalette, Fonts } from '../../constants/theme';
import { useThemedColors } from '../../hooks/useThemedColors';
import { getDemoCredentialsHint } from '../../lib/demo/demoSession';
import { ENABLE_DEMO_MODE } from '../../lib/demo/config';

export default function LoginScreen({ navigation, route }: any) {
  const palette = useThemedColors();
  const styles = useMemo(() => createLoginStyles(palette), [palette]);
  const requestedRole = route?.params?.role === 'provider' ? 'provider' : 'customer';
  const isRoleLocked = route?.params?.role === 'provider' || route?.params?.role === 'customer';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'customer' | 'provider'>(requestedRole);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorType, setErrorType] = useState<
    'invalid_credentials' | 'network' | 'server' | 'empty_fields'
  >('invalid_credentials');
  const [errorTitle, setErrorTitle] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [errorHint, setErrorHint] = useState<string | undefined>(undefined);
  const { login, consumeAuthNotice } = useAuthStore();

  useEffect(() => {
    setRole(requestedRole);
  }, [requestedRole]);

  useEffect(() => {
    const notice = consumeAuthNotice();
    if (!notice) {
      return;
    }

    showLoginError({
      type: 'server',
      title: 'Session Expired',
      message: notice,
      hint: 'Sign in again to continue.',
    });
  }, [consumeAuthNotice]);

  const showLoginError = ({
    type,
    title,
    message,
    hint,
  }: {
    type: 'invalid_credentials' | 'network' | 'server' | 'empty_fields';
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

  const handleLogin = async () => {
    if (!email || !password) {
      showLoginError({ type: 'empty_fields' });
      return;
    }

    setLoading(true);
    const result = await login(email, password, role);
    setLoading(false);

    if (!result.success || !result.role) {
      showLoginError({
        type: 'invalid_credentials',
        title: 'Sign In Failed',
        message: result.error ?? 'Unable to sign in. Please try again.',
        hint:
          result.error?.includes('registered as')
            ? 'Switch to the matching account type and try again.'
            : undefined,
      });
      return;
    }

    if (result.role === 'provider') {
      navigation.replace('ProviderApp');
      return;
    }

    if (result.role === 'admin') {
      navigation.replace('AdminApp');
      return;
    }

    navigation.replace('CustomerApp');
  };

  return (
    <>
      <AuthScreenLayout
        title="Welcome back"
        subtitle={
          requestedRole === 'provider'
            ? 'Sign in to manage your appointments, clients, and business profile.'
            : 'Sign in to book appointments, save favorites, and manage your profile.'
        }
        footer={
          <>
            <Text style={styles.promoTitle}>Premium Business Management</Text>
            <Text style={styles.promoText}>
              Verified beauty and wellness professionals across Kenya.
            </Text>
            {ENABLE_DEMO_MODE ? (
              <View style={styles.demoBox}>
                <Text style={styles.demoLabel}>Try demo mode (offline)</Text>
                <Text style={styles.demoHint}>Provider: {getDemoCredentialsHint('provider')}</Text>
                <View style={styles.demoBtns}>
                  <TouchableOpacity
                    style={styles.demoBtn}
                    onPress={() => {
                      setRole('provider');
                      setEmail('demo@provider.com');
                      setPassword('demo1234');
                    }}
                  >
                    <Text style={styles.demoBtnText}>Fill provider demo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </>
        }
      >
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.replace('CustomerApp');
            }
          }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>

        <NLBBCard>
          {!isRoleLocked ? (
            <View style={styles.roleToggle}>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'customer' && styles.roleBtnActive]}
                onPress={() => setRole('customer')}
                activeOpacity={0.85}
              >
                <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>
                  Customer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'provider' && styles.roleBtnActive]}
                onPress={() => setRole('provider')}
                activeOpacity={0.85}
              >
                <Text style={[styles.roleText, role === 'provider' && styles.roleTextActive]}>
                  Provider
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.roleLockedBanner}>
              <Feather name={requestedRole === 'provider' ? 'briefcase' : 'user'} size={16} color={palette.gold} />
              <Text style={styles.roleLockedText}>
                {requestedRole === 'provider' ? 'Service Provider Sign In' : 'Customer Sign In'}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <NLBBInput
              label="Email"
              icon="mail"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <NLBBInput
              label="Password"
              icon="lock"
              value={password}
              onChangeText={setPassword}
              placeholder="********"
              secureTextEntry
              secureVisible={showPassword}
              onToggleSecure={() => setShowPassword(!showPassword)}
            />

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <NLBBButton label="Sign In" onPress={handleLogin} loading={loading} size="lg" style={styles.loginBtn} />

          <Text style={styles.terms}>
            By continuing, you agree to NLBB's{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate(role === 'provider' ? 'ProviderSignup' : 'Signup')
              }
            >
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            onPress={() => navigation.replace('CustomerApp')}
            style={styles.homeBtn}
          >
            <Feather name="home" size={16} color={palette.gold} />
            <Text style={styles.homeBtnText}>Go to Customer App</Text>
          </TouchableOpacity>
        </NLBBCard>
      </AuthScreenLayout>

      <LoginErrorModal
        visible={errorVisible}
        onDismiss={() => {
          setErrorVisible(false);
          setErrorTitle(undefined);
          setErrorMessage(undefined);
          setErrorHint(undefined);
        }}
        errorType={errorType}
        titleOverride={errorTitle}
        messageOverride={errorMessage}
        hintOverride={errorHint}
      />
    </>
  );
}

function createLoginStyles(p: ColorPalette) {
  return StyleSheet.create({
    roleToggle: {
      flexDirection: 'row',
      backgroundColor: p.bg,
      borderRadius: 14,
      padding: 4,
      marginBottom: 24,
    },
    roleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    roleBtnActive: { backgroundColor: p.gold },
    roleText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: p.textSecondary },
    roleTextActive: { color: p.bg, fontWeight: '700' },
    roleLockedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: p.goldDim,
      borderRadius: 14,
      paddingVertical: 12,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: p.goldBorder,
    },
    roleLockedText: {
      color: p.gold,
      fontFamily: Fonts.sansBold,
      fontSize: 13,
    },
    form: { gap: 16, marginBottom: 24 },
    forgotBtn: { alignSelf: 'flex-end', marginTop: -4 },
    forgotText: { color: p.gold, fontFamily: Fonts.sansMedium, fontSize: 13 },
    loginBtn: { width: '100%', marginBottom: 16 },
    terms: {
      color: p.textMuted,
      fontFamily: Fonts.sans,
      fontSize: 11,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 18,
    },
    termsLink: { color: p.gold, fontFamily: Fonts.sansMedium },
    signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    signupText: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 14 },
    signupLink: { color: p.gold, fontFamily: Fonts.sansBold, fontSize: 14 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: p.cardInner,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, marginTop: 10 },
    dividerLine: { flex: 1, height: 1, backgroundColor: p.borderMedium },
    dividerText: { color: p.textMuted, fontFamily: Fonts.sans, fontSize: 13 },
    homeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: p.goldDim,
    },
    homeBtnText: { color: p.gold, fontFamily: Fonts.sansMedium, fontSize: 14 },
    promoTitle: {
      fontFamily: Fonts.serif,
      fontSize: 17,
      color: p.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    promoText: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      color: p.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 16,
    },
    demoBox: {
      width: '100%',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(181,146,42,0.35)',
      backgroundColor: 'rgba(181,146,42,0.08)',
      padding: 14,
      gap: 6,
    },
    demoLabel: {
      fontFamily: Fonts.sansBold,
      fontSize: 12,
      color: p.gold,
      textAlign: 'center',
      marginBottom: 4,
    },
    demoHint: {
      fontFamily: Fonts.sans,
      fontSize: 11,
      color: p.textSecondary,
      textAlign: 'center',
    },
    demoBtns: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 10,
    },
    demoBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: p.goldBorder,
      alignItems: 'center',
    },
    demoBtnText: {
      fontFamily: Fonts.sansMedium,
      fontSize: 11,
      color: p.gold,
    },
  });
}
