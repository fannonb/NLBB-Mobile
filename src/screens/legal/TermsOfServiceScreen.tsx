import React from 'react';
import LegalDocumentLayout from '../../components/LegalDocumentLayout';
import { TERMS_LAST_UPDATED, TERMS_OF_SERVICE_SECTIONS } from '../../constants/legalContent';

export default function TermsOfServiceScreen({ navigation }: any) {
  return (
    <LegalDocumentLayout
      title="Terms of Service"
      lastUpdated={TERMS_LAST_UPDATED}
      sections={TERMS_OF_SERVICE_SECTIONS}
      navigation={navigation}
    />
  );
}
