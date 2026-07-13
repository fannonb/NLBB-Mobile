import { create } from 'zustand';
import {
  bookingApi,
  BookingRecord,
  UpdateBookingStatusPayload,
} from '../lib/api/bookings';
import { getStoredSession } from '../lib/authSession';

interface BookingDataState {
  records: BookingRecord[];
  loading: boolean;
  loadedAt: number;
  error: string | null;
  loadMyBookings: (options?: { force?: boolean }) => Promise<BookingRecord[]>;
  updateBookingStatus: (
    bookingId: string,
    status: UpdateBookingStatusPayload['status'],
  ) => Promise<BookingRecord>;
  addBookingRecord: (booking: BookingRecord) => void;
  resetBookings: () => void;
}

const BOOKING_CACHE_MS = 5_000;

let loadPromise: Promise<BookingRecord[]> | null = null;
let mutationVersion = 0;

const isFresh = (loadedAt: number) =>
  loadedAt > 0 && Date.now() - loadedAt < BOOKING_CACHE_MS;

const mergeBooking = (records: BookingRecord[], updated: BookingRecord) => {
  const exists = records.some((booking) => booking.id === updated.id);
  if (!exists) {
    return [updated, ...records];
  }
  return records.map((booking) => (booking.id === updated.id ? updated : booking));
};

const errorMessageFor = (error: unknown) =>
  error instanceof Error ? error.message : 'Unable to refresh bookings right now.';

export const useBookingDataStore = create<BookingDataState>((set, get) => ({
  records: [],
  loading: false,
  loadedAt: 0,
  error: null,

  loadMyBookings: async (options) => {
    const { records, loadedAt } = get();
    if (!options?.force && records.length > 0 && isFresh(loadedAt)) {
      return records;
    }

    if (loadPromise) {
      return loadPromise;
    }

    loadPromise = (async () => {
      const startedAtVersion = mutationVersion;
      const session = await getStoredSession();
      if (!session?.accessToken) {
        set({ loading: false, error: null });
        return [];
      }

      set((state) => ({
        loading: state.records.length === 0,
        error: null,
      }));

      try {
        const nextRecords = await bookingApi.listMyBookings();
        if (startedAtVersion === mutationVersion) {
          set({
            records: nextRecords,
            loadedAt: Date.now(),
            error: null,
          });
        }
        return nextRecords;
      } catch (error) {
        set({
          error: errorMessageFor(error),
          // Keep existing records visible; emptying on transient failures causes flicker.
          loading: false,
        });
        return get().records;
      } finally {
        set({ loading: false });
        loadPromise = null;
      }
    })();

    return loadPromise;
  },

  updateBookingStatus: async (bookingId, status) => {
    mutationVersion += 1;
    const updated = await bookingApi.updateBookingStatus(bookingId, status);
    set((state) => ({
      records: mergeBooking(state.records, updated),
      loadedAt: Date.now(),
      error: null,
    }));
    return updated;
  },

  addBookingRecord: (booking) => {
    mutationVersion += 1;
    set((state) => ({
      records: mergeBooking(state.records, booking),
      loadedAt: Date.now(),
      error: null,
    }));
  },

  resetBookings: () => {
    loadPromise = null;
    mutationVersion = 0;
    set({
      records: [],
      loading: false,
      loadedAt: 0,
      error: null,
    });
  },
}));
