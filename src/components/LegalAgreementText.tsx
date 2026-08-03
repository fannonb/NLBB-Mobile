import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { ColorPalette, Fonts } from '../constants/theme';
import { useThemedColors } from '../hooks/useThemedColors';
import { navigate } from '../lib/navigationRef';

interface LegalAgreementTextProps {
  prefix?: string;
  navigation?: { navigate: (route: string) => void };
  style?: object;
}

function createStyles(p: ColorPalette) {
  return StyleSheet.create({
    terms: {
      color: p.textMuted,
      fontFamily: Fonts.sans,
      fontSize: 11,
      textAlign: 'center',
      lineHeight: 18,
    },
    termsLink: { color: p.gold, fontFamily: Fonts.sansMedium },
  });
}

export default function LegalAgreementText({
  prefix = "By continuing, you agree to NLBB's",
  navigation,
  style,
}: LegalAgreementTextProps) {
  const palette = useThemedColors();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const goTo = (route: string) => {
    if (navigation) {
      navigation.navigate(route);
    } else {
      navigate(route);
    }
  };

  return (
    <Text style={[styles.terms, style]}>
      {prefix}{' '}
      <Text style={styles.termsLink} onPress={() => goTo('TermsOfService')}>
        Terms of Service
      </Text>{' '}
      and{' '}
      <Text style={styles.termsLink} onPress={() => goTo('PrivacyPolicy')}>
        Privacy Policy
      </Text>
      .
    </Text>
  );
}
