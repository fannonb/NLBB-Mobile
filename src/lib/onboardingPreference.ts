import { safeStorage } from './safeStorage';

const ONBOARDING_COMPLETE_KEY = '@nlbb/onboarding_complete';

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await safeStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  try {
    await safeStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
  } catch {
    // Ignore persistence failures; user can still browse as guest.
  }
}
