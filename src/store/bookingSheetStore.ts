import { create } from 'zustand';
import { Service } from '../types';

export type BookingSheetStep = 'service' | 'schedule' | 'confirm';

export type BookingSheetPayload = {
  providerId: string;
  providerName: string;
  providerPhone?: string;
  providerWhatsapp?: string;
  services?: Service[];
  preselectedServiceId?: string;
};

interface BookingSheetState {
  visible: boolean;
  payload: BookingSheetPayload | null;
  open: (payload: BookingSheetPayload) => void;
  close: () => void;
}

export const useBookingSheetStore = create<BookingSheetState>((set) => ({
  visible: false,
  payload: null,

  open: (payload) => {
    set({ visible: true, payload });
  },

  close: () => {
    set({ visible: false, payload: null });
  },
}));
