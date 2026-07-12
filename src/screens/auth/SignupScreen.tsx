import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import ErrorModal from '../../components/ErrorModal';
import { AuthScreenLayout, NLBBButton, NLBBInput, NLBBCard } from '../../components/ui';
import { ColorPalette, Fonts } from '../../constants/theme';
import { useThemedColors } from '../../hooks/useThemedColors';

export default function SignupScreen({ navigation }: any) {
  const palette = useThemedColors();
  const styles = useMemo(() => createSignupStyles(palette), [palette]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signupCustomer } = useAuthStore();

  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorVisible(true);
  };

  const handleSignup = async () => {
    if (!name || !email || !phone || !password) {
      showError('Please complete all fields to create your account.');
      return;
    }

    if (password.length < 8) {
      showError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const result = await signupCustomer({
      name,
      email,
      phone,
      password,
      location: 'Nairobi, Kenya',
    });
    setLoading(false);

    if (!result.success) {
      showError(result.error ?? 'Unable to create account. Please try again.');
      return;
    }

    navigation.replace('CustomerApp');
  };

  return (
    <>
      <AuthScreenLayout
        title="Create Account"
        subtitle="Create your account to book services, save favorites, and manage appointments."
        showLogo={false}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>

        <NLBBCard>
          <View style={styles.form}>
            <NLBBInput
              label="Full Name"
              icon="user"
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
            />
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
              label="Phone Number"
              icon="phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+254 7XX XXX XXX"
              keyboardType="phone-pad"
            />
            <NLBBInput
              label="Password"
              icon="lock"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              secureTextEntry
              secureVisible={showPassword}
              onToggleSecure={() => setShowPassword(!showPassword)}
            />
          </View>

          <Text style={styles.terms}>
            By signing up, you agree to NLBB's{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          <NLBBButton label="Create Account" onPress={handleSignup} loading={loading} size="lg" style={styles.submitBtn} />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login', { role: 'customer' })}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('ProviderSignup')} style={styles.providerBtn}>
            <Feather name="briefcase" size={16} color={palette.gold} />
            <Text style={styles.providerBtnText}>Register as a Service Provider</Text>
          </TouchableOpacity>
        </NLBBCard>
      </AuthScreenLayout>

      <ErrorModal
        visible={errorVisible}
        title="Signup Failed"
        message={errorMessage}
        onDismiss={() => setErrorVisible(false)}
      />
    </>
  );
}

function createSignupStyles(p: ColorPalette) {
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
    form: { gap: 16, marginBottom: 24 },
    terms: {
      color: p.textMuted,
      fontFamily: Fonts.sans,
      fontSize: 11,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 18,
    },
    termsLink: { color: p.gold, fontFamily: Fonts.sansMedium },
    submitBtn: { width: '100%', marginBottom: 20 },
    loginRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
    loginText: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 14 },
    loginLink: { color: p.gold, fontFamily: Fonts.sansBold, fontSize: 14 },
    divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: p.borderMedium },
    dividerText: { color: p.textMuted, fontFamily: Fonts.sans, fontSize: 13 },
    providerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: p.goldDim,
    },
    providerBtnText: { color: p.gold, fontFamily: Fonts.sansMedium, fontSize: 14 },
  });
}
