import { BusinessProfileShort, BusinessProfileStoreState } from "@/types/store.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useBusinessProfileStore = create<BusinessProfileStoreState>()(
  persist(
    (set, get) => ({
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
      // Реализация
      updateBusinessProfile: async (businessProfileId, data) => {
        try {
          set({ isLoading: true, error: null });

          const res = await fetch(`/api/business`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ _id: businessProfileId, ...data }),
          });

          const result = await res.json();

          if (!res.ok || !result.success) {
            throw new Error(result.error || 'Failed to update business profile');
          }

          await get().fetchBusinessProfiles(); // fetchBusinessProfiles пусть сам управляет isLoading
          set({ isLoading: false });

          return { success: true, data: result.data };

        } catch (e) {
          const error = e instanceof Error ? e.message : 'Unknown error';
          set({ error, isLoading: false });
          return { success: false, error }; // ← не забывай возвращать из catch
        }
      },
      createBusinessProfile: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const res = await fetch(`/api/business`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const result = await res.json();
          if (!res.ok || !result.success) {
            throw new Error(result.error || 'Failed to create business profile');
          }
          await get().fetchBusinessProfiles();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false
          });
        }
      },
      deleteBusinessProfile: async (_id: string) => {
        try {
          set({ isLoading: true, error: null });
          const res = await fetch(`/api/business`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ _id }),
          });
          const result = await res.json();
          if (!res.ok || !result.success) {
            throw new Error(result.error || 'Failed to delete business profile');
          }
          await get().fetchBusinessProfiles();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false
          });
        }
      },
    }),
    {
      name: 'business-profile-store',
    }
  )
);