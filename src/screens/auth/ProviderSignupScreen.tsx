import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeedbackModalHost from '../../components/FeedbackModalHost';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { DEFAULT_SERVICE_CATEGORY_NAMES } from '../../constants/serviceCategories';
import GoldButton from '../../components/GoldButton';
import InputFocusWrap from '../../components/InputFocusWrap';
import ProviderLocationPicker, { PickedProviderLocation } from '../../components/ProviderLocationPicker';
import { useModalManager } from '../../hooks/useModalManager';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../lib/api/auth';
import { providerManagementApi } from '../../lib/api/providerManagement';

const toggleCategory = (selected: string[], category: string) =>
  selected.includes(category)
    ? selected.filter((item) => item !== category)
    : [...selected, category];

export default function ProviderSignupScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<PickedProviderLocation | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signupProvider } = useAuthStore();
  const { modal, showError, showInfo, hideModal } = useModalManager();

  const handleContinue = () => {
    if (!businessName || !ownerName || selectedCategories.length === 0 || !location) {
      showError('Missing Details', 'Please complete all business details before continuing.');
      return;
    }
    if (!selectedLocation || selectedLocation.label.trim().toLowerCase() !== location.trim().toLowerCase()) {
      showInfo(
        'Location not pinned',
        'Pick a suggested location, resolve the typed place, or use your current location so we can save exact coordinates.'
      );
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!phone || !email || !password) {
      showError('Missing Details', 'Please complete account details.');
      return;
    }

    if (password.length < 8) {
      showInfo('Weak Password', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const result = await signupProvider({
      name: businessName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      location: location.trim(),
    });

    if (!result.success) {
      setLoading(false);
      showError('Signup Failed', result.error ?? 'Unable to create provider account.');
      return;
    }

    try {
      await authApi.upsertProfile({
        name: ownerName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role: 'provider',
        location: location.trim(),
      });

      await providerManagementApi.saveMyRegistrationDetails({
        name: businessName.trim(),
        category: selectedCategories[0],
        categories: selectedCategories,
        location: selectedLocation?.label ?? location.trim(),
        address: selectedLocation?.address ?? location.trim(),
        phone: phone.trim(),
        coordinates: selectedLocation?.coordinates,
      });
    } catch {
      // Provider account exists at this point; the profile screen can complete any missing details.
    } finally {
      setLoading(false);
    }

    navigation.replace('ProviderApp');
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        bottomPadding={32}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.stepRow}>
          {[1, 2].map((s) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
                {step > s ? (
                  <Feather name="check" size={12} color={Colors.bg} />
                ) : (
                  <Text style={[styles.stepNum, step === s && styles.stepNumActive]}>{s}</Text>
                )}
              </View>
              {s < 2 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
            </View>
          ))}
        </View>

        <Text style={styles.heading}>{step === 1 ? 'Business Details' : 'Account Setup'}</Text>
        <Text style={styles.subheading}>
          {step === 1 ? 'Tell us about your beauty business' : 'Set up your provider account'}
        </Text>

        {step === 1 ? (
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Business Name</Text>
              <InputFocusWrap style={styles.inputWrap}>
                <Feather name="briefcase" size={16} color={Colors.textSecondary} />
                <TextInput value={businessName} onChangeText={setBusinessName} placeholder="e.g. Luxe Glow Studio" placeholderTextColor={Colors.textSecondary} style={styles.input} />
              </InputFocusWrap>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Owner / Contact Name</Text>
              <InputFocusWrap style={styles.inputWrap}>
                <Feather name="user" size={16} color={Colors.textSecondary} />
                <TextInput value={ownerName} onChangeText={setOwnerName} placeholder="Your full name" placeholderTextColor={Colors.textSecondary} style={styles.input} />
              </InputFocusWrap>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Service Categories</Text>
              <View style={styles.categoryGrid}>
                {DEFAULT_SERVICE_CATEGORY_NAMES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setSelectedCategories((current) => toggleCategory(current, c))}
                    style={[styles.categoryChip, selectedCategories.includes(c) && styles.categoryChipActive]}
                  >
                    <Text style={[styles.categoryText, selectedCategories.includes(c) && styles.categoryTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <ProviderLocationPicker
              label="Location / Area"
              value={location}
              selectedLocation={selectedLocation}
              onChangeText={setLocation}
              onLocationSelected={setSelectedLocation}
              placeholder="Search estate, area, or exact business location"
            />
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Business Phone (M-Pesa)</Text>
              <InputFocusWrap style={styles.inputWrap}>
                <Feather name="phone" size={16} color={Colors.textSecondary} />
                <TextInput value={phone} onChangeText={setPhone} placeholder="+254 7XX XXX XXX" placeholderTextColor={Colors.textSecondary} keyboardType="phone-pad" style={styles.input} />
              </InputFocusWrap>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <InputFocusWrap style={styles.inputWrap}>
                <Feather name="mail" size={16} color={Colors.textSecondary} />
                <TextInput value={email} onChangeText={setEmail} placeholder="business@email.com" placeholderTextColor={Colors.textSecondary} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
              </InputFocusWrap>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <InputFocusWrap style={styles.inputWrap}>
                <Feather name="lock" size={16} color={Colors.textSecondary} />
                <TextInput value={password} onChangeText={setPassword} placeholder="Min. 8 characters" placeholderTextColor={Colors.textSecondary} secureTextEntry style={styles.input} />
              </InputFocusWrap>
            </View>

            <View style={styles.subNotice}>
              <Feather name="info" size={14} color={Colors.gold} />
              <Text style={styles.subNoticeText}>
                A monthly subscription of <Text style={{ color: Colors.gold }}>Ksh 300 via M-Pesa</Text> is required to remain visible to customers.
              </Text>
            </View>
          </View>
        )}

        {step === 1 ? (
          <GoldButton label="Continue" onPress={handleContinue} style={styles.submitBtn} size="lg" />
        ) : (
          <GoldButton label="Create Provider Account" onPress={handleSubmit} loading={loading} style={styles.submitBtn} size="lg" />
        )}

        {step === 2 && (
          <TouchableOpacity onPress={() => setStep(1)} style={styles.backStepBtn}>
            <Text style={styles.backStepText}>Back</Text>
          </TouchableOpacity>
        )}
        <FeedbackModalHost modal={modal} onDismiss={hideModal} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 24, flexGrow: 1 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepDotActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  stepNum: { color: Colors.textMuted, fontFamily: Fonts.sansBold, fontSize: 13 },
  stepNumActive: { color: Colors.bg },
  stepLine: { width: 32, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: Colors.gold },
  heading: { fontFamily: Fonts.serif, fontSize: 28, color: Colors.textPrimary, marginBottom: 8 },
  subheading: { fontFamily: Fonts.sans, fontSize: 15, color: Colors.textSecondary, marginBottom: 28 },
  form: { gap: 20, marginBottom: 28 },
  field: { gap: 8 },
  label: { color: Colors.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 12, marginLeft: 4 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    color: Colors.textPrimary,
    fontFamily: Fonts.sans,
    fontSize: 14,
    padding: 0,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: { backgroundColor: Colors.goldDim, borderColor: Colors.gold },
  categoryText: { color: Colors.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 13 },
  categoryTextActive: { color: Colors.gold },
  subNotice: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.goldDim,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    alignItems: 'flex-start',
  },
  subNoticeText: { flex: 1, color: Colors.textSecondary, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20 },
  submitBtn: { width: '100%', marginBottom: 16 },
  backStepBtn: { alignItems: 'center', paddingVertical: 10 },
  backStepText: { color: Colors.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 14 },
});
