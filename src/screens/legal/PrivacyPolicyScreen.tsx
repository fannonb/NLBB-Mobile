import React from 'react';
import LegalDocumentLayout from '../../components/LegalDocumentLayout';
import { PRIVACY_LAST_UPDATED, PRIVACY_POLICY_SECTIONS } from '../../constants/legalContent';

export default function PrivacyPolicyScreen({ navigation }: any) {
  return (
    <LegalDocumentLayout
      title="Privacy Policy"
      lastUpdated={PRIVACY_LAST_UPDATED}
      sections={PRIVACY_POLICY_SECTIONS}
      navigation={navigation}
    />
  );
}
