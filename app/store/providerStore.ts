import { ProviderShort, ProviderStoreState } from "@/types/store.types";
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
        },
        toggleActiveProvider: async (providerId: string, active: boolean) => {
            try {
                set({ isLoading: true, error: null });

                const res = await fetch(`/api/providers/active`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ _id: providerId, active }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || 'Failed to toggle active provider');
                }

                const response = await res.json();
                // API может вернуть { data: {...} } или сразу объект
                const updatedProvider = response.data ?? response;

                set((state) => {
                    if (!state.providers) return { isLoading: false };

                    const updatedProviders = state.providers.map((p) =>
                        p._id === providerId ? { ...p, ...updatedProvider, active } : p
                    );

                    // Если выбранный провайдер совпадает с обновляемым, синхронизируем его
                    const updatedSelected =
                        state.selectedProvider?._id === providerId
                            ? { ...state.selectedProvider, ...updatedProvider, active }
                            : state.selectedProvider;

                    return {
                        providers: updatedProviders,
                        selectedProvider: updatedSelected, // или null, если ваша логика требует сброса
                        isLoading: false,
                    };
                });
            } catch (error) {
                set((state) => ({
                    // ⚠️ Никогда не сбрасываем providers в null при ошибке
                    providers: state.providers,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    isLoading: false,
                }));
            }
        },
        updateProvider: async (
            providerId: string,
            data: Omit<ProviderShort, '_id' | 'createdAt' | 'updatedAt'>
        ) => {
            try {
                set({ isLoading: true, error: null });

                const res = await fetch(`/api/providers`, {
                    method: 'PATCH', // 🔧 PATCH для частичного обновления
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ _id: providerId, ...data }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || 'Failed to update provider');
                }

                const response = await res.json();
                const updatedProvider = response.data ?? response;

                // 🔧 Обновляем только нужный элемент в массиве
                set((state) => {
                    if (!state.providers) return { isLoading: false };

                    const updatedProviders = state.providers.map((p) =>
                        p._id === providerId ? { ...p, ...updatedProvider } : p
                    );

                    // Синхронизируем selectedProvider, если это он
                    const updatedSelected =
                        state.selectedProvider?._id === providerId
                            ? { ...state.selectedProvider, ...updatedProvider }
                            : state.selectedProvider;

                    return {
                        providers: updatedProviders,
                        selectedProvider: updatedSelected,
                        isLoading: false,
                    };
                });

                // 🔧 Возвращаем результат для toast.promise
                return { success: true, updatedProvider };

            } catch (error) {
                set((state) => ({
                    providers: state.providers, // 🔧 Не стираем список при ошибке!
                    error: error instanceof Error ? error.message : 'Unknown error',
                    isLoading: false,
                }));
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        },
        deleteProvider: async (providerId: string) => {
            try {
                set({ isLoading: true, error: null });
                const res = await fetch(`/api/providers`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ _id: providerId }),
                });
                if (!res.ok) throw new Error('Failed to delete provider');
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
        },

    }),
    { name: 'providerStore' }
)
)