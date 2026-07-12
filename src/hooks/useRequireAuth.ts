import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { AuthGateReason, useAuthGateStore } from '../store/authGateStore';

export function useRequireAuth() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const openAuthGate = useAuthGateStore((state) => state.open);

  const requireAuth = useCallback(
    (reason: AuthGateReason, onAuthed?: () => void): boolean => {
      if (isLoggedIn) {
        onAuthed?.();
        return true;
      }
      openAuthGate(reason, onAuthed);
      return false;
    },
    [isLoggedIn, openAuthGate]
  );

  return { isLoggedIn, requireAuth };
}
