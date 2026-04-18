import { ProviderStoreState } from "@/types/store.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";


export const useProviderStore = create<ProviderStoreState>()(persist(
    (set) => ({
        providers: null,
        selectedProvider: null,
        isLoading: false,
        error: null,
        setSelectedProvider: (provider) => set({ selectedProvider: provider }),
        fetchProviders: async () => {
            try {
                set({ isLoading: true, error: null });
                const res = await fetch('/api/providers');
                if (!res.ok) throw new Error('Failed to fetch providers');
                const data = await res.json();
                const providers = data.data ?? null;
                set({ providers, isLoading: false });
            } catch (error) {
                set({
                    providers: null,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    isLoading: false
                });
            }
        }

    }),
    { name: 'providerStore' }
)
)