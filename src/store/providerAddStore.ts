import { create } from 'zustand';

interface ProviderAddState {
  openAddServiceOnMount: boolean;
  requestAddService: () => void;
  consumeAddService: () => boolean;
}

export const useProviderAddStore = create<ProviderAddState>((set, get) => ({
  openAddServiceOnMount: false,

  requestAddService: () => {
    set({ openAddServiceOnMount: true });
  },

  consumeAddService: () => {
    const pending = get().openAddServiceOnMount;
    if (pending) {
      set({ openAddServiceOnMount: false });
    }
    return pending;
  },
}));
