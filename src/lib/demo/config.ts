const normalizeEnvFlag = (value: string | undefined, defaultValue = false) => {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return defaultValue;
  }

  return normalized === 'true';
};

export const ENABLE_DEMO_MODE = normalizeEnvFlag(process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE, false);
export const ALLOW_SEEDED_IDENTITIES = normalizeEnvFlag(
  process.env.EXPO_PUBLIC_ALLOW_SEEDED_IDENTITIES,
  false
);
