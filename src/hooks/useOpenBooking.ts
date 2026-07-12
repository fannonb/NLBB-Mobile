import { useCallback } from 'react';
import { useRequireAuth } from './useRequireAuth';
import { BookingSheetPayload, useBookingSheetStore } from '../store/bookingSheetStore';

export function useOpenBooking() {
  const { requireAuth } = useRequireAuth();
  const openSheet = useBookingSheetStore((state) => state.open);

  const openBooking = useCallback(
    (payload: BookingSheetPayload) => {
      requireAuth('book', () => openSheet(payload));
    },
    [openSheet, requireAuth]
  );

  return { openBooking };
}
