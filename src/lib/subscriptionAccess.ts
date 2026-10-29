import type { Subscription } from '../types';

export const isSubscriptionEffectivelyActive = (value: Subscription | null | undefined) => {
  if (!value) {
    return false;
  }
  if (value.paused) {
    return true;
  }
  if (value.status === 'suspended') {
    return false;
  }
  if (value.status !== 'active') {
    return false;
  }
  return new Date(value.renewalDate).getTime() > Date.now();
};

export const subscriptionPauseMessage = (value: Subscription | null | undefined) => {
  if (!value?.paused && value?.status !== 'paused') {
    return null;
  }
  const days = value.remainingDays ?? 0;
  const remaining =
    days > 0
      ? `${days} paid day${days === 1 ? '' : 's'} stay frozen until payments are required again.`
      : 'No paid days are waiting — premium access is complimentary for now.';
  if (value.pauseScope === 'account') {
    return `Payments are paused for this account. You have full premium access. ${remaining}`;
  }
  return `NLBB has paused subscription payments. Every provider has premium access. ${remaining}`;
};
