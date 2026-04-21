import { StokeShort, StokeStoreState } from "@/types/store.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";



export const useStokeStore =create<StokeStoreState>()(
    persist(
        (set) => ({
            stock: null,
            fetchStock: async () => {
                try {
                    set({ isLoading: true, error: null });
                    const res = await fetch('/api/stock');
                    if (!res.ok) throw new Error('Failed to fetch stock data');
                    const data = await res.json();
                    const stock = Array.isArray(data) ? data : data.data ?? [];
                    set({ stock, isLoading: false });
                } catch (error) {
                    set({ stock: null, error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
                }
            },
            deleteStock: async (stockId: string) => {
                try {
                    set({ isLoading: true, error: null });
                    const res = await fetch(`/api/stock`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ _id: stockId }),
                    });
                    if (!res.ok) throw new Error('Failed to delete stock');
                    const data = await res.json();
                    const stock = data.data ?? null;
                    set({ stock, isLoading: false });
                } catch (error) {
                    set({ stock: null, error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
                }
            },
            setSelectedStock: (stock: StokeShort | null) => set({ selectedStock: stock }),
            selectedStock: null,
            isLoading: false,
            error: null,
        }),
        {
            name: "stoke-store",
        }
    )
)