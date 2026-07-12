import { create } from 'zustand';

export type AuthGateReason =
  | 'book'
  | 'favorite'
  | 'contact'
  | 'bookings'
  | 'profile'
  | 'notifications'
  | 'favorites'
  | 'generic';

type PendingAuthAction = {
  reason: AuthGateReason;
  onSuccess?: () => void;
};

interface AuthGateState {
  visible: boolean;
  reason: AuthGateReason;
  pendingAction: PendingAuthAction | null;
  open: (reason: AuthGateReason, onSuccess?: () => void) => void;
  close: () => void;
  consumePendingAction: () => (() => void) | undefined;
}

export const useAuthGateStore = create<AuthGateState>((set, get) => ({
  visible: false,
  reason: 'generic',
  pendingAction: null,

  open: (reason, onSuccess) => {
    set({
      visible: true,
      reason,
      pendingAction: { reason, onSuccess },
    });
  },

  close: () => {
    set({ visible: false, pendingAction: null });
  },

  consumePendingAction: () => {
    const callback = get().pendingAction?.onSuccess;
    set({ visible: false, pendingAction: null });
    return callback;
  },
}));

export const AUTH_GATE_COPY: Record<
  AuthGateReason,
  { title: string; subtitle: string; cta: string }
> = {
  book: {
    title: 'Sign in to book',
    subtitle: 'Create a free account to request appointments and track your visits.',
    cta: 'Continue to book',
  },
  favorite: {
    title: 'Sign in to save favorites',
    subtitle: 'Keep your go-to salons, stylists, and providers in one place.',
    cta: 'Save favorites',
  },
  contact: {
    title: 'Sign in to contact',
    subtitle: 'Call or message providers after you sign in.',
    cta: 'Contact provider',
  },
  bookings: {
    title: 'Sign in to view bookings',
    subtitle: 'See upcoming visits, history, and booking updates.',
    cta: 'View bookings',
  },
  profile: {
    title: 'Sign in to your profile',
    subtitle: 'Manage your account, settings, and saved places.',
    cta: 'Open profile',
  },
  notifications: {
    title: 'Sign in for notifications',
    subtitle: 'Get alerts when providers confirm or update your bookings.',
    cta: 'Enable notifications',
  },
  favorites: {
    title: 'Sign in to see favorites',
    subtitle: 'Your saved providers sync to your account.',
    cta: 'View favorites',
  },
  generic: {
    title: 'Join NLBB',
    subtitle: 'Sign in or create an account to unlock this feature.',
    cta: 'Continue',
  },
};
