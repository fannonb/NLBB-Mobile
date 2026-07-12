export type SocialPlatform = 'instagram' | 'facebook';

const ensureHttps = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('www.')) {
    return `https://${trimmed}`;
  }

  return '';
};

const normalizeHandle = (value: string) =>
  value
    .trim()
    .replace(/^@+/, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

export const normalizeInstagramLink = (value: string | null | undefined) => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    return '';
  }

  const directUrl = ensureHttps(trimmed);
  if (directUrl) {
    return directUrl;
  }

  if (/instagram\.com/i.test(trimmed)) {
    return `https://${trimmed.replace(/^\/+/, '')}`;
  }

  const handle = normalizeHandle(trimmed);
  return handle ? `https://instagram.com/${handle}` : '';
};

export const normalizeFacebookLink = (value: string | null | undefined) => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    return '';
  }

  const directUrl = ensureHttps(trimmed);
  if (directUrl) {
    return directUrl;
  }

  if (/facebook\.com/i.test(trimmed)) {
    return `https://${trimmed.replace(/^\/+/, '')}`;
  }

  const handle = normalizeHandle(trimmed);
  return handle ? `https://facebook.com/${handle}` : '';
};

export const normalizeSocialLink = (platform: SocialPlatform, value: string | null | undefined) =>
  platform === 'instagram' ? normalizeInstagramLink(value) : normalizeFacebookLink(value);

export const getSocialDisplayValue = (platform: SocialPlatform, value: string | null | undefined) => {
  const normalized = normalizeSocialLink(platform, value);
  return normalized.replace(/^https?:\/\//i, '');
};
