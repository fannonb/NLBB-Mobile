import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthScreenLayout, NLBBButton, NLBBInput, NLBBCard } from '../../components/ui';
import { ColorPalette, Fonts } from '../../constants/theme';
import { useThemedColors } from '../../hooks/useThemedColors';
import { authApi } from '../../lib/api/auth';

type Step = 'request' | 'sent';

export default function ForgotPasswordScreen({ navigation }: any) {
  const palette = useThemedColors();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('request');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true, easing: Easing.linear }),
    ]).start();
  };

  const handleRequest = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setErrorMsg('Please enter your email address.');
      triggerShake();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg('Please enter a valid email address.');
      triggerShake();
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await authApi.forgotPassword({ email: trimmed });
      if (result.sent) {
        setStep('sent');
      } else {
        setErrorMsg('We could not send the reset email right now. Please try again later.');
        triggerShake();
      }
    } catch (err: any) {
      if (err?.code === 'BACKEND_UNREACHABLE' || err?.status === 0) {
        setErrorMsg('Cannot connect to server. Please check your connection and try again.');
        triggerShake();
      } else {
        const msg = err?.message ?? '';
        if (msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('limit')) {
          setErrorMsg('Too many requests. Please wait a moment and try again.');
          triggerShake();
        } else {
          setErrorMsg('We could not send the reset email right now. Please try again later.');
          triggerShake();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <AuthScreenLayout
      title={step === 'request' ? 'Reset password' : 'Check your inbox'}
      subtitle={
        step === 'request'
          ? 'Enter the email linked to your account and we\'ll send a secure reset link.'
          : `We've sent a password reset link to\n${email.trim().toLowerCase()}`
      }
    >
      <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
        <Feather name="arrow-left" size={20} color={palette.textPrimary} />
      </TouchableOpacity>

      <NLBBCard>
        {step === 'request' ? (
          <>
            <View style={styles.form}>
              <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                <NLBBInput
                  label="Email"
                  icon="mail"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Animated.View>

              {errorMsg ? (
                <View style={styles.errorRow}>
                  <Feather name="alert-circle" size={14} color={palette.error} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}
            </View>

            <NLBBButton
              label="Send Reset Link"
              onPress={handleRequest}
              loading={loading}
              size="lg"
              style={styles.submitBtn}
            />

            <TouchableOpacity onPress={handleBack} style={styles.returnRow}>
              <Feather name="chevron-left" size={14} color={palette.gold} />
              <Text style={styles.returnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.successIconWrap}>
              <View style={styles.successIconOuter}>
                <View style={styles.successIconInner}>
                  <Feather name="mail" size={28} color={palette.gold} />
                </View>
              </View>
            </View>

            <Text style={styles.successTitle}>Link sent!</Text>
            <Text style={styles.successBody}>
              Open the email and tap the link to set a new password. The link
              expires in 1 hour.{'\n\n'}
              Didn't receive it? Check your spam folder or tap below to try again.
            </Text>

            <NLBBButton
              label="Resend Link"
              onPress={() => {
                setStep('request');
                setErrorMsg(null);
              }}
              size="lg"
              variant="secondary"
              style={styles.submitBtn}
            />

            <TouchableOpacity onPress={handleBack} style={styles.returnRow}>
              <Feather name="chevron-left" size={14} color={palette.gold} />
              <Text style={styles.returnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </>
        )}
      </NLBBCard>
    </AuthScreenLayout>
  );
}

function createStyles(p: ColorPalette) {
  return StyleSheet.create({
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: p.cardInner,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    form: {
      gap: 12,
      marginBottom: 24,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 4,
    },
    errorText: {
      color: p.error,
      fontFamily: Fonts.sans,
      fontSize: 12,
      flex: 1,
      lineHeight: 18,
    },
    submitBtn: {
      width: '100%',
      marginBottom: 16,
    },
    returnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 8,
    },
    returnText: {
      color: p.gold,
      fontFamily: Fonts.sansMedium,
      fontSize: 13,
    },
    successIconWrap: {
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 8,
    },
    successIconOuter: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: p.goldDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successIconInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(184,146,42,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    successTitle: {
      fontFamily: Fonts.serifBold,
      fontSize: 22,
      color: p.textPrimary,
      textAlign: 'center',
      marginBottom: 12,
    },
    successBody: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      color: p.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
  });
}
