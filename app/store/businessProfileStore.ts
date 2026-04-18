import { BusinessProfileShort, BusinessProfileStoreState } from "@/types/store.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useBusinessProfileStore = create<BusinessProfileStoreState>()(
  persist(
    (set) => ({
      businessProfiles: null,
      isLoading: false,
      error: null,
      selectedBusinessProfile: null,

      setSelectedBusinessProfile: (profile: BusinessProfileShort | null) =>
        set({ selectedBusinessProfile: profile }),
      fetchBusinessProfiles: async () => {
        try {
          set({ isLoading: true, error: null });
          const res = await fetch('/api/business');

          const result = await res.json();

          if (!res.ok || !result.success) {
            throw new Error(result.error || 'Failed to fetch business profiles');
          }

          const businessProfiles = Array.isArray(result.data) ? result.data : [];

          set({ businessProfiles, isLoading: false, error: null });
          return businessProfiles;

        } catch (error) {
          set({
            businessProfiles: [],
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false
          });
          return [];
        }
      },
    }),
    {
      name: 'business-profile-store',
    }
  )
);