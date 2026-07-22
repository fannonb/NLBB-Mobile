import { create } from 'zustand';
import {
  bookingApi,
  BookingRecord,
  mapBookingStatusToBackend,
  UpdateBookingStatusPayload,
} from '../lib/api/bookings';
import { getStoredSession, getStoredUser } from '../lib/authSession';
import { safeStorage } from '../lib/safeStorage';

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

const BOOKING_CACHE_MS = 30_000;
const BOOKING_SNAPSHOT_KEY = 'nlbb_booking_snapshot_v1';

interface BookingSnapshot {
  userId: string;
  records: BookingRecord[];
  savedAt: number;
}

let loadPromise: Promise<BookingRecord[]> | null = null;
let mutationVersion = 0;
let snapshotHydratedForUserId: string | null = null;

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

const readBookingSnapshot = async (userId: string): Promise<BookingSnapshot | null> => {
  const raw = await safeStorage.getItem(BOOKING_SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    const snapshot = JSON.parse(raw) as BookingSnapshot;
    return snapshot.userId === userId && Array.isArray(snapshot.records) ? snapshot : null;
  } catch {
    return null;
  }
};

const persistBookingSnapshot = async (records: BookingRecord[]) => {
  const user = await getStoredUser();
  if (!user) return;
  const snapshot: BookingSnapshot = { userId: user.id, records, savedAt: Date.now() };
  await safeStorage.setItem(BOOKING_SNAPSHOT_KEY, JSON.stringify(snapshot));
};

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

    let request!: Promise<BookingRecord[]>;
    request = (async () => {
      const startedAtVersion = mutationVersion;
      const session = await getStoredSession();
      if (!session?.accessToken) {
        if (startedAtVersion === mutationVersion) {
          set({ loading: false, error: null });
        }
        return [];
      }

      const user = await getStoredUser();
      if (user && snapshotHydratedForUserId !== user.id) {
        snapshotHydratedForUserId = user.id;
        const snapshot = await readBookingSnapshot(user.id);
        if (snapshot && startedAtVersion === mutationVersion && get().records.length === 0) {
          set({ records: snapshot.records, loadedAt: snapshot.savedAt, error: null });
        }
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
          void persistBookingSnapshot(nextRecords);
        }
        return nextRecords;
      } catch (error) {
        if (startedAtVersion === mutationVersion) {
          set({
            error: errorMessageFor(error),
            // Keep existing records visible; emptying on transient failures causes flicker.
            loading: false,
          });
        }
        return get().records;
      } finally {
        if (startedAtVersion === mutationVersion) {
          set({ loading: false });
        }
        if (loadPromise === request) {
          loadPromise = null;
        }
      }
    })();
    loadPromise = request;

    return request;
  },

  updateBookingStatus: async (bookingId, status) => {
    mutationVersion += 1;
    const operationVersion = mutationVersion;
    const previous = get().records;
    const existing = previous.find((booking) => booking.id === bookingId);
    const optimisticStatus = mapBookingStatusToBackend(status);

    if (existing) {
      const optimistic: BookingRecord = {
        ...existing,
        status: optimisticStatus,
        updatedAt: new Date().toISOString(),
      };
      set({
        records: mergeBooking(previous, optimistic),
        loadedAt: Date.now(),
        error: null,
      });
      void persistBookingSnapshot(get().records);
    }

    try {
      const updated = await bookingApi.updateBookingStatus(bookingId, status);
      if (operationVersion !== mutationVersion) {
        return updated;
      }
      set((state) => ({
        records: mergeBooking(state.records, updated),
        loadedAt: Date.now(),
        error: null,
      }));
      void persistBookingSnapshot(get().records);
      return updated;
    } catch (error) {
      if (operationVersion === mutationVersion) {
        set({
          records: previous,
          error: errorMessageFor(error),
        });
        void persistBookingSnapshot(previous);
      }
      throw error;
    }
  },

  addBookingRecord: (booking) => {
    mutationVersion += 1;
    set((state) => ({
      records: mergeBooking(state.records, booking),
      loadedAt: Date.now(),
      error: null,
    }));
    void persistBookingSnapshot(get().records);
  },

  resetBookings: () => {
    loadPromise = null;
    mutationVersion += 1;
    snapshotHydratedForUserId = null;
    set({
      records: [],
      loading: false,
      loadedAt: 0,
      error: null,
    });
  },
}));
