import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthScreenLayout, NLBBButton, NLBBCard, NLBBInput } from '../../components/ui';
import { ColorPalette, Fonts } from '../../constants/theme';
import { useThemedColors } from '../../hooks/useThemedColors';
import { authApi } from '../../lib/api/auth';

type Step = 'form' | 'success';

export default function ResetPasswordScreen({ navigation, route }: any) {
  const palette = useThemedColors();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const token = typeof route?.params?.token === 'string' ? route.params.token : '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!token) {
      setErrorMessage('This reset link is invalid or missing. Please request a new one.');
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMessage('Enter your new password in both fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await authApi.resetPassword({ token, newPassword: password });
      setStep('success');
    } catch (error: any) {
      setErrorMessage(
        error?.message ?? 'Password could not be updated. Please request a new reset link.'
      );
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.replace('Login');
  };

  return (
    <AuthScreenLayout
      title={step === 'form' ? 'Set a new password' : 'Password updated'}
      subtitle={
        step === 'form'
          ? 'Choose a strong password for your account. You will use it the next time you sign in.'
          : 'Your password has been reset successfully. You can now sign in with your new password.'
      }
    >
      <TouchableOpacity onPress={goToLogin} style={styles.backBtn}>
        <Feather name="arrow-left" size={20} color={palette.textPrimary} />
      </TouchableOpacity>

      <NLBBCard>
        {step === 'form' ? (
          <>
            <View style={styles.form}>
              <NLBBInput
                label="New Password"
                icon="lock"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Min. 8 characters"
                secureTextEntry
                secureVisible={showPassword}
                onToggleSecure={() => setShowPassword((value) => !value)}
              />

              <NLBBInput
                label="Confirm Password"
                icon="lock"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Repeat your password"
                secureTextEntry
                secureVisible={showConfirmPassword}
                onToggleSecure={() => setShowConfirmPassword((value) => !value)}
              />

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            </View>

            <NLBBButton
              label="Update Password"
              onPress={handleSubmit}
              loading={loading}
              size="lg"
              style={styles.submitBtn}
            />

            <TouchableOpacity onPress={goToLogin} style={styles.returnRow}>
              <Feather name="chevron-left" size={14} color={palette.gold} />
              <Text style={styles.returnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.successIconWrap}>
              <View style={styles.successIconOuter}>
                <View style={styles.successIconInner}>
                  <Feather name="check" size={28} color={palette.gold} />
                </View>
              </View>
            </View>

            <Text style={styles.successTitle}>All set</Text>
            <Text style={styles.successBody}>
              Your password has been updated. Return to sign in and continue using the app.
            </Text>

            <NLBBButton label="Go to Sign In" onPress={goToLogin} size="lg" style={styles.submitBtn} />
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
      gap: 16,
      marginBottom: 24,
    },
    errorText: {
      color: p.error,
      fontFamily: Fonts.sans,
      fontSize: 12,
      lineHeight: 18,
      marginTop: -4,
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
      fontFamily: Fonts.serifMedium,
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
