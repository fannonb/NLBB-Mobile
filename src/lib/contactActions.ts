import { Linking, Platform } from 'react-native';

const tryOpenUrl = async (url: string) => {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
};

const normalizePhoneForCall = (value: string | null | undefined) => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    return '';
  }

  const hasPlusPrefix = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D+/g, '');
  if (!digits) {
    return '';
  }

  return hasPlusPrefix ? `+${digits}` : digits;
};

export const normalizePhoneForWhatsApp = (value: string | null | undefined) => {
  const digits = (value ?? '').replace(/\D+/g, '');
  if (!digits) {
    return '';
  }

  if (digits.startsWith('00')) {
    return digits.slice(2);
  }

  if (digits.startsWith('254')) {
    return digits;
  }

  if (digits.startsWith('0')) {
    return `254${digits.slice(1)}`;
  }

  if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1'))) {
    return `254${digits}`;
  }

  return digits;
};

export const openExternalUrl = async (url: string) => tryOpenUrl(url);

export const openPhoneNumber = async (phone: string | null | undefined) => {
  const normalized = normalizePhoneForCall(phone);
  if (!normalized) {
    return false;
  }

  const urls =
    Platform.OS === 'ios'
      ? [`telprompt:${normalized}`, `tel:${normalized}`]
      : [`tel:${normalized}`];

  for (const url of urls) {
    if (await tryOpenUrl(url)) {
      return true;
    }
  }

  return false;
};

export const openWhatsAppContact = async (phone: string | null | undefined) => {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) {
    return false;
  }

  const urls = [`whatsapp://send?phone=${normalized}`, `https://wa.me/${normalized}`];
  for (const url of urls) {
    if (await tryOpenUrl(url)) {
      return true;
    }
  }

  return false;
};
