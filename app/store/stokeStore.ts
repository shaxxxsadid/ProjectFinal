import { StokeShort, StokeStoreState } from "@/types/store.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";



export const useStokeStore = create<StokeStoreState>()(
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
            createStock: async (data: Omit<StokeShort, '_id' | 'createdAt' | 'updatedAt'>) => {
                try {
                    set({ isLoading: true, error: null });
                    const res = await fetch('/api/stock', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    if (!res.ok) throw new Error('Failed to create stock');
                    const response = await res.json();
                    const createdStock = response.data ?? response;
                    set((state) => ({
                        stock: state.stock ? [...state.stock, createdStock] : [createdStock],
                        isLoading: false,
                    }));
                    return { success: true, data: createdStock };
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown error';
                    set({ error: message, isLoading: false });
                    return { success: false, error: message };
                }
            },
            updateStock: async (stockId: string, data: Partial<Omit<StokeShort, '_id' | 'createdAt' | 'updatedAt'>>) => {
                try {
                    set({ isLoading: true, error: null });

                    const res = await fetch(`/api/stock`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ _id: stockId, ...data }),
                    });

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || 'Failed to update stock');
                    }

                    const response = await res.json();
                    const updatedStock = response.data ?? response; // 🔧 Один объект

                    // 🔧 Обновляем только нужный элемент в массиве
                    set((state) => {
                        if (!state.stock) return { isLoading: false };

                        const updatedStocks = state.stock.map((s) =>
                            s._id === stockId ? { ...s, ...updatedStock } : s
                        );

                        // 🔧 Синхронизируем selectedStock, если это он
                        const updatedSelected =
                            state.selectedStock?._id === stockId
                                ? { ...state.selectedStock, ...updatedStock }
                                : state.selectedStock;

                        return {
                            stock: updatedStocks,
                            selectedStock: updatedSelected,
                            isLoading: false,
                        };
                    });

                    // 🔧 Возвращаем результат для FormModal
                    return { success: true };

                } catch (error) {
                    set((state) => ({
                        stock: state.stock, // 🔧 Не стираем список при ошибке!
                        error: error instanceof Error ? error.message : 'Unknown error',
                        isLoading: false,
                    }));
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
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
                    set((state) => ({
                        stock: (Array.isArray(state.stock) ? state.stock : []).filter(item => item._id !== stockId),
                        selectedStock: state.selectedStock?._id === stockId ? null : state.selectedStock,
                        isLoading: false,
                    }));

                } catch (error) {
                    set((state) => ({
                        stock: state.stock, // сохраняем текущий массив
                        error: error instanceof Error ? error.message : 'Unknown error',
                        isLoading: false,
                    }));
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